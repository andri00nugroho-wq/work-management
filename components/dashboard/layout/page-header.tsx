import { ROLE_LABEL } from "../constants";
import type { DashboardUser, MenuName } from "../types";

export default function PageHeader({
  user,
  activeMenu,
  primaryAction,
  onExport,
}: {
  user: DashboardUser;
  activeMenu: MenuName;
  primaryAction: { label: string; onClick: () => void } | null;
  onExport: (() => void) | null;
}) {
  return (
    <section className="welcome-row">
      <div>
        <div className="eyebrow">WORKSPACE OVERVIEW</div>
        <h1>{activeMenu}</h1>
        <p>
          Selamat datang, {user.name}. Pantau pekerjaan dan kolaborasi tim Raja Emas Indonesia.
        </p>
        <span className="role-label">{ROLE_LABEL[user.role]}</span>
      </div>

      <div className="welcome-actions">
        {onExport && (
          <button className="secondary-button" onClick={onExport}>
            ↓ Ekspor CSV
          </button>
        )}
        {primaryAction && (
          <button className="primary-button" onClick={primaryAction.onClick}>
            {primaryAction.label}
          </button>
        )}
      </div>
    </section>
  );
}
