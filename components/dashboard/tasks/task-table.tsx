"use client";

import { faChevronLeft, faChevronRight, faDiamond, faSort, faSortDown, faSortUp } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useMemo, useState } from "react";
import { PRIORITY_LABEL, STATUSES, STATUS_LABEL } from "../constants";
import { formatDate } from "../lib/format";
import type { Member, Task, TaskStatus } from "../types";
import { EmptyRow, LabelChips, PriorityBadge, StatusSelect } from "../ui";
import TaskBadges from "./task-badges";

type SortKey = "title" | "project" | "assignee" | "priority" | "status" | "dueDate";
type Sort = { key: SortKey; dir: 1 | -1 } | null;

export type BulkAction =
  | { kind: "status"; value: TaskStatus }
  | { kind: "priority"; value: Task["priority"] }
  | { kind: "assignee"; value: string }
  | { kind: "delete" };

const PAGE_SIZE = 25;
const PRIORITY_RANK = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
const STATUS_RANK = { TODO: 0, IN_PROGRESS: 1, REVIEW: 2, DONE: 3 } as const;

function sortValue(task: Task, key: SortKey): string | number {
  switch (key) {
    case "title":
      return task.title.toLowerCase();
    case "project":
      return (task.project?.name ?? task.division?.name ?? "").toLowerCase();
    case "assignee":
      return (task.assignee?.name ?? "").toLowerCase();
    case "priority":
      return PRIORITY_RANK[task.priority];
    case "status":
      return STATUS_RANK[task.status];
    case "dueDate":
      return task.dueDate ?? "9999"; // tanpa tenggat di akhir
  }
}

const COLUMNS: Array<{ key: SortKey; label: string }> = [
  { key: "title", label: "NAMA TUGAS" },
  { key: "project", label: "PROYEK / DIVISI" },
  { key: "assignee", label: "PENANGGUNG JAWAB" },
  { key: "priority", label: "PRIORITAS" },
  { key: "status", label: "STATUS" },
  { key: "dueDate", label: "TENGGAT" },
];

/** Tabel tugas: urut per kolom, halaman 25 baris, dan aksi massal (manajemen). */
export default function TaskTable({
  tasks,
  loading,
  userId,
  members,
  canBulk,
  readOnly = false,
  onOpenTask,
  onStatusChange,
  onBulk,
}: {
  tasks: Task[];
  loading: boolean;
  userId: string;
  members: Member[];
  canBulk: boolean;
  readOnly?: boolean;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onBulk: (tasks: Task[], action: BulkAction) => Promise<void>;
}) {
  const [sort, setSort] = useState<Sort>(null);
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const sorted = useMemo(() => {
    if (!sort) return tasks;
    return [...tasks].sort((a, b) => {
      const x = sortValue(a, sort.key);
      const y = sortValue(b, sort.key);
      return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
    });
  }, [tasks, sort]);

  const pages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = sorted.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  // Pilihan hanya berlaku untuk tugas yang masih terlihat (filter bisa berubah).
  const selectedTasks = tasks.filter((task) => selected.has(task.id));
  const allOnPage = rows.length > 0 && rows.every((task) => selected.has(task.id));
  const colSpan = COLUMNS.length + (canBulk ? 1 : 0);

  function toggleSort(key: SortKey) {
    setSort((value) => (value?.key !== key ? { key, dir: 1 } : value.dir === 1 ? { key, dir: -1 } : null));
    setPage(0);
  }

  function toggle(taskId: string) {
    setSelected((value) => {
      const next = new Set(value);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  }

  function togglePage() {
    setSelected((value) => {
      const next = new Set(value);
      rows.forEach((task) => (allOnPage ? next.delete(task.id) : next.add(task.id)));
      return next;
    });
  }

  async function runBulk(action: BulkAction) {
    if (!selectedTasks.length) return;
    if (
      action.kind === "delete" &&
      !window.confirm(`Hapus ${selectedTasks.length} tugas terpilih? Tindakan ini tidak bisa dibatalkan.`)
    ) {
      return;
    }
    setBusy(true);
    try {
      await onBulk(selectedTasks, action);
      setSelected(new Set());
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {canBulk && selectedTasks.length > 0 && (
        <div className="bulk-bar" role="region" aria-label="Aksi massal">
          <strong>{selectedTasks.length} dipilih</strong>
          <select
            disabled={busy}
            value=""
            onChange={(event) => void runBulk({ kind: "status", value: event.target.value as TaskStatus })}
            aria-label="Ubah status terpilih"
          >
            <option value="">Ubah status...</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <select
            disabled={busy}
            value=""
            onChange={(event) => void runBulk({ kind: "priority", value: event.target.value as Task["priority"] })}
            aria-label="Ubah prioritas terpilih"
          >
            <option value="">Ubah prioritas...</option>
            {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            disabled={busy}
            value=""
            onChange={(event) => void runBulk({ kind: "assignee", value: event.target.value })}
            aria-label="Alihkan tugas terpilih"
          >
            <option value="">Alihkan ke...</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="secondary-button danger"
            disabled={busy}
            onClick={() => void runBulk({ kind: "delete" })}
          >
            Hapus
          </button>
          <button type="button" className="text-button" onClick={() => setSelected(new Set())}>
            Batal pilih
          </button>
          {busy && <span className="bulk-busy">Memproses...</span>}
        </div>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {canBulk && (
                <th className="select-col">
                  <input
                    type="checkbox"
                    checked={allOnPage}
                    onChange={togglePage}
                    aria-label="Pilih semua di halaman ini"
                  />
                </th>
              )}
              {COLUMNS.map((column) => (
                <th key={column.key} aria-sort={sort?.key === column.key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                  <button type="button" className="sort-button" onClick={() => toggleSort(column.key)}>
                    {column.label}
                    <Icon
                      icon={sort?.key !== column.key ? faSort : sort.dir === 1 ? faSortUp : faSortDown}
                      className={sort?.key === column.key ? "sort-active" : "sort-idle"}
                    />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <EmptyRow colSpan={colSpan}>Memuat data dari PostgreSQL...</EmptyRow>
            ) : rows.length === 0 ? (
              <EmptyRow colSpan={colSpan}>Tidak ada tugas yang cocok dengan filter.</EmptyRow>
            ) : (
              rows.map((task) => (
                <tr key={task.id} className={selected.has(task.id) ? "selected" : ""}>
                  {canBulk && (
                    <td className="select-col">
                      <input
                        type="checkbox"
                        checked={selected.has(task.id)}
                        onChange={() => toggle(task.id)}
                        aria-label={`Pilih ${task.title}`}
                      />
                    </td>
                  )}
                  <td>
                    <div className="task-name">
                      <span className={`task-indicator ${task.status === "DONE" ? "indicator-done" : ""}`} />
                      <button type="button" className="task-title" onClick={() => onOpenTask(task)}>
                        {task.isMilestone && <Icon icon={faDiamond} title="Milestone" />} {task.title}
                      </button>
                      {task.tags?.some((tag) => tag.user.id === userId) && (
                        <span className="task-tag-badge">Ditandai</span>
                      )}
                    </div>
                    <LabelChips labels={task.labels} small />
                    <TaskBadges task={task} />
                  </td>
                  <td>
                    <span className="project-tag">{task.project?.name ?? task.division?.name ?? "Umum"}</span>
                  </td>
                  <td>{task.assignee?.name ?? "Belum ditetapkan"}</td>
                  <td>
                    <PriorityBadge priority={task.priority} />
                  </td>
                  <td>
                    <StatusSelect
                      status={task.status}
                      title={task.title}
                      disabled={readOnly}
                      onChange={(next) => onStatusChange(task, next)}
                    />
                  </td>
                  <td className="due-date">{formatDate(task.dueDate)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav className="pagination" aria-label="Halaman tugas">
          <button
            type="button"
            className="icon-action"
            aria-label="Halaman sebelumnya"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            <Icon icon={faChevronLeft} />
          </button>
          <span>
            Halaman {current + 1} dari {pages}
          </span>
          <button
            type="button"
            className="icon-action"
            aria-label="Halaman berikutnya"
            disabled={current >= pages - 1}
            onClick={() => setPage(current + 1)}
          >
            <Icon icon={faChevronRight} />
          </button>
        </nav>
      )}
    </>
  );
}
