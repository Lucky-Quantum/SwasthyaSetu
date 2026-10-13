import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Activity,
  AlertTriangle,
  Ambulance,
  Bell,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  LogOut,
  MapPin,
  MapPinned,
  Menu,
  PhoneCall,
  Pill,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";

import Brand from "../components/Brand";
import LanguageSelector, {
  Language,
} from "../components/LanguageSelector";
import { useCare } from "../src/store/careStore";
import type { JourneyStage, ReferralStatus } from "../src/data/careData";
import {
  PatientDashboardData,
  CareJourneyStep,
} from "../src/data/patientData";

interface PatientDashboardProps {
  data: PatientDashboardData;
  language: Language;
  setLanguage: (language: Language) => void;
  onLogout: () => void;
}

type ExtendedPatient = PatientDashboardData["patient"] & {
  age?: number;
  gender?: string;
  mobile?: string;
  preferredLanguage?: string;
  abhaNumber?: string;
};

export default function PatientDashboard({
  data,
  language,
  setLanguage,
  onLogout,
}: PatientDashboardProps) {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // ==========================================================
  // PATIENT ACTION STATE
  // ==========================================================

  const [showAppointment, setShowAppointment] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [appointmentBooked, setAppointmentBooked] = useState(false);
  const [emergencyRequested, setEmergencyRequested] = useState(false);
  const [attendanceConfirmed, setAttendanceConfirmed] = useState(false);

  const { referrals, updateReferral } = useCare();

  const today = new Date().toISOString().slice(0, 10);

  const [appointmentForm, setAppointmentForm] = useState({
    careType: "General Medicine",
    facility: data.referral.facility,
    date: today,
    slot: "10:30 AM",
    reason: "New concern",
  });

  // ==========================================================
  // EXISTING DATA
  // ==========================================================

  const patient = data.patient as ExtendedPatient;
  const liveReferral = referrals.find((referral) => referral.patientId === patient.id);
  const primaryAppointment = data.appointments[0];
  const nextFollowUp = data.followUps[0];

  const patientStatusLabel = (status: ReferralStatus): string => {
    if (status === "Completed") return t("patient.status.completed");
    if (status === "Stuck") return t("patient.status.needsAction");
    return t("patient.status.inProgress");
  };

  const patientProgress = liveReferral
    ? liveReferral.status === "Completed"
      ? 100
      : Math.min(95, Math.max(10, Math.round((liveReferral.journey.length / 7) * 100)))
    : data.referral.progress;

  const effectiveReferral = liveReferral
    ? {
      ...data.referral,
      id: liveReferral.id,
      specialty: liveReferral.specialty,
      facility: liveReferral.facility,
      reason: liveReferral.reasonForReferral,
      status: patientStatusLabel(liveReferral.status),
      appointment: liveReferral.appointmentDate ?? data.referral.appointment,
      nextAction:
        liveReferral.status === "Completed"
          ? "Care journey completed"
          : liveReferral.status === "Follow-up"
            ? "Complete scheduled follow-up"
            : liveReferral.status === "Treatment"
              ? "Complete treatment and review"
              : "Continue referral journey",
      progress: patientProgress,
    }
    : data.referral;

  const journeyStageMap: Record<string, { index: number; title: string; subtitle: string; detail: string }> = {
    "Referral Created": { index: 0, title: "Referral Created", subtitle: effectiveReferral.specialty, detail: "Referral entered into the SwasthyaSetu care journey." },
    "Referral Accepted": { index: 1, title: "Referral Accepted", subtitle: effectiveReferral.facility, detail: "Receiving facility acknowledged the referral." },
    "Appointment Booked": { index: 2, title: "Appointment Booked", subtitle: effectiveReferral.facility, detail: effectiveReferral.appointment || "Appointment scheduled." },
    "Consultation": { index: 3, title: "Specialist Consultation", subtitle: effectiveReferral.facility, detail: "Clinical consultation recorded by the receiving doctor." },
    "Diagnostics": { index: 4, title: "Diagnostics", subtitle: effectiveReferral.facility, detail: "Requested diagnostics are being processed or reviewed." },
    "Treatment": { index: 5, title: "Treatment", subtitle: effectiveReferral.facility, detail: "Treatment step recorded in the referral journey." },
    "Follow-up": { index: 6, title: "Follow-up", subtitle: "Care continuity", detail: "Follow-up step is due or scheduled." },
    "Completed": { index: 7, title: "Care Completed", subtitle: "Referral closed", detail: "The referral has reached completed care." },
  };

  const liveJourney = liveReferral
    ? liveReferral.journey.map((stage, index) => {
      const meta = journeyStageMap[stage];
      return {
        id: `live-${stage}`,
        title: meta?.title ?? stage,
        subtitle: meta?.subtitle ?? "SwasthyaSetu",
        date: index === 0 ? liveReferral.createdAt : liveReferral.appointmentDate ?? "Updated just now",
        status: liveReferral.status === "Completed" || index < liveReferral.journey.length - 1 ? "completed" as const : "current" as const,
        detail: meta?.detail ?? "Journey stage recorded.",
      };
    })
    : data.careJourney;

  const readyDiagnostics = data.diagnostics.filter(
    (item) => item.status === "Result Ready",
  ).length;

  const activeMedicines = data.prescriptions.length;

  // Patient-facing status only; no internal risk calculation is exposed.
  const healthStatus = nextFollowUp?.date
    ? "Needs Follow-up"
    : "Care in progress";

  const maskedPatientId = useMemo(() => {
    const raw = patient.id ?? "";

    if (!raw) return "Not assigned";
    if (raw.length <= 6) return `••••${raw}`;

    return `${raw.slice(0, 3)}••••${raw.slice(-3)}`;
  }, [patient.id]);

  const maskedAbha = patient.abhaNumber
    ? patient.abhaNumber
    : "Not linked in prototype";
  const preferredLocale = ({
    English: "en",
    Hindi: "hi",
    Marathi: "mr",
  } as Record<string, string>)[patient.preferredLanguage ?? ""] ?? language;

  // ==========================================================
  // ACTIONS
  // ==========================================================

  const confirmAppointment = () => {
    setAppointmentBooked(true);
    setAttendanceConfirmed(false);

    if (liveReferral) {
      const appointmentJourney = liveReferral.journey.includes("Appointment Booked" as JourneyStage)
        ? liveReferral.journey
        : [...liveReferral.journey, "Appointment Booked" as JourneyStage];

      updateReferral(liveReferral.id, {
        status: liveReferral.status === "New" ? "Accepted" : liveReferral.status,
        appointmentDate: `${appointmentForm.date} • ${appointmentForm.slot} • ${appointmentForm.careType}`,
        journey: appointmentJourney,
      });
    }
  };

  const confirmAttendance = () => {
    setAttendanceConfirmed(true);
  };

  const requestEmergency = () => {
    setEmergencyRequested(true);
  };

  const openDirections = () => {
    const query = encodeURIComponent(
      `${effectiveReferral.facility}, ${patient.district}`,
    );

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${query}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const callEmergency = () => {
    window.location.href = "tel:108";
  };

  return (
    <main className="patient-dashboard-page">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <header className="patient-header">
        <div className="patient-header-inner">
          <button
            type="button"
            className="patient-brand-button"
            onClick={() =>
              window.scrollTo({
                top: 0,
                behavior: "smooth",
              })
            }
            aria-label={t("common.goHome")}
          >
            <Brand />
          </button>

          <nav
            className={
              mobileMenuOpen
                ? "patient-nav patient-nav-open"
                : "patient-nav"
            }
          >
            <a href="#patient-overview" className="patient-nav-link active" onClick={() => setMobileMenuOpen(false)}>
              {t("patient.nav.home")}
            </a>
            <a href="#my-journey" className="patient-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t("patient.nav.journey")}
            </a>
            <a href="#appointments" className="patient-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t("patient.nav.appointments")}
            </a>
            <a href="#records" className="patient-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t("patient.nav.records")}
            </a>
            <a href="#medicines-tests" className="patient-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t("patient.nav.medicines")}
            </a>
            <a href="#care-team" className="patient-nav-link" onClick={() => setMobileMenuOpen(false)}>
              {t("patient.nav.team")}
            </a>
          </nav>

          <div className="patient-actions">
            <LanguageSelector
              language={language}
              setLanguage={setLanguage}
            />

            <button
              type="button"
              className="patient-icon-button"
              aria-label={t("patient.notification")}
              title={t("patient.notification")}
              onClick={() => setShowHelp(true)}
            >
              <Bell size={18} />
              <span className="notification-dot" />
            </button>

            <div className="patient-profile-chip">
              <span className="patient-avatar">
                <UserRound size={18} />
              </span>
              <span className="patient-profile-name">
                {patient.name}
              </span>
            </div>

            <button
              type="button"
              className="patient-logout"
              onClick={onLogout}
              title={t("common.signOut")}
            >
              <LogOut size={17} />
              <span>{t("common.signOut")}</span>
            </button>

            <button
              type="button"
              className="patient-menu-button"
              onClick={() => setMobileMenuOpen((value) => !value)}
              aria-label={
                mobileMenuOpen ? t("common.closeMenu") : t("common.openMenu")
              }
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================
          MAIN
      ======================================================= */}

      <section id="patient-overview" className="patient-main">
        {/* WELCOME */}

        <div className="patient-welcome-row">
          <div>
            <span className="patient-kicker">
              <ShieldCheck size={16} />
              {t("patient.space")}
            </span>
            <h1>
              {t("patient.greeting", { name: patient.name.split(" ")[0] })} <span>👋</span>
            </h1>
            <p>
              {t("patient.intro")}
            </p>
          </div>

          <div className="patient-location-pill">
            <MapPin size={16} />
            {patient.village}, {patient.district}
          </div>
        </div>

        {/* PRIVACY / IDENTITY */}

        <div className="patient-privacy-banner">
          <ShieldCheck size={18} />
          <div>
            <strong>{t("patient.privateTitle")}</strong>
            <span>
              {t("patient.privateText")}
            </span>
          </div>
          <span className="privacy-id">
            {t("patient.patientId")}: {maskedPatientId}
          </span>
        </div>

        {liveReferral && (
          <div className="patient-live-link">
            <RefreshCw size={15} />
            <span>{t("patient.liveDemo")}</span>
            <strong>{effectiveReferral.id}</strong>
          </div>
        )}

        {/* PATIENT PROFILE SNAPSHOT */}

        <section className="patient-profile-summary patient-panel">
          <div>
            <span className="patient-panel-label">{t("patient.profile")}</span>
            <h2>{patient.name}</h2>
            <p>
              {patient.age
                ? `${patient.age} ${t("patient.years")}`
                : t("patient.ageUnavailable")}
              {" • "}
              {patient.gender || t("patient.genderUnavailable")}
              {" • "}
              {patient.village}, {patient.district}
            </p>
          </div>

          <div className="patient-profile-summary-grid">
            <div>
              <span>{t("patient.patientId")}</span>
              <strong>{maskedPatientId}</strong>
            </div>
            <div>
              <span>{t("patient.abha")}</span>
              <strong>{maskedAbha}</strong>
            </div>
            <div>
              <span>{t("patient.language")}</span>
              <strong>{t(`language.${preferredLocale}`)}</strong>
            </div>
          </div>
        </section>

        {/* ====================================================
            CARE ACTIONS
        ===================================================== */}

        <section className="patient-care-actions">
          <div className="patient-care-actions-heading">
            <div>
              <span className="patient-kicker">
                <HeartPulse size={16} />
                {t("patient.careActions")}
              </span>
              <h2>{t("patient.supportHeading")}</h2>
              <p>
                {t("patient.supportText")}
              </p>
            </div>
          </div>

          <div className="patient-care-action-grid">
            <button
              type="button"
              className="patient-action-card appointment-action"
              onClick={() => {
                setAppointmentBooked(false);
                setAppointmentForm((current) => ({
                  ...current,
                  reason: "New concern",
                }));
                setShowAppointment(true);
              }}
            >
              <CalendarPlus size={24} />
              <div>
                <strong>{t("patient.bookAppointment")}</strong>
                <span>{t("patient.chooseSlot")}</span>
              </div>
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              className="patient-action-card urgent-action"
              onClick={() => {
                setAppointmentBooked(false);
                setAppointmentForm((current) => ({
                  ...current,
                  reason: "Worsening condition",
                }));
                setShowAppointment(true);
              }}
            >
              <AlertTriangle size={24} />
              <div>
                <strong>{t("patient.urgentCare")}</strong>
                <span>{t("patient.earlierSlot")}</span>
              </div>
              <ChevronRight size={18} />
            </button>

            <button
              type="button"
              className="patient-action-card emergency-action"
              onClick={() => {
                setEmergencyRequested(false);
                setShowEmergency(true);
              }}
            >
              <Ambulance size={24} />
              <div>
                <strong>{t("patient.emergencyHelp")}</strong>
                <span>
                  {t("patient.emergencyRequest")}
                </span>
              </div>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>

        {/* ====================================================
            STATUS CARDS
        ===================================================== */}

        <div className="patient-status-grid">
          <article className="patient-status-card green-card">
            <div className="status-card-icon">
              <HeartPulse size={21} />
            </div>
            <div>
              <span>{t("patient.healthStatus")}</span>
              <strong>{healthStatus === "Needs Follow-up" ? t("patient.needsFollowup") : t("patient.careInProgress")}</strong>
              <small>{t("patient.basedOnJourney")}</small>
            </div>
          </article>

          <article className="patient-status-card blue-card">
            <div className="status-card-icon">
              <CalendarDays size={21} />
            </div>
            <div>
              <span>{t("patient.nextAppointment")}</span>
              <strong>
                {primaryAppointment
                  ? primaryAppointment.date.replace(" 2026", "")
                  : t("patient.notBooked")}
              </strong>
              <small>
                {primaryAppointment
                  ? `${primaryAppointment.time} • Token ${primaryAppointment.token}`
                  : t("patient.chooseAppointment")}
              </small>
            </div>
          </article>

          <article className="patient-status-card orange-card">
            <div className="status-card-icon">
              <RefreshCw size={21} />
            </div>
            <div>
              <span>{t("patient.activeReferral")}</span>
              <strong>{effectiveReferral.status}</strong>
              <small>{effectiveReferral.facility}</small>
            </div>
          </article>

          <article className="patient-status-card purple-card">
            <div className="status-card-icon">
              <Clock3 size={21} />
            </div>
            <div>
              <span>{t("patient.nextFollowup")}</span>
              <strong>
                {nextFollowUp
                  ? nextFollowUp.date.replace(" 2026", "")
                  : t("patient.notScheduled")}
              </strong>
              <small>
                {nextFollowUp
                  ? nextFollowUp.title
                  : t("patient.noUpcomingFollowup")}
              </small>
            </div>
          </article>
        </div>

        {/* ====================================================
            MAIN GRID
        ===================================================== */}

        <div className="patient-dashboard-grid">
          <section
            id="my-journey"
            className="patient-panel journey-panel"
          >
            <div className="patient-panel-heading">
              <div>
                <span>{t("patient.myJourney")}</span>
                <h2>{t("patient.firstContact")}</h2>
              </div>
              <span className="journey-status-pill">
                {effectiveReferral.status}
              </span>
            </div>

            <div className="patient-journey-timeline">
              {liveJourney.map((step) => (
                <article
                  key={step.id}
                  className={`patient-timeline-item ${step.status}`}
                >
                  <div className="patient-timeline-marker">
                    {step.status === "completed"
                      ? "✓"
                      : step.status === "current"
                        ? "•"
                        : ""}
                  </div>

                  <div className="patient-timeline-content">
                    <div className="patient-timeline-top">
                      <div>
                        <strong>{t(`patient.stages.${step.title}`, { defaultValue: step.title })}</strong>
                        <span>{t(`patient.journeyMeta.${step.subtitle}`, { defaultValue: step.subtitle })}</span>
                      </div>
                      <span className="timeline-status">
                        {t(`patient.status.${step.status}`)}
                      </span>
                    </div>
                    <small>{step.date}</small>
                    <p>{t(`patient.journeyDetails.${step.title}`, { defaultValue: step.detail })}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="patient-side-stack">
            {/* ACTIVE REFERRAL */}

            <section className="patient-panel referral-panel">
              <div className="patient-panel-heading compact-heading">
                <div>
                  <span>{t("patient.activeReferral")}</span>
                  <h2>{t("patient.flightRecorder")}</h2>
                </div>
                <span className="referral-id">
                  {effectiveReferral.id}
                </span>
              </div>

              <div className="referral-progress-row">
                <div>
                  <strong>{effectiveReferral.progress}%</strong>
                  <span>{t("patient.journeyComplete")}</span>
                </div>
                <div className="progress-track">
                  <div
                    style={{
                      width: `${effectiveReferral.progress}%`,
                    }}
                  />
                </div>
              </div>

              <div className="referral-facility">
                <div className="facility-icon">
                  <Stethoscope size={19} />
                </div>
                <div>
                  <strong>{effectiveReferral.facility}</strong>
                  <span>{effectiveReferral.specialty}</span>
                </div>
              </div>

              <div className="referral-meta-grid">
                <div>
                  <span>{t("patient.appointmentLabel")}</span>
                  <strong>{effectiveReferral.appointment}</strong>
                </div>
                <div>
                  <span>{t("patient.nextAction")}</span>
                  <strong>{effectiveReferral.nextAction}</strong>
                </div>
              </div>

              <div className="patient-referral-actions">
                <button
                  type="button"
                  className="patient-panel-button"
                  onClick={openDirections}
                >
                  <MapPinned size={17} />
                  {t("patient.directions")}
                </button>

                <button
                  type="button"
                  className="patient-panel-button"
                  onClick={confirmAttendance}
                >
                  <CheckCircle2 size={17} />
                  {attendanceConfirmed
                    ? t("patient.attendanceConfirmed")
                    : t("patient.willAttend")}
                </button>
              </div>
            </section>

            {/* FOLLOW-UP */}

            <section
              id="followups"
              className="patient-panel followup-panel"
            >
              <div className="patient-panel-heading compact-heading">
                <div>
                  <span>{t("patient.followup")}</span>
                  <h2>{t("patient.keepNextStep")}</h2>
                </div>
                <Activity size={20} />
              </div>

              {nextFollowUp ? (
                <div className="followup-item">
                  <div className="followup-date">
                    {nextFollowUp.date.split(" ")[0]}
                    <span>
                      {nextFollowUp.date
                        .split(" ")[1]
                        ?.replace("2026", "")}
                    </span>
                  </div>
                  <div>
                    <strong>{nextFollowUp.title}</strong>
                    <p>{nextFollowUp.description}</p>
                  </div>
                  <span className="followup-badge">{t("patient.due")}</span>
                </div>
              ) : (
                <p>{t("patient.noUpcomingFollowup")}</p>
              )}
            </section>
          </aside>
        </div>

        {/* ====================================================
            APPOINTMENTS + RECORDS
        ===================================================== */}

        <div className="patient-lower-grid">
          <section
            id="appointments"
            className="patient-panel list-panel"
          >
            <div className="patient-panel-heading">
              <div>
                <span>{t("patient.nav.appointments")}</span>
                <h2>{t("patient.appointmentsHeading")}</h2>
              </div>
              <CalendarDays size={20} />
            </div>

            <div className="patient-list">
              {data.appointments.length > 0 ? (
                data.appointments.map((appointment) => (
                  <article
                    className="patient-list-item"
                    key={appointment.id}
                  >
                    <div className="list-date-block">
                      <strong>
                        {appointment.date.split(" ")[0]}
                      </strong>
                      <span>
                        {appointment.date
                          .split(" ")[1]
                          ?.replace("2026", "")}
                      </span>
                    </div>

                    <div className="list-main-copy">
                      <strong>{appointment.specialty}</strong>
                      <span>
                        {appointment.doctor} • {appointment.facility}
                      </span>
                      <small>
                        {appointment.mode}
                        {appointment.token
                          ? ` • Token ${appointment.token}`
                          : ""}
                      </small>
                    </div>

                    <span className="list-status active-status">
                      {t("patient.scheduled")}
                    </span>
                  </article>
                ))
              ) : (
                <div className="patient-empty-state">
                  <CalendarDays size={25} />
                  <strong>{t("patient.noAppointments")}</strong>
                  <span>
                    {t("patient.bookFromActions")}
                  </span>
                </div>
              )}
            </div>

            <button
              type="button"
              className="patient-panel-button"
              onClick={() => {
                setAppointmentBooked(false);
                setAppointmentForm((current) => ({
                  ...current,
                  reason: "New concern",
                }));
                setShowAppointment(true);
              }}
            >
              <CalendarPlus size={17} />
              {t("patient.bookAppointmentLower")}
            </button>
          </section>

          <section
            id="records"
            className="patient-panel list-panel"
          >
            <div className="patient-panel-heading">
              <div>
                <span>{t("patient.myRecords")}</span>
                <h2>{t("patient.recentInfo")}</h2>
              </div>
              <FileText size={20} />
            </div>

            <div className="record-cards">
              <article className="record-mini-card">
                <div className="record-mini-icon">
                  <Activity size={19} />
                </div>
                <div>
                  <strong>{t("patient.diagnostics")}</strong>
                  <span>
                    {t("patient.resultsReady", { count: readyDiagnostics })}
                  </span>
                </div>
                <ChevronRight size={17} />
              </article>

              <article className="record-mini-card">
                <div className="record-mini-icon purple">
                  <Pill size={19} />
                </div>
                <div>
                  <strong>{t("patient.prescriptions")}</strong>
                  <span>
                    {t("patient.activeMedicines", { count: activeMedicines })}
                  </span>
                </div>
                <ChevronRight size={17} />
              </article>

              <article className="record-mini-card">
                <div className="record-mini-icon orange">
                  <FileText size={19} />
                </div>
                <div>
                  <strong>{t("patient.medicalHistory")}</strong>
                  <span>
                    {patient.conditions.join(", ") ||
                      t("patient.noConditions")}
                  </span>
                </div>
                <ChevronRight size={17} />
              </article>
            </div>
          </section>
        </div>

        {/* ====================================================
            MEDICINES & TESTS
        ===================================================== */}

        <section
          id="medicines-tests"
          className="patient-panel patient-medicines-panel"
        >
          <div className="patient-panel-heading">
            <div>
              <span>{t("patient.medicinesTests")}</span>
              <h2>{t("patient.beforeTravel")}</h2>
              <p>
                {t("patient.travelPrivacy")}
              </p>
            </div>
            <Pill size={20} />
          </div>

          <div className="patient-travel-grid">
            <article className="patient-travel-card">
              <CheckCircle2 size={19} />
              <div>
                <strong>{t("patient.appointmentStatus")}</strong>
                <span>
                  {primaryAppointment
                    ? t("patient.appointmentAvailable")
                    : t("patient.noAppointmentBooked")}
                </span>
              </div>
            </article>

            <article className="patient-travel-card">
              <CheckCircle2 size={19} />
              <div>
                <strong>{t("patient.destination")}</strong>
                <span>{data.referral.facility}</span>
              </div>
            </article>

            <article className="patient-travel-card">
              <Activity size={19} />
              <div>
                <strong>{t("patient.diagnosticResults")}</strong>
                <span>
                  {readyDiagnostics > 0
                    ? t("patient.resultsReadyInRecords", { count: readyDiagnostics })
                    : t("patient.noReadyResults")}
                </span>
              </div>
            </article>

            <article className="patient-travel-card">
              <Pill size={19} />
              <div>
                <strong>{t("patient.prescriptions")}</strong>
                <span>
                  {activeMedicines > 0
                    ? t("patient.activeMedicinesInRecords", { count: activeMedicines })
                    : t("patient.noPrescriptions")}
                </span>
              </div>
            </article>
          </div>
        </section>

        {/* ====================================================
            CARE TEAM
        ===================================================== */}

        <section id="care-team" className="patient-care-team">
          <section className="patient-panel">
            <div className="patient-panel-heading">
              <div>
                <span>{t("patient.careTeam")}</span>
                <h2>{t("patient.supportPeople")}</h2>
              </div>
              <Stethoscope size={20} />
            </div>

            <div className="patient-care-team-grid">
              <article className="patient-team-card">
                <div className="patient-team-icon">
                  <UserRound size={20} />
                </div>

                <div>
                  <span>{t("patient.assignedWorker")}</span>
                  <strong>{t("patient.ashaSupport")}</strong>
                  <small>
                    {t("patient.workerHelpText")}
                  </small>
                </div>

                <button
                  type="button"
                  className="patient-panel-button"
                  onClick={() => setShowHelp(true)}
                >
                  {t("patient.askHelp")}
                </button>
              </article>

              <article className="patient-team-card">
                <div className="patient-team-icon">
                  <Stethoscope size={20} />
                </div>

                <div>
                  <span>{t("patient.currentFacility")}</span>
                  <strong>{effectiveReferral.facility}</strong>
                  <small>{data.referral.specialty}</small>
                </div>

                <button
                  type="button"
                  className="patient-panel-button"
                  onClick={openDirections}
                >
                  <MapPinned size={17} />
                  {t("patient.directions")}
                </button>
              </article>
            </div>
          </section>
        </section>

        {/* ====================================================
            EMERGENCY HELP
        ===================================================== */}

        <section className="patient-emergency-banner">
          <div>
            <span>{t("patient.emergencySupport")}</span>
            <h2>{t("patient.immediateHelp")}</h2>
            <p>
              {t("patient.emergencyText")}
            </p>
          </div>

          <button
            type="button"
            className="patient-emergency-button"
            onClick={() => {
              setEmergencyRequested(false);
              setShowEmergency(true);
            }}
          >
            <Ambulance size={19} />
            {t("patient.emergencyHelp")}
          </button>

          <button
            type="button"
            className="patient-emergency-call"
            onClick={callEmergency}
          >
            <PhoneCall size={18} />
            {t("patient.call108")}
          </button>
        </section>

        <div className="patient-dashboard-footer-note">
          <ShieldCheck size={17} />
          {t("patient.footerNote")}
        </div>
      </section>

      {/* ======================================================
          APPOINTMENT MODAL
      ======================================================= */}

      {showAppointment && (
        <div className="patient-modal-backdrop">
          <section className="patient-modal">
            <button
              type="button"
              className="patient-modal-close"
              onClick={() => setShowAppointment(false)}
              aria-label={t("patient.close")}
            >
              <X size={20} />
            </button>

            {!appointmentBooked ? (
              <>
                <span className="patient-kicker">
                  <CalendarPlus size={16} />
                  {t("patient.appointmentModal")}
                </span>

                <h2>{t("patient.bookYourCare")}</h2>

                <p>
                  {t("patient.modalSlotText")}
                </p>

                <label>
                  {t("patient.careType")}
                  <select
                    value={appointmentForm.careType}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        careType: event.target.value,
                      }))
                    }
                  >
                    <option value="General Medicine">{t("patient.appointment.generalMedicine")}</option>
                    <option value="Follow-up">{t("patient.appointment.followup")}</option>
                    <option value="Specialist consultation">{t("patient.appointment.specialist")}</option>
                  </select>
                </label>

                <label>
                  {t("patient.facility")}
                  <select
                    value={appointmentForm.facility}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        facility: event.target.value,
                      }))
                    }
                  >
                    <option>{effectiveReferral.facility}</option>
                    <option value="Nearest PHC">{t("patient.appointment.nearestPhc")}</option>
                    <option value="District Hospital">{t("patient.appointment.districtHospital")}</option>
                  </select>
                </label>

                <label>
                  {t("patient.preferredDate")}
                  <input
                    type="date"
                    value={appointmentForm.date}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  {t("patient.availableSlot")}
                  <select
                    value={appointmentForm.slot}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        slot: event.target.value,
                      }))
                    }
                  >
                    <option>10:30 AM</option>
                    <option>12:00 PM</option>
                    <option>2:30 PM</option>
                  </select>
                </label>

                <label>
                  {t("patient.reason")}
                  <select
                    value={appointmentForm.reason}
                    onChange={(event) =>
                      setAppointmentForm((current) => ({
                        ...current,
                        reason: event.target.value,
                      }))
                    }
                  >
                    <option value="New concern">{t("patient.appointment.newConcern")}</option>
                    <option value="Follow-up">{t("patient.appointment.followup")}</option>
                    <option value="Worsening condition">{t("patient.appointment.worsening")}</option>
                    <option value="Referred care">{t("patient.appointment.referredCare")}</option>
                  </select>
                </label>

                <button
                  type="button"
                  className="patient-panel-button"
                  onClick={confirmAppointment}
                >
                  {t("patient.confirmAppointment")}
                  <CalendarPlus size={17} />
                </button>
              </>
            ) : (
              <>
                <CheckCircle2 size={32} />

                <h2>{t("patient.appointmentBooked")}</h2>

                <p>
                  {t("patient.requestRecorded")}
                </p>

                <div className="patient-modal-summary">
                  <strong>{appointmentForm.facility}</strong>
                  <span>{appointmentForm.careType}</span>
                  <span>
                    {appointmentForm.date} • {appointmentForm.slot}
                  </span>
                  <span>
                    {t("patient.reasonSummary", { reason: appointmentForm.reason })}
                  </span>
                </div>

                <button
                  type="button"
                  className="patient-panel-button"
                  onClick={() => setShowAppointment(false)}
                >
                  {t("patient.done")}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {/* ======================================================
          EMERGENCY MODAL
      ======================================================= */}

      {showEmergency && (
        <div className="patient-modal-backdrop">
          <section className="patient-modal emergency-modal">
            <button
              type="button"
              className="patient-modal-close"
              onClick={() => setShowEmergency(false)}
              aria-label={t("patient.closeEmergency")}
            >
              <X size={20} />
            </button>

            {!emergencyRequested ? (
              <>
                <AlertTriangle size={32} />

                <h2>{t("patient.emergencyHelp")}</h2>

                <p>
                  {t("patient.emergencyUse")}
                </p>

                <button
                  type="button"
                  className="patient-emergency-button"
                  onClick={requestEmergency}
                >
                  <Ambulance size={20} />
                  {t("patient.requestAmbulance")}
                </button>

                <button
                  type="button"
                  className="patient-panel-button"
                  onClick={openDirections}
                >
                  <MapPinned size={18} />
                  {t("patient.findEmergencyFacility")}
                </button>

                <button
                  type="button"
                  className="patient-emergency-call"
                  onClick={callEmergency}
                >
                  <PhoneCall size={18} />
                  {t("patient.call108")}
                </button>

                <small>
                  {t("patient.emergencyDisclaimer")}
                </small>
              </>
            ) : (
              <>
                <CheckCircle2 size={32} />

                <h2>{t("patient.requestCreated")}</h2>

                <p>
                  {t("patient.requestLinked")}
                </p>

                <div className="patient-modal-summary">
                  <strong>{t("patient.destination")}</strong>
                  <span>{t("patient.nearestEmergency")}</span>
                  <strong>{t("patient.requestId")}</strong>
                  <span>EMR-MH-2026-0021</span>
                </div>

                <button
                  type="button"
                  className="patient-panel-button"
                  onClick={() => setShowEmergency(false)}
                >
                  {t("patient.close")}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {/* ======================================================
          HELP MODAL
      ======================================================= */}

      {showHelp && (
        <div className="patient-modal-backdrop">
          <section className="patient-modal">
            <button
              type="button"
              className="patient-modal-close"
              onClick={() => setShowHelp(false)}
              aria-label={t("patient.closeHelp")}
            >
              <X size={20} />
            </button>

            <span className="patient-kicker">
              <ShieldCheck size={16} />
              {t("patient.careSupport")}
            </span>

            <h2>{t("patient.howCanHelp")}</h2>
            <p>{t("patient.chooseHelp")}</p>

            <button
              type="button"
              className="patient-panel-button"
              onClick={() => {
                setShowHelp(false);
                setAppointmentBooked(false);
                setShowAppointment(true);
              }}
            >
              <CalendarPlus size={18} />
              {t("patient.appointmentHelp")}
            </button>

            <button
              type="button"
              className="patient-panel-button"
              onClick={() => {
                setShowHelp(false);
                setEmergencyRequested(false);
                setShowEmergency(true);
              }}
            >
              <Ambulance size={18} />
              {t("patient.emergencyAssistance")}
            </button>

            <button
              type="button"
              className="patient-panel-button"
              onClick={() => setShowHelp(false)}
            >
              <UserRound size={18} />
              {t("patient.requestAsha")}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
