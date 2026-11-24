"use client";

import { faChevronLeft, faChevronRight, faDiamond } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  dayNumber,
  diffDays,
  monthGrid,
  monthLabel,
  shortLabel,
  taskDay,
  today,
  weekDays,
  weekdayShort,
  type Day,
} from "../lib/dates";
import { isOverdue } from "../lib/tasks";
import type { Task } from "../types";

const PRIORITY_RANK = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
const MAX_PER_CELL = 4;

/** Kalender tenggat (bulan/minggu). Seret kartu ke tanggal lain untuk menggeser jadwal. */
export default function CalendarView({
  tasks,
  canReschedule,
  onOpenTask,
  onReschedule,
}: {
  tasks: Task[];
  canReschedule: boolean;
  onOpenTask: (task: Task) => void;
  onReschedule: (task: Task, dates: { startDate: string | null; dueDate: string }) => void;
}) {
  const [mode, setMode] = useState<"month" | "week">("month");
  const [cursor, setCursor] = useState<Day>(today());
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropDay, setDropDay] = useState<Day | null>(null);
  const [expanded, setExpanded] = useState<Day | null>(null);
  const now = today();

  const days = mode === "month" ? monthGrid(cursor) : weekDays(cursor);
  const currentMonth = cursor.slice(0, 7);

  const byDay = useMemo(() => {
    const map = new Map<Day, Task[]>();
    for (const task of tasks) {
      const due = taskDay(task.dueDate);
      if (!due) continue;
      map.set(due, [...(map.get(due) ?? []), task]);
    }
    for (const list of map.values()) {
      list.sort(
        (a, b) =>
          Number(b.isMilestone ?? false) - Number(a.isMilestone ?? false) ||
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      );
    }
    return map;
  }, [tasks]);

  const undated = tasks.filter((task) => !task.dueDate).length;

  function shift(direction: -1 | 1) {
    setCursor((day) => (mode === "month" ? addMonths(day, direction) : addDays(day, direction * 7)));
  }

  function drop(day: Day) {
    const task = tasks.find((item) => item.id === dragId);
    setDragId(null);
    setDropDay(null);
    const due = taskDay(task?.dueDate);
    if (!task || !due || due === day) return;
    const delta = diffDays(due, day);
    const start = taskDay(task.startDate);
    onReschedule(task, { dueDate: day, startDate: start ? addDays(start, delta) : null });
  }

  return (
    <div className="calendar">
      <div className="calendar-toolbar">
        <div className="calendar-nav">
          <button type="button" className="icon-action" aria-label="Sebelumnya" onClick={() => shift(-1)}>
            <Icon icon={faChevronLeft} />
          </button>
          <button type="button" className="secondary-button" onClick={() => setCursor(today())}>
            Hari ini
          </button>
          <button type="button" className="icon-action" aria-label="Berikutnya" onClick={() => shift(1)}>
            <Icon icon={faChevronRight} />
          </button>
          <strong>
            {mode === "month" ? monthLabel(cursor) : `${shortLabel(days[0])} – ${shortLabel(days[6])}`}
          </strong>
        </div>
        <div className="segmented" role="group" aria-label="Mode kalender">
          <button type="button" className={mode === "month" ? "active" : ""} onClick={() => setMode("month")}>
            Bulan
          </button>
          <button type="button" className={mode === "week" ? "active" : ""} onClick={() => setMode("week")}>
            Minggu
          </button>
        </div>
      </div>

      <div className={`calendar-grid calendar-${mode}`}>
        {days.slice(0, 7).map((day) => (
          <div key={`h-${day}`} className="calendar-weekday">
            {weekdayShort(day)}
          </div>
        ))}
        {days.map((day) => {
          const list = byDay.get(day) ?? [];
          const limit = mode === "week" || expanded === day ? list.length : MAX_PER_CELL;
          return (
            <div
              key={day}
              className={[
                "calendar-cell",
                day.slice(0, 7) !== currentMonth && mode === "month" ? "muted" : "",
                day === now ? "today" : "",
                dropDay === day ? "drop" : "",
              ].join(" ")}
              onDragOver={(event) => {
                if (!dragId) return;
                event.preventDefault();
                setDropDay(day);
              }}
              onDragLeave={() => setDropDay((current) => (current === day ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                drop(day);
              }}
            >
              <span className="calendar-date">{mode === "week" ? shortLabel(day) : dayNumber(day)}</span>
              {list.slice(0, limit).map((task) => (
                <button
                  key={task.id}
                  type="button"
                  draggable={canReschedule}
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => {
                    setDragId(null);
                    setDropDay(null);
                  }}
                  className={[
                    "calendar-task",
                    `status-${task.status.toLowerCase()}`,
                    isOverdue(task) ? "overdue" : "",
                    task.isMilestone ? "milestone" : "",
                  ].join(" ")}
                  title={`${task.title} · ${task.assignee?.name ?? "Belum ditetapkan"}`}
                  onClick={() => onOpenTask(task)}
                >
                  {task.isMilestone && <Icon icon={faDiamond} />}
                  <span>{task.title}</span>
                </button>
              ))}
              {list.length > limit && (
                <button type="button" className="calendar-more" onClick={() => setExpanded(day)}>
                  +{list.length - limit} lagi
                </button>
              )}
              {expanded === day && list.length > MAX_PER_CELL && mode === "month" && (
                <button type="button" className="calendar-more" onClick={() => setExpanded(null)}>
                  ringkas
                </button>
              )}
            </div>
          );
        })}
      </div>
      <p className="calendar-footnote">
        {undated > 0 ? `${undated} tugas tanpa tenggat tidak ditampilkan. ` : ""}
        {canReschedule ? "Seret tugas ke tanggal lain untuk menggeser jadwal." : ""}
      </p>
    </div>
  );
}
