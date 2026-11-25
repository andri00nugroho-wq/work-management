"use client";

import { useEffect, useState } from "react";
import { errorText, formatDateTime, formatRelative, initials } from "../lib/format";
import { request } from "../lib/http";
import type { Activity } from "../types";
import { TaskSection } from "../ui";

/** Riwayat perubahan tugas; dimuat ulang setiap kali tugas berubah (versi). */
export default function TaskActivitySection({ taskId, version }: { taskId: string; version?: string }) {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    request<{ activities: Activity[] }>(`/api/tasks/${taskId}/activities`, {}, "Riwayat gagal dimuat.")
      .then((result) => {
        if (!cancelled) setActivities(result.activities);
      })
      .catch((err) => {
        if (!cancelled) setError(errorText(err, "Riwayat gagal dimuat."));
      });
    return () => {
      cancelled = true;
    };
  }, [taskId, version]);

  const list = activities ?? [];
  const shown = showAll ? list : list.slice(0, 6);

  return (
    <TaskSection
      title="Riwayat aktivitas"
      subtitle="Semua perubahan pada tugas ini tercatat otomatis."
      aside={activities ? `${list.length} catatan` : "Memuat..."}
    >
      {error && <p className="task-link-error">{error}</p>}
      {activities && list.length === 0 && <p className="task-tag-empty">Belum ada aktivitas.</p>}
      {shown.length > 0 && (
        <ol className="activity-list">
          {shown.map((activity) => (
            <li key={activity.id}>
              <span className="task-tag-avatar">{initials(activity.user.name)}</span>
              <span className="activity-body">
                <span>{activity.message}</span>
                <time dateTime={activity.createdAt} title={formatDateTime(activity.createdAt)}>
                  {formatRelative(activity.createdAt)}
                </time>
              </span>
            </li>
          ))}
        </ol>
      )}
      {list.length > 6 && (
        <button type="button" className="text-button" onClick={() => setShowAll((value) => !value)}>
          {showAll ? "Tampilkan lebih sedikit" : `Tampilkan semua (${list.length})`}
        </button>
      )}
    </TaskSection>
  );
}
