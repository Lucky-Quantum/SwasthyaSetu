import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  CloudOff,
  FileHeart,
  HeartPulse,
  LayoutDashboard,
  Languages,
  LogOut,
  MapPin,
  Mic,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  UsersRound,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import Brand from "../components/Brand";
import LanguageSelector, { Language } from "../components/LanguageSelector";
import WorkspaceTopbar from "../components/WorkspaceTopbar";
import { useCare } from "../src/store/careStore";
import { runAiTriage, type TriageResult } from "../src/services/aiTriage";
import type { PatientRecord, ReferralPriority, ReferralRecord, ReferralStatus, JourneyStage } from "../src/data/careData";

import {
  assignedPatients,
  referralRecommendations,
  workerProfile,
  WorkerPriority,
} from "../src/data/workerData";

interface WorkerDashboardProps {
  language: Language;
  setLanguage: (language: Language) => void;
  onLogout: () => void;
}

type WorkerView =
  | "home"
  | "register"
  | "assessment"
  | "referral"
  | "followups";

const priorityStyles: Record<
  WorkerPriority,
  {
    badge: string;
    dot: string;
  }
> = {
  Emergency: {
    badge: "priority-emergency",
    dot: "dot-red",
  },

  High: {
    badge: "priority-high",
    dot: "dot-orange",
  },

  "Referral Delayed": {
    badge: "priority-delayed",
    dot: "dot-amber",
  },

  "Follow-up Due": {
    badge: "priority-followup",
    dot: "dot-purple",
  },

  Routine: {
    badge: "priority-routine",
    dot: "dot-green",
  },
};

const symptomOptions = [
  "Fever",
  "Cough",
  "Breathing difficulty",
  "Weakness",
  "Pain",
  "Dizziness",
  "Chest discomfort",
  "Other",
];

const flightSteps = [
  "Referral created",
  "Facility accepted",
  "Appointment booked",
  "Patient departed",
  "Patient arrived",
  "Consultation",
  "Diagnostics",
  "Treatment",
  "Follow-up",
  "Closed",
];

