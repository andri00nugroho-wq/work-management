"use client";

import { faPlay, faStop, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useState } from "react";
import { useAsyncAction } from "../hooks/use-async-action";
import { formatClock, useRunningTimer } from "../hooks/use-running-timer";
import { errorText, formatDate, formatDateTime, percent, toDateInput } from "../lib/format";
import { request } from "../lib/http";
import { formatMinutes } from "../lib/tasks";
import type { Task, TimeEntry } from "../types";
import { ProgressBar, SectionMessages, TaskSection } from "../ui";

type TimeData = { entries: TimeEntry[]; totalMinutes: number };

/** Estimasi vs realisasi, timer, dan catatan waktu manual. */
export default function TaskTimeSection({
  task,
  userId,
  canModerate,
  onChanged,
}: {
  task: Task;
  userId: string;
  canModerate: boolean;
  onChanged: () => void;
}) {
  const [data, setData] = useState<TimeData | null>(null);
  const [loadError, setLoadError] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [date, setDate] = useState(() => toDateInput(new Date().toISOString()));
  const [note, setNote] = useState("");
  const { timer, elapsed } = useRunningTimer();
  const action = useAsyncAction();
  const runningHere = timer?.task.id === task.id;

  useEffect(() => {
    let cancelled = false;
    request<TimeData>(`/api/tasks/${task.id}/time`, {}, "Catatan waktu gagal dimuat.")
      .then((result) => !cancelled && setData(result))
      .catch((err) => !cancelled && setLoadError(errorText(err, "Catatan waktu gagal dimuat.")));
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  const call = (init: RequestInit, url = `/api/tasks/${task.id}/time`, success = "") =>
    action.run(async () => {
      setData(await request<TimeData>(url, init, "Catatan waktu gagal disimpan."));
      window.dispatchEvent(new Event("rei:timer"));
      onChanged();
      return success;
    }, "Catatan waktu gagal disimpan.");

  function addManual(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const total = Number(hours || 0) * 60 + Number(minutes || 0);
    if (!Number.isInteger(total) || total < 1 || total > 1440) {
      action.setError("Isi durasi antara 1 menit dan 24 jam.");
      return;
    }
    void call(
      { method: "POST", body: JSON.stringify({ minutes: total, date, note }) },
      undefined,
      `${formatMinutes(total)} dicatat.`
    ).then((ok) => {
      if (ok) {
        setHours("");
        setMinutes("");
        setNote("");
      }
    });
  }

  const logged = (data?.totalMinutes ?? 0) + (runningHere ? Math.floor(elapsed / 60) : 0);
  const estimate = task.estimateMinutes ?? 0;

  return (
    <TaskSection
      title="Waktu kerja"
      subtitle={estimate ? `Estimasi ${formatMinutes(estimate)}` : "Belum ada estimasi (atur di Edit tugas)."}
      aside={`${formatMinutes(logged)} tercatat`}
    >
      {estimate > 0 && (
        <div className={`time-progress ${logged > estimate ? "over" : ""}`}>
          <ProgressBar value={Math.min(100, percent(logged, estimate))} />
          <small>
            {percent(logged, estimate)}% dari estimasi
            {logged > estimate ? ` · lewat ${formatMinutes(logged - estimate)}` : ""}
          </small>
        </div>
      )}

      <div className="time-actions">
        {runningHere ? (
          <button
            type="button"
            className="primary-button timer-running"
            disabled={action.busy}
            onClick={() =>
              void call(
                { method: "POST", body: JSON.stringify({ action: "stop" }) },
                undefined,
                elapsed < 60 ? "Timer dihentikan (di bawah 1 menit, tidak dicatat)." : "Timer dihentikan dan dicatat."
              )
            }
          >
            <Icon icon={faStop} /> Hentikan · {formatClock(elapsed)}
          </button>
        ) : (
          <button
            type="button"
            className="secondary-button"
            disabled={action.busy}
            onClick={() =>
              void call(
                { method: "POST", body: JSON.stringify({ action: "start" }) },
                undefined,
                timer ? `Timer "${timer.task.title}" dihentikan, timer di tugas ini dimulai.` : "Timer dimulai."
              )
            }
          >
            <Icon icon={faPlay} /> Mulai timer
          </button>
        )}
      </div>

      <form className="time-form" onSubmit={addManual}>
        <input type="number" min={0} max={24} value={hours} onChange={(e) => setHours(e.target.value)} placeholder="jam" aria-label="Jam" />
        <input type="number" min={0} max={59} value={minutes} onChange={(e) => setMinutes(e.target.value)} placeholder="menit" aria-label="Menit" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Tanggal kerja" />
        <input value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)" aria-label="Catatan waktu" />
        <button className="secondary-button" disabled={action.busy}>
          + Catat
        </button>
      </form>

      {loadError && <p className="task-link-error">{loadError}</p>}
      {data && data.entries.length > 0 && (
        <ul className="time-list">
          {data.entries.slice(0, 8).map((entry) => (
            <li key={entry.id}>
              <span>
                <strong>{entry.endedAt ? formatMinutes(entry.minutes ?? 0) : "Berjalan…"}</strong> · {entry.user.name}
                {entry.note ? ` · ${entry.note}` : ""}
              </span>
              {/* Entri manual hanya bertanggal (disimpan tengah malam UTC); timer punya jam. */}
              <time dateTime={entry.startedAt}>
                {entry.endedAt === entry.startedAt ? formatDate(entry.startedAt) : formatDateTime(entry.startedAt)}
              </time>
              {(entry.user.id === userId || canModerate) && entry.endedAt && (
                <button
                  type="button"
                  className="icon-action danger"
                  aria-label="Hapus catatan waktu"
                  onClick={() => void call({ method: "DELETE" }, `/api/tasks/${task.id}/time/${entry.id}`)}
                >
                  <Icon icon={faTrashCan} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <SectionMessages error={action.error} notice={action.notice} />
    </TaskSection>
  );
}
