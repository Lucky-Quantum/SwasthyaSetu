import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import hi from "./locales/hi.json";
import mr from "./locales/mr.json";

const supportedLanguages = ["en", "hi", "mr"] as const;

function getInitialLanguage() {
    try {
        const saved = localStorage.getItem("swasthyasetu.language");
        return saved && supportedLanguages.includes(saved as (typeof supportedLanguages)[number])
            ? saved
            : "en";
    } catch {
        return "en";
    }
}

void i18n.use(initReactI18next).init({
    resources: {
        en: { translation: en },
        hi: { translation: hi },
        mr: { translation: mr },
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    supportedLngs: [...supportedLanguages],
    interpolation: { escapeValue: false },
    returnNull: false,
});

i18n.on("languageChanged", (language) => {
    try {
        localStorage.setItem("swasthyasetu.language", language);
    } catch {
        // Language switching still works for the current session if storage is unavailable.
    }
});

export default i18n;