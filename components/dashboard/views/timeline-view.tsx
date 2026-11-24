"use client";

import {
  faChevronLeft,
  faChevronRight,
  faDiamond,
  faLock,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useMemo, useState, type CSSProperties } from "react";
import { STATUS_LABEL } from "../constants";
import {
  addDays,
  dayNumber,
  diffDays,
  isWeekend,
  monthLabel,
  shortLabel,
  startOfWeek,
  taskDay,
  today,
  type Day,
} from "../lib/dates";
import { isOverdue } from "../lib/tasks";
import type { Task } from "../types";

type GroupBy = "project" | "assignee";
type Zoom = "day" | "week";

const ZOOM: Record<Zoom, { px: number; span: number; step: number }> = {
  day: { px: 30, span: 42, step: 14 },
  week: { px: 11, span: 126, step: 28 },
};

type Row = { task: Task; start: Day; end: Day; conflict: boolean; blocked: boolean };

/** Rentang jadwal tugas: start..due; bila salah satu kosong, pakai yang ada. */
function spanOf(task: Task): { start: Day; end: Day } | null {
  const start = taskDay(task.startDate);
  const due = taskDay(task.dueDate);
  if (!start && !due) return null;
  return { start: start ?? due!, end: due ?? start! };
}

export default function TimelineView({
  tasks,
  onOpenTask,
}: {
  tasks: Task[];
  onOpenTask: (task: Task) => void;
}) {
  const [groupBy, setGroupBy] = useState<GroupBy>("project");
  const [zoom, setZoom] = useState<Zoom>("day");
  const [from, setFrom] = useState<Day>(() => addDays(startOfWeek(today()), -7));
  const { px, span, step } = ZOOM[zoom];
  const days = useMemo(() => Array.from({ length: span }, (_, index) => addDays(from, index)), [from, span]);
  const to = days[days.length - 1];
  const now = today();

  const groups = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const task of tasks) {
      const range = spanOf(task);
      if (!range) continue;
      const key =
        groupBy === "project"
          ? task.project?.name ?? "Tanpa proyek"
          : task.assignee?.name ?? "Belum ditetapkan";
      const blocked = Boolean(task.dependsOn?.some(({ dependsOn }) => dependsOn.status !== "DONE"));
      map.set(key, [...(map.get(key) ?? []), { task, ...range, conflict: false, blocked }]);
    }
    for (const rows of map.values()) {
      rows.sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
      // Bentrok: penanggung jawab yang sama punya tugas aktif dengan rentang beririsan.
      if (groupBy === "assignee") {
        const active = rows.filter((row) => row.task.status !== "DONE");
        for (const a of active)
          for (const b of active)
            if (a !== b && a.start <= b.end && b.start <= a.end) a.conflict = true;
      }
    }
    return Array.from(map, ([name, rows]) => ({ name, rows })).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks, groupBy]);

  const undated = tasks.filter((task) => !spanOf(task)).length;
  const visibleCount = groups.reduce(
    (sum, group) => sum + group.rows.filter((row) => row.end >= from && row.start <= to).length,
    0
  );
  const width = span * px;
  const todayOffset = diffDays(from, now);

  return (
    <div className="timeline">
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button type="button" className="icon-action" aria-label="Mundur" onClick={() => setFrom(addDays(from, -step))}>
            <Icon icon={faChevronLeft} />
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => setFrom(addDays(startOfWeek(today()), -7))}
          >
            Hari ini
          </button>
          <button type="button" className="icon-action" aria-label="Maju" onClick={() => setFrom(addDays(from, step))}>
            <Icon icon={faChevronRight} />
          </button>
          <strong>
            {shortLabel(from)} – {shortLabel(to)}
          </strong>
        </div>
        <div className="timeline-controls">
          <div className="segmented" role="group" aria-label="Kelompokkan">
            <button type="button" className={groupBy === "project" ? "active" : ""} onClick={() => setGroupBy("project")}>
              Per proyek
            </button>
            <button type="button" className={groupBy === "assignee" ? "active" : ""} onClick={() => setGroupBy("assignee")}>
              Per orang
            </button>
          </div>
          <div className="segmented" role="group" aria-label="Skala">
            <button type="button" className={zoom === "day" ? "active" : ""} onClick={() => setZoom("day")}>
              Hari
            </button>
            <button type="button" className={zoom === "week" ? "active" : ""} onClick={() => setZoom("week")}>
              Minggu
            </button>
          </div>
        </div>
      </div>

      <div className="timeline-scroll">
        <div className="timeline-inner" style={{ "--tl-width": `${width}px`, "--tl-day": `${px}px` } as CSSProperties}>
          <div className="timeline-header">
            <div className="timeline-label-col">Tugas</div>
            <div className="timeline-days">
              {days.map((day) => {
                const showLabel = zoom === "day" || day === startOfWeek(day);
                return (
                  <div key={day} className={`timeline-day ${isWeekend(day) ? "weekend" : ""} ${day === now ? "today" : ""}`}>
                    {showLabel && (
                      <>
                        {(dayNumber(day) <= (zoom === "day" ? 1 : 7) || day === from) && (
                          <small>{monthLabel(day)}</small>
                        )}
                        <span>{zoom === "day" ? dayNumber(day) : shortLabel(day)}</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {groups.map((group) => {
            const conflicts = group.rows.filter((row) => row.conflict).length;
            return (
              <div key={group.name} className="timeline-group">
                <div className="timeline-group-title">
                  <strong>{group.name}</strong>
                  <small>{group.rows.length} tugas</small>
                  {conflicts > 0 && (
                    <span className="timeline-conflict-pill" title="Jadwal tugas aktif saling bertumpuk">
                      <Icon icon={faTriangleExclamation} /> {conflicts} bentrok
                    </span>
                  )}
                </div>
                {group.rows.map((row) => {
                  const left = diffDays(from, row.start) * px;
                  const barWidth = Math.max(1, diffDays(row.start, row.end) + 1) * px;
                  const outside = row.end < from || row.start > to;
                  return (
                    <div key={row.task.id} className="timeline-row">
                      <button type="button" className="timeline-label-col timeline-task-name" onClick={() => onOpenTask(row.task)}>
                        {row.blocked && <Icon icon={faLock} title="Menunggu tugas prasyarat" />}
                        <span>{row.task.title}</span>
                      </button>
                      <div className="timeline-track">
                        {todayOffset >= 0 && todayOffset < span && (
                          <span className="timeline-today" style={{ left: todayOffset * px + px / 2 }} />
                        )}
                        {!outside &&
                          (row.task.isMilestone ? (
                            <button
                              type="button"
                              className={`timeline-milestone status-${row.task.status.toLowerCase()}`}
                              style={{ left: diffDays(from, row.end) * px + px / 2 }}
                              title={`Milestone: ${row.task.title} (${shortLabel(row.end)})`}
                              onClick={() => onOpenTask(row.task)}
                            >
                              <Icon icon={faDiamond} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className={[
                                "timeline-bar",
                                `status-${row.task.status.toLowerCase()}`,
                                isOverdue(row.task) ? "overdue" : "",
                                row.conflict ? "conflict" : "",
                              ].join(" ")}
                              style={{ left, width: barWidth }}
                              title={`${row.task.title}\n${shortLabel(row.start)} – ${shortLabel(row.end)} · ${STATUS_LABEL[row.task.status]}${row.conflict ? "\nBertumpuk dengan tugas lain orang yang sama" : ""}`}
                              onClick={() => onOpenTask(row.task)}
                            >
                              {barWidth > 60 && <span>{row.task.assignee?.name ?? ""}</span>}
                            </button>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
          {groups.length === 0 && <p className="timeline-empty">Belum ada tugas berjadwal.</p>}
        </div>
      </div>
      <p className="calendar-footnote">
        {visibleCount} tugas dalam rentang ini.
        {undated > 0 ? ` ${undated} tugas tanpa tanggal mulai/tenggat tidak ditampilkan.` : ""} Klik batang untuk
        membuka detail dan mengubah jadwal.
      </p>
    </div>
  );
}
