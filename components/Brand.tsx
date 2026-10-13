import { useTranslation } from "react-i18next";

export default function Brand() {
  const { t } = useTranslation();

  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">
        <img src="/assets/logo.png" alt="" />
      </span>

      <span className="brand-wordmark">
        <span className="brand-swasthya">Swasthya</span>
        <span className="brand-plus">+</span>
        <span className="brand-setu">Setu</span>

        <small>{t("brand.tagline")}</small>
      </span>
    </div>
  );
}