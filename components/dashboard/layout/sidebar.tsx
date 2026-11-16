"use client";

import ReiLogo from "@/components/rei-logo";
import { MENU, ROLE_LABEL } from "../constants";
import { initials } from "../lib/format";
import type { DashboardUser, MenuName } from "../types";

export default function Sidebar({
  user,
  activeMenu,
  myTasksCount,
  chatUnread,
  showProfileMenu,
  onToggleProfileMenu,
  onSelectMenu,
  onHelp,
  onLogout,
}: {
  user: DashboardUser;
  activeMenu: MenuName;
  myTasksCount: number;
  chatUnread: number;
  showProfileMenu: boolean;
  onToggleProfileMenu: () => void;
  onSelectMenu: (menu: MenuName) => void;
  onHelp: () => void;
  onLogout: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div
          style={{
            padding: "20px 16px",
            borderBottom: "1px solid rgba(212, 175, 55, 0.25)",
            marginBottom: "12px",
          }}
        >
          <ReiLogo compact />
        </div>
        <div>
          <div className="brand-name">RAJA EMAS</div>
          <div className="brand-subtitle">WORK MANAGEMENT</div>
        </div>
      </div>

      <div className="workspace-label">WORKSPACE</div>
      <div className="workspace">
        <div className="workspace-info">
          <strong>REI Indonesia</strong>
          <span>Workspace utama</span>
        </div>
      </div>

      <div className="menu-label">MENU UTAMA</div>
      <nav className="navigation">
        {MENU.map((item) => (
          <button
            key={item.name}
            className={`nav-item ${activeMenu === item.name ? "active" : ""}`}
            onClick={() => onSelectMenu(item.name)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.name}</span>
            {item.name === "Tugas Saya" && <span className="nav-count">{myTasksCount}</span>}
            {item.name === "Chat" && chatUnread > 0 && (
              <span className="nav-count nav-count-alert">
                {chatUnread > 99 ? "99+" : chatUnread}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="help-card">
          <div className="help-icon">✦</div>
          <strong>REI Work Management</strong>
          <p>Kelola pekerjaan, tim, dan progres dalam satu tempat.</p>
          <button onClick={onHelp}>Pusat Bantuan →</button>
        </div>

        <div className="profile">
          <div className="profile-avatar">{initials(user.name)}</div>
          <div className="profile-info">
            <strong>{user.name}</strong>
            <span>{ROLE_LABEL[user.role]}</span>
          </div>
          <button className="profile-more" aria-label="Menu profil" onClick={onToggleProfileMenu}>
            •••
          </button>
        </div>

        {showProfileMenu && (
          <div className="profile-menu">
            <div className="profile-email">{user.email}</div>
            <button onClick={onLogout}>Keluar dari akun ↗</button>
          </div>
        )}
      </div>
    </aside>
  );
}
