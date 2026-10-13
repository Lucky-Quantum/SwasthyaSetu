export interface CareSnapshot<Patient = unknown, Referral = unknown> {
  version: 1;
  savedAt: string;
  patients: Patient[];
  referrals: Referral[];
}

interface QueuedSnapshot {
  key: "latest";
  queuedAt: string;
  snapshot: CareSnapshot;
}

const DB_NAME = "swasthyaSetuOffline";
const DB_VERSION = 1;
const STATE_STORE = "care-state";
const OUTBOX_STORE = "outbox";

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb() {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STATE_STORE)) {
        db.createObjectStore(STATE_STORE, { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        db.createObjectStore(OUTBOX_STORE, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Unable to open offline store"));
  });

  return dbPromise;
}

export async function loadCareSnapshot<Patient, Referral>(
  fallback: CareSnapshot<Patient, Referral>,
): Promise<CareSnapshot<Patient, Referral>> {
  const db = await getDb();
  if (!db) return fallback;

  return new Promise((resolve) => {
    const tx = db.transaction(STATE_STORE, "readonly");
    const request = tx.objectStore(STATE_STORE).get("latest");

    request.onsuccess = () => {
      resolve((request.result?.snapshot as CareSnapshot<Patient, Referral> | undefined) ?? fallback);
    };
    request.onerror = () => resolve(fallback);
  });
}

export async function persistCareSnapshot<Patient, Referral>(
  snapshot: CareSnapshot<Patient, Referral>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STATE_STORE, "readwrite");
    tx.objectStore(STATE_STORE).put({ key: "latest", snapshot });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Unable to persist offline state"));
  });
}

export async function queueCareSnapshot<Patient, Referral>(
  snapshot: CareSnapshot<Patient, Referral>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const queued: QueuedSnapshot = {
    key: "latest",
    queuedAt: new Date().toISOString(),
    snapshot,
  };

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readwrite");
    tx.objectStore(OUTBOX_STORE).put(queued);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Unable to queue offline state"));
  });
}

export async function getPendingSnapshot() {
  const db = await getDb();
  if (!db) return null;

  return new Promise<QueuedSnapshot | null>((resolve) => {
    const tx = db.transaction(OUTBOX_STORE, "readonly");
    const request = tx.objectStore(OUTBOX_STORE).get("latest");
    request.onsuccess = () => resolve((request.result as QueuedSnapshot | undefined) ?? null);
    request.onerror = () => resolve(null);
  });
}

export async function clearPendingSnapshot(): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(OUTBOX_STORE, "readwrite");
    tx.objectStore(OUTBOX_STORE).delete("latest");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Unable to clear sync queue"));
  });
}

export async function syncCareSnapshot(snapshot: CareSnapshot): Promise<boolean> {
  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(snapshot),
    });

    if (!response.ok) return false;
    const payload = await response.json() as { ok?: boolean };
    return payload.ok === true;
  } catch {
    return false;
  }
}
