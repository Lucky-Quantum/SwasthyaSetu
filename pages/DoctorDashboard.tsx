import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  AlertTriangle,
  Bell,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ClipboardList,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  LogOut,
  Pill,
  RefreshCw,
  Search,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
  Video,
  X,
} from "lucide-react";
import { useCare } from "../src/store/careStore";
import { sharedFacilities } from "../src/data/facilityData";
import Brand from "../components/Brand";
import type { Language } from "../components/LanguageSelector";
import WorkspaceTopbar from "../components/WorkspaceTopbar";
import type {
  JourneyStage,
  ReferralRecord,
  ReferralStatus,
  ReferralPriority,
} from "../src/data/careData";

interface DoctorDashboardProps {
  onLogout: () => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

type DoctorView =
  | "overview"
  | "referrals"
  | "patients"
  | "timeline"
  | "diagnostics"
  | "followups"
  | "prescriptions"
  | "profile";

const doctorViewLabels: Record<DoctorView, string> = {
  overview: "Overview",
  referrals: "Referral Queue",
  patients: "My Patients",
  timeline: "Patient Timeline",
  diagnostics: "Diagnostics",
  followups: "Follow-ups",
  prescriptions: "E-Prescriptions",
  profile: "Profile",
};

type ReferralFilter =
  | "all"
  | "high"
  | "pending"
  | "followups"
  | "completed";

type Disposition =
  | "manage"
  | "chc"
  | "district"
  | "emergency";

interface ClinicalDraft {
  assessment: string;
  notes: string;
  medicines: string;
  diagnostics: string[];
  disposition: Disposition;
  followUpDate: string;
}

const priorityStyles: Record<
  ReferralPriority,
  { badge: string; dot: string; label: string }
> = {
  Emergency: {
    badge: "priority-emergency",
    dot: "dot-red",
    label: "Emergency",
  },
  High: {
    badge: "priority-high",
    dot: "dot-orange",
    label: "High",
  },
  Medium: {
    badge: "priority-medium",
    dot: "dot-amber",
    label: "Medium",
  },
  Routine: {
    badge: "priority-routine",
    dot: "dot-green",
    label: "Routine",
  },
};

const statusStyles: Record<
  ReferralStatus,
  { badge: string; label: string; color: string }
> = {
  New: {
    badge: "status-new",
    label: "New",
    color: "#0b6ee8",
  },
  Accepted: {
    badge: "status-accepted",
    label: "Accepted",
    color: "#7253d4",
  },
  "Awaiting Diagnostics": {
    badge: "status-pending",
    label: "Diagnostics Pending",
    color: "#e38720",
  },
  Consultation: {
    badge: "status-consultation",
    label: "Consultation",
    color: "#0b6ee8",
  },
  Diagnostics: {
    badge: "status-diagnostics",
    label: "Diagnostics",
    color: "#14845f",
  },
  Treatment: {
    badge: "status-treatment",
    label: "Treatment",
    color: "#14845f",
  },
  "Follow-up": {
    badge: "status-followup",
    label: "Follow-up",
    color: "#7253d4",
  },
  Completed: {
    badge: "status-completed",
    label: "Completed",
    color: "#15865f",
  },
  Stuck: {
    badge: "status-stuck",
    label: "Stuck",
    color: "#c84558",
  },
};

const clinicalStages: ReferralStatus[] = [
  "New",
  "Accepted",
  "Consultation",
  "Diagnostics",
  "Treatment",
  "Follow-up",
  "Completed",
];

const diagnosticOptions = [
  "CBC",
  "Hemoglobin",
  "Blood Sugar",
  "Urine Test",
  "Ultrasound",
  "Blood Pressure monitoring",
];

const todayLabel = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());

const emptyDraft: ClinicalDraft = {
  assessment: "",
  notes: "",
  medicines: "",
  diagnostics: [],
  disposition: "manage",
  followUpDate: "",
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function stageIndex(status: ReferralStatus) {
  const index = clinicalStages.indexOf(status);
  return index === -1 ? 0 : index;
}

export default function DoctorDashboard({
  onLogout,
  language,
  setLanguage,
}: DoctorDashboardProps) {
  const { t } = useTranslation();
  const { referrals, updateReferral, online } = useCare();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [view, setView] = useState<DoctorView>("overview");
  const [selectedReferral, setSelectedReferral] =
    useState<ReferralRecord | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    ReferralStatus | "All"
  >("All");
  const [filterPriority, setFilterPriority] = useState<
    ReferralPriority | "All"
  >("All");
  const [quickFilter, setQuickFilter] =
    useState<ReferralFilter>("all");
  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  // ----------------------------------------------------------
  // MODALS / LOCAL DEMO STATE
  // ----------------------------------------------------------

  const [activeModal, setActiveModal] = useState<
    | "appointment"
    | "teleconsult"
    | "details"
    | "prescription"
    | "onward"
    | "none"
  >("none");

  const [actionNotice, setActionNotice] =
    useState("");

  const [appointment, setAppointment] = useState({
    date: getTodayKey(),
    time: "10:30 AM",
    mode: "In-person",
  });

  const [clinicalDraft, setClinicalDraft] =
    useState<ClinicalDraft>(emptyDraft);

  const [prescriptionSaved, setPrescriptionSaved] =
    useState(false);

  const [onwardFacility, setOnwardFacility] =
    useState(sharedFacilities[1]?.name ?? sharedFacilities[0]?.name ?? "Receiving facility");

  const [onwardReason, setOnwardReason] =
    useState("");

  // ----------------------------------------------------------
  // DERIVED REFERRALS
  // ----------------------------------------------------------

  const filteredReferrals = useMemo(() => {
    let result = [...referrals];

    if (quickFilter === "high") {
      result = result.filter(
        (r) =>
          r.priority === "Emergency" ||
          r.priority === "High",
      );
    }

    if (quickFilter === "pending") {
      result = result.filter(
        (r) =>
          r.status === "New" ||
          r.status === "Accepted",
      );
    }

    if (quickFilter === "followups") {
      result = result.filter(
        (r) => r.status === "Follow-up",
      );
    }

    if (quickFilter === "completed") {
      result = result.filter(
        (r) => r.status === "Completed",
      );
    }

    if (filterStatus !== "All") {
      result = result.filter(
        (r) => r.status === filterStatus,
      );
    }

    if (filterPriority !== "All") {
      result = result.filter(
        (r) => r.priority === filterPriority,
      );
    }

    const q = search.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (r) =>
          r.patientName
            .toLowerCase()
            .includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.patientVillage
            .toLowerCase()
            .includes(q) ||
          r.specialty
            .toLowerCase()
            .includes(q),
      );
    }

    result.sort((a, b) => {
      const priorityRank: Record<
        ReferralPriority,
        number
      > = {
        Emergency: 0,
        High: 1,
        Medium: 2,
        Routine: 3,
      };

      const priorityDifference =
        (priorityRank[a.priority] ?? 2) -
        (priorityRank[b.priority] ?? 2);

      if (priorityDifference !== 0) {
        return priorityDifference;
      }

      if (a.status === "Stuck") return -1;
      if (b.status === "Stuck") return 1;

      return a.patientName.localeCompare(
        b.patientName,
      );
    });

    return result;
  }, [
    referrals,
    quickFilter,
    filterStatus,
    filterPriority,
    search,
  ]);

  const selectedFreshReferral = selectedReferral
    ? referrals.find(
      (r) => r.id === selectedReferral.id,
    ) ?? selectedReferral
    : null;

  const newReferrals = referrals.filter(
    (r) => r.status === "New",
  ).length;

  const highPriorityCases = referrals.filter(
    (r) =>
      r.priority === "High" ||
      r.priority === "Emergency",
  ).length;

  const emergencyCases = referrals.filter(
    (r) => r.priority === "Emergency",
  ).length;

  const followUpsDue = referrals.filter(
    (r) => r.status === "Follow-up",
  ).length;

  const pendingReview = referrals.filter(
    (r) =>
      r.status === "New" ||
      r.status === "Accepted",
  ).length;

  const pendingDiagnostics = referrals.filter(
    (r) =>
      r.status === "Awaiting Diagnostics",
  ).length;

  const appointmentsToday = referrals.filter(
    (r) =>
      r.status === "Accepted" ||
      r.status === "Consultation",
  ).length;

  const stuckCases = referrals.filter(
    (r) => r.status === "Stuck",
  ).length;

  const uniquePatients = useMemo(() => {
    const map = new Map<string, ReferralRecord>();

    referrals.forEach((referral) => {
      if (!map.has(referral.patientName)) {
        map.set(referral.patientName, referral);
      }
    });

    return Array.from(map.values());
  }, [referrals]);

  const followUpReferrals = referrals.filter(
    (r) => r.status === "Follow-up",
  );

  // ----------------------------------------------------------
  // HELPERS
  // ----------------------------------------------------------

  const resetClinicalDraft = () => {
    setClinicalDraft({
      ...emptyDraft,
      followUpDate: "",
    });
    setPrescriptionSaved(false);
  };

  const openReferral = (
    referral: ReferralRecord,
  ) => {
    setSelectedReferral(referral);
    resetClinicalDraft();
    setActionNotice("");
    setActiveModal("none");
    setView("referrals");
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeReferral = () => {
    setSelectedReferral(null);
    setActiveModal("none");
    setActionNotice("");
  };

  const changeReferralStatus = (
    referral: ReferralRecord,
    status: ReferralStatus,
    message: string,
  ) => {
    updateReferral(referral.id, { status });
    setSelectedReferral({ ...referral, status });
    setActionNotice(message);
  };

  const acceptReferral = () => {
    if (!selectedFreshReferral) return;

    changeReferralStatus(
      selectedFreshReferral,
      "Accepted",
      "Referral accepted. The patient is now in your active care queue.",
    );
  };

  const requestMoreDetails = () => {
    setActionNotice(
      "Request sent to the referring health worker for additional details.",
    );
    setActiveModal("details");
  };

  const openAppointmentModal = () => {
    setAppointment({
      date: getTodayKey(),
      time: "10:30 AM",
      mode: "In-person",
    });
    setActiveModal("appointment");
  };

  const bookAppointment = () => {
    if (!selectedFreshReferral) return;

    const appointmentJourney: JourneyStage[] = selectedFreshReferral.journey.includes("Appointment Booked")
      ? selectedFreshReferral.journey
      : [...selectedFreshReferral.journey, "Appointment Booked"];

    const updates: Partial<ReferralRecord> = {
      status: selectedFreshReferral.status === "New" ? "Accepted" : selectedFreshReferral.status,
      appointmentDate: `${appointment.date} • ${appointment.time} • ${appointment.mode}`,
      journey: appointmentJourney,
    };

    updateReferral(selectedFreshReferral.id, updates);

    setSelectedReferral({
      ...selectedFreshReferral,
      ...updates,
    });

    setActionNotice(
      `Appointment booked for ${appointment.date} at ${appointment.time}.`,
    );

    setActiveModal("none");
  };

  const startTeleconsult = () => {
    setActionNotice(
      "Assisted teleconsultation request created in demo mode. The patient and referring worker would be notified.",
    );
    setActiveModal("teleconsult");
  };

  const saveClinicalAction = () => {
    if (!selectedFreshReferral) return;

    let nextStatus: ReferralStatus =
      "Treatment";

    if (
      clinicalDraft.diagnostics.length > 0
    ) {
      nextStatus = "Awaiting Diagnostics";
    }

    if (
      clinicalDraft.disposition === "chc" ||
      clinicalDraft.disposition === "district"
    ) {
      nextStatus = "Treatment";
    }

    if (
      clinicalDraft.disposition ===
      "emergency"
    ) {
      nextStatus = "Stuck";
    }

    const updates: Partial<ReferralRecord> = {
      status: nextStatus,
      doctorNotes: clinicalDraft.notes.trim() || selectedFreshReferral.doctorNotes,
      treatment: clinicalDraft.assessment.trim() || clinicalDraft.notes.trim() || selectedFreshReferral.treatment,
      prescription: clinicalDraft.medicines.trim() || selectedFreshReferral.prescription,
      requestedDiagnostics: clinicalDraft.diagnostics.length > 0
        ? clinicalDraft.diagnostics
        : selectedFreshReferral.requestedDiagnostics,
      followUpDate: clinicalDraft.followUpDate || selectedFreshReferral.followUpDate,
    };

    updateReferral(selectedFreshReferral.id, updates);

    setSelectedReferral({
      ...selectedFreshReferral,
      ...updates,
    });

    setActionNotice(
      clinicalDraft.diagnostics.length > 0
        ? "Clinical action saved. Diagnostics are now pending before the next treatment step."
        : "Clinical action saved. The patient's care journey has moved to the next stage.",
    );
  };

  const completeConsultation = () => {
    if (!selectedFreshReferral) return;

    const allowed = [
      "Consultation",
      "Diagnostics",
      "Treatment",
    ].includes(selectedFreshReferral.status);

    if (!allowed) {
      setActionNotice(
        "A consultation must be active before this referral can be completed.",
      );
      return;
    }

    const nextStatus: ReferralStatus =
      clinicalDraft.followUpDate
        ? "Follow-up"
        : "Completed";

    const updates: Partial<ReferralRecord> = {
      status: nextStatus,
      doctorNotes: clinicalDraft.notes.trim() || selectedFreshReferral.doctorNotes,
      treatment: clinicalDraft.assessment.trim() || clinicalDraft.notes.trim() || selectedFreshReferral.treatment,
      prescription: clinicalDraft.medicines.trim() || selectedFreshReferral.prescription,
      requestedDiagnostics: clinicalDraft.diagnostics.length > 0
        ? clinicalDraft.diagnostics
        : selectedFreshReferral.requestedDiagnostics,
      followUpDate: clinicalDraft.followUpDate || selectedFreshReferral.followUpDate,
    };

    updateReferral(selectedFreshReferral.id, updates);

    setSelectedReferral({
      ...selectedFreshReferral,
      ...updates,
    });

    setActionNotice(
      nextStatus === "Follow-up"
        ? "Consultation completed. Follow-up has been scheduled."
        : "Consultation completed and referral marked closed.",
    );
  };

  const savePrescription = () => {
    if (selectedFreshReferral) {
      const prescription = clinicalDraft.medicines.trim();
      updateReferral(selectedFreshReferral.id, {
        prescription: prescription || selectedFreshReferral.prescription,
      });
    }

    setPrescriptionSaved(true);
    setActiveModal("prescription");
    setActionNotice(
      "E-prescription prepared for this patient in demo mode.",
    );
  };

  const createOnwardReferral = () => {
    if (!selectedFreshReferral) return;

    setActionNotice(
      `Onward referral prepared for ${onwardFacility}. Reason: ${onwardReason || "Specialist / higher-level care required."}`,
    );

    setActiveModal("none");
  };

  const toggleDiagnostic = (
    diagnostic: string,
  ) => {
    setClinicalDraft((current) => ({
      ...current,
      diagnostics: current.diagnostics.includes(
        diagnostic,
      )
        ? current.diagnostics.filter(
          (item) => item !== diagnostic,
        )
        : [
          ...current.diagnostics,
          diagnostic,
        ],
    }));
  };

  const navigateTo = (next: DoctorView) => {
    setView(next);
    setMobileOpen(false);
    setSelectedReferral(null);
    setActionNotice("");
    setActiveModal("none");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ----------------------------------------------------------
  // CARD DATA
  // ----------------------------------------------------------

  const statCards = [
    {
      label: "Incoming Referrals",
      value: newReferrals,
      sub: "Awaiting review",
      color: "blue",
      icon: Stethoscope,
    },
    {
      label: "High Priority",
      value: highPriorityCases,
      sub: "Need attention",
      color: "red",
      icon: AlertTriangle,
    },
    {
      label: "Appointments Today",
      value: appointmentsToday,
      sub: "Active / scheduled care",
      color: "purple",
      icon: CalendarDays,
    },
    {
      label: "Follow-ups Due",
      value: followUpsDue,
      sub: "Close the care loop",
      color: "green",
      icon: RefreshCw,
    },
  ];

  const renderReferralRow = (
    referral: ReferralRecord,
  ) => {
    const status = statusStyles[referral.status] ?? statusStyles.New;
    const priority =
      priorityStyles[referral.priority] ?? priorityStyles.Routine;

    return (
      <tr
        key={referral.id}
        className={
          referral.status === "Stuck"
            ? "row-stuck"
            : ""
        }
        onClick={() => openReferral(referral)}
      >
        <td>
          <div className="ref-patient-cell">
            <span className="patient-initial">
              {referral.patientName.charAt(0)}
            </span>

            <div>
              <strong>
                {referral.patientName}
              </strong>

              <span>
                {referral.patientAge} {referral.patientGender === "Male" ? "M" : "F"}
                {" • "}
                {referral.patientVillage}
              </span>
            </div>
          </div>
        </td>

        <td>
          <div className="ref-info-cell">
            <strong>
              {referral.specialty}
            </strong>

            <span>
              {referral.referringWorker}
            </span>
          </div>
        </td>

        <td>
          <span
            className={`priority-badge ${priority.badge}`}
          >
            <i className={priority.dot} />
            {priority.label}
          </span>
        </td>

        <td>
          <span
            className={`status-badge ${status.badge}`}
            style={{
              color: status.color,
              borderColor: status.color,
            }}
          >
            {status.label}
          </span>
        </td>

        <td>
          <span className="waiting-time">
            {referral.waitingTime}
          </span>
        </td>

        <td>
          {referral.distance}
        </td>

        <td>
          <button
            className="text-action"
            onClick={(event) => {
              event.stopPropagation();
              openReferral(referral);
            }}
          >
            Review
            <ChevronRight size={14} />
          </button>
        </td>
      </tr>
    );
  };

  const renderReferralTable = (
    rows: ReferralRecord[],
  ) => (
    <div className="doctor-referral-table-wrap">
      <table className="doctor-referral-table">
        <thead>
          <tr>
            <th>Patient</th>
            <th>Referral</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Waiting</th>
            <th>Distance</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.map(renderReferralRow)}
        </tbody>
      </table>

      {rows.length === 0 && (
        <div className="doctor-empty">
          No referrals match the selected filters.
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <>
      <div className="doctor-welcome-row">
        <div>
          <span className="doctor-kicker">
            <ShieldCheck size={16} />
            Doctor Dashboard
          </span>

          <h1>
            Good morning, Dr. Anjali 👋
          </h1>

          <p>
            Prioritize referrals, review patients,
            and close the next care step.
          </p>
        </div>

        <div className="doctor-facility-pill">
          <Stethoscope size={16} />
          District Hospital Nashik • General Medicine
        </div>
      </div>

      <div className="doctor-stat-grid">
        {statCards.map((card) => (
          <article
            key={card.label}
            className={`doctor-stat-card ${card.color}`}
          >
            <div className="doctor-stat-icon">
              <card.icon size={22} />
            </div>

            <div>
              <small>{card.label}</small>
              <strong>{card.value}</strong>
              <span>{card.sub}</span>
            </div>
          </article>
        ))}
      </div>

      <section className="doctor-action-strip">
        <button
          type="button"
          className="doctor-action-card"
          onClick={() =>
            openReferral(
              referrals.find(
                (r) => r.priority === "Emergency",
              ) ?? referrals[0],
            )
          }
          disabled={referrals.length === 0}
        >
          <AlertTriangle size={22} />
          <div>
            <strong>
              Review urgent case
            </strong>
            <span>
              {emergencyCases} emergency case(s)
            </span>
          </div>
          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          className="doctor-action-card"
          onClick={() => navigateTo("followups")}
        >
          <RefreshCw size={22} />
          <div>
            <strong>
              Review follow-ups
            </strong>
            <span>
              {followUpsDue} care gap(s)
            </span>
          </div>
          <ChevronRight size={17} />
        </button>

        <button
          type="button"
          className="doctor-action-card"
          onClick={() => navigateTo("diagnostics")}
        >
          <Activity size={22} />
          <div>
            <strong>
              Check diagnostics
            </strong>
            <span>
              {pendingDiagnostics} case(s) waiting
            </span>
          </div>
          <ChevronRight size={17} />
        </button>
      </section>

      <section className="doctor-referral-section">
        <div className="doctor-referral-header">
          <div>
            <span>
              PRIORITY REFERRAL QUEUE
            </span>
            <h2>
              Referrals requiring action
            </h2>
          </div>

          <button
            type="button"
            className="button primary"
            onClick={() => navigateTo("referrals")}
          >
            View full queue
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="doctor-queue-tabs">
          {(
            [
              ["all", "All Referrals"],
              ["high", "High Priority"],
              ["pending", "Pending Review"],
              ["followups", "Follow-ups"],
              ["completed", "Completed"],
            ] as Array<[ReferralFilter, string]>
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={
                quickFilter === key
                  ? "active"
                  : ""
              }
              onClick={() =>
                setQuickFilter(key)
              }
            >
              {label}
            </button>
          ))}
        </div>

        {renderReferralTable(
          filteredReferrals.slice(0, 8),
        )}
      </section>
    </>
  );

  const renderReferralQueue = () => (
    <section className="doctor-page-section">
      <div className="doctor-section-heading">
        <div>
          <span>
            REFERRAL QUEUE
          </span>
          <h1>
            Review every referral
          </h1>
          <p>
            Prioritize emergency and high-priority
            rural referrals first.
          </p>
        </div>
      </div>

      <div className="doctor-queue-tabs">
        {(
          [
            ["all", "All Referrals"],
            ["high", "High Priority"],
            ["pending", "Pending Review"],
            ["followups", "Follow-ups"],
            ["completed", "Completed"],
          ] as Array<[ReferralFilter, string]>
        ).map(([key, label]) => (
          <button
            type="button"
            key={key}
            className={
              quickFilter === key
                ? "active"
                : ""
            }
            onClick={() =>
              setQuickFilter(key)
            }
          >
            {label}
          </button>
        ))}
      </div>

      <div className="doctor-referral-header compact">
        <div className="doctor-filters">
          <select
            value={filterStatus}
            onChange={(event) =>
              setFilterStatus(
                event.target.value as
                | ReferralStatus
                | "All",
              )
            }
          >
            <option value="All">
              All Status
            </option>
            <option value="New">New</option>
            <option value="Accepted">
              Accepted
            </option>
            <option value="Awaiting Diagnostics">
              Diagnostics Pending
            </option>
            <option value="Consultation">
              Consultation
            </option>
            <option value="Stuck">
              Stuck
            </option>
            <option value="Completed">
              Completed
            </option>
          </select>

          <select
            value={filterPriority}
            onChange={(event) =>
              setFilterPriority(
                event.target.value as
                | ReferralPriority
                | "All",
              )
            }
          >
            <option value="All">
              All Priority
            </option>
            <option value="Emergency">
              Emergency
            </option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Routine">
              Routine
            </option>
          </select>
        </div>
      </div>

      {renderReferralTable(filteredReferrals)}
    </section>
  );

  const renderPatients = () => (
    <section className="doctor-page-section">
      <div className="doctor-section-heading">
        <div>
          <span>
            MY PATIENTS
          </span>
          <h1>
            Patients connected to your referrals
          </h1>
          <p>
            One clinical view of patients currently
            moving through your care queue.
          </p>
        </div>
      </div>

      <div className="doctor-patient-grid">
        {uniquePatients.map((referral) => (
          <article
            key={referral.patientName}
            className="doctor-patient-card"
          >
            <div className="doctor-patient-card-top">
              <span className="doctor-avatar large">
                <UserRound size={20} />
              </span>

              <span
                className={`priority-badge ${(priorityStyles[referral.priority] ?? priorityStyles.Routine).badge}`}
              >
                <i
                  className={
                    (priorityStyles[referral.priority] ?? priorityStyles.Routine).dot
                  }
                />
                {referral.priority}
              </span>
            </div>

            <h3>
              {referral.patientName}
            </h3>

            <p>
              {referral.patientAge} years • {referral.patientGender} • {referral.patientVillage}
            </p>

            <span className="doctor-patient-specialty">
              {referral.specialty} • {referral.status}
            </span>

            <button
              type="button"
              className="button primary"
              onClick={() => openReferral(referral)}
            >
              View Patient
              <ChevronRight size={16} />
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  const renderTimeline = () => {
    const timelineReferral =
      selectedFreshReferral ?? filteredReferrals[0];

    if (!timelineReferral) {
      return (
        <section className="doctor-page-section">
          <div className="doctor-empty">
            No referral timeline is available yet.
          </div>
        </section>
      );
    }

    const currentIndex = stageIndex(
      timelineReferral.status,
    );

    return (
      <section className="doctor-page-section">
        <div className="doctor-section-heading">
          <div>
            <span>PATIENT TIMELINE</span>
            <h1>{timelineReferral.patientName}</h1>
            <p>
              Referral {timelineReferral.id} • {timelineReferral.specialty}
            </p>
          </div>
          <button
            type="button"
            className="button primary"
            onClick={() => openReferral(timelineReferral)}
          >
            Open Patient 360
            <ChevronRight size={16} />
          </button>
        </div>

        <section className="doctor-panel timeline-panel">
          <div className="doctor-timeline">
            {clinicalStages.map((stage, index) => {
              const completed = index <= currentIndex;
              const current = index === currentIndex;

              return (
                <article
                  key={stage}
                  className={
                    completed
                      ? "doctor-timeline-item completed"
                      : "doctor-timeline-item"
                  }
                >
                  <div className="doctor-timeline-marker">
                    {completed ? "✓" : index + 1}
                  </div>

                  <div>
                    <strong>
                      {stageStylesForTimeline(stage)}
                    </strong>
                    <span>
                      {current
                        ? "Current step"
                        : completed
                          ? "Completed"
                          : "Pending"}
                    </span>
                    <small>
                      {current
                        ? timelineReferral.waitingTime
                        : timelineReferral.distance}
                    </small>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    );
  };

  const renderDiagnostics = () => (
    <section className="doctor-page-section">
      <div className="doctor-section-heading">
        <div>
          <span>DIAGNOSTICS</span>
          <h1>Diagnostics needing attention</h1>
          <p>
            Keep required tests visible so a referral does not stall between consultation and treatment.
          </p>
        </div>
      </div>

      <div className="doctor-diagnostics-grid">
        {referrals
          .filter(
            (r) =>
              r.status === "Awaiting Diagnostics" ||
              r.status === "Diagnostics",
          )
          .map((referral) => (
            <article
              className="doctor-diagnostic-card"
              key={referral.id}
            >
              <div className="doctor-diagnostic-icon">
                <Activity size={22} />
              </div>

              <div>
                <span>{referral.id}</span>
                <h3>{referral.patientName}</h3>
                <p>
                  {referral.specialty} • {referral.patientVillage}
                </p>
                <small>
                  Priority: {referral.priority} • Waiting: {referral.waitingTime}
                </small>
              </div>

              <button
                type="button"
                className="text-action"
                onClick={() => openReferral(referral)}
              >
                Review
                <ChevronRight size={15} />
              </button>
            </article>
          ))}
      </div>

      {pendingDiagnostics === 0 && (
        <div className="doctor-empty">
          No pending diagnostics in the current demo data.
        </div>
      )}
    </section>
  );

  const renderFollowups = () => (
    <section className="doctor-page-section">
      <div className="doctor-section-heading">
        <div>
          <span>FOLLOW-UP QUEUE</span>
          <h1>Close the gaps in care</h1>
          <p>
            Follow-up becomes complete only when the next care step has happened.
          </p>
        </div>
      </div>

      <div className="doctor-followup-list">
        {followUpReferrals.map((referral) => (
          <article
            key={referral.id}
            className="doctor-followup-card"
          >
            <div className="doctor-patient-card-top">
              <span className="doctor-avatar large">
                <HeartPulse size={20} />
              </span>

              <span className="priority-badge priority-followup">
                <i className="dot-purple" />
                Follow-up
              </span>
            </div>

            <h3>{referral.patientName}</h3>

            <p>
              {referral.specialty} • {referral.patientVillage}
            </p>

            <small>
              Referral: {referral.id} • Waiting: {referral.waitingTime}
            </small>

            <div className="doctor-followup-actions">
              <button
                type="button"
                className="button primary"
                onClick={() => openReferral(referral)}
              >
                Review
              </button>

              <button
                type="button"
                className="text-action"
                onClick={() => {
                  setActionNotice(
                    `ASHA contact request prepared for ${referral.patientName}.`,
                  );
                }}
              >
                Contact ASHA
                <ChevronRight size={15} />
              </button>
            </div>
          </article>
        ))}
      </div>

      {followUpReferrals.length === 0 && (
        <div className="doctor-empty">
          No follow-ups are due in the current demo data.
        </div>
      )}
    </section>
  );

  const renderPrescriptions = () => (
    <section className="doctor-page-section">
      <div className="doctor-section-heading">
        <div>
          <span>E-PRESCRIPTIONS</span>
          <h1>Prescription workflow</h1>
          <p>
            Create a structured prescription after clinical review and share it with the patient in demo mode.
          </p>
        </div>
      </div>

      <div className="doctor-prescription-workspace">
        <div className="doctor-panel">
          <div className="doctor-panel-heading">
            <div>
              <span>CURRENT REFERRAL</span>
              <h2>
                {selectedFreshReferral?.patientName ?? "Select a referral"}
              </h2>
            </div>
            <Pill size={20} />
          </div>

          {selectedFreshReferral ? (
            <>
              <label className="doctor-field">
                Assessment / Diagnosis
                <input
                  value={clinicalDraft.assessment}
                  onChange={(event) =>
                    setClinicalDraft((current) => ({
                      ...current,
                      assessment: event.target.value,
                    }))
                  }
                  placeholder="Enter clinical assessment"
                />
              </label>

              <label className="doctor-field">
                Medicines
                <textarea
                  value={clinicalDraft.medicines}
                  onChange={(event) =>
                    setClinicalDraft((current) => ({
                      ...current,
                      medicines: event.target.value,
                    }))
                  }
                  placeholder="Medicine • dose • frequency • duration"
                />
              </label>

              <label className="doctor-field">
                Advice / Notes
                <textarea
                  value={clinicalDraft.notes}
                  onChange={(event) =>
                    setClinicalDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Advice, precautions and return instructions"
                />
              </label>

              <div className="doctor-action-buttons">
                <button
                  type="button"
                  className="button primary"
                  onClick={savePrescription}
                >
                  <Pill size={17} />
                  Save Prescription
                </button>

                <button
                  type="button"
                  className="button outline"
                  onClick={() =>
                    setActionNotice(
                      "Prescription share action prepared for the patient's dashboard in demo mode.",
                    )
                  }
                >
                  Share with Patient
                </button>
              </div>

              {prescriptionSaved && (
                <div className="doctor-success-message">
                  <CheckCircle2 size={18} />
                  Prescription saved in demo mode.
                </div>
              )}
            </>
          ) : (
            <div className="doctor-empty">
              Open a referral first, then use the prescription workflow here.
            </div>
          )}
        </div>

        <div className="doctor-panel doctor-prescription-preview">
          <span>PREVIEW</span>
          <h2>SWASTHYA SETU — E-PRESCRIPTION</h2>
          <p>
            Patient: {selectedFreshReferral?.patientName ?? "—"}
          </p>
          <p>Doctor: Dr. Anjali Sharma</p>
          <p>Facility: District Hospital Nashik</p>
          <p>Date: {todayLabel}</p>

          <div className="doctor-preview-divider" />

          <strong>Assessment</strong>
          <span>
            {clinicalDraft.assessment || "Pending clinical assessment"}
          </span>

          <strong>Medicines</strong>
          <span>
            {clinicalDraft.medicines || "No medicines entered yet"}
          </span>

          <strong>Diagnostics</strong>
          <span>
            {clinicalDraft.diagnostics.length > 0
              ? clinicalDraft.diagnostics.join(", ")
              : "No diagnostics selected"}
          </span>

          <strong>Follow-up</strong>
          <span>
            {clinicalDraft.followUpDate || "Not scheduled"}
          </span>
        </div>
      </div>
    </section>
  );

  const renderProfile = () => (
    <section className="doctor-page-section">
      <div className="doctor-section-heading">
        <div>
          <span>DOCTOR PROFILE</span>
          <h1>Clinical profile & access</h1>
          <p>
            The doctor sees only the permissions needed for referral care in this prototype.
          </p>
        </div>
      </div>

      <div className="doctor-profile-grid">
        <article className="doctor-panel doctor-profile-card">
          <span className="doctor-avatar large">
            <Stethoscope size={22} />
          </span>
          <h2>Dr. Anjali Sharma</h2>
          <p>General Medicine • District Hospital Nashik</p>
          <span>Doctor ID: DOC-DEMO-001</span>
        </article>

        <article className="doctor-panel consent-card">
          <span className="doctor-panel-label">
            PATIENT RECORD ACCESS
          </span>
          <h2>Consent-aware care</h2>
          <p>
            Demo Consent Status: Granted for Current Referral
          </p>
          <div className="doctor-consent-item">
            <CheckCircle2 size={18} />
            Current referral + relevant records
          </div>
          <div className="doctor-consent-item">
            <CheckCircle2 size={18} />
            Access is limited to clinical care
          </div>
          <small>
            ABDM-ready / consent-aware prototype wording; no live government integration is claimed here.
          </small>
        </article>
      </div>
    </section>
  );

  const renderReferralDetail = () => {
    if (!selectedFreshReferral) return null;

    const currentStatus = selectedFreshReferral.status;
    const currentStage = stageIndex(currentStatus);

    return (
      <section className="doctor-detail-page">
        <div className="doctor-detail-topbar">
          <button
            type="button"
            className="doctor-back-button"
            onClick={closeReferral}
          >
            <ChevronRight
              size={17}
              style={{ transform: "rotate(180deg)" }}
            />
            Back to referral queue
          </button>

          <span>
            PATIENT 360 • {selectedFreshReferral.id}
          </span>
        </div>

        <div className="doctor-detail-grid">
          {/* LEFT: PATIENT SNAPSHOT */}
          <aside className="doctor-detail-sidebar">
            <section className="doctor-panel">
              <div className="doctor-patient-hero">
                <span className="doctor-avatar large">
                  <UserRound size={24} />
                </span>
                <div>
                  <h2>
                    {selectedFreshReferral.patientName}
                  </h2>
                  <span>
                    {selectedFreshReferral.patientAge} years • {selectedFreshReferral.patientGender}
                  </span>
                </div>
              </div>

              <div className="doctor-patient-meta">
                <span>
                  Village
                  <strong>
                    {selectedFreshReferral.patientVillage}
                  </strong>
                </span>
                <span>
                  Patient ID
                  <strong>
                    PT-DEMO-{selectedFreshReferral.id.slice(-4)}
                  </strong>
                </span>
                <span>
                  Assigned worker
                  <strong>
                    {selectedFreshReferral.referringWorker}
                  </strong>
                </span>
                <span>
                  Specialty
                  <strong>
                    {selectedFreshReferral.specialty}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                className="button outline full-width"
                onClick={() =>
                  setActionNotice(
                    `Call action prepared for ${selectedFreshReferral.referringWorker}.`,
                  )
                }
              >
                <PhoneIcon />
                Call ASHA / ANM
              </button>
            </section>

            <section className="doctor-panel">
              <span className="doctor-panel-label">
                REFERRAL SUMMARY
              </span>

              <div className="doctor-summary-row">
                <span>Priority</span>
                <span
                  className={`priority-badge ${(priorityStyles[selectedFreshReferral.priority] ?? priorityStyles.Routine).badge}`}
                >
                  <i
                    className={
                      (priorityStyles[
                        selectedFreshReferral.priority
                      ] ?? priorityStyles.Routine).dot
                    }
                  />
                  {selectedFreshReferral.priority}
                </span>
              </div>

              <div className="doctor-summary-row">
                <span>Status</span>
                <strong>
                  {(statusStyles[currentStatus] ?? statusStyles.New).label}
                </strong>
              </div>

              <div className="doctor-summary-row">
                <span>Waiting</span>
                <strong>
                  {selectedFreshReferral.waitingTime}
                </strong>
              </div>

              <div className="doctor-summary-row">
                <span>Distance</span>
                <strong>
                  {selectedFreshReferral.distance}
                </strong>
              </div>
            </section>
          </aside>

          {/* CENTER / RIGHT */}
          <div className="doctor-detail-content">
            <section className="doctor-panel doctor-current-referral">
              <div className="doctor-panel-heading">
                <div>
                  <span>CURRENT REFERRAL</span>
                  <h2>
                    {selectedFreshReferral.specialty} referral review
                  </h2>
                </div>

                <span
                  className={`status-badge ${(statusStyles[currentStatus] ?? statusStyles.New).badge}`}
                  style={{
                    color: (statusStyles[currentStatus] ?? statusStyles.New).color,
                    borderColor: (statusStyles[currentStatus] ?? statusStyles.New).color,
                  }}
                >
                  {(statusStyles[currentStatus] ?? statusStyles.New).label}
                </span>
              </div>

              <div className="doctor-clinical-summary-grid">
                <div>
                  <span>Clinical concern</span>
                  <strong>
                    {selectedFreshReferral.specialty} referral requiring clinician review
                  </strong>
                </div>

                <div>
                  <span>Referral source</span>
                  <strong>
                    {selectedFreshReferral.referringWorker}
                  </strong>
                </div>

                <div>
                  <span>Travel distance</span>
                  <strong>
                    {selectedFreshReferral.distance}
                  </strong>
                </div>

                <div>
                  <span>Response clock</span>
                  <strong>
                    {selectedFreshReferral.waitingTime}
                  </strong>
                </div>
              </div>

              <div className="doctor-record-boundary">
                <ShieldCheck size={18} />
                <div>
                  <strong>
                    Consent-aware record access
                  </strong>
                  <span>
                    Demo Consent Status: Granted for Current Referral • Current referral + relevant records
                  </span>
                </div>
              </div>
            </section>

            {/* ACTIONS */}
            <section className="doctor-panel doctor-actions-panel">
              <div className="doctor-panel-heading">
                <div>
                  <span>DOCTOR ACTIONS</span>
                  <h2>Choose the next care step</h2>
                </div>
              </div>

              <div className="doctor-action-buttons">
                <button
                  type="button"
                  className="button primary"
                  onClick={acceptReferral}
                  disabled={
                    currentStatus !== "New"
                  }
                >
                  <CheckCircle2 size={17} />
                  Accept Referral
                </button>

                <button
                  type="button"
                  className="button outline"
                  onClick={requestMoreDetails}
                >
                  Request More Details
                </button>

                <button
                  type="button"
                  className="button outline"
                  onClick={startTeleconsult}
                >
                  <Video size={17} />
                  Start Teleconsult
                </button>

                <button
                  type="button"
                  className="button outline"
                  onClick={openAppointmentModal}
                >
                  <CalendarPlus size={17} />
                  Book Appointment
                </button>

                <button
                  type="button"
                  className="button outline"
                  onClick={savePrescription}
                >
                  <Pill size={17} />
                  E-Prescription
                </button>

                <button
                  type="button"
                  className="button outline"
                  onClick={() =>
                    setActionNotice(
                      "Clinical notes are being prepared in the structured action panel below.",
                    )
                  }
                >
                  <FileText size={17} />
                  Add Clinical Notes
                </button>
              </div>
            </section>

            {/* STRUCTURED CLINICAL ACTION */}
            <section className="doctor-panel doctor-clinical-action-panel">
              <div className="doctor-panel-heading">
                <div>
                  <span>CLINICAL ACTION</span>
                  <h2>Structured care decision</h2>
                </div>
                <Stethoscope size={20} />
              </div>

              <div className="doctor-form-grid">
                <label className="doctor-field">
                  Assessment / Diagnosis
                  <input
                    value={clinicalDraft.assessment}
                    onChange={(event) =>
                      setClinicalDraft((current) => ({
                        ...current,
                        assessment:
                          event.target.value,
                      }))
                    }
                    placeholder="Enter assessment"
                  />
                </label>

                <label className="doctor-field">
                  Follow-up Date
                  <input
                    type="date"
                    value={
                      clinicalDraft.followUpDate
                    }
                    onChange={(event) =>
                      setClinicalDraft((current) => ({
                        ...current,
                        followUpDate:
                          event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label className="doctor-field">
                Doctor Notes
                <textarea
                  value={clinicalDraft.notes}
                  onChange={(event) =>
                    setClinicalDraft((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Document the clinically relevant note"
                />
              </label>

              <label className="doctor-field">
                Prescription
                <textarea
                  value={clinicalDraft.medicines}
                  onChange={(event) =>
                    setClinicalDraft((current) => ({
                      ...current,
                      medicines:
                        event.target.value,
                    }))
                  }
                  placeholder="Medicine • dose • frequency • duration"
                />
              </label>

              <div className="doctor-form-block">
                <span>
                  Diagnostics Required
                </span>

                <div className="doctor-check-grid">
                  {diagnosticOptions.map(
                    (diagnostic) => (
                      <label
                        key={diagnostic}
                        className="doctor-check-card"
                      >
                        <input
                          type="checkbox"
                          checked={clinicalDraft.diagnostics.includes(
                            diagnostic,
                          )}
                          onChange={() =>
                            toggleDiagnostic(
                              diagnostic,
                            )
                          }
                        />
                        <span>
                          {diagnostic}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="doctor-form-block">
                <span>Disposition</span>

                <div className="doctor-disposition-grid">
                  {[
                    [
                      "manage",
                      "Manage at current facility",
                    ],
                    [
                      "chc",
                      "Refer to CHC",
                    ],
                    [
                      "district",
                      "Refer to District Hospital",
                    ],
                    [
                      "emergency",
                      "Emergency escalation",
                    ],
                  ].map(([value, label]) => (
                    <label
                      key={value}
                      className="doctor-radio-card"
                    >
                      <input
                        type="radio"
                        name="doctor-disposition"
                        value={value}
                        checked={
                          clinicalDraft.disposition ===
                          value
                        }
                        onChange={() =>
                          setClinicalDraft(
                            (current) => ({
                              ...current,
                              disposition:
                                value as Disposition,
                            }),
                          )
                        }
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="doctor-action-buttons">
                <button
                  type="button"
                  className="button primary"
                  onClick={saveClinicalAction}
                >
                  Save Clinical Action
                </button>

                <button
                  type="button"
                  className="button outline"
                  onClick={completeConsultation}
                  disabled={
                    currentStatus === "New" ||
                    currentStatus === "Accepted"
                  }
                >
                  <CheckCircle2 size={17} />
                  {clinicalDraft.followUpDate
                    ? "Complete + Schedule Follow-up"
                    : "Mark Consultation Complete"}
                </button>

                <button
                  type="button"
                  className="button outline"
                  onClick={() =>
                    setActiveModal("onward")
                  }
                >
                  Refer to Higher Facility
                </button>
              </div>
            </section>

            {/* TIMELINE */}
            <section className="doctor-panel">
              <div className="doctor-panel-heading">
                <div>
                  <span>REFERRAL TIMELINE</span>
                  <h2>
                    No referral should disappear
                  </h2>
                </div>
                <RefreshCw size={20} />
              </div>

              <div className="doctor-detail-timeline">
                {clinicalStages.map(
                  (stage, index) => {
                    const done =
                      index <= currentStage;

                    return (
                      <div
                        className={
                          done
                            ? "doctor-detail-timeline-item done"
                            : "doctor-detail-timeline-item"
                        }
                        key={stage}
                      >
                        <div className="doctor-detail-timeline-marker">
                          {done ? "✓" : index + 1}
                        </div>
                        <div>
                          <strong>
                            {stageStylesForTimeline(
                              stage,
                            )}
                          </strong>
                          <span>
                            {done
                              ? "Completed"
                              : "Pending"}
                          </span>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            </section>

            {actionNotice && (
              <div className="doctor-success-message">
                <CheckCircle2 size={18} />
                {actionNotice}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  };

  return (
    <main className="doctor-dashboard-page">
      <aside className={`doctor-sidebar ${mobileOpen ? "doctor-sidebar-open" : ""}`}>
        <div className="doctor-sidebar-top">
          <button
            type="button"
            className="doctor-brand-button"
            onClick={() => navigateTo("overview")}
            aria-label="SwasthyaSetu home"
          >
            <Brand />
          </button>

          <button
            type="button"
            className="doctor-sidebar-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="doctor-role-card">
          <span className="doctor-role-avatar">
            <Stethoscope size={18} />
          </span>
          <span>
            <strong>{t("doctor.workspace")}</strong>
            <small>{t("doctor.workspaceSubtitle")}</small>
          </span>
        </div>

        <nav className="doctor-sidebar-nav" aria-label="Doctor dashboard">
          {(
            [
              ["overview", "Overview"],
              ["referrals", "Referral Queue"],
              ["patients", "My Patients"],
              ["timeline", "Patient Timeline"],
              ["diagnostics", "Diagnostics"],
              ["followups", "Follow-ups"],
              ["prescriptions", "E-Prescriptions"],
              ["profile", "Profile"],
            ] as Array<[DoctorView, string]>
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              className={
                view === key
                  ? "doctor-nav-link active"
                  : "doctor-nav-link"
              }
              aria-current={view === key ? "page" : undefined}
              onClick={() =>
                navigateTo(key)
              }
            >
              {key === "overview" && <Activity size={17} aria-hidden="true" />}
              {key === "referrals" && <ClipboardList size={17} aria-hidden="true" />}
              {key === "patients" && <UsersRound size={17} aria-hidden="true" />}
              {key === "timeline" && <Clock3 size={17} aria-hidden="true" />}
              {key === "diagnostics" && <HeartPulse size={17} aria-hidden="true" />}
              {key === "followups" && <CalendarDays size={17} aria-hidden="true" />}
              {key === "prescriptions" && <Pill size={17} aria-hidden="true" />}
              {key === "profile" && <UserRound size={17} aria-hidden="true" />}
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="doctor-sidebar-footer">
          <div className="doctor-sidebar-note">
            <ShieldCheck size={16} />
            <span>Consent-aware clinical access</span>
          </div>
          <button type="button" className="doctor-sidebar-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <WorkspaceTopbar
        workspace="Clinical Workspace"
        page={doctorViewLabels[view]}
        online={online}
        menuLabel="Open doctor menu"
        onOpenMenu={() => setMobileOpen(true)}
        language={language}
        setLanguage={setLanguage}
      />

      {mobileOpen && (
        <button
          type="button"
          className="doctor-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* =====================================================
          CONTENT
      ====================================================== */}

      <section className="doctor-main">
        {selectedFreshReferral ? (
          renderReferralDetail()
        ) : (
          <>
            {view === "overview" &&
              renderOverview()}
            {view === "referrals" &&
              renderReferralQueue()}
            {view === "patients" &&
              renderPatients()}
            {view === "timeline" &&
              renderTimeline()}
            {view === "diagnostics" &&
              renderDiagnostics()}
            {view === "followups" &&
              renderFollowups()}
            {view === "prescriptions" &&
              renderPrescriptions()}
            {view === "profile" &&
              renderProfile()}
          </>
        )}
      </section>

      {/* =====================================================
          APPOINTMENT MODAL
      ====================================================== */}

      {activeModal === "appointment" && (
        <div className="doctor-modal-backdrop">
          <section className="doctor-modal">
            <button
              type="button"
              className="doctor-modal-close"
              onClick={() =>
                setActiveModal("none")
              }
              aria-label="Close appointment"
            >
              <X size={20} />
            </button>

            <span className="doctor-panel-label">
              APPOINTMENT
            </span>

            <h2>
              Book the next care step
            </h2>

            <p>
              {selectedFreshReferral?.patientName}
              {selectedFreshReferral
                ? ` • ${selectedFreshReferral.specialty}`
                : ""}
            </p>

            <label className="doctor-field">
              Date
              <input
                type="date"
                value={appointment.date}
                onChange={(event) =>
                  setAppointment((current) => ({
                    ...current,
                    date: event.target.value,
                  }))
                }
              />
            </label>

            <label className="doctor-field">
              Slot
              <select
                value={appointment.time}
                onChange={(event) =>
                  setAppointment((current) => ({
                    ...current,
                    time: event.target.value,
                  }))
                }
              >
                <option>
                  10:30 AM
                </option>
                <option>
                  12:00 PM
                </option>
                <option>
                  2:30 PM
                </option>
                <option>
                  4:00 PM
                </option>
              </select>
            </label>

            <label className="doctor-field">
              Mode
              <select
                value={appointment.mode}
                onChange={(event) =>
                  setAppointment((current) => ({
                    ...current,
                    mode: event.target.value,
                  }))
                }
              >
                <option>In-person</option>
                <option>Assisted Teleconsult</option>
              </select>
            </label>

            <button
              type="button"
              className="button primary full-width"
              onClick={bookAppointment}
            >
              <CalendarPlus size={17} />
              Confirm Appointment
            </button>
          </section>
        </div>
      )}

      {/* =====================================================
          TELECONSULT MODAL
      ====================================================== */}

      {activeModal === "teleconsult" && (
        <div className="doctor-modal-backdrop">
          <section className="doctor-modal">
            <button
              type="button"
              className="doctor-modal-close"
              onClick={() =>
                setActiveModal("none")
              }
              aria-label="Close teleconsult"
            >
              <X size={20} />
            </button>

            <Video size={34} />

            <h2>
              Assisted Teleconsultation
            </h2>

            <p>
              Patient and referring worker would be
              notified in a production workflow.
            </p>

            <div className="doctor-modal-summary">
              <strong>
                Demo Mode
              </strong>
              <span>
                Video integration is simulated here and can be connected to an approved telemedicine service later.
              </span>
            </div>

            <button
              type="button"
              className="button primary full-width"
              onClick={() =>
                setActiveModal("none")
              }
            >
              Continue in Demo
            </button>
          </section>
        </div>
      )}

      {/* =====================================================
          MORE DETAILS MODAL
      ====================================================== */}

      {activeModal === "details" && (
        <div className="doctor-modal-backdrop">
          <section className="doctor-modal">
            <button
              type="button"
              className="doctor-modal-close"
              onClick={() =>
                setActiveModal("none")
              }
              aria-label="Close request"
            >
              <X size={20} />
            </button>

            <FileText size={32} />

            <h2>
              Request more details
            </h2>

            <p>
              The referring worker will receive a
              request for missing clinical context.
            </p>

            <div className="doctor-modal-summary">
              <strong>
                Requested from
              </strong>
              <span>
                {selectedFreshReferral?.referringWorker}
              </span>

              <strong>
                Patient
              </strong>
              <span>
                {selectedFreshReferral?.patientName}
              </span>
            </div>

            <button
              type="button"
              className="button primary full-width"
              onClick={() =>
                setActiveModal("none")
              }
            >
              Mark Request Sent
            </button>
          </section>
        </div>
      )}

      {/* =====================================================
          ONWARD REFERRAL MODAL
      ====================================================== */}

      {activeModal === "onward" && (
        <div className="doctor-modal-backdrop">
          <section className="doctor-modal">
            <button
              type="button"
              className="doctor-modal-close"
              onClick={() =>
                setActiveModal("none")
              }
              aria-label="Close onward referral"
            >
              <X size={20} />
            </button>

            <span className="doctor-panel-label">
              ONWARD REFERRAL
            </span>

            <h2>
              Refer to higher facility
            </h2>

            <p>
              Preserve the current referral context
              when escalating care.
            </p>

            <label className="doctor-field">
              Refer to
              <select
                value={onwardFacility}
                onChange={(event) =>
                  setOnwardFacility(
                    event.target.value,
                  )
                }
              >
                {sharedFacilities.map((facility) => (
                  <option key={facility.id} value={facility.name}>{facility.name}</option>
                ))}
              </select>
            </label>

            <label className="doctor-field">
              Reason
              <textarea
                value={onwardReason}
                onChange={(event) =>
                  setOnwardReason(
                    event.target.value,
                  )
                }
                placeholder="Why does the patient need higher-level care?"
              />
            </label>

            <button
              type="button"
              className="button primary full-width"
              onClick={createOnwardReferral}
            >
              Create Onward Referral
              <ChevronRight size={17} />
            </button>
          </section>
        </div>
      )}

      {/* =====================================================
          PRESCRIPTION MODAL
      ====================================================== */}

      {activeModal === "prescription" && (
        <div className="doctor-modal-backdrop">
          <section className="doctor-modal doctor-prescription-modal">
            <button
              type="button"
              className="doctor-modal-close"
              onClick={() =>
                setActiveModal("none")
              }
              aria-label="Close prescription"
            >
              <X size={20} />
            </button>

            <span className="doctor-panel-label">
              E-PRESCRIPTION PREVIEW
            </span>

            <h2>
              SWASTHYA SETU
            </h2>

            <p>
              Patient: {selectedFreshReferral?.patientName ?? "—"}
            </p>
            <p>
              Doctor: Dr. Anjali Sharma
            </p>
            <p>
              Facility: District Hospital Nashik
            </p>
            <p>
              Date: {todayLabel}
            </p>

            <div className="doctor-modal-summary">
              <strong>Assessment</strong>
              <span>
                {clinicalDraft.assessment ||
                  "Clinical assessment pending"}
              </span>

              <strong>Medicines</strong>
              <span>
                {clinicalDraft.medicines ||
                  "No medicines entered yet"}
              </span>

              <strong>Diagnostics</strong>
              <span>
                {clinicalDraft.diagnostics.join(", ") ||
                  "None selected"}
              </span>

              <strong>Follow-up</strong>
              <span>
                {clinicalDraft.followUpDate ||
                  "Not scheduled"}
              </span>
            </div>

            <div className="doctor-action-buttons">
              <button
                type="button"
                className="button primary"
                onClick={() => {
                  setPrescriptionSaved(true);
                  setActiveModal("none");
                  setActionNotice(
                    "Prescription saved and ready to share with the patient in demo mode.",
                  );
                }}
              >
                <CheckCircle2 size={17} />
                Save & Share
              </button>

              <button
                type="button"
                className="button outline"
                onClick={() => {
                  setActionNotice(
                    "Print / download is represented as a prototype action.",
                  );
                }}
              >
                Print / Download
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function stageStylesForTimeline(
  stage: ReferralStatus,
) {
  const labels: Record<
    ReferralStatus,
    string
  > = {
    New: "Referral Created",
    Accepted: "Referral Accepted",
    "Awaiting Diagnostics": "Diagnostics Pending",
    Consultation: "Consultation",
    Diagnostics: "Diagnostics Completed",
    Treatment: "Treatment",
    "Follow-up": "Follow-up Scheduled",
    Completed: "Care Closed",
    Stuck: "Referral Stuck",
  };

  return labels[stage];
}

function PhoneIcon() {
  return <span aria-hidden="true">☎</span>;
}
