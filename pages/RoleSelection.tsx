import {
  ArrowLeft,
  Building2,
  ShieldCheck,
  Stethoscope,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import Brand from "../components/Brand";
import RoleCard from "../components/RoleCard";
import LanguageSelector, {
  Language,
} from "../components/LanguageSelector";

interface RoleSelectionProps {
  onBack: () => void;
  onSelectRole: (
    role: "patient" | "worker" | "doctor" | "admin"
  ) => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

export default function RoleSelection({
  onBack,
  onSelectRole,
  language,
  setLanguage,
}: RoleSelectionProps) {
  const { t } = useTranslation();

  return (
    <main className="role-page">

      {/* =========================
          TOP BAR
      ========================== */}

      <header className="role-navbar">

        <button
          type="button"
          className="role-back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          {t("common.backToHome")}
        </button>

        <Brand />

        <LanguageSelector
          language={language}
          setLanguage={setLanguage}
        />

      </header>

      {/* =========================
          MAIN
      ========================== */}

      <section className="role-main">

        <div className="role-header">

          <span className="role-eyebrow">
            <ShieldCheck size={17} />
            {t("roles.eyebrow")}
          </span>

          <h1>
            {t("roles.heading")}
          </h1>

          <p>
            {t("roles.description")}
          </p>

        </div>

        {/* =========================
            ROLE CARDS
        ========================== */}

        <div className="role-grid">

          {/* PATIENT */}

          <RoleCard
            icon={UserRound}
            title={t("common.patient")}
            subtitle={t("roles.patientSubtitle")}
            description={t("roles.patientDescription")}
            color="green"
            onClick={() => onSelectRole("patient")}
          />

          {/* HEALTH WORKER */}

          <RoleCard
            icon={UsersRound}
            title={t("common.healthWorker")}
            subtitle={t("roles.workerSubtitle")}
            description={t("roles.workerDescription")}
            color="blue"
            onClick={() => onSelectRole("worker")}
          />

          {/* DOCTOR */}

          <RoleCard
            icon={Stethoscope}
            title={t("common.doctor")}
            subtitle={t("roles.doctorSubtitle")}
            description={t("roles.doctorDescription")}
            color="purple"
            onClick={() => onSelectRole("doctor")}
          />

          {/* ADMIN */}

          <RoleCard
            icon={Building2}
            title={t("common.administrator")}
            subtitle={t("roles.adminSubtitle")}
            description={t("roles.adminDescription")}
            color="orange"
            onClick={() => onSelectRole("admin")}
          />

        </div>

        {/* =========================
            SECURITY NOTE
        ========================== */}

        <div className="role-security">

          <ShieldCheck size={20} />

          <div>
            <strong>
              {t("roles.securityTitle")}
            </strong>

            <p>
              {t("roles.securityText")}
            </p>
          </div>

        </div>

        {/* =========================
            DEMO MODE
        ========================== */}

        <div className="demo-box">

          <div>
            <span className="demo-label">
              {t("roles.demoLabel")}
            </span>

            <h3>
              {t("roles.demoHeading")}
            </h3>

            <p>
              {t("roles.demoText")}
            </p>
          </div>

          <button
            type="button"
            className="demo-button"
            onClick={() => onSelectRole("worker")}
          >
            {t("roles.demoButton")}
          </button>

        </div>

      </section>

    </main>
  );
}