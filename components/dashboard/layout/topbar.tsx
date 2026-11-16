"use client";

import { initials } from "../lib/format";
import type { DashboardUser, MenuName } from "../types";
import ThemeSwitcher from "./theme-switcher";

export default function Topbar({
  user,
  activeMenu,
  onRefresh,
  onToggleProfileMenu,
}: {
  user: DashboardUser;
  activeMenu: MenuName;
  onRefresh: () => void;
  onToggleProfileMenu: () => void;
}) {
  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>REI Indonesia</span>
        <span className="breadcrumb-divider">/</span>
        <strong>{activeMenu}</strong>
      </div>

      <div className="topbar-actions">
        <div className="system-status">
          <span className="status-dot" />
          Terhubung
        </div>
        <ThemeSwitcher />
        <button
          className="icon-button"
          aria-label="Muat ulang data"
          title="Muat ulang data"
          onClick={onRefresh}
        >
          ↻
        </button>
        <button className="topbar-avatar" title={user.name} onClick={onToggleProfileMenu}>
          {initials(user.name)}
        </button>
      </div>
    </header>
  );
}
