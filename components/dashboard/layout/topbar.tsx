"use client";

import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
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
}: {
  user: DashboardUser;
  activeMenu: MenuName;
  notifications: Notifications;
  onRefresh: () => void;
  onOpenTask: (taskId: string) => void;
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
        <button className="topbar-avatar" title={user.name} onClick={onToggleProfileMenu}>
          {initials(user.name)}
        </button>
      </div>
    </header>
  );
}