export default function WorkerDashboard({
  language,
  setLanguage,
  onLogout,
}: WorkerDashboardProps) {
  const { t } = useTranslation();
  const {
    addPatient,
    updatePatient,
    addReferral,
    updateReferral,
    getPatientById,
    getReferralById,
    referrals,
    online,
    syncing,
    pendingSync,
    lastSyncedAt,
    setOfflineMode,
    syncNow,
  } = useCare();

  // ==========================================================
  // BASIC NAVIGATION STATE
  // ==========================================================

  const [mobileOpen, setMobileOpen] = useState(false);

  const [view, setView] = useState<WorkerView>("home");

  const [selectedPatient, setSelectedPatient] = useState(
    assignedPatients[0],
  );

  // Current patients visible to this worker.
  // Prototype: stored in React memory.
  // Later: load/save from Supabase.
  const [patients, setPatients] = useState(
    assignedPatients,
  );

  // ==========================================================
  // SEARCH
  // ==========================================================

  const [search, setSearch] = useState("");

  // ==========================================================
  // CONNECTIVITY / SYNC
  // Backed by IndexedDB + a small sync queue.
  // ==========================================================

  // ==========================================================
  // ASSESSMENT STATE
  // ==========================================================

  const [assessmentSaved, setAssessmentSaved] =
    useState(false);

  const [voiceNote, setVoiceNote] = useState(false);

  const [selectedSymptoms, setSelectedSymptoms] =
    useState<string[]>([]);

  const [vitals, setVitals] = useState({
    bloodPressure: "146 / 92",
    pulse: "84",
    temperature: "98.6",
    spo2: "98",
  });

  const [notes, setNotes] = useState("");

  const [priority, setPriority] =
    useState<WorkerPriority>("High");

  const [aiTriage, setAiTriage] = useState<TriageResult | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState("");

  // ==========================================================
  // NEW PATIENT REGISTRATION
  // ==========================================================

  const [newPatientForm, setNewPatientForm] = useState({
    name: "",
    age: "",
    gender: "",
    mobile: "",
    village: "",
    address: "",
    emergencyContact: "",
    preferredLanguage: "Marathi",
    existingCondition: "",
    registrationSource: "ASHA",
  });

  const [patientCreated, setPatientCreated] =
    useState(false);

  const [createdPatient, setCreatedPatient] =
    useState<(typeof assignedPatients)[number] | null>(
      null,
    );

  // ==========================================================
  // REFERRAL STATE
  // ==========================================================

  const [referralCreated, setReferralCreated] =
    useState(false);

  const [selectedFacility, setSelectedFacility] = useState(
    referralRecommendations[0]?.id ?? "",
  );

  // -1 = referral not created yet
  //  0 = referral created
  //  1 = facility accepted
  //  2 = appointment booked
  // etc.
  const [referralStage, setReferralStage] =
    useState(-1);

  const [createdReferralId, setCreatedReferralId] =
    useState<string | null>(null);

  // ==========================================================
  // PATIENT SEARCH
  // ==========================================================

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return patients;
    }

    return patients.filter((patient) =>
      [
        patient.name,
        patient.id,
        patient.village,
        patient.issue,
        patient.priority,
      ].some((value) =>
        value.toLowerCase().includes(query),
      ),
    );
  }, [search, patients]);

  // ==========================================================
  // WORKER INSIGHTS
  // ==========================================================

  const workerInsights = useMemo(() => {
    const activePatients = patients.length;

    const urgentCases = patients.filter(
      (patient) =>
        patient.priority === "Emergency" ||
        patient.priority === "High",
    ).length;

    const delayedReferrals = patients.filter(
      (patient) =>
        patient.priority === "Referral Delayed",
    ).length;

    const followUpsDue = patients.filter(
      (patient) =>
        patient.priority === "Follow-up Due",
    ).length;

    const diagnosticReadyFacilities =
      referralRecommendations.filter(
        (facility) =>
          Array.isArray(facility.diagnostics) &&
          facility.diagnostics.length > 0,
      ).length;

    const specialistReadyFacilities =
      referralRecommendations.filter(
        (facility) =>
          Boolean(facility.doctor) &&
          facility.status === "Recommended",
      ).length;

    return {
      activePatients,
      urgentCases,
      delayedReferrals,
      followUpsDue,
      diagnosticReadyFacilities,
      specialistReadyFacilities,
    };
  }, [patients]);

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const openAssessment = (
    patient = patients[0],
  ) => {
    setSelectedPatient(patient);

    // Reset form for selected patient
    setAssessmentSaved(false);
    setReferralCreated(false);
    setVoiceNote(false);

    const storedPatient = getPatientById(patient.id);
    setSelectedSymptoms(storedPatient?.symptoms ?? []);

    setVitals({
      bloodPressure: storedPatient?.vitals.bp?.replace("/", " / ") ?? "",
      pulse: storedPatient?.vitals.pulse?.replace(" bpm", "") ?? "",
      temperature: storedPatient?.vitals.temp?.replace(" °F", "") ?? "",
      spo2: storedPatient?.vitals.spo2?.replace("%", "") ?? "",
    });

    setNotes(patient.issue);

    setPriority(patient.priority);

    // Reset referral journey
    setSelectedFacility(
      referralRecommendations[0]?.id ?? "",
    );

    setReferralStage(-1);

    setView("assessment");
    setMobileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openReferral = () => {
    setReferralCreated(false);
    setReferralStage(-1);

    setView("referral");

    setMobileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const openFollowups = () => {
    setView("followups");

    setMobileOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetRegistration = () => {
    setNewPatientForm({
      name: "",
      age: "",
      gender: "",
      mobile: "",
      village: "",
      address: "",
      emergencyContact: "",
      preferredLanguage: "Marathi",
      existingCondition: "",
      registrationSource: "ASHA",
    });

    setPatientCreated(false);
    setCreatedPatient(null);
  };

  const createNewPatient = () => {
    if (
      !newPatientForm.name.trim() ||
      !newPatientForm.age.trim() ||
      !newPatientForm.gender ||
      !newPatientForm.village.trim()
    ) {
      window.alert(
        t("worker.registration.fillRequired"),
      );
      return;
    }

    const age = Number(newPatientForm.age);
    if (!Number.isFinite(age) || age <= 0 || age > 120) {
      window.alert(t("worker.registration.validAge"));
      return;
    }

    const patientId = `SS-PAT-${Date.now().toString().slice(-6)}`;

    const generatedPatient = {
      id: patientId,
      name: newPatientForm.name.trim(),
      age,
      village: newPatientForm.village.trim(),
      issue:
        newPatientForm.existingCondition.trim() ||
        "New patient",
      priority: "Routine" as WorkerPriority,
      nextAction: "Initial assessment",
      lastVisit: "First visit",
      gender: newPatientForm.gender,
      mobile: newPatientForm.mobile.trim(),
      address: newPatientForm.address.trim(),
      emergencyContact:
        newPatientForm.emergencyContact.trim(),
      preferredLanguage:
        newPatientForm.preferredLanguage,
      registrationSource:
        newPatientForm.registrationSource,
      registeredBy: workerProfile.name,
      registeredAt: new Date().toISOString(),
    };

    const patientRecord: PatientRecord = {
      id: patientId,
      name: generatedPatient.name,
      age: generatedPatient.age,
      gender: generatedPatient.gender,
      village: generatedPatient.village,
      district: workerProfile.district,
      allergies: ["Not recorded"],
      conditions: generatedPatient.issue === "New patient" ? [] : [generatedPatient.issue],
      currentMedications: [],
      chiefComplaint: generatedPatient.issue,
      symptoms: [],
      vitals: { bp: "Not recorded", pulse: "Not recorded", temp: "Not recorded", spo2: "Not recorded" },
      relevantHistory: "Newly registered in the SwasthyaSetu prototype.",
      previousConsultations: [],
      previousDiagnostics: [],
      preferredLanguage: generatedPatient.preferredLanguage as PatientRecord["preferredLanguage"],
      emergencyContact: generatedPatient.emergencyContact || "Not recorded",
    };

    addPatient(patientRecord);
    setPatients((currentPatients) => [
      generatedPatient,
      ...currentPatients,
    ]);

    setSelectedPatient(generatedPatient);
    setCreatedPatient(generatedPatient);
    setPatientCreated(true);
  };

  // ==========================================================
  // SYMPTOM HANDLER
  // ==========================================================

  const toggleSymptom = (symptom: string) => {
    setSelectedSymptoms((current) =>
      current.includes(symptom)
        ? current.filter((item) => item !== symptom)
        : [...current, symptom],
    );
  };

  // ==========================================================
  // ASSESSMENT SAVE
  // Prototype version only.
  //
  // Later:
  // this object -> Supabase assessment table
  // ==========================================================

  const saveAssessment = () => {
    const basePatient = getPatientById(selectedPatient.id);

    if (basePatient) {
      updatePatient(selectedPatient.id, {
        symptoms: selectedSymptoms,
        chiefComplaint: notes.trim() || basePatient.chiefComplaint,
        vitals: {
          bp: vitals.bloodPressure,
          pulse: vitals.pulse,
          temp: `${vitals.temperature} °F`,
          spo2: `${vitals.spo2}%`,
        },
      });
    }

    console.log("SwasthyaSetu assessment saved", {
      patientId: selectedPatient.id,
      symptoms: selectedSymptoms,
      vitals,
      priority,
      notes,
    });

    setAssessmentSaved(true);
  };

  // ==========================================================
  // REFERRAL CREATION
  // ==========================================================

  const createReferral = () => {
    const selectedFacilityData =
      referralRecommendations.find(
        (facility) =>
          facility.id === selectedFacility,
      );

    if (!selectedFacilityData) {
      window.alert("Please choose a receiving facility before creating the referral.");
      return;
    }

    if (selectedSymptoms.length === 0) {
      window.alert("Capture at least one symptom or assessment signal before referral.");
      return;
    }

    if (referralCreated && createdReferralId) {
      setView("referral");
      return;
    }

    const basePatient = getPatientById(selectedPatient.id);
    const normalizedPriority: ReferralPriority =
      priority === "Referral Delayed" || priority === "Follow-up Due"
        ? "Medium"
        : priority;

    const triageLevel: ReferralRecord["triageLevel"] =
      normalizedPriority === "Emergency"
        ? "EMERGENCY"
        : normalizedPriority === "High"
          ? "HIGH"
          : normalizedPriority === "Medium"
            ? "MEDIUM"
            : "LOW";

    const existingReferral = referrals.find(
      (item) => item.patientId === selectedPatient.id && item.status !== "Completed",
    );
    const referralId = existingReferral?.id ?? `REF-MH-${Date.now()}`;
    const referral: ReferralRecord = {
      id: referralId,
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientAge: selectedPatient.age,
      patientGender: basePatient?.gender ?? selectedPatient.gender ?? "Not recorded",
      patientVillage: selectedPatient.village,
      patientDistrict: basePatient?.district ?? workerProfile.district,
      specialty: selectedFacilityData.specialty,
      facility: selectedFacilityData.name,
      referringFacility: `PHC ${workerProfile.village}`,
      referringWorker: `${workerProfile.name} • ${workerProfile.role}`,
      reasonForReferral: notes.trim() || selectedPatient.issue,
      priority: normalizedPriority,
      triageLevel,
      triageSignals: selectedSymptoms,
      status: "New",
      waitingTime: "Just created",
      diagnosticsAvailable: selectedFacilityData.diagnostics,
      distance: selectedFacilityData.distance,
      createdAt: new Date().toISOString(),
      journey: ["Referral Created"],
      requestedDiagnostics: selectedFacilityData.diagnostics.slice(0, 2),
      careGaps: aiTriage?.missingInformation ?? [],
      aiSummary: aiTriage
        ? {
          keyConcerns: aiTriage.keyConcerns,
          importantFindings: aiTriage.importantFindings,
          missingInformation: aiTriage.missingInformation,
          previousCare: "Generated from the current worker assessment for clinician review.",
          referralReason: aiTriage.referralReason,
        }
        : undefined,
    };

    if (existingReferral) {
      updateReferral(existingReferral.id, referral);
    } else {
      addReferral(referral);
    }
    setCreatedReferralId(referralId);
    setReferralCreated(true);
    setReferralStage(0);
  };

  // ==========================================================
  // MOVE REFERRAL TO NEXT STAGE
  // Prototype demonstration of closed-loop workflow.
  // Later each stage will come from database events.
  // ==========================================================

  const advanceReferral = () => {
    if (referralStage < 0 || !createdReferralId) {
      return;
    }

    const nextStage = Math.min(
      referralStage + 1,
      flightSteps.length - 1,
    );

    const statusByStage: ReferralStatus[] = [
      "New",
      "Accepted",
      "Accepted",
      "Accepted",
      "Accepted",
      "Consultation",
      "Diagnostics",
      "Treatment",
      "Follow-up",
      "Completed",
    ];

    const journeyByStage: (JourneyStage | null)[] = [
      "Referral Created",
      "Referral Accepted",
      "Appointment Booked",
      null,
      null,
      "Consultation",
      "Diagnostics",
      "Treatment",
      "Follow-up",
      "Completed",
    ];

    const currentReferral = getReferralById(createdReferralId);
    const extraStage = journeyByStage[nextStage];

    if (currentReferral) {
      const nextJourney = extraStage && !currentReferral.journey.includes(extraStage)
        ? [...currentReferral.journey, extraStage]
        : currentReferral.journey;

      updateReferral(createdReferralId, {
        status: statusByStage[nextStage],
        waitingTime: nextStage === 9 ? "Completed" : `${Math.max(nextStage, 1)} step(s) in demo`,
        journey: nextJourney,
      });
    }

    setReferralStage(nextStage);
  };

  // ==========================================================
  // CONNECTIVITY
  // ==========================================================

  const toggleConnection = () => {
    setOfflineMode(online);
  };

  const handleSyncNow = async () => {
    if (!online) {
      setOfflineMode(false);
      return;
    }
    await syncNow();
  };

  const runTriageReview = async () => {
    setAiError("");
    if (!online) {
      setAiError("AI review needs a connection. The assessment itself can still be saved offline.");
      return;
    }
    if (selectedSymptoms.length === 0) {
      setAiError("Select at least one symptom before running the AI review.");
      return;
    }

    setAiBusy(true);
    try {
      const result = await runAiTriage({
        patientId: selectedPatient.id,
        age: selectedPatient.age,
        gender: selectedPatient.gender ?? "Not recorded",
        symptoms: selectedSymptoms,
        vitals,
        currentCondition: selectedPatient.issue,
        notes,
      });
      setAiTriage(result);
    } catch (error) {
      setAiError(error instanceof Error ? error.message : "AI review failed");
    } finally {
      setAiBusy(false);
    }
  };

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <main className="worker-dashboard-page">
      <aside className={`worker-sidebar ${mobileOpen ? "worker-sidebar-open" : ""}`}>
        <div className="worker-sidebar-top">
          <button
            className="worker-brand-button"
            onClick={() => {
              setView("home");
              setMobileOpen(false);
            }}
            aria-label={t("common.goHome")}
          >
            <Brand />
          </button>

          <button
            className="worker-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label={t("common.closeMenu")}
          >
            <X size={20} />
          </button>
        </div>

        <div className="worker-role-card">
          <span className="worker-role-avatar">
            <UsersRound size={18} />
          </span>
          <span>
            <strong>{t("worker.workspace")}</strong>
            <small>{t("worker.workspaceSubtitle")}</small>
          </span>
        </div>

        <nav className="worker-sidebar-nav" aria-label={t("worker.nav.label")}>
          <button
            className={
              view === "home"
                ? "worker-nav-link active"
                : "worker-nav-link"
            }
            aria-current={view === "home" ? "page" : undefined}
            onClick={() => {
              setView("home");
              setMobileOpen(false);
            }}
          >
            <LayoutDashboard size={17} aria-hidden="true" />
            <span>{t("worker.nav.dashboard")}</span>
          </button>

          <button
            className={
              view === "register"
                ? "worker-nav-link active"
                : "worker-nav-link"
            }
            aria-current={view === "register" ? "page" : undefined}
            onClick={() => {
              resetRegistration();
              setView("register");
              setMobileOpen(false);
            }}
          >
            <UsersRound size={17} aria-hidden="true" />
            <span>{t("worker.nav.register")}</span>
          </button>

          <button
            className={
              view === "assessment"
                ? "worker-nav-link active"
                : "worker-nav-link"
            }
            aria-current={view === "assessment" ? "page" : undefined}
            onClick={() => openAssessment(selectedPatient)}
          >
            <Stethoscope size={17} aria-hidden="true" />
            <span>{t("worker.nav.assessment")}</span>
          </button>

          <button
            className={
              view === "referral"
                ? "worker-nav-link active"
                : "worker-nav-link"
            }
            aria-current={view === "referral" ? "page" : undefined}
            onClick={openReferral}
          >
            <FileHeart size={17} aria-hidden="true" />
            <span>{t("worker.nav.referrals")}</span>
          </button>

          <button
            className={
              view === "followups"
                ? "worker-nav-link active"
                : "worker-nav-link"
            }
            aria-current={view === "followups" ? "page" : undefined}
            onClick={openFollowups}
          >
            <CalendarDays size={17} aria-hidden="true" />
            <span>{t("worker.nav.followups")}</span>
          </button>
        </nav>

        <div className="worker-sidebar-footer">
          <div className="worker-sidebar-note">
            <Wifi size={16} />
            <span>{online ? t("worker.onlineWorkspace") : t("worker.offlineWorkspace")}</span>
          </div>
          <button className="worker-sidebar-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>{t("common.signOut")}</span>
          </button>
        </div>
      </aside>

      <WorkspaceTopbar
        workspace={t("worker.workspace")}
        page={{
          home: t("worker.pages.dashboard"),
          register: t("worker.pages.register"),
          assessment: t("worker.pages.assessment"),
          referral: t("worker.pages.referrals"),
          followups: t("worker.pages.followups"),
        }[view]}
        online={online}
        menuLabel={t("worker.openMenu")}
        onOpenMenu={() => setMobileOpen(true)}
        language={language}
        setLanguage={setLanguage}
      />

      {mobileOpen && (
        <button
          className="worker-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =====================================================
          HOME DASHBOARD
      ===================================================== */}

      {view === "home" && (
        <section className="worker-main">
          {/* WELCOME */}

          <div className="worker-welcome-row">
            <div>
              <span className="worker-kicker">
                <ShieldCheck size={16} />
                {t("worker.workspace")}
              </span>

              <h1>
                {t("worker.welcome", { name: workerProfile.name.split(" ")[0] })}{" "}
                <span>👋</span>
              </h1>

              <p>
                {t("worker.welcomeText")}
              </p>
            </div>

            <div className="worker-location-pill">
              <MapPin size={16} />

              {workerProfile.village},{" "}
              {workerProfile.district}
            </div>
          </div>

          {/* CONNECTION + FACILITY READINESS */}

          <div className="worker-status-row">
            {/* CONNECTION */}

            <div className="worker-sync-card">
              <div className="worker-sync-icon">
                {online ? (
                  <RefreshCw size={20} />
                ) : (
                  <CloudOff size={20} />
                )}
              </div>

              <div>
                <strong>
                  {syncing
                    ? t("worker.synchronizing")
                    : online
                      ? t("worker.connection")
                      : t("worker.workingOffline")}
                </strong>

                <span>
                  {pendingSync === 0
                    ? lastSyncedAt
                      ? t("worker.lastSync", { time: new Date(lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
                      : t("worker.everythingSynced")
                    : t("worker.pendingSync", { count: pendingSync })}
                </span>
              </div>

              <button onClick={handleSyncNow}>
                {t("worker.syncNow")}
              </button>
            </div>

            {/* FACILITY READINESS */}

            <div className="worker-readiness-card">
              <div className="worker-readiness-heading">
                <span className="worker-panel-label">
                  {t("worker.recommendedDestination")}
                </span>

                <MapPin size={18} />
              </div>

              <div className="worker-readiness-main">
                <div>
                  <strong>
                    {
                      referralRecommendations[0]
                        ?.name
                    }
                  </strong>

                  <span>
                    {
                      referralRecommendations[0]
                        ?.distance
                    }{" "}
                    •{" "}
                    {
                      referralRecommendations[0]
                        ?.specialty
                    }
                  </span>
                </div>

                <span className="recommended-pill">
                  {t("worker.recommended")}
                </span>
              </div>

              <div className="worker-readiness-tags">
                <span>
                  <CheckCircle2 size={13} />
                  {t("worker.specialist")}
                </span>

                <span>
                  <CheckCircle2 size={13} />
                  {t("worker.diagnostics")}
                </span>

                <span>
                  <CheckCircle2 size={13} />
                  {t("worker.appointment")}
                </span>
              </div>

              <button
                className="text-action"
                onClick={openReferral}
              >
                {t("worker.compareFacilities")}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* STATISTICS */}

          {/* STATISTICS */}

          <div className="worker-stat-grid">
            <article className="worker-stat-card blue">
              <div className="worker-stat-icon">
                <UsersRound />
              </div>

              <div>
                <small>{t("worker.stats.activePatients")}</small>
                <strong>{workerInsights.activePatients}</strong>
                <span>{t("worker.stats.underCare")}</span>
              </div>
            </article>

            <article className="worker-stat-card red">
              <div className="worker-stat-icon">
                <AlertTriangle />
              </div>

              <div>
                <small>{t("worker.stats.priorityCases")}</small>
                <strong>{workerInsights.urgentCases}</strong>
                <span>{t("worker.stats.needAttention")}</span>
              </div>
            </article>

            <article className="worker-stat-card orange">
              <div className="worker-stat-icon">
                <RefreshCw />
              </div>

              <div>
                <small>{t("worker.stats.referralDelays")}</small>
                <strong>{workerInsights.delayedReferrals}</strong>
                <span>{t("worker.stats.intervention")}</span>
              </div>
            </article>

            <article className="worker-stat-card purple">
              <div className="worker-stat-icon">
                <CalendarDays />
              </div>

              <div>
                <small>{t("worker.stats.careGaps")}</small>
                <strong>{workerInsights.followUpsDue}</strong>
                <span>{t("worker.stats.followupDue")}</span>
              </div>
            </article>
          </div>

          {/* CARE PULSE */}

          <section className="worker-care-pulse">
            {/* ACCESS */}

            <article className="worker-pulse-card access">
              <div className="worker-pulse-icon">
                <MapPin size={20} />
              </div>

              <div className="worker-pulse-content">
                <span>{t("worker.pulse.access")}</span>

                <strong>
                  {
                    referralRecommendations[0]
                      ?.distance || "—"
                  }
                </strong>

                <small>
                  {t("worker.pulse.nearestReferral")}
                </small>
              </div>

              <button onClick={openReferral}>
                {t("worker.pulse.viewFacilities")}
                <ChevronRight size={15} />
              </button>
            </article>

            {/* SPECIALIST */}

            <article className="worker-pulse-card specialist">
              <div className="worker-pulse-icon">
                <Stethoscope size={20} />
              </div>

              <div className="worker-pulse-content">
                <span>{t("worker.pulse.specialistAccess")}</span>

                <strong>
                  {
                    workerInsights.specialistReadyFacilities
                  }
                </strong>

                <small>
                  {t("worker.pulse.suitableSpecialists")}
                </small>
              </div>

              <div className="worker-pulse-status">
                {t("worker.pulse.available")}
              </div>
            </article>

            {/* DIAGNOSTICS */}

            <article className="worker-pulse-card diagnostics">
              <div className="worker-pulse-icon">
                <FileHeart size={20} />
              </div>

              <div className="worker-pulse-content">
                <span>{t("worker.pulse.diagnosticReadiness")}</span>

                <strong>
                  {
                    workerInsights.diagnosticReadyFacilities
                  }
                </strong>

                <small>
                  {t("worker.pulse.facilitiesWithDiagnostics")}
                </small>
              </div>

              <div className="worker-pulse-status">
                {t("worker.pulse.ready")}
              </div>
            </article>

            {/* REFERRAL CONTINUITY */}

            <article className="worker-pulse-card referral">
              <div className="worker-pulse-icon">
                <RefreshCw size={20} />
              </div>

              <div className="worker-pulse-content">
                <span>{t("worker.pulse.referralContinuity")}</span>

                <strong>
                  {workerInsights.delayedReferrals === 0
                    ? t("worker.pulse.onTrack")
                    : t("worker.pulse.delayed", { count: workerInsights.delayedReferrals })}
                </strong>

                <small>
                  {t("worker.pulse.trackHandoffs")}
                </small>
              </div>

              <div className="worker-pulse-status">
                {t("worker.pulse.flightRecorder")}
              </div>
            </article>

            {/* CONNECTIVITY */}

            <article className="worker-pulse-card offline">
              <div className="worker-pulse-icon">
                {online ? (
                  <Wifi size={20} />
                ) : (
                  <CloudOff size={20} />
                )}
              </div>

              <div className="worker-pulse-content">
                <span>{t("worker.pulse.connectivity")}</span>

                <strong>
                  {online ? t("worker.pulse.online") : t("worker.pulse.offline")}
                </strong>

                <small>
                  {pendingSync === 0
                    ? t("worker.pulse.recordsSynced")
                    : t("worker.pendingSync", { count: pendingSync })}
                </small>
              </div>

              <button onClick={toggleConnection}>
                {online ? t("worker.pulse.testOffline") : t("worker.pulse.reconnect")}
              </button>
            </article>

            {/* FOLLOW-UP */}

            <article className="worker-pulse-card followup">
              <div className="worker-pulse-icon">
                <Bell size={20} />
              </div>

              <div className="worker-pulse-content">
                <span>{t("worker.pulse.careContinuity")}</span>

                <strong>
                  {workerInsights.followUpsDue}
                </strong>

                <small>
                  {t("worker.pulse.needFollowup")}
                </small>
              </div>

              <button onClick={openFollowups}>
                {t("worker.pulse.review")}
                <ChevronRight size={15} />
              </button>
            </article>
          </section>

          {/* QUICK ACTIONS */}

          <div className="worker-quick-actions">
            <button
              onClick={() => {
                resetRegistration();
                setView("register");
              }}
            >
              <Plus size={21} />

              <span>
                {t("worker.actions.register")}
              </span>

              <small>
                {t("worker.actions.registerText")}
              </small>
            </button>

            <button onClick={openReferral}>
              <RouteIcon />

              <span>
                {t("worker.actions.referral")}
              </span>

              <small>
                {t("worker.actions.referralText")}
              </small>
            </button>

            <button onClick={openFollowups}>
              <Bell size={21} />

              <span>
                {t("worker.actions.followups")}
              </span>

              <small>
                {t("worker.actions.followupsText")}
              </small>
            </button>

            <button onClick={toggleConnection}>
              {online ? (
                <WifiOff size={21} />
              ) : (
                <Wifi size={21} />
              )}

              <span>
                {t("worker.actions.connectivity")}
              </span>

              <small>
                {online
                  ? t("worker.actions.offline")
                  : t("worker.actions.backOnline")}
              </small>
            </button>
          </div>

          {/* PATIENT QUEUE */}

          <div className="worker-content-grid">
            <section className="worker-panel worker-patients-panel">
              <div className="worker-panel-heading">
                <div>
                  <span>
                    {t("worker.queue.eyebrow")}
                  </span>

                  <h2>
                    {t("worker.queue.heading")}
                  </h2>
                </div>

                <div className="worker-search">
                  <Search size={17} />

                  <input
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                    placeholder={t("worker.queue.search")}
                  />
                </div>
              </div>

              {/* PRIORITY LEGEND */}

              <div className="worker-priority-strip">
                <span>
                  <i className="dot-red" />
                  {t("worker.queue.emergency")}{" "}
                  {
                    patients.filter(
                      (p) =>
                        p.priority === "Emergency",
                    ).length
                  }
                </span>

                <span>
                  <i className="dot-orange" />
                  {t("worker.queue.high")}{" "}
                  {
                    patients.filter(
                      (p) =>
                        p.priority === "High",
                    ).length
                  }
                </span>

                <span>
                  <i className="dot-amber" />
                  {t("worker.queue.referralDelayed")}{" "}
                  {
                    patients.filter(
                      (p) =>
                        p.priority ===
                        "Referral Delayed",
                    ).length
                  }
                </span>

                <span>
                  <i className="dot-purple" />
                  {t("worker.queue.followupDue")}{" "}
                  {
                    patients.filter(
                      (p) =>
                        p.priority ===
                        "Follow-up Due",
                    ).length
                  }
                </span>
              </div>

              {/* PATIENT LIST */}

              <div className="worker-patient-list">
                {filteredPatients.length === 0 ? (
                  <div className="worker-empty-state">
                    <Search size={26} />

                    <strong>
                      {t("worker.queueDetails.noPatients")}
                    </strong>

                    <span>
                      {t("worker.queueDetails.searchHelp")}
                    </span>
                  </div>
                ) : (
                  filteredPatients.map((patient) => (
                    <article
                      key={patient.id}
                      className="worker-patient-row"
                    >
                      <div className="worker-patient-avatar">
                        {patient.name.charAt(0)}
                      </div>

                      <div className="worker-patient-main">
                        <div className="worker-patient-name-row">
                          <strong>
                            {patient.name}
                          </strong>

                          <span
                            className={`priority-badge ${priorityStyles[
                              patient.priority
                            ].badge
                              }`}
                          >
                            <i
                              className={
                                priorityStyles[
                                  patient.priority
                                ].dot
                              }
                            />

                            {t(`worker.queue.${patient.priority === "Referral Delayed" ? "referralDelayed" : patient.priority === "Follow-up Due" ? "followupDue" : patient.priority.toLowerCase()}`)}
                          </span>
                        </div>

                        <p>
                          {patient.age} {t("patient.years")}
                          {" • "}
                          {patient.village}
                          {" • "}
                          {patient.issue}
                        </p>

                        <small>
                          {patient.nextAction}
                          {" • "}
                          {t("worker.queueDetails.lastVisit")}{" "}
                          {patient.lastVisit}
                        </small>
                      </div>

                      <button
                        className="worker-view-button"
                        onClick={() =>
                          openAssessment(patient)
                        }
                      >
                        {t("worker.queueDetails.assess")}
                        <ChevronRight size={16} />
                      </button>
                    </article>
                  ))
                )}
              </div>
            </section>

            {/* SIDE STACK */}

            <aside className="worker-side-stack">
              {/* EMERGENCY */}

              <section className="worker-panel emergency-panel">
                <div className="worker-panel-heading compact">
                  <div>
                    <span>
                      {t("worker.queueDetails.emergencyEscalation")}
                    </span>

                    <h2>
                      {t("worker.queueDetails.actQuickly")}
                    </h2>
                  </div>

                  <AlertTriangle size={21} />
                </div>

                <p>
                  {t("worker.queueDetails.emergencyText")}
                </p>

                <button
                  className="emergency-button"
                  onClick={() =>
                    openAssessment(
                      patients[3] ??
                      patients[0],
                    )
                  }
                >
                  <AlertTriangle size={18} />
                  {t("worker.queueDetails.startEmergency")}
                </button>
              </section>

              {/* CARE GAPS */}

              <section className="worker-panel followup-panel">
                <div className="worker-panel-heading compact">
                  <div>
                    <span>{t("worker.queueDetails.careGaps")}</span>

                    <h2>
                      {t("worker.queueDetails.needsFollowup")}
                    </h2>
                  </div>

                  <span className="care-gap-count">
                    {workerInsights.followUpsDue}
                  </span>
                </div>

                <div className="care-gap-item">
                  <span>
                    {t("worker.queueDetails.awaitingAcceptance")}
                  </span>

                  <strong>2</strong>
                </div>

                <div className="care-gap-item">
                  <span>
                    {t("worker.queueDetails.overdue")}
                  </span>

                  <strong>3</strong>
                </div>

                <div className="care-gap-item">
                  <span>
                    {t("worker.queueDetails.diagnosticPending")}
                  </span>

                  <strong>2</strong>
                </div>

                <button
                  className="text-action"
                  onClick={openFollowups}
                >
                  {t("worker.queueDetails.viewAllGaps")}
                  <ArrowRight size={16} />
                </button>
              </section>
            </aside>
          </div>
        </section>
      )}

      {/* =====================================================
          NEW PATIENT REGISTRATION VIEW
      ===================================================== */}

      {view === "register" && (
        <section className="worker-main workflow-main">
          <div className="workflow-topbar">
            <button
              className="workflow-back"
              onClick={() => {
                resetRegistration();
                setView("home");
              }}
            >
              <ArrowLeft size={18} />
              {t("worker.registration.back")}
            </button>

            <span className="workflow-step">
              {t("worker.registration.step")}
            </span>
          </div>

          <div className="workflow-heading">
            <div>
              <span className="worker-kicker">
                <Plus size={16} />
                {t("worker.registration.kicker")}
              </span>

              <h1>
                {t("worker.registration.heading")}
              </h1>

              <p>
                {t("worker.registration.intro")}
              </p>
            </div>
          </div>

          {!patientCreated ? (
            <div className="assessment-grid">
              <section className="worker-panel assessment-form">
                <div className="worker-panel-heading compact">
                  <div>
                    <span>
                      {t("worker.registration.basic")}
                    </span>

                    <h2>
                      {t("worker.registration.details")}
                    </h2>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">
                    <UsersRound size={18} />
                    {t("worker.registration.personal")}
                  </div>

                  <div className="vitals-grid">
                    <label>
                      {t("worker.registration.fullName")}
                      <input
                        value={newPatientForm.name}
                        onChange={(event) =>
                          setNewPatientForm(
                            (current) => ({
                              ...current,
                              name: event.target.value,
                            }),
                          )
                        }
                        placeholder={t("worker.registration.patientName")}
                      />
                    </label>

                    <label>
                      {t("worker.registration.age")}
                      <input
                        type="number"
                        min="0"
                        max="120"
                        value={newPatientForm.age}
                        onChange={(event) =>
                          setNewPatientForm(
                            (current) => ({
                              ...current,
                              age: event.target.value,
                            }),
                          )
                        }
                        placeholder={t("worker.registration.age")}
                      />
                    </label>

                    <label>
                      {t("worker.registration.gender")}
                      <select
                        value={newPatientForm.gender}
                        onChange={(event) =>
                          setNewPatientForm(
                            (current) => ({
                              ...current,
                              gender:
                                event.target.value,
                            }),
                          )
                        }
                      >
                        <option value="">
                          {t("worker.registration.selectGender")}
                        </option>
                        <option value="Female">
                          {t("worker.registration.female")}
                        </option>
                        <option value="Male">
                          {t("worker.registration.male")}
                        </option>
                        <option value="Other">
                          {t("worker.registration.other")}
                        </option>
                      </select>
                    </label>

                    <label>
                      {t("worker.registration.mobile")}
                      <input
                        type="tel"
                        value={newPatientForm.mobile}
                        onChange={(event) =>
                          setNewPatientForm(
                            (current) => ({
                              ...current,
                              mobile:
                                event.target.value,
                            }),
                          )
                        }
                        placeholder={t("worker.registration.optional")}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-section">
                  <div className="form-section-title">
                    <MapPin size={18} />
                    {t("worker.registration.location")}
                  </div>

                  <div className="vitals-grid">
                    <label>
                      {t("worker.registration.village")}
                      <input
                        value={newPatientForm.village}
                        onChange={(event) =>
                          setNewPatientForm(
                            (current) => ({
                              ...current,
                              village:
                                event.target.value,
                            }),
                          )
                        }
                        placeholder={t("worker.registration.villagePlaceholder")}
                      />
                    </label>

                    <label>
                      {t("worker.registration.preferredLanguage")}
                      <select
                        value={
                          newPatientForm.preferredLanguage
                        }
                        onChange={(event) =>
                          setNewPatientForm(
                            (current) => ({
                              ...current,
                              preferredLanguage:
                                event.target.value,
                            }),
                          )
                        }
                      >
                        <option value="Marathi">
                          {t("language.mr")}
                        </option>
                        <option value="Hindi">
                          {t("language.hi")}
                        </option>
                        <option value="English">
                          {t("language.en")}
                        </option>
                      </select>
                    </label>
                  </div>

                  <label>
                    {t("worker.registration.address")}
                    <textarea
                      value={newPatientForm.address}
                      onChange={(event) =>
                        setNewPatientForm(
                          (current) => ({
                            ...current,
                            address:
                              event.target.value,
                          }),
                        )
                      }
                      placeholder={t("worker.registration.addressPlaceholder")}
                    />
                  </label>
                </div>

                <div className="form-section">
                  <div className="form-section-title">
                    <AlertTriangle size={18} />
                    {t("worker.registration.emergencyContact")}
                  </div>

                  <label>
                    {t("worker.registration.emergencyNumber")}
                    <input
                      type="tel"
                      value={
                        newPatientForm.emergencyContact
                      }
                      onChange={(event) =>
                        setNewPatientForm(
                          (current) => ({
                            ...current,
                            emergencyContact:
                              event.target.value,
                          }),
                        )
                      }
                      placeholder={t("worker.registration.caregiverNumber")}
                    />
                  </label>
                </div>

                <div className="form-section">
                  <div className="form-section-title">
                    <FileHeart size={18} />
                    {t("worker.registration.existingHealth")}
                  </div>

                  <label>
                    {t("worker.registration.existingConcern")}
                    <textarea
                      value={
                        newPatientForm.existingCondition
                      }
                      onChange={(event) =>
                        setNewPatientForm(
                          (current) => ({
                            ...current,
                            existingCondition:
                              event.target.value,
                          }),
                        )
                      }
                      placeholder={t("worker.registration.concernExample")}
                    />
                  </label>
                </div>

                <div className="form-section">
                  <div className="form-section-title">
                    <ShieldCheck size={18} />
                    {t("worker.registration.registrationSource")}
                  </div>

                  <div className="priority-selector">
                    {[
                      "ASHA",
                      "ANM",
                      "PHC",
                      "CHC",
                      "Self",
                    ].map((source) => (
                      <button
                        key={source}
                        type="button"
                        className={
                          newPatientForm.registrationSource ===
                            source
                            ? "selected"
                            : ""
                        }
                        onClick={() =>
                          setNewPatientForm(
                            (current) => ({
                              ...current,
                              registrationSource:
                                source,
                            }),
                          )
                        }
                      >
                        {source}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="assessment-actions">
                  <button
                    className="button outline"
                    onClick={() => {
                      resetRegistration();
                      setView("home");
                    }}
                  >
                    <ArrowLeft size={17} />
                    {t("worker.registration.cancel")}
                  </button>

                  <button
                    className="button primary"
                    onClick={createNewPatient}
                  >
                    <CheckCircle2 size={17} />
                    {t("worker.registration.createPatient")}
                  </button>
                </div>
              </section>

              <aside className="worker-side-stack">
                <section className="worker-panel ai-summary-panel">
                  <div className="worker-panel-heading compact">
                    <div>
                      <span>
                        {t("worker.registration.frontlineRegistration")}
                      </span>

                      <h2>
                        {t("worker.registration.keepSimple")}
                      </h2>
                    </div>

                    <ShieldCheck size={20} />
                  </div>

                  <div className="ai-summary-callout">
                    <strong>
                      {t("worker.registration.createFirst")}
                    </strong>

                    <p>
                      {t("worker.registration.assessmentInfo")}
                    </p>
                  </div>

                  <div className="ai-summary-list">
                    <span>
                      {t("worker.registration.required")}
                      <strong>
                        {" "}
                        {t("worker.registration.requiredFields")}
                      </strong>
                    </span>

                    <span>
                      {t("worker.registration.locationLabel")}
                      <strong>
                        {" "}
                        {t("worker.registration.locationValue")}
                      </strong>
                    </span>

                    <span>
                      {t("worker.registration.registrationLabel")}
                      <strong>
                        {" "}
                        {newPatientForm.registrationSource}
                      </strong>
                    </span>
                  </div>

                  <small className="ai-disclaimer">
                    {t("worker.registration.collectMinimum")}
                  </small>
                </section>

                <section className="worker-panel patient-mini-card">
                  <span className="worker-panel-label">
                    {t("worker.registration.worker")}
                  </span>

                  <h3>
                    {workerProfile.name}
                  </h3>

                  <p>
                    {workerProfile.role}
                  </p>

                  <div className="mini-info">
                    <MapPin size={16} />
                    {workerProfile.village},{" "}
                    {workerProfile.district}
                  </div>

                  <div className="mini-info">
                    <Languages size={16} />
                    {workerProfile.language}
                  </div>
                </section>
              </aside>
            </div>
          ) : (
            <section className="worker-panel">
              <div className="worker-panel-heading">
                <div>
                  <span>
                    {t("worker.registration.created")}
                  </span>

                  <h2>
                    {t("worker.registration.createdSuccess")}
                  </h2>
                </div>

                <CheckCircle2 size={24} />
              </div>

              {createdPatient && (
                <div className="patient-mini-card">
                  <span className="worker-panel-label">
                    {t("worker.registration.newPatient")}
                  </span>

                  <h3>
                    {createdPatient.name}
                  </h3>

                  <p>
                    {t("patient.patientId")}:{" "}
                    {createdPatient.id}
                  </p>

                  <div className="mini-info">
                    <UsersRound size={16} />
                    {createdPatient.age} {t("patient.years")}
                  </div>

                  <div className="mini-info">
                    <MapPin size={16} />
                    {createdPatient.village}
                  </div>

                  <div className="mini-info">
                    <FileHeart size={16} />
                    {t("worker.registration.initialAssessmentPending")}
                  </div>
                </div>
              )}

              <div className="assessment-actions">
                <button
                  className="button outline"
                  onClick={() => {
                    resetRegistration();
                    setView("home");
                  }}
                >
                  {t("worker.registration.backToDashboard")}
                </button>

                <button
                  className="button primary"
                  onClick={() => {
                    if (createdPatient) {
                      openAssessment(createdPatient);
                    }
                  }}
                >
                  {t("worker.registration.startAssessment")}
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>
          )}
        </section>
      )}

      {/* =====================================================
          ASSESSMENT VIEW
      ===================================================== */}

      {view === "assessment" && (
        <section className="worker-main workflow-main">
          {/* TOPBAR */}

          <div className="workflow-topbar">
            <button
              className="workflow-back"
              onClick={() => setView("home")}
            >
              <ArrowLeft size={18} />
              {t("worker.assessment.back")}
            </button>

            <span className="workflow-step">
              {t("worker.assessment.step")}
            </span>
          </div>

          {/* HEADING */}

          <div className="workflow-heading">
            <div>
              <span className="worker-kicker">
                <ClipboardList size={16} />
                {t("worker.assessment.assisted")}
              </span>

              <h1>
                {selectedPatient.name}
              </h1>

              <p>
                {selectedPatient.age} {t("patient.years")}
                {" • "}
                {selectedPatient.village}
                {" • "}
                {t("patient.patientId")}{" "}
                {selectedPatient.id}
              </p>
            </div>

            <span
              className={`priority-badge large ${priorityStyles[priority].badge
                }`}
            >
              <i
                className={
                  priorityStyles[priority].dot
                }
              />

              {priority}
            </span>
          </div>

          <div className="assessment-grid">
            {/* =================================================
                LEFT - ASSESSMENT FORM
            ================================================= */}

            <section className="worker-panel assessment-form">
              <div className="worker-panel-heading compact">
                <div>
                  <span>
                    {t("worker.assessment.patientIntake")}
                  </span>

                  <h2>
                    {t("worker.assessment.whatSeeing")}
                  </h2>
                </div>
              </div>

              {/* SYMPTOMS */}

              <div className="form-section">
                <div className="form-section-title">
                  <Stethoscope size={18} />
                  {t("worker.assessment.symptoms")}
                </div>

                <div className="symptom-grid">
                  {symptomOptions.map((item) => (
                    <label
                      key={item}
                      className="check-card"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSymptoms.includes(
                          item,
                        )}
                        onChange={() =>
                          toggleSymptom(item)
                        }
                      />

                      <span>{t(`worker.symptoms.${item}`)}</span>
                    </label>
                  ))}
                </div>

                <button
                  className={
                    voiceNote
                      ? "voice-button listening"
                      : "voice-button"
                  }
                  onClick={() =>
                    setVoiceNote(
                      (value) => !value,
                    )
                  }
                >
                  <Mic size={18} />

                  {voiceNote
                    ? t("worker.assessment.listening")
                    : t("worker.assessment.speak")}
                </button>

                {selectedSymptoms.length > 0 && (
                  <small>
                    {t("worker.assessment.selectedSymptoms", {
                      symptoms: selectedSymptoms.map((item) => t(`worker.symptoms.${item}`)).join(", "),
                    })}
                  </small>
                )}
              </div>

              {/* VITALS */}

              <div className="form-section">
                <div className="form-section-title">
                  <HeartPulse size={18} />
                  {t("worker.assessment.vitals")}
                </div>

                <div className="vitals-grid">
                  <label>
                    {t("worker.assessment.bloodPressure")}

                    <input
                      value={vitals.bloodPressure}
                      onChange={(event) =>
                        setVitals((current) => ({
                          ...current,
                          bloodPressure:
                            event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    {t("worker.assessment.pulse")}

                    <input
                      value={vitals.pulse}
                      onChange={(event) =>
                        setVitals((current) => ({
                          ...current,
                          pulse: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    {t("worker.assessment.temperature")}

                    <input
                      value={vitals.temperature}
                      onChange={(event) =>
                        setVitals((current) => ({
                          ...current,
                          temperature:
                            event.target.value,
                        }))
                      }
                    />
                  </label>

                  <label>
                    SpO₂

                    <input
                      value={vitals.spo2}
                      onChange={(event) =>
                        setVitals((current) => ({
                          ...current,
                          spo2: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>

              {/* PRIORITY + NOTES */}

              <div className="form-section">
                <div className="form-section-title">
                  <FileHeart size={18} />
                  {t("worker.assessment.priorityNotes")}
                </div>

                <div className="priority-selector">
                  {(
                    Object.keys(
                      priorityStyles,
                    ) as WorkerPriority[]
                  ).map((item) => (
                    <button
                      key={item}
                      className={
                        priority === item
                          ? `selected ${priorityStyles[item].badge}`
                          : ""
                      }
                      onClick={() =>
                        setPriority(item)
                      }
                    >
                      <i
                        className={
                          priorityStyles[item].dot
                        }
                      />

                      {t(`worker.queue.${item === "Emergency" ? "emergency" : item === "Referral Delayed" ? "referralDelayed" : item === "Follow-up Due" ? "followupDue" : item.toLowerCase()}`)}
                    </button>
                  ))}
                </div>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder={t("worker.assessment.workerNote")}
                />
              </div>

              {/* ACTIONS */}

              <div className="ai-triage-action-card">
                <div>
                  <span className="worker-panel-label">{t("worker.assessment.triage")}</span>
                  <strong>{t("worker.assessment.triageReview")}</strong>
                  <small>{t("worker.assessment.triageDisclaimer")}</small>
                </div>
                <button className="button outline" onClick={runTriageReview} disabled={aiBusy || !online}>
                  {aiBusy ? t("worker.assessment.analyzing") : t("worker.assessment.runReview")}
                </button>
              </div>

              {aiError && <div className="ai-error-callout">{aiError}</div>}

              {aiTriage && (
                <div className="ai-result-card">
                  <div className="ai-result-header">
                    <div>
                      <span className="worker-panel-label">{t("worker.assessment.liveResult")}</span>
                      <strong>{aiTriage.urgency} {t("worker.assessment.urgency")}</strong>
                    </div>
                    <span className="ai-model-badge">{aiTriage.model}</span>
                  </div>
                  <div className="ai-result-grid">
                    <div><span>{t("worker.assessment.keyConcerns")}</span><strong>{aiTriage.keyConcerns[0] ?? t("worker.assessment.noneReturned")}</strong></div>
                    <div><span>{t("worker.assessment.recommendedAction")}</span><strong>{aiTriage.recommendedAction}</strong></div>
                    <div><span>{t("worker.assessment.referralReason")}</span><strong>{aiTriage.referralReason}</strong></div>
                    <div><span>{t("worker.assessment.missingInformation")}</span><strong>{aiTriage.missingInformation[0] ?? t("worker.assessment.noAdditionalInfo")}</strong></div>
                  </div>
                </div>
              )}

              <div className="assessment-actions">
                <button
                  className="button outline"
                  onClick={() =>
                    setView("home")
                  }
                >
                  <ArrowLeft size={17} />
                  {t("worker.assessment.saveLater")}
                </button>

                <button
                  className="button primary"
                  onClick={saveAssessment}
                >
                  <CheckCircle2 size={17} />

                  {assessmentSaved
                    ? t("worker.assessment.saved")
                    : t("worker.assessment.save")}
                </button>

                <button
                  className="button primary"
                  onClick={() => {
                    saveAssessment();
                    openReferral();
                  }}
                >
                  {t("worker.assessment.continueReferral")}
                  <ArrowRight size={17} />
                </button>
              </div>
            </section>

            {/* =================================================
                RIGHT - ASSESSMENT CONTEXT
            ================================================= */}

            <aside className="worker-side-stack">
              {/* AI SUMMARY */}

              <section className="worker-panel ai-summary-panel">
                <div className="worker-panel-heading compact">
                  <div>
                    <span>
                      {t("worker.assessment.summary")}
                    </span>

                    <h2>
                      {t("worker.assessment.readyReview")}
                    </h2>
                  </div>

                  <ShieldCheck size={20} />
                </div>

                <div className="ai-summary-callout">
                  <strong>
                    {t("worker.assessment.prioritySuggested")}
                  </strong>

                  <p>
                    {t("worker.assessment.assessmentPrepared")}
                  </p>
                </div>

                <div className="ai-summary-list">
                  <span>
                    {t("worker.assessment.bpCaptured")}
                    <strong>
                      {" "}
                      {vitals.bloodPressure}
                    </strong>
                  </span>

                  <span>
                    Symptoms:
                    <strong>
                      {" "}
                      {selectedSymptoms.length}
                    </strong>
                  </span>

                  <span>
                    {t("worker.assessment.currentConcern")}
                    <strong>
                      {" "}
                      {selectedPatient.issue}
                    </strong>
                  </span>

                  <span>
                    Priority:
                    <strong>
                      {" "}
                      {priority}
                    </strong>
                  </span>
                </div>

                <small className="ai-disclaimer">
                  {t("worker.assessment.finalDecision")}
                </small>
              </section>

              {/* CARE CONTEXT */}

              <section className="worker-panel patient-mini-card">
                <span className="worker-panel-label">
                  {t("worker.assessment.careContext")}
                </span>

                <h3>
                  {t("worker.assessment.assignedWorker")}
                </h3>

                <p>
                  {workerProfile.name}
                  {" • "}
                  {workerProfile.role}
                </p>

                <div className="mini-info">
                  <MapPin size={16} />
                  {workerProfile.village},{" "}
                  {workerProfile.district}
                </div>

                <div className="mini-info">
                  <Languages size={16} />
                  {t("worker.assessment.preferredLanguage")}{" "}
                  {workerProfile.language}
                </div>
              </section>

              {/* CURRENT PATIENT DATA */}

              <section className="worker-panel patient-mini-card">
                <span className="worker-panel-label">
                  {t("worker.assessment.currentCase")}
                </span>

                <h3>
                  {selectedPatient.name}
                </h3>

                <p>
                  {t("patient.patientId")}:{" "}
                  {selectedPatient.id}
                </p>

                <div className="mini-info">
                  <FileHeart size={16} />
                  {selectedSymptoms.length} {t("worker.assessment.symptomsRecorded")}
                </div>
              </section>
            </aside>
          </div>
        </section>
      )}

      {/* =====================================================
          SMART REFERRAL VIEW
      ===================================================== */}

      {view === "referral" && (
        <section className="worker-main workflow-main">
          {/* TOPBAR */}

          <div className="workflow-topbar">
            <button
              className="workflow-back"
              onClick={() =>
                setView("assessment")
              }
            >
              <ArrowLeft size={18} />
              {t("worker.referral.back")}
            </button>

            <span className="workflow-step">
              {t("worker.referral.step")}
            </span>
          </div>

          {/* HEADING */}

          <div className="workflow-heading">
            <div>
              <span className="worker-kicker">
                <RouteIcon />
                {t("worker.referral.engine")}
              </span>

              <h1>
                {t("worker.referral.heading")}
              </h1>

              <p>
                {selectedPatient.name}
                {" • "}
                {selectedPatient.issue}
              </p>
            </div>

            <span className="referral-demo-badge">
              {t("worker.referral.synthetic")}
            </span>
          </div>

          {/* REQUEST SUMMARY */}

          <div className="referral-request-bar">
            <div>
              <strong>
                {t("worker.referral.specialty")}
              </strong>

              <span>
                General Medicine
              </span>
            </div>

            <div>
              <strong>
                {t("worker.referral.urgency")}
              </strong>

              <span
                className={`priority-badge ${priorityStyles[priority].badge
                  }`}
              >
                <i
                  className={
                    priorityStyles[priority].dot
                  }
                />

                {priority}
              </span>
            </div>

            <div>
              <strong>
                {t("worker.referral.location")}
              </strong>

              <span>
                {workerProfile.village},{" "}
                {workerProfile.district}
              </span>
            </div>
          </div>

          <div className="referral-layout">
            {/* =================================================
                FACILITY MATCHING
            ================================================= */}

            <section className="worker-panel facility-panel">
              <div className="worker-panel-heading compact">
                <div>
                  <span>
                    {t("worker.referral.readiness")}
                  </span>

                  <h2>
                    {t("worker.referral.compare")}
                  </h2>
                </div>

                <MapPin size={20} />
              </div>

              <div className="facility-list">
                {referralRecommendations.map(
                  (facility) => (
                    <button
                      key={facility.id}
                      className={
                        selectedFacility ===
                          facility.id
                          ? "facility-option selected"
                          : "facility-option"
                      }
                      onClick={() =>
                        setSelectedFacility(
                          facility.id,
                        )
                      }
                    >
                      <div className="facility-option-top">
                        <span
                          className={
                            facility.status ===
                              "Recommended"
                              ? "recommended-pill"
                              : "alternative-pill"
                          }
                        >
                          {t(facility.status === "Recommended" ? "worker.referral.recommended" : "worker.referral.alternative")}
                        </span>

                        <span>
                          {facility.distance}
                        </span>
                      </div>

                      <h3>
                        {facility.name}
                      </h3>

                      <p>
                        {facility.specialty}
                        {" • "}
                        {facility.doctor}
                      </p>

                      <strong>
                        {facility.appointment}
                      </strong>

                      <div className="facility-diagnostics">
                        {facility.diagnostics.map(
                          (diagnostic) => (
                            <span
                              key={diagnostic}
                            >
                              <CheckCircle2
                                size={13}
                              />
                              {diagnostic}
                            </span>
                          ),
                        )}
                      </div>

                      <small>
                        {facility.reason}
                      </small>
                    </button>
                  ),
                )}
              </div>

              {/* ACTION BAR */}

              <div className="referral-action-bar">
                <div>
                  <ShieldCheck size={18} />

                  <span>
                    {t("worker.referral.suggestionText")}
                  </span>
                </div>

                <button
                  className="button primary"
                  onClick={createReferral}
                >
                  <RouteIcon />
                  {referralCreated
                    ? t("worker.referral.created")
                    : t("worker.referral.create")}
                </button>
              </div>

              {/* SUCCESS */}

              {referralCreated && (
                <div className="referral-success">
                  <CheckCircle2 size={20} />

                  <div>
                    <strong>
                      {t("worker.referral.createdSuccess")}
                    </strong>

                    <span>
                      {t("worker.referral.created")} • {t("worker.referral.selectedFacility")}
                      {" "}
                      {
                        referralRecommendations.find(
                          (facility) =>
                            facility.id ===
                            selectedFacility,
                        )?.name
                      }
                    </span>
                  </div>
                </div>
              )}
            </section>

            {/* =================================================
                REFERRAL FLIGHT RECORDER
            ================================================= */}

            <aside className="worker-panel flight-panel">
              <div className="worker-panel-heading compact">
                <div>
                  <span>
                    {t("worker.referral.flightRecorder")}
                  </span>

                  <h2>
                    {t("worker.referral.trackJourney")}
                  </h2>
                </div>
              </div>

              <div className="flight-steps">
                {flightSteps.map(
                  (label, index) => {
                    const completed =
                      referralStage >= index;

                    return (
                      <div
                        className="flight-step"
                        key={label}
                      >
                        <div
                          className={
                            completed
                              ? "flight-marker done"
                              : "flight-marker"
                          }
                        >
                          {completed
                            ? "✓"
                            : index + 1}
                        </div>

                        <div>
                          <strong>
                            {t(`worker.flight.${label}`, { defaultValue: label })}
                          </strong>

                          <small>
                            {completed
                              ? t("worker.referral.completed")
                              : t("worker.referral.waiting")}
                          </small>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {/* DEMO JOURNEY CONTROL */}

              {referralCreated &&
                referralStage <
                flightSteps.length - 1 && (
                  <button
                    className="button primary"
                    onClick={advanceReferral}
                  >
                    {t("worker.referral.advance")}
                    <ArrowRight size={17} />
                  </button>
                )}

              {referralCreated &&
                referralStage ===
                flightSteps.length - 1 && (
                  <div className="referral-success">
                    <CheckCircle2 size={20} />

                    <div>
                      <strong>
                        {t("worker.referral.journeyClosed")}
                      </strong>

                      <span>
                        {t("worker.referral.closedDemo")}
                      </span>
                    </div>
                  </div>
                )}

              <div className="flight-note">
                <AlertTriangle size={17} />

                <span>
                  {t("worker.referral.stuckNote")}
                </span>
              </div>
            </aside>
          </div>
        </section>
      )}

      {/* =====================================================
          FOLLOW-UP / CARE GAP VIEW
      ===================================================== */}

      {view === "followups" && (
        <section className="worker-main workflow-main">
          {/* TOPBAR */}

          <div className="workflow-topbar">
            <button
              className="workflow-back"
              onClick={() =>
                setView("home")
              }
            >
              <ArrowLeft size={18} />
              {t("worker.followups.back")}
            </button>

            <span className="workflow-step">
              {t("worker.followups.step")}
            </span>
          </div>

          {/* HEADING */}

          <div className="workflow-heading">
            <div>
              <span className="worker-kicker">
                <Bell size={16} />
                {t("worker.followups.kicker")}
              </span>

              <h1>
                {t("worker.followups.heading")}
              </h1>

              <p>
                {t("worker.followups.intro")}
              </p>
            </div>
          </div>

          {/* FOLLOW-UP LIST */}

          <div className="followup-grid">
            <section className="worker-panel">
              {[
                [
                  "Lata Gaikwad",
                  "Referral awaiting acceptance",
                  "36 hours",
                  "escalate",
                ],
                [
                  "Sita More",
                  "ANC follow-up due",
                  "Tomorrow",
                  "confirmVisit",
                ],
                [
                  "Ramesh Patil",
                  "Diagnostic review after specialist",
                  "3 days",
                  "scheduleReminder",
                ],
                [
                  "Mahesh Pawar",
                  "Diabetes review",
                  "5 days",
                  "checkGlucose",
                ],
              ].map(
                ([name, gap, age, action]) => (
                  <div
                    className="followup-row"
                    key={name}
                  >
                    <div className="worker-patient-avatar">
                      {name.charAt(0)}
                    </div>

                    <div>
                      <strong>
                        {name}
                      </strong>

                      <span>
                        {t(`worker.followups.gaps.${gap}`)}
                      </span>

                      <small>
                        {t(`worker.followups.time.${age}`)}
                      </small>
                    </div>

                    <button
                      className="text-action"
                      onClick={() =>
                        openAssessment(
                          patients.find(
                            (patient) =>
                              patient.name ===
                              name,
                          ) ??
                          patients[0],
                        )
                      }
                    >
                      {t(`worker.followups.${action}`)}

                      <ChevronRight
                        size={15}
                      />
                    </button>
                  </div>
                ),
              )}
            </section>
          </div>
        </section>
      )}
    </main>
  );
}

/* ============================================================
   SMALL LOCAL ICON
   Keeps the referral icon consistent.
============================================================ */

function RouteIcon() {
  return <RefreshCw size={20} />;
}