import { useState } from "react";

import LandingPage from "../pages/LandingPage";
import RoleSelection from "../pages/RoleSelection";
import Login from "../pages/Login";
import PatientDashboard from "../pages/PatientDashboard";
import WorkerDashboard from "../pages/WorkerDashboard";
import DoctorDashboard from "../pages/DoctorDashboard";
import AdminCommandCenter from "../pages/AdminCommandCenter";

import type { Language } from "../components/LanguageSelector";
import i18n from "./i18n";
import { demoPatientData } from "./data/patientData";

type Page =
  | "landing"
  | "roles"
  | "login"
  | "patient-dashboard"
  | "worker-dashboard"
  | "doctor-dashboard"
  | "admin-dashboard";

type Role =
  | "patient"
  | "worker"
  | "doctor"
  | "admin";

export default function App() {
  const [page, setPage] =
    useState<Page>("landing");

  const [role, setRole] =
    useState<Role | null>(null);

  const [language, setLanguageState] = useState<Language>(() => {
    const current = i18n.resolvedLanguage ?? i18n.language;
    return current === "hi" || current === "mr" ? current : "en";
  });

  const setLanguage = (nextLanguage: Language) => {
    setLanguageState(nextLanguage);
    void i18n.changeLanguage(nextLanguage);
  };

  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const goToRoles = () => {
    setPage("roles");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const selectRole = (selectedRole: Role) => {
    setRole(selectedRole);
    setPage("login");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goHome = () => {
    setRole(null);
    setPage("landing");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const goBackToRoles = () => {
    setRole(null);
    setPage("roles");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // LOGIN SUCCESS
  // ==========================================================

  const handleLogin = () => {
    if (role === "patient") {
      setPage("patient-dashboard");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (role === "worker") {
      setPage("worker-dashboard");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (role === "doctor") {
      setPage("doctor-dashboard");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (role === "admin") {
      setPage("admin-dashboard");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }
  };

  // ==========================================================
  // LOGOUT
  // ==========================================================

  const handleLogout = () => {
    setRole(null);
    setPage("landing");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // ==========================================================
  // ROLE SELECTION
  // ==========================================================

  if (page === "roles") {
    return (
      <RoleSelection
        onBack={goHome}
        onSelectRole={selectRole}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  // ==========================================================
  // LOGIN
  // ==========================================================

  if (page === "login" && role) {
    return (
      <Login
        role={role}
        onBack={goBackToRoles}
        onContinue={handleLogin}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  // ==========================================================
  // PATIENT DASHBOARD
  // ==========================================================

  if (
    page === "patient-dashboard" &&
    role === "patient"
  ) {
    return (
      <PatientDashboard
        data={demoPatientData}
        language={language}
        setLanguage={setLanguage}
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================================
  // WORKER DASHBOARD
  // ==========================================================

  if (
    page === "worker-dashboard" &&
    role === "worker"
  ) {
    return (
      <WorkerDashboard
        language={language}
        setLanguage={setLanguage}
        onLogout={handleLogout}
      />
    );
  }

  // ==========================================================
  // DOCTOR DASHBOARD
  // ==========================================================

  if (
    page === "doctor-dashboard" &&
    role === "doctor"
  ) {
    return (
      <DoctorDashboard
        onLogout={handleLogout}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  // ==========================================================
  // ADMIN COMMAND CENTER
  // ==========================================================

  if (
    page === "admin-dashboard" &&
    role === "admin"
  ) {
    return (
      <AdminCommandCenter
        onLogout={handleLogout}
        language={language}
        setLanguage={setLanguage}
      />
    );
  }

  // ==========================================================
  // DEFAULT
  // ==========================================================

  return (
    <LandingPage
      onGetStarted={goToRoles}
      language={language}
      setLanguage={setLanguage}
    />
  );
}
