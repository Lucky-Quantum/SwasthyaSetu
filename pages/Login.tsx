import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "react-i18next";

import Brand from "../components/Brand";
import LanguageSelector, { type Language } from "../components/LanguageSelector";

interface LoginProps {
  role: "patient" | "worker" | "doctor" | "admin";
  onBack: () => void;
  onContinue: () => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

export default function Login({
  role,
  onBack,
  onContinue,
  language,
  setLanguage,
}: LoginProps) {
  const { t } = useTranslation();
  const prefix = role === "admin" ? "admin" : role;
  const info = {
    title: t(`login.${prefix}Title`),
    subtitle: t(`login.${prefix}Subtitle`),
    idLabel: t(role === "patient" ? "login.mobile" : `login.${prefix}Id`),
    placeholder: t(role === "patient" ? "login.mobilePlaceholder" : `login.${prefix}Placeholder`),
    helper: t(role === "patient" ? "login.otpHelper" : `login.${prefix}Helper`),
  };

  return (
    <main className="login-page">

      <div className="login-topbar">

        <button
          type="button"
          className="login-back"
          onClick={onBack}
        >
          <ArrowLeft size={18} />
          {t("common.changeRole")}
        </button>

        <Brand />

        <LanguageSelector language={language} setLanguage={setLanguage} />

      </div>

      <section className="login-container">

        <div className="login-card">

          <div className="login-icon">
            <LockKeyhole size={30} />
          </div>

          <div className="login-heading">

            <span>
              {t("login.secureAccess")}
            </span>

            <h1>{info.title}</h1>

            <p>{info.subtitle}</p>

          </div>

          <div className="login-form">

            <label>
              {info.idLabel}
            </label>

            <input
              type="text"
              placeholder={info.placeholder}
            />

            {role !== "patient" && (
              <>
                <label>
                  {t("login.password")}
                </label>

                <input
                  type="password"
                  placeholder={t("login.passwordPlaceholder")}
                />
              </>
            )}

            <small>
              {info.helper}
            </small>

            <button
              type="button"
              className="login-button"
              onClick={onContinue}
            >
              {t("common.continue")}
              <ArrowRight size={18} />
            </button>

          </div>

          <div className="login-security">

            <ShieldCheck size={18} />

            <span>
              {t("login.securityNote")}
            </span>

          </div>

          <div className="login-demo-note">
            <ShieldCheck size={15} />
            {t("login.demoNote")}
          </div>

          <button
            type="button"
            className="demo-login"
            onClick={onContinue}
          >
            {t("login.demoButton")}
          </button>

        </div>

      </section>

    </main>
  );
}