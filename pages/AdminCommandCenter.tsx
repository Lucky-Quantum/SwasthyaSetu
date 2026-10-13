import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileText,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Network,
  Pill,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Siren,
  Stethoscope,
  TestTube2,
  TrendingDown,
  TrendingUp,
  Users,
  UsersRound,
  Wifi,
  X,
} from "lucide-react";
import Brand from "../components/Brand";
import LanguageSelector, { type Language } from "../components/LanguageSelector";
import { useCare } from "../src/store/careStore";
import {
  demoAdminStats,
  demoDelayReasons,
  demoFacilities,
  referralStageLabels,
  type FacilityData,
  type JourneyStage,
} from "../src/data/careData";

interface AdminCommandCenterProps {
  onLogout: () => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

type AdminSection =
  | "command-center"
  | "action-required"
  | "village-care"
  | "facility-performance"
  | "medicine-diagnostics"
  | "high-risk"
  | "referral-analytics"
  | "settings";

type VillageStatus = "critical" | "review" | "healthy" | "followup";

interface VillageCareStatus {
  name: string;
  completion: number;
  delayedReferrals: number;
  followupDue: number;
  highRiskDue: number;
  totalReferrals: number;
  completed: number;
  pendingAcceptance: number;
  mainIssue: string;
  medicineIssue: string;
  status: VillageStatus;
}

interface ActionAlert {
  id: string;
  severity: "critical" | "high" | "warning" | "info";
  title: string;
  meta: string;
  description: string;
  primaryAction: string;
  secondaryAction?: string;
}

interface MedicineAlert {
  name: string;
  severity: "critical" | "warning";
  detail: string;
  scope: string;
  action: string;
}

interface DiagnosticStatus {
  name: string;
  tone: "available" | "warning" | "critical";
  detail: string;
}

const villageStatuses: VillageCareStatus[] = [
  {
    name: "Velhe",
    completion: 62,
    delayedReferrals: 12,
    followupDue: 0,
    highRiskDue: 0,
    totalReferrals: 96,
    completed: 60,
    pendingAcceptance: 8,
    mainIssue: "PHC doctor unavailability",
    medicineIssue: "BP medicine low stock",
    status: "critical",
  },
  {
    name: "Pabe",
    completion: 76,
    delayedReferrals: 6,
    followupDue: 4,
    highRiskDue: 0,
    totalReferrals: 82,
    completed: 62,
    pendingAcceptance: 5,
    mainIssue: "ANC follow-up backlog",
    medicineIssue: "Iron + folic acid low stock",
    status: "review",
  },
  {
    name: "Nasrapur",
    completion: 93,
    delayedReferrals: 2,
    followupDue: 0,
    highRiskDue: 0,
    totalReferrals: 71,
    completed: 66,
    pendingAcceptance: 1,
    mainIssue: "No critical bottleneck",
    medicineIssue: "No critical shortage",
    status: "healthy",
  },
  {
    name: "Karanji",
    completion: 81,
    delayedReferrals: 5,
    followupDue: 1,
    highRiskDue: 3,
    totalReferrals: 88,
    completed: 71,
    pendingAcceptance: 3,
    mainIssue: "Referral volume",
    medicineIssue: "No critical shortage",
    status: "followup",
  },
];

const actionAlerts: ActionAlert[] = [
  {
    id: "A1",
    severity: "critical",
    title: "12 referrals delayed for more than 48 hours",
    meta: "Velhe PHC",
    description: "Reason: Doctor review pending.",
    primaryAction: "View Cases",
    secondaryAction: "Notify Medical Officer",
  },
  {
    id: "A2",
    severity: "high",
    title: "High-risk maternal follow-up overdue",
    meta: "Village: Pabe",
    description: "4 patients need ANC follow-up within 24 hours.",
    primaryAction: "View Care Gap",
    secondaryAction: "Alert ASHA Supervisor",
  },
  {
    id: "A3",
    severity: "warning",
    title: "Medicine shortage",
    meta: "Insulin • 3 PHCs",
    description: "Stockout detected at facilities serving active referrals.",
    primaryAction: "View Facilities",
    secondaryAction: "Raise Stock Request",
  },
  {
    id: "A4",
    severity: "info",
    title: "Diagnostic service unavailable",
    meta: "Karanji PHC",
    description: "Hemoglobin testing unavailable at the facility.",
    primaryAction: "Redirect Patients",
    secondaryAction: "Notify Facility",
  },
];

const medicineAlerts: MedicineAlert[] = [
  {
    name: "Insulin",
    severity: "critical",
    detail: "Out of stock",
    scope: "3 PHCs • 24 affected cases",
    action: "Raise Stock Request",
  },
  {
    name: "Amlodipine 5 mg",
    severity: "warning",
    detail: "Low stock",
    scope: "5 PHCs • ~3 days remaining",
    action: "Notify Pharmacy",
  },
  {
    name: "Iron + Folic Acid",
    severity: "warning",
    detail: "Low stock",
    scope: "2 PHCs • high ANC demand",
    action: "View Villages",
  },
];

const diagnosticStatuses: DiagnosticStatus[] = [
  {
    name: "BP Measurement",
    tone: "available",
    detail: "Available in 42 facilities",
  },
  {
    name: "Blood Sugar Test",
    tone: "available",
    detail: "Available in 34 facilities",
  },
  {
    name: "Hemoglobin Test",
    tone: "warning",
    detail: "Unavailable in 5 PHCs",
  },
  {
    name: "Ultrasound",
    tone: "critical",
    detail: "Available only at 2 CHCs",
  },
];

const villageStatusCopy: Record<
  VillageStatus,
  { label: string; colorClass: string }
> = {
  critical: { label: "Needs intervention", colorClass: "critical" },
  review: { label: "Review delays", colorClass: "review" },
  healthy: { label: "Monitor normally", colorClass: "healthy" },
  followup: { label: "Follow-up priority", colorClass: "followup" },
};

const referralTrend = [71, 76, 80, 84];
const referralReasons = [
  { label: "Maternal Care", value: 31 },
  { label: "Diabetes / Hypertension", value: 25 },
  { label: "Fever / Infection", value: 18 },
  { label: "Respiratory", value: 14 },
  { label: "Other", value: 12 },
];

export default function AdminCommandCenter({
  onLogout,
  language,
  setLanguage,
}: AdminCommandCenterProps) {
  const { t } = useTranslation();
  const { referrals, patients } = useCare();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeSection, setActiveSection] =
    useState<AdminSection>("command-center");
  const [districtFilter, setDistrictFilter] = useState("All Districts");
  const [facilityFilter, setFacilityFilter] = useState("All Facilities");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [search, setSearch] = useState("");
  const [selectedVillage, setSelectedVillage] =
    useState<VillageCareStatus | null>(null);
  const [selectedFacility, setSelectedFacility] =
    useState<FacilityData | null>(null);
  const [toast, setToast] = useState("");

  const activeReferrals = referrals.filter(
    (referral) => referral.status !== "Completed",
  ).length;

  const completedCount = referrals.filter(
    (referral) => referral.status === "Completed",
  ).length;

  const currentCompletionRate = Math.round(
    (completedCount / Math.max(referrals.length, 1)) * 100,
  );

  const stageCounts = useMemo(() => {
    const stages: JourneyStage[] = referralStageLabels.map(
      (stage) => stage.label as JourneyStage,
    );

    return stages.map((stage) => ({
      stage,
      count: referrals.filter((referral) =>
        referral.journey.includes(stage),
      ).length,
    }));
  }, [referrals]);

  const filteredFacilities = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return demoFacilities.filter((facility) => {
      if (
        districtFilter !== "All Districts" &&
        facility.district !== districtFilter
      ) {
        return false;
      }

      if (
        facilityFilter !== "All Facilities" &&
        facility.name !== facilityFilter
      ) {
        return false;
      }

      if (statusFilter !== "All Status") {
        const status = facility.completionRate < 70 ? "Stuck" : "Active";
        if (status !== statusFilter) return false;
      }

      if (normalizedSearch) {
        const haystack = [
          facility.name,
          facility.district,
          facility.currentBottleneck,
        ]
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(normalizedSearch)) return false;
      }

      return true;
    });
  }, [districtFilter, facilityFilter, search, statusFilter]);

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    setMobileOpen(false);

    if (section === "settings") {
      setToast("Settings panel is reserved for the next integration phase.");
      return;
    }

    window.setTimeout(() => {
      document
        .getElementById(`admin-section-${section}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const displayCompletionRate =
    demoAdminStats.referralCompletionRate || currentCompletionRate;

  const primaryKpis = [
    {
      label: "Total Referrals",
      value: "1,247",
      helper: "+12% from last month",
      icon: FileText,
      tone: "blue",
    },
    {
      label: "Completion Rate",
      value: `${displayCompletionRate}%`,
      helper: "Target: 90%",
      icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "Overdue Referrals",
      value: "42",
      helper: "Needs immediate action",
      icon: AlertTriangle,
      tone: "red",
    },
    {
      label: "Critical Medicine Alerts",
      value: "15",
      helper: "Across 8 PHCs",
      icon: Pill,
      tone: "purple",
    },
  ];

  const secondaryKpis = [
    ["Active Facilities", "42"],
    ["Active ASHA / ANM", "186"],
    ["High-Risk Cases Due", "27"],
    ["Avg Referral Completion", "4.2 days"],
  ];

  return (
    <main className="admin-cc-page">
      <aside
        className={`admin-cc-sidebar ${mobileOpen ? "admin-cc-sidebar-open" : ""
          }`}
      >
        <div className="admin-cc-sidebar-top">
          <button
            className="admin-cc-brand-button"
            aria-label="SwasthyaSetu home"
            onClick={() => handleSectionChange("command-center")}
          >
            <Brand />
          </button>
          <button
            className="admin-cc-close-mobile"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="admin-cc-role-card">
          <div className="admin-cc-role-avatar">
            <Network size={18} />
          </div>
          <div>
            <strong>District Command</strong>
            <span>District-level admin</span>
          </div>
        </div>

        <nav className="admin-cc-side-nav" aria-label="Admin dashboard">
          <button
            className={activeSection === "command-center" ? "active" : ""}
            onClick={() => handleSectionChange("command-center")}
          >
            <LayoutDashboard size={17} />
            <span>Command Center</span>
          </button>
          <button
            className={activeSection === "action-required" ? "active" : ""}
            onClick={() => handleSectionChange("action-required")}
          >
            <Siren size={17} />
            <span>Action Required</span>
            <b>4</b>
          </button>
          <button
            className={activeSection === "village-care" ? "active" : ""}
            onClick={() => handleSectionChange("village-care")}
          >
            <MapPin size={17} />
            <span>Village Care Status</span>
          </button>
          <button
            className={
              activeSection === "facility-performance" ? "active" : ""
            }
            onClick={() => handleSectionChange("facility-performance")}
          >
            <Building2 size={17} />
            <span>Facility Performance</span>
          </button>
          <button
            className={
              activeSection === "medicine-diagnostics" ? "active" : ""
            }
            onClick={() => handleSectionChange("medicine-diagnostics")}
          >
            <Pill size={17} />
            <span>Medicine & Diagnostics</span>
          </button>
          <button
            className={activeSection === "high-risk" ? "active" : ""}
            onClick={() => handleSectionChange("high-risk")}
          >
            <HeartPulse size={17} />
            <span>High-Risk Follow-ups</span>
          </button>
          <button
            className={
              activeSection === "referral-analytics" ? "active" : ""
            }
            onClick={() => handleSectionChange("referral-analytics")}
          >
            <BarChart3 size={17} />
            <span>Referral Analytics</span>
          </button>
          <button
            className={activeSection === "settings" ? "active" : ""}
            onClick={() => handleSectionChange("settings")}
          >
            <Settings size={17} />
            <span>Settings</span>
          </button>
        </nav>

        <div className="admin-cc-sidebar-footer">
          <div className="admin-cc-security-mini">
            <ShieldCheck size={16} />
            <span>Aggregate analytics • Synthetic demo data</span>
          </div>
          <button className="admin-cc-sidebar-logout" onClick={onLogout}>
            <LogOut size={16} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <button
          className="admin-cc-sidebar-backdrop"
          aria-label="Close sidebar"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <section className="admin-cc-main">
        <header className="admin-cc-topbar">
          <div className="admin-cc-topbar-left">
            <button
              className="admin-cc-menu-button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={21} />
            </button>

            <div className="admin-cc-breadcrumb">
              <span>District Health Command Center</span>
              <ChevronRight size={14} />
              <strong>Operational overview</strong>
            </div>
          </div>

          <div className="admin-cc-topbar-actions">
            <LanguageSelector language={language} setLanguage={setLanguage} />
            <div className="admin-cc-search">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search facilities or bottlenecks"
                aria-label="Search facilities"
              />
            </div>

            <div className="admin-cc-online-pill">
              <Wifi size={15} />
              <span>Online</span>
            </div>

            <div className="admin-cc-notify-wrap">
              <button
                className="admin-cc-icon-button"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="admin-cc-notification-dot" />
              </button>

              {notificationsOpen && (
                <div className="admin-cc-notification-menu">
                  <div>
                    <strong>Notifications</strong>
                    <span>4 actions need attention</span>
                  </div>
                  {actionAlerts.slice(0, 3).map((alert) => (
                    <button
                      key={alert.id}
                      onClick={() => {
                        setNotificationsOpen(false);
                        handleSectionChange("action-required");
                      }}
                    >
                      <i className={`admin-cc-severity-dot ${alert.severity}`} />
                      <span>{alert.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-cc-profile">
              <span className="admin-cc-profile-avatar">
                <UsersRound size={17} />
              </span>
              <span>
                <strong>District Admin</strong>
                <small>Nashik District • Maharashtra</small>
              </span>
            </div>

            <button
              className="admin-cc-icon-button admin-cc-desktop-logout"
              onClick={onLogout}
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <div className="admin-cc-content">
          <section
            id="admin-section-command-center"
            className="admin-cc-hero"
          >
            <div>
              <span className="admin-cc-kicker">
                <BarChart3 size={16} />
                Operational Intelligence
              </span>
              <h1>District Health Command Center</h1>
              <p>
                Live overview of referrals, care gaps, facility readiness and
                medicine availability.
              </p>
            </div>

            <div className="admin-cc-hero-meta">
              <div>
                <strong>1,284</strong>
                <span>Total patients in system</span>
              </div>
              <div>
                <strong>{activeReferrals}</strong>
                <span>Live referrals in demo store</span>
              </div>
            </div>
          </section>

          <div className="admin-cc-demo-banner">
            <ShieldCheck size={16} />
            <span>
              <strong>Prototype mode:</strong> dashboard metrics outside the
              live referral store are synthetic demo data for SIH presentation.
            </span>
          </div>

          <section className="admin-cc-kpi-grid">
            {primaryKpis.map((kpi) => (
              <article
                className={`admin-cc-kpi-card ${kpi.tone}`}
                key={kpi.label}
              >
                <div className="admin-cc-kpi-icon">
                  <kpi.icon size={20} />
                </div>
                <div>
                  <span>{kpi.label}</span>
                  <strong>{kpi.value}</strong>
                  <small>{kpi.helper}</small>
                </div>
              </article>
            ))}
          </section>

          <section className="admin-cc-secondary-kpi-grid">
            {secondaryKpis.map(([label, value]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <section
            id="admin-section-action-required"
            className="admin-cc-section-block"
          >
            <div className="admin-cc-section-heading">
              <div>
                <span>ACTION REQUIRED</span>
                <h2>Intervene where care is breaking</h2>
              </div>
              <span className="admin-cc-section-count">4 alerts</span>
            </div>

            <div className="admin-cc-action-grid">
              {actionAlerts.map((alert) => (
                <article
                  className={`admin-cc-action-card ${alert.severity}`}
                  key={alert.id}
                >
                  <div className="admin-cc-action-icon">
                    <AlertTriangle size={17} />
                  </div>
                  <div className="admin-cc-action-copy">
                    <strong>{alert.title}</strong>
                    <span>{alert.meta}</span>
                    <p>{alert.description}</p>
                  </div>
                  <div className="admin-cc-action-buttons">
                    <button
                      className="primary"
                      onClick={() => showToast(`${alert.primaryAction}: opened demo workflow`)}
                    >
                      {alert.primaryAction}
                      <ArrowRight size={14} />
                    </button>
                    {alert.secondaryAction && (
                      <button
                        className="secondary"
                        onClick={() =>
                          showToast(
                            `${alert.secondaryAction}: demo action queued`,
                          )
                        }
                      >
                        {alert.secondaryAction}
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            id="admin-section-village-care"
            className="admin-cc-grid-2"
          >
            <article className="admin-cc-panel">
              <div className="admin-cc-panel-heading">
                <div>
                  <span>VILLAGE-WISE CARE STATUS</span>
                  <h2>Where care gaps concentrate</h2>
                </div>
                <MapPin size={19} />
              </div>

              <div className="admin-cc-village-list">
                {villageStatuses.map((village) => (
                  <button
                    className="admin-cc-village-row"
                    key={village.name}
                    onClick={() => setSelectedVillage(village)}
                  >
                    <div
                      className={`admin-cc-village-marker ${villageStatusCopy[village.status].colorClass}`}
                    >
                      {village.name.charAt(0)}
                    </div>
                    <div className="admin-cc-village-info">
                      <strong>{village.name}</strong>
                      <span>
                        {village.completion}% completion •{" "}
                        {village.delayedReferrals} delayed referrals
                      </span>
                    </div>
                    <div className="admin-cc-village-result">
                      <b>{villageStatusCopy[village.status].label}</b>
                      <ChevronRight size={16} />
                    </div>
                  </button>
                ))}
              </div>

              <div className="admin-cc-panel-footnote">
                Green &gt;90% • Yellow 70–90% • Red &lt;70% • Purple = follow-up
                priority
              </div>
            </article>

            <article
              id="admin-section-referral-analytics"
              className="admin-cc-panel"
            >
              <div className="admin-cc-panel-heading">
                <div>
                  <span>REFERRAL CONTINUITY</span>
                  <h2>Completion trend</h2>
                </div>
                <TrendingUp size={19} />
              </div>

              <div className="admin-cc-trend-card">
                <div className="admin-cc-trend-stat">
                  <strong>84%</strong>
                  <span>current synthetic district benchmark</span>
                </div>

                <svg
                  className="admin-cc-trend-chart"
                  viewBox="0 0 500 180"
                  role="img"
                  aria-label="Referral completion trend"
                >
                  <path
                    d="M25 145 L170 105 L315 72 L470 40"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {[25, 170, 315, 470].map((x, index) => {
                    const y = [145, 105, 72, 40][index];
                    return (
                      <g key={x}>
                        <circle cx={x} cy={y} r="7" />
                        <text x={x} y={y - 13} textAnchor="middle">
                          {referralTrend[index]}%
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="admin-cc-chart-labels">
                  {["Week 1", "Week 2", "Week 3", "Week 4"].map((label) => (
                    <span key={label}>{label}</span>
                  ))}
                </div>
              </div>

              <div className="admin-cc-mini-metrics">
                <div>
                  <strong>1,047</strong>
                  <span>completed</span>
                </div>
                <div>
                  <strong>42</strong>
                  <span>overdue</span>
                </div>
                <div>
                  <strong>{displayCompletionRate}%</strong>
                  <span>live demo store</span>
                </div>
              </div>
            </article>
          </section>

          <section
            id="admin-section-facility-performance"
            className="admin-cc-panel"
          >
            <div className="admin-cc-panel-heading admin-cc-panel-heading-wrap">
              <div>
                <span>FACILITY PERFORMANCE</span>
                <h2>Facility readiness and completion</h2>
              </div>

              <div className="admin-cc-filter-row">
                <select
                  value={districtFilter}
                  onChange={(event) => setDistrictFilter(event.target.value)}
                >
                  <option>All Districts</option>
                  <option>Nashik</option>
                  <option>Dindori</option>
                </select>

                <select
                  value={facilityFilter}
                  onChange={(event) => setFacilityFilter(event.target.value)}
                >
                  <option>All Facilities</option>
                  {demoFacilities.map((facility) => (
                    <option key={facility.name}>{facility.name}</option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <option>All Status</option>
                  <option>Active</option>
                  <option>Stuck</option>
                </select>
              </div>
            </div>

            <div className="admin-cc-table-wrap">
              <table className="admin-cc-table">
                <thead>
                  <tr>
                    <th>Facility</th>
                    <th>District</th>
                    <th>Referrals</th>
                    <th>Avg Wait</th>
                    <th>Specialist</th>
                    <th>Diagnostics</th>
                    <th>Completion</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFacilities.map((facility) => (
                    <tr key={facility.name}>
                      <td>
                        <strong>{facility.name}</strong>
                      </td>
                      <td>{facility.district}</td>
                      <td>{facility.activeReferrals}</td>
                      <td>{facility.avgWaitingTime}</td>
                      <td>
                        <span className="admin-cc-data-pill">
                          {facility.specialistAvailability}
                        </span>
                      </td>
                      <td>
                        <span className="admin-cc-data-pill">
                          {facility.diagnosticAvailability}
                        </span>
                      </td>
                      <td>
                        <div className="admin-cc-progress-cell">
                          <div className="admin-cc-progress">
                            <div
                              style={{
                                width: `${facility.completionRate}%`,
                              }}
                            />
                          </div>
                          <span>{facility.completionRate}%</span>
                        </div>
                      </td>
                      <td>
                        <button
                          className="admin-cc-table-action"
                          onClick={() => setSelectedFacility(facility)}
                        >
                          Details
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredFacilities.length === 0 && (
                <div className="admin-cc-empty">
                  No facilities match the current filters.
                </div>
              )}
            </div>
          </section>

          <section
            id="admin-section-medicine-diagnostics"
            className="admin-cc-grid-2"
          >
            <article className="admin-cc-panel">
              <div className="admin-cc-panel-heading">
                <div>
                  <span>MEDICINE AVAILABILITY</span>
                  <h2>Shortages that may interrupt care</h2>
                </div>
                <Pill size={19} />
              </div>

              <div className="admin-cc-resource-list">
                {medicineAlerts.map((item) => (
                  <div className="admin-cc-resource-row" key={item.name}>
                    <div className={`admin-cc-resource-icon ${item.severity}`}>
                      <Pill size={16} />
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.detail} • {item.scope}</span>
                    </div>
                    <button
                      onClick={() =>
                        showToast(`${item.action}: demo workflow opened`)
                      }
                    >
                      {item.action}
                    </button>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-cc-panel">
              <div className="admin-cc-panel-heading">
                <div>
                  <span>DIAGNOSTIC AVAILABILITY</span>
                  <h2>Route patients around service gaps</h2>
                </div>
                <TestTube2 size={19} />
              </div>

              <div className="admin-cc-resource-list">
                {diagnosticStatuses.map((item) => (
                  <div className="admin-cc-resource-row" key={item.name}>
                    <div className={`admin-cc-resource-icon ${item.tone}`}>
                      <TestTube2 size={16} />
                    </div>
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <span
                      className={`admin-cc-availability ${item.tone}`}
                    >
                      {item.tone === "available"
                        ? "Available"
                        : item.tone === "warning"
                          ? "Limited"
                          : "Critical"}
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section id="admin-section-high-risk" className="admin-cc-grid-2">
            <article className="admin-cc-panel">
              <div className="admin-cc-panel-heading">
                <div>
                  <span>HIGH-RISK FOLLOW-UP MONITOR</span>
                  <h2>Aggregate care-gap queue</h2>
                </div>
                <HeartPulse size={19} />
              </div>

              <div className="admin-cc-followup-grid">
                <div className="admin-cc-followup-card red">
                  <span>Maternal care</span>
                  <strong>27</strong>
                  <small>high-risk pregnancies</small>
                  <b>4 overdue ANC follow-ups</b>
                </div>
                <div className="admin-cc-followup-card orange">
                  <span>Child health</span>
                  <strong>14</strong>
                  <small>missed follow-ups</small>
                  <b>immunisation / growth review</b>
                </div>
                <div className="admin-cc-followup-card purple">
                  <span>Chronic care</span>
                  <strong>38</strong>
                  <small>patients due for review</small>
                  <b>diabetes / hypertension</b>
                </div>
              </div>

              <div className="admin-cc-privacy-note">
                <ShieldCheck size={15} />
                <span>
                  Patient names and detailed clinical records are intentionally
                  hidden from the district aggregate view.
                </span>
              </div>
            </article>

            <article className="admin-cc-panel">
              <div className="admin-cc-panel-heading">
                <div>
                  <span>WHY REFERRALS GET STUCK</span>
                  <h2>Delay reasons</h2>
                </div>
                <Clock3 size={19} />
              </div>

              <div className="admin-cc-delay-list">
                {demoDelayReasons.slice(0, 6).map((delay) => (
                  <div key={delay.category}>
                    <div>
                      <strong>{delay.category}</strong>
                      <span>{delay.percentage}%</span>
                    </div>
                    <div className="admin-cc-delay-track">
                      <div style={{ width: `${delay.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-cc-grid-2">
            <article className="admin-cc-panel">
              <div className="admin-cc-panel-heading">
                <div>
                  <span>CARE BOTTLENECK RADAR</span>
                  <h2>Where the system is losing time</h2>
                </div>
                <Activity size={19} />
              </div>

              <div className="admin-cc-bottleneck-grid">
                {[
                  ["Specialist shortage", 12, "high"],
                  ["Diagnostic delay", 18, "high"],
                  ["Referral stuck", 9, "high"],
                  ["Facility overload", 6, "medium"],
                  ["Medicine shortage", 4, "medium"],
                  ["Follow-up overdue", 24, "medium"],
                ].map(([label, count, severity]) => (
                  <div
                    key={String(label)}
                    className={`admin-cc-bottleneck ${severity}`}
                  >
                    <div>
                      <strong>{label}</strong>
                      <b>{count}</b>
                    </div>
                    <div className="admin-cc-bottleneck-track">
                      <div
                        style={{
                          width: `${Math.min((Number(count) / 30) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="admin-cc-panel">
              <div className="admin-cc-panel-heading">
                <div>
                  <span>REFERRAL REASONS</span>
                  <h2>What is driving demand</h2>
                </div>
                <Stethoscope size={19} />
              </div>

              <div className="admin-cc-reason-list">
                {referralReasons.map((reason) => (
                  <div key={reason.label}>
                    <div>
                      <span>{reason.label}</span>
                      <b>{reason.value}%</b>
                    </div>
                    <div className="admin-cc-reason-track">
                      <div style={{ width: `${reason.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>

          <section className="admin-cc-analytics-summary">
            <div>
              <span>REFERRAL FUNNEL • LIVE DEMO STORE</span>
              <h2>Referral Created ≠ Care Completed</h2>
              <p>
                The operational objective is to make every referral visible
                from creation to completed care, while surfacing the exact
                point where the journey breaks.
              </p>
            </div>

            <div className="admin-cc-funnel">
              {stageCounts.map((stage, index) => {
                const maxCount = stageCounts[0]?.count || 1;
                const width = Math.max(
                  14,
                  (stage.count / maxCount) * 100,
                );

                return (
                  <div key={stage.stage}>
                    <div className="admin-cc-funnel-label">
                      <span>{index + 1}</span>
                      <strong>{stage.stage}</strong>
                    </div>
                    <div className="admin-cc-funnel-track">
                      <div style={{ width: `${width}%` }}>
                        {stage.count}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="admin-cc-privacy-panel">
            <div>
              <ShieldCheck size={18} />
              <div>
                <strong>DATA ACCESS & PRIVACY</strong>
                <span>
                  Admin access: aggregate district analytics only • Patient
                  names and clinical records hidden • Synthetic demo data •
                  Future architecture: ABDM-ready and consent-aware
                </span>
              </div>
            </div>

            <div className="admin-cc-privacy-metrics">
              <span>
                <Users size={14} />
                {patients.length} demo patients
              </span>
              <span>
                <RefreshCw size={14} />
                Offline-first ready
              </span>
              <span>
                <ShieldCheck size={14} />
                Role-based access
              </span>
            </div>
          </section>
        </div>
      </section>

      {selectedVillage && (
        <div
          className="admin-cc-modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedVillage.name} care gap analysis`}
        >
          <button
            className="admin-cc-modal-backdrop"
            aria-label="Close village details"
            onClick={() => setSelectedVillage(null)}
          />
          <section className="admin-cc-modal">
            <div className="admin-cc-modal-heading">
              <div>
                <span>VILLAGE CARE GAP ANALYSIS</span>
                <h2>{selectedVillage.name} Village</h2>
              </div>
              <button
                onClick={() => setSelectedVillage(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="admin-cc-modal-stats">
              <div>
                <strong>{selectedVillage.totalReferrals}</strong>
                <span>Total referrals</span>
              </div>
              <div>
                <strong>{selectedVillage.completed}</strong>
                <span>Completed</span>
              </div>
              <div>
                <strong>{selectedVillage.delayedReferrals}</strong>
                <span>Delayed</span>
              </div>
              <div>
                <strong>{selectedVillage.pendingAcceptance}</strong>
                <span>Pending acceptance</span>
              </div>
            </div>

            <div className="admin-cc-modal-detail-grid">
              <div>
                <span>Main issue</span>
                <strong>{selectedVillage.mainIssue}</strong>
              </div>
              <div>
                <span>Medicine issue</span>
                <strong>{selectedVillage.medicineIssue}</strong>
              </div>
              <div>
                <span>Follow-ups due</span>
                <strong>{selectedVillage.followupDue}</strong>
              </div>
              <div>
                <span>High-risk due</span>
                <strong>{selectedVillage.highRiskDue}</strong>
              </div>
            </div>

            <div className="admin-cc-modal-actions">
              <button
                className="primary"
                onClick={() =>
                  showToast(`PHC notification queued for ${selectedVillage.name}`)
                }
              >
                Notify PHC
              </button>
              <button
                className="secondary"
                onClick={() =>
                  showToast(
                    `Escalation queued for ${selectedVillage.name} village`,
                  )
                }
              >
                Escalate to Block Officer
              </button>
              <button
                className="secondary"
                onClick={() => {
                  setSelectedVillage(null);
                  handleSectionChange("facility-performance");
                }}
              >
                View Facility Performance
              </button>
            </div>
          </section>
        </div>
      )}

      {selectedFacility && (
        <div
          className="admin-cc-modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedFacility.name} details`}
        >
          <button
            className="admin-cc-modal-backdrop"
            aria-label="Close facility details"
            onClick={() => setSelectedFacility(null)}
          />
          <section className="admin-cc-modal">
            <div className="admin-cc-modal-heading">
              <div>
                <span>FACILITY PERFORMANCE</span>
                <h2>{selectedFacility.name}</h2>
              </div>
              <button
                onClick={() => setSelectedFacility(null)}
                aria-label="Close"
              >
                <X size={19} />
              </button>
            </div>

            <div className="admin-cc-modal-stats">
              <div>
                <strong>{selectedFacility.activeReferrals}</strong>
                <span>Active referrals</span>
              </div>
              <div>
                <strong>{selectedFacility.avgWaitingTime}</strong>
                <span>Average wait</span>
              </div>
              <div>
                <strong>{selectedFacility.completionRate}%</strong>
                <span>Completion</span>
              </div>
              <div>
                <strong>{selectedFacility.diagnosticAvailability}</strong>
                <span>Diagnostics</span>
              </div>
            </div>

            <div className="admin-cc-modal-detail-grid">
              <div>
                <span>District</span>
                <strong>{selectedFacility.district}</strong>
              </div>
              <div>
                <span>Specialist availability</span>
                <strong>{selectedFacility.specialistAvailability}</strong>
              </div>
              <div>
                <span>Current bottleneck</span>
                <strong>{selectedFacility.currentBottleneck}</strong>
              </div>
              <div>
                <span>Demo status</span>
                <strong>
                  {selectedFacility.completionRate < 70
                    ? "Needs action"
                    : "Active"}
                </strong>
              </div>
            </div>

            <div className="admin-cc-modal-actions">
              <button
                className="primary"
                onClick={() =>
                  showToast(
                    `Facility alert queued for ${selectedFacility.name}`,
                  )
                }
              >
                Send Facility Alert
              </button>
              <button
                className="secondary"
                onClick={() =>
                  showToast("Temporary doctor request queued in demo workflow")
                }
              >
                Request Temporary Doctor
              </button>
              <button
                className="secondary"
                onClick={() =>
                  showToast("Medicine stock request queued in demo workflow")
                }
              >
                Raise Stock Request
              </button>
            </div>
          </section>
        </div>
      )}

      {toast && <div className="admin-cc-toast">{toast}</div>}
    </main>
  );
}