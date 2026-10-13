import { ChevronRight, Menu, Wifi, WifiOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSelector, { type Language } from "./LanguageSelector";

interface WorkspaceTopbarProps {
    workspace: string;
    page: string;
    online: boolean;
    menuLabel: string;
    onOpenMenu: () => void;
    language: Language;
    setLanguage: (language: Language) => void;
}

export default function WorkspaceTopbar({
    workspace,
    page,
    online,
    menuLabel,
    onOpenMenu,
    language,
    setLanguage,
}: WorkspaceTopbarProps) {
    const { t } = useTranslation();
    return (
        <header className="workspace-topbar">
            <div className="workspace-topbar-left">
                <button
                    type="button"
                    className="workspace-menu-button"
                    onClick={onOpenMenu}
                    aria-label={menuLabel}
                >
                    <Menu size={20} />
                </button>
                <div className="workspace-breadcrumb">
                    <span>{workspace}</span>
                    <ChevronRight size={14} aria-hidden="true" />
                    <strong>{page}</strong>
                </div>
            </div>
            <div className="workspace-topbar-actions">
                <LanguageSelector language={language} setLanguage={setLanguage} />
                <div className={`workspace-connection ${online ? "online" : "offline"}`}>
                    {online ? <Wifi size={15} /> : <WifiOff size={15} />}
                    <span>{online ? t("common.online") : t("common.offline")}</span>
                </div>
            </div>
        </header>
    );
}