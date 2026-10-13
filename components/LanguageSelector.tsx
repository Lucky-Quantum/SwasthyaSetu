import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, Globe2 } from "lucide-react";

export type Language = "en" | "hi" | "mr";

interface LanguageSelectorProps {
  language: Language;
  setLanguage: (language: Language) => void;
}

export default function LanguageSelector({
  language,
  setLanguage,
}: LanguageSelectorProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const options: Language[] = ["en", "hi", "mr"];

  return (
    <div className="language-wrap">
      <button
        type="button"
        className="language-button"
        aria-label={t("language.label")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Globe2 size={18} />
        <span>{t(`language.${language}`)}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="language-menu" role="group" aria-label={t("language.label")}>
          {options.map((option) => (
            <button
              type="button"
              key={option}
              className={option === language ? "language-option selected" : "language-option"}
              aria-pressed={option === language}
              onClick={() => {
                setLanguage(option);
                setOpen(false);
              }}
            >
              {t(`language.${option}`)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}