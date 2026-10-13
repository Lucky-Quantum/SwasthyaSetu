import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowRight,
  BellRing,
  ClipboardList,
  HeartPulse,
  Languages,
  MapPinned,
  Menu,
  Network,
  Route,
  ShieldCheck,
  Stethoscope,
  UserRound,
  WifiOff,
  X,
} from "lucide-react";
import Brand from "../components/Brand";
import LanguageSelector, { type Language } from "../components/LanguageSelector";

const features = [
  {
    translationKey: "smartReferral",
    title: "Smart Referral",
    text: "Recommend a suitable facility using specialty, diagnostics and availability.",
    icon: Route,
    tone: "green",
  },
  {
    translationKey: "patientJourney",
    title: "Patient Journey",
    text: "One connected timeline across visits, referrals and follow-ups.",
    icon: ClipboardList,
    tone: "blue",
  },
  {
    translationKey: "flightRecorder",
    title: "Referral Flight Recorder",
    text: "Track every referral from creation to completion.",
    icon: Network,
    tone: "violet",
  },
  {
    translationKey: "offlineFirst",
    title: "Offline-First",
    text: "Keep essential frontline work running when connectivity is weak.",
    icon: WifiOff,
    tone: "orange",
  },
  {
    translationKey: "careGaps",
    title: "Care Gap Detection",
    text: "Detect referral delays, missed appointments and care gaps.",
    icon: BellRing,
    tone: "rose",
  },
  {
    translationKey: "multilingual",
    title: "Multilingual & Simple",
    text: "Designed for English, Hindi and Marathi with low-literacy UX.",
    icon: Languages,
    tone: "teal",
  },
];

const journey = [
  {
    translationKey: "patient",
    label: "Patient",
    subKey: "registration",
    sub: "Registration",
    icon: UserRound,
  },
  {
    translationKey: "asha",
    label: "ASHA / ANM",
    subKey: "assessment",
    sub: "Assessment",
    icon: UserRound,
  },
  {
    translationKey: "phc",
    label: "PHC",
    subKey: "consultation",
    sub: "Consultation",
    icon: HeartPulse,
  },
  {
    translationKey: "hospital",
    label: "Hospital",
    subKey: "referral",
    sub: "Referral",
    icon: Stethoscope,
  },
  {
    translationKey: "specialist",
    label: "Specialist",
    subKey: "treatment",
    sub: "Treatment",
    icon: ClipboardList,
  },
  {
    translationKey: "followUp",
    label: "Follow-up",
    subKey: "recovery",
    sub: "Recovery",
    icon: ShieldCheck,
  },
];

interface LandingPageProps {
  onGetStarted: () => void;
  language: Language;
  setLanguage: (language: Language) => void;
}

export default function LandingPage({
  onGetStarted,
  language,
  setLanguage,
}: LandingPageProps) {
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth" });

    setMobileOpen(false);
  };

  return (
    <main className="site-shell">

      {/* =====================================================
          NAVBAR
      ====================================================== */}
      <header className="navbar">
        <div className="nav-inner">

          <button
            className="brand-button"
            onClick={() => scrollTo("home")}
            aria-label="Go to SwasthyaSetu home"
          >
            <Brand />
          </button>

          {/* Desktop / Mobile navigation */}
          <nav
            className={
              mobileOpen
                ? "nav-links nav-links-open"
                : "nav-links"
            }
          >
            <button
              className="nav-link active"
              onClick={() => scrollTo("home")}
            >
              {t("landing.nav.home")}
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("how-it-works")}
            >
              {t("landing.nav.how")}
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("features")}
            >
              {t("landing.nav.features")}
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("users")}
            >
              {t("landing.nav.patients")}
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("users")}
            >
              {t("landing.nav.workers")}
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("impact")}
            >
              {t("landing.nav.impact")}
            </button>

            <button
              className="nav-link"
              onClick={() => scrollTo("about")}
            >
              {t("landing.nav.about")}
            </button>
          </nav>

          <div className="nav-actions">

            <LanguageSelector language={language} setLanguage={setLanguage} />

            {/* Desktop buttons */}
            <button
              className="button secondary desktop-only"
              onClick={onGetStarted}
            >
              {t("common.signIn")}
            </button>

            <button
              className="button primary desktop-only"
              onClick={onGetStarted}
            >
              {t("common.getStarted")}
              <ArrowRight size={18} />
            </button>

            {/* Mobile menu */}
            <button
              className="mobile-menu-button"
              onClick={() =>
                setMobileOpen((value) => !value)
              }
              aria-label={
                mobileOpen
                  ? t("common.closeMenu")
                  : t("common.openMenu")
              }
            >
              {mobileOpen ? (
                <X size={24} />
              ) : (
                <Menu size={24} />
              )}
            </button>

          </div>
        </div>
      </header>

      {/* =====================================================
          HERO
      ====================================================== */}
      <section id="home" className="hero">

        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-content">

          <span className="eyebrow">
            <ShieldCheck size={17} />
            {t("landing.badge")}
          </span>

          <div className="sih-context-badge" aria-label="Smart India Hackathon problem statement">
            <span>SIH 2026</span>
            <b>PS SIH26133</b>
            <span>MedTech / HealthTech • Software</span>
          </div>

          <h1>
            {t("landing.heading1")}
            <span>{t("landing.heading2")}</span>
          </h1>

          <p className="hero-description">
            {t("landing.description")}
          </p>

          <div className="hero-core-message">
            <Route size={17} />
            <span>{t("landing.coreMessage")}</span>
          </div>

          <div className="hero-buttons">

            <button
              className="button primary large"
              onClick={onGetStarted}
            >
              {t("common.getStarted")}
              <ArrowRight size={19} />
            </button>

            <button
              className="button outline large"
              onClick={() => scrollTo("how-it-works")}
            >
              <HeartPulse size={18} />
              {t("landing.watch")}
            </button>

          </div>

          <div className="trust-row">

            <span>
              <ShieldCheck size={16} />
              {t("landing.trust.roles")}
            </span>

            <span>
              <WifiOff size={16} />
              {t("landing.trust.offline")}
            </span>

            <span>
              <Languages size={16} />
              {t("landing.trust.languages")}
            </span>

          </div>

        </div>

        {/* Hero visual */}
        <div className="hero-visual">

          <div className="hero-image-wrap">

            <img
              src="/assets/hero-rural.png"
              alt="Rural healthcare worker helping a family at a primary health centre"
              className="hero-image"
            />

            <div className="image-fade" />

          </div>

          {/* Care journey card */}
          <div className="journey-card">

            <div className="journey-heading">

              <div>
                <span>
                  ONE CONNECTED CARE JOURNEY
                </span>

                <strong>
                  Village → Specialist → Follow-up
                </strong>
              </div>

              <div className="live-dot">
                <i />
                Live flow
              </div>

            </div>

            <div className="journey-line">

              {journey.map((item, index) => {

                const Icon = item.icon;

                return (
                  <div
                    className="journey-step"
                    key={item.label}
                  >

                    <div className="journey-icon">
                      <Icon size={18} />
                    </div>

                    <strong>
                      {t(`landing.journey.${item.translationKey}`)}
                    </strong>

                    <span>
                      {t(`landing.journey.${item.subKey}`)}
                    </span>

                    {index <
                      journey.length - 1 && (
                        <div className="journey-arrow">
                          <ArrowRight size={15} />
                        </div>
                      )}

                  </div>
                );
              })}

            </div>
          </div>

        </div>
      </section>

      {/* =====================================================
          FEATURES
      ====================================================== */}
      <section
        id="features"
        className="features-section section"
      >

        <div className="section-heading centered">

          <span>
            {t("landing.features.eyebrow")}
          </span>

          <h2>
            {t("landing.features.heading")}
          </h2>

          <p>
            {t("landing.features.description")}
          </p>

        </div>

        <div className="feature-grid">

          {features.map((feature) => {

            const Icon = feature.icon;

            return (
              <article
                className="feature-card"
                key={feature.title}
              >

                <div
                  className={`feature-icon ${feature.tone}`}
                >
                  <Icon size={25} />
                </div>

                <h3>
                  {t(`landing.features.${feature.translationKey}`)}
                </h3>

                <p>
                  {t(`landing.features.${feature.translationKey}Text`)}
                </p>

              </article>
            );
          })}

        </div>
      </section>

      {/* =====================================================
          HOW IT WORKS
      ====================================================== */}
      <section
        id="how-it-works"
        className="how-section section"
      >

        <div className="how-copy">

          <span className="section-kicker">
            {t("landing.how.eyebrow")}
          </span>

          <h2>
            {t("landing.how.heading")}
          </h2>

          <p>
            {t("landing.how.description")}
          </p>

          <div className="mini-points">

            <div>
              <span>01</span>

              <strong>
                {t("landing.how.chooseRole")}
              </strong>

              <small>
                {t("landing.how.chooseRoleText")}
              </small>
            </div>

            <div>
              <span>02</span>

              <strong>
                {t("landing.how.secureAccess")}
              </strong>

              <small>
                {t("landing.how.secureAccessText")}
              </small>
            </div>

            <div>
              <span>03</span>

              <strong>
                {t("landing.how.completeJourney")}
              </strong>

              <small>
                {t("landing.how.completeJourneyText")}
              </small>
            </div>

          </div>
        </div>

        {/* Connected care map */}
        <div className="care-map">

          <div className="map-topline">

            <span>
              {t("landing.how.network")}
            </span>

            <MapPinned size={19} />

          </div>

          <div
            className="map-path"
            role="region"
            aria-label={t("landing.how.network")}
            tabIndex={0}
          >

            <div className="map-node">
              <UserRound />

              <strong>
                {t("landing.journey.patient")}
              </strong>

              <small>
                {t("landing.how.village")}
              </small>
            </div>

            <ArrowRight className="map-arrow" />

            <div className="map-node">
              <UserRound />

              <strong>
                {t("landing.journey.asha")}
              </strong>

              <small>
                {t("landing.journey.assessment")}
              </small>
            </div>

            <ArrowRight className="map-arrow" />

            <div className="map-node">
              <HeartPulse />

              <strong>
                PHC
              </strong>

              <small>
                {t("landing.how.firstCare")}
              </small>
            </div>

            <ArrowRight className="map-arrow" />

            <div className="map-node">
              <Stethoscope />

              <strong>
                {t("landing.journey.specialist")}
              </strong>

              <small>
                {t("landing.journey.referral")}
              </small>
            </div>

            <ArrowRight className="map-arrow" />

            <div className="map-node success">
              <ShieldCheck />

              <strong>
                {t("landing.journey.followUp")}
              </strong>

              <small>
                {t("landing.how.complete")}
              </small>
            </div>

          </div>

          <div className="map-footer">

            <span>
              🔄 {t("landing.how.statusFollows")}
            </span>

            <span>
              📶 {t("landing.how.offlineSupported")}
            </span>

          </div>

        </div>
      </section>

      {/* =====================================================
          USERS
      ====================================================== */}
      <section
        id="users"
        className="user-section section"
      >

        <div className="section-heading">

          <span>
            {t("landing.users.eyebrow")}
          </span>

          <h2>
            {t("landing.users.heading")}
          </h2>

        </div>

        <div className="user-grid">

          <article className="user-card">

            <UserRound />

            <h3>
              {t("landing.users.patients")}
            </h3>

            <p>
              {t("landing.users.patientsText")}
            </p>

          </article>

          <article className="user-card">

            <HeartPulse />

            <h3>
              {t("landing.users.workers")}
            </h3>

            <p>
              {t("landing.users.workersText")}
            </p>

          </article>

          <article className="user-card">

            <Stethoscope />

            <h3>
              {t("landing.users.doctors")}
            </h3>

            <p>
              {t("landing.users.doctorsText")}
            </p>

          </article>

          <article className="user-card">

            <Network />

            <h3>
              {t("landing.users.admins")}
            </h3>

            <p>
              {t("landing.users.adminsText")}
            </p>

          </article>

        </div>

      </section>

      {/* =====================================================
          IMPACT
      ====================================================== */}
      <section
        id="impact"
        className="impact-section section"
      >

        <div className="impact-panel">

          <div>

            <span className="section-kicker">
              {t("landing.impact.eyebrow")}
            </span>

            <h2>
              {t("landing.impact.heading")}
            </h2>

            <p>
              {t("landing.impact.description")}
            </p>

          </div>

          <div className="impact-pills">

            <span>
              <ArrowRight />
              {t("landing.impact.consultation")}
            </span>

            <span>
              <ArrowRight />
              {t("landing.impact.followups")}
            </span>

            <span>
              <ArrowRight />
              {t("landing.impact.resources")}
            </span>

            <span>
              <ArrowRight />
              {t("landing.impact.quality")}
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          ABOUT
      ====================================================== */}
      <section
        id="about"
        className="about-section section"
      >

        <div className="about-card">

          <div>

            <span className="section-kicker">
              {t("landing.about.eyebrow")}
            </span>

            <h2>
              {t("landing.about.heading")}
            </h2>

            <p>
              {t("landing.about.description")}
            </p>

          </div>

          <div className="about-badges">

            <span>
              <ShieldCheck />
              {t("landing.about.secure")}
            </span>

            <span>
              <Network />
              {t("landing.about.interoperability")}
            </span>

            <span>
              <WifiOff />
              {t("landing.about.rural")}
            </span>

          </div>

        </div>

      </section>

      {/* =====================================================
          SIGN IN CTA
      ====================================================== */}
      <section
        id="sign-in"
        className="cta-section"
      >

        <div>

          <span>
            {t("landing.cta.eyebrow")}
          </span>

          <h2>
            {t("landing.cta.heading")}
          </h2>

          <p>
            {t("landing.cta.roles")}
          </p>

        </div>

        <button
          className="button white large"
          onClick={onGetStarted}
        >
          {t("landing.cta.button")}
          <ArrowRight size={19} />
        </button>

      </section>

      {/* =====================================================
          FOOTER
      ====================================================== */}
      <footer className="footer">

        <div className="footer-brand">

          <button
            className="brand-button footer-brand-button"
            onClick={() => scrollTo("home")}
            aria-label="Go to SwasthyaSetu home"
          >
            <Brand />
          </button>

        </div>

        <div className="footer-note">
          {t("landing.footer.tagline")}
        </div>

        <div className="footer-copy">
          {t("landing.footer.note")}
        </div>

      </footer>
    </main>
  );
}

