import {
  ArrowRight,
  LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface RoleCardProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  description: string;
  color: "green" | "blue" | "purple" | "orange";
  onClick: () => void;
}

export default function RoleCard({
  icon: Icon,
  title,
  subtitle,
  description,
  color,
  onClick,
}: RoleCardProps) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className={`role-card role-${color}`}
      onClick={onClick}
    >
      <div className="role-card-top">
        <div className="role-icon">
          <Icon size={30} />
        </div>

        <div className="role-arrow">
          <ArrowRight size={19} />
        </div>
      </div>

      <div className="role-content">
        <h3>{title}</h3>

        <span className="role-subtitle">
          {subtitle}
        </span>

        <p>{description}</p>
      </div>

      <div className="role-action">
        {t("roles.continueAs", { role: title })}
      </div>
    </button>
  );
}