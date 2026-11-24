"use client";

import {
  faAt,
  faBell,
  faCircleCheck,
  faClock,
  faComment,
  faInbox,
  faLockOpen,
  faRepeat,
  faRobot,
  faTag,
  faTriangleExclamation,
  faUserCheck,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import Icon from "@/components/icon";
import { useEffect, useRef, useState } from "react";
import type { Notifications } from "../hooks/use-notifications";
import { formatDateTime, formatRelative } from "../lib/format";
import type { NotificationItem } from "../types";

const TYPE_ICON: Record<string, IconDefinition> = {
  ASSIGNED: faUserCheck,
  MENTIONED: faAt,
  COMMENTED: faComment,
  STATUS_CHANGED: faCircleCheck,
  TAGGED: faTag,
  DUE_SOON: faClock,
  OVERDUE: faTriangleExclamation,
  DEPENDENCY_READY: faLockOpen,
  RECURRING: faRepeat,
  AUTOMATION: faRobot,
  REQUEST: faInbox,
};

type Filter = "all" | "unread" | "MENTIONED";

/** Lonceng + panel kotak masuk pemberitahuan. */
export default function NotificationBell({
  notifications,
  onOpenTask,
}: {
  notifications: Notifications;
  onOpenTask: (taskId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const rootRef = useRef<HTMLDivElement>(null);
  const { items, unread, markRead, markAll } = notifications;

  // Tutup saat klik di luar panel atau tekan Escape.
  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const shown = items.filter((item) =>
    filter === "all" ? true : filter === "unread" ? !item.readAt : item.type === filter
  );

  function openItem(item: NotificationItem) {
    void markRead(item);
    if (item.taskId) {
      setOpen(false);
      onOpenTask(item.taskId);
    }
  }

  return (
    <div className="notif-root" ref={rootRef}>
      <button
        type="button"
        className="icon-button notif-button"
        aria-label={unread ? `Pemberitahuan, ${unread} belum dibaca` : "Pemberitahuan"}
        aria-expanded={open}
        title="Pemberitahuan"
        onClick={() => setOpen((value) => !value)}
      >
        <Icon icon={faBell} />
        {unread > 0 && <span className="notif-count">{unread > 99 ? "99+" : unread}</span>}
      </button>

      {open && (
        <section className="notif-panel" role="dialog" aria-label="Kotak masuk pemberitahuan">
          <header className="notif-head">
            <strong>Pemberitahuan</strong>
            <button type="button" className="text-button" disabled={!unread} onClick={() => void markAll()}>
              Tandai semua dibaca
            </button>
          </header>
          <div className="segmented notif-filter" role="group" aria-label="Saring pemberitahuan">
            {(
              [
                ["all", "Semua"],
                ["unread", `Belum dibaca${unread ? ` (${unread})` : ""}`],
                ["MENTIONED", "Mention"],
              ] as Array<[Filter, string]>
            ).map(([value, label]) => (
              <button key={value} type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>
                {label}
              </button>
            ))}
          </div>
          {shown.length === 0 ? (
            <p className="notif-empty">Tidak ada pemberitahuan.</p>
          ) : (
            <ul className="notif-list">
              {shown.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`notif-item ${item.readAt ? "" : "unread"} notif-${item.type.toLowerCase()}`}
                    onClick={() => openItem(item)}
                  >
                    <span className="notif-icon">
                      <Icon icon={TYPE_ICON[item.type] ?? faBell} />
                    </span>
                    <span className="notif-text">
                      <strong>{item.title}</strong>
                      {item.body && <span>{item.body}</span>}
                      <time dateTime={item.createdAt} title={formatDateTime(item.createdAt)}>
                        {formatRelative(item.createdAt)}
                      </time>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
