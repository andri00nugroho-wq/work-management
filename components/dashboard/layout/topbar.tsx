"use client";

import { faRightFromBracket, faRotateRight } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { initials } from "../lib/format";
import type { Notifications } from "../hooks/use-notifications";
import type { DashboardUser, MenuName } from "../types";
import NotificationBell from "./notification-bell";
import RunningTimer from "./running-timer";
import ThemeSwitcher from "./theme-switcher";

export default function Topbar({
  user,
  activeMenu,
  notifications,
  onRefresh,
  onOpenTask,
  onToggleProfileMenu,
  showProfileMenu,
  onIntegrations,
  onChangePassword,
  onLogout,
}: {
  user: DashboardUser;
  activeMenu: MenuName;
  notifications: Notifications;
  onRefresh: () => void;
  onOpenTask: (taskId: string) => void;
  onToggleProfileMenu: () => void;
  showProfileMenu: boolean;
  onIntegrations: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
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
        <RunningTimer onOpenTask={onOpenTask} />
        <ThemeSwitcher />
        <NotificationBell notifications={notifications} onOpenTask={onOpenTask} />
        <button
          className="icon-button"
          aria-label="Muat ulang data"
          title="Muat ulang data"
          onClick={onRefresh}
        >
          <Icon icon={faRotateRight} />
        </button>
        <div className="topbar-profile">
          <button
            className="topbar-avatar"
            title={user.name}
            aria-label="Menu profil"
            aria-expanded={showProfileMenu}
            onClick={onToggleProfileMenu}
          >
            {initials(user.name)}
          </button>
          {showProfileMenu && (
            <div className="profile-menu topbar-profile-menu">
              <div className="profile-email">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <button onClick={onIntegrations}>Integrasi & kalender</button>
              <button onClick={onChangePassword}>Ganti kata sandi</button>
              <button onClick={onLogout}>Keluar dari akun <Icon icon={faRightFromBracket} /></button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
