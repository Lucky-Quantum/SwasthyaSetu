import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  demoPatients,
  demoReferrals,
  type JourneyStage,
  type PatientRecord,
  type ReferralPriority,
  type ReferralRecord,
  type ReferralStatus,
} from "../data/careData";
import {
  clearPendingSnapshot,
  getPendingSnapshot,
  loadCareSnapshot,
  persistCareSnapshot,
  queueCareSnapshot,
  syncCareSnapshot,
  type CareSnapshot,
} from "../services/offlineSync";

interface CareState {
  referrals: ReferralRecord[];
  patients: PatientRecord[];
  hydrated: boolean;
  online: boolean;
  syncing: boolean;
  pendingSync: number;
  lastSyncedAt: string | null;
  setOfflineMode: (offline: boolean) => void;
  syncNow: () => Promise<boolean>;
  addPatient: (patient: PatientRecord) => void;
  updatePatient: (id: string, updates: Partial<PatientRecord>) => void;
  addReferral: (referral: ReferralRecord) => void;
  updateReferral: (id: string, updates: Partial<ReferralRecord>) => void;
  getReferralsByStatus: (status: ReferralStatus) => ReferralRecord[];
  getReferralsByPriority: (priority: ReferralPriority) => ReferralRecord[];
  getReferralById: (id: string) => ReferralRecord | undefined;
  getPatientById: (id: string) => PatientRecord | undefined;
}

const CareContext = createContext<CareState | null>(null);

const statusToJourneyStage: Partial<Record<ReferralStatus, JourneyStage>> = {
  New: "Referral Created",
  Accepted: "Referral Accepted",
  Consultation: "Consultation",
  "Awaiting Diagnostics": "Diagnostics",
  Diagnostics: "Diagnostics",
  Treatment: "Treatment",
  "Follow-up": "Follow-up",
  Completed: "Completed",
};

function withJourneyStage(
  referral: ReferralRecord,
  status?: ReferralStatus,
): ReferralRecord {
  if (!status) return referral;

  const stage = statusToJourneyStage[status];
  if (!stage || referral.journey.includes(stage)) {
    return referral;
  }

  return {
    ...referral,
    journey: [...referral.journey, stage],
  };
}

function browserOnline() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

export function CareProvider({ children }: { children: ReactNode }) {
  const [referrals, setReferrals] = useState<ReferralRecord[]>(demoReferrals);
  const [patients, setPatients] = useState<PatientRecord[]>(demoPatients);
  const [hydrated, setHydrated] = useState(false);
  const [browserIsOnline, setBrowserIsOnline] = useState(browserOnline);
  const [offlineOverride, setOfflineOverride] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [pendingSync, setPendingSync] = useState(0);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const online = browserIsOnline && !offlineOverride;

  useEffect(() => {
    let active = true;

    void (async () => {
      const fallback: CareSnapshot<PatientRecord, ReferralRecord> = {
        version: 1,
        savedAt: new Date().toISOString(),
        patients: demoPatients,
        referrals: demoReferrals,
      };

      const snapshot = await loadCareSnapshot(fallback);
      if (!active) return;

      setPatients(snapshot.patients);
      setReferrals(snapshot.referrals);
      setHydrated(true);

      const pending = await getPendingSnapshot();
      if (active) setPendingSync(pending ? 1 : 0);

      if (browserOnline() && pending) {
        const ok = await syncCareSnapshot(pending.snapshot);
        if (ok) {
          await clearPendingSnapshot();
          if (active) {
            setPendingSync(0);
            setLastSyncedAt(new Date().toISOString());
          }
        }
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleOnline = () => setBrowserIsOnline(true);
    const handleOffline = () => setBrowserIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const snapshot = useMemo<CareSnapshot<PatientRecord, ReferralRecord>>(
    () => ({
      version: 1,
      savedAt: new Date().toISOString(),
      patients,
      referrals,
    }),
    [patients, referrals],
  );

  useEffect(() => {
    if (!hydrated) return;

    let cancelled = false;

    void (async () => {
      await persistCareSnapshot(snapshot);
      if (cancelled) return;

      if (!online) {
        await queueCareSnapshot(snapshot);
        if (!cancelled) setPendingSync(1);
        return;
      }

      setSyncing(true);
      const ok = await syncCareSnapshot(snapshot);
      if (cancelled) return;

      if (ok) {
        await clearPendingSnapshot();
        setPendingSync(0);
        setLastSyncedAt(new Date().toISOString());
      } else {
        await queueCareSnapshot(snapshot);
        setPendingSync(1);
      }
      setSyncing(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [snapshot, hydrated, online]);

  const syncNow = useCallback(async () => {
    if (!browserOnline() || offlineOverride) return false;

    setSyncing(true);
    const pending = await getPendingSnapshot();
    const target = pending?.snapshot ?? snapshot;
    const ok = await syncCareSnapshot(target);

    if (ok) {
      await persistCareSnapshot(target);
      await clearPendingSnapshot();
      setPendingSync(0);
      setLastSyncedAt(new Date().toISOString());
    } else {
      await queueCareSnapshot(target);
      setPendingSync(1);
    }

    setSyncing(false);
    return ok;
  }, [offlineOverride, snapshot]);

  const setOfflineMode = useCallback((offline: boolean) => {
    setOfflineOverride(offline);
  }, []);

  const addPatient = useCallback((patient: PatientRecord) => {
    setPatients((prev) => {
      const exists = prev.some((item) => item.id === patient.id);
      return exists
        ? prev.map((item) => (item.id === patient.id ? patient : item))
        : [patient, ...prev];
    });
  }, []);

  const updatePatient = useCallback(
    (id: string, updates: Partial<PatientRecord>) => {
      setPatients((prev) =>
        prev.map((patient) =>
          patient.id === id ? { ...patient, ...updates } : patient,
        ),
      );
    },
    [],
  );

  const addReferral = useCallback((referral: ReferralRecord) => {
    setReferrals((prev) => {
      const exists = prev.some((item) => item.id === referral.id);
      return exists
        ? prev.map((item) => (item.id === referral.id ? referral : item))
        : [referral, ...prev];
    });
  }, []);

  const updateReferral = useCallback(
    (id: string, updates: Partial<ReferralRecord>) => {
      setReferrals((prev) =>
        prev.map((referral) => {
          if (referral.id !== id) return referral;

          const next = { ...referral, ...updates };
          return withJourneyStage(next, updates.status);
        }),
      );
    },
    [],
  );

  const getReferralsByStatus = useCallback(
    (status: ReferralStatus) => referrals.filter((r) => r.status === status),
    [referrals],
  );

  const getReferralsByPriority = useCallback(
    (priority: ReferralPriority) =>
      referrals.filter((r) => r.priority === priority),
    [referrals],
  );

  const getReferralById = useCallback(
    (id: string) => referrals.find((r) => r.id === id),
    [referrals],
  );

  const getPatientById = useCallback(
    (id: string) => patients.find((p) => p.id === id),
    [patients],
  );

  const value = useMemo<CareState>(
    () => ({
      referrals,
      patients,
      hydrated,
      online,
      syncing,
      pendingSync,
      lastSyncedAt,
      setOfflineMode,
      syncNow,
      addPatient,
      updatePatient,
      addReferral,
      updateReferral,
      getReferralsByStatus,
      getReferralsByPriority,
      getReferralById,
      getPatientById,
    }),
    [
      referrals,
      patients,
      hydrated,
      online,
      syncing,
      pendingSync,
      lastSyncedAt,
      setOfflineMode,
      syncNow,
      addPatient,
      updatePatient,
      addReferral,
      updateReferral,
      getReferralsByStatus,
      getReferralsByPriority,
      getReferralById,
      getPatientById,
    ],
  );

  return <CareContext.Provider value={value}>{children}</CareContext.Provider>;
}

export function useCare() {
  const ctx = useContext(CareContext);
  if (!ctx) {
    throw new Error("useCare must be used within CareProvider");
  }

  return ctx;
}
