"use client";

import { useState } from "react";
import { PRIORITY_LABEL, STATUSES, STATUS_LABEL } from "../constants";
import { formatDate } from "../lib/format";
import type { MenuName, Task, TaskStatus } from "../types";
import { EmptyRow, PriorityBadge, StatusSelect, TableFooter } from "../ui";

type TaskHandlers = {
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
};

export default function TasksPanel({
  menu,
  tasks,
  loading,
  userId,
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onRefresh,
  onOpenTask,
  onStatusChange,
}: TaskHandlers & {
  menu: MenuName;
  tasks: Task[];
  loading: boolean;
  userId: string;
  search: string;
  statusFilter: string;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
}) {
  const handlers = { onOpenTask, onStatusChange };

  return (
    <section className="panel tasks-panel">
      <div className="panel-heading tasks-heading">
        <div>
          <h2>{menu === "Dashboard" ? "Daftar tugas" : menu}</h2>
          <p>Status dan informasi tugas dari database</p>
        </div>

        <div className="task-tools">
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Cari tugas..."
              aria-label="Cari tugas"
            />
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(event) => onStatusFilterChange(event.target.value)}
            aria-label="Filter status"
          >
            <option value="ALL">Semua status</option>
            <option value="TODO">Belum mulai</option>
            <option value="IN_PROGRESS">Berjalan</option>
            <option value="REVIEW">Review</option>
            <option value="DONE">Selesai</option>
          </select>
        </div>
      </div>

      {menu === "Board Kanban" ? (
        <KanbanBoard tasks={tasks} loading={loading} {...handlers} />
      ) : (
        <TaskTable tasks={tasks} loading={loading} userId={userId} {...handlers} />
      )}

      <TableFooter
        label={`Menampilkan ${tasks.length} tugas${loading ? " · Memuat..." : ""}`}
        onRefresh={onRefresh}
      />
    </section>
  );
}

function KanbanBoard({
  tasks,
  loading,
  onOpenTask,
  onStatusChange,
}: TaskHandlers & { tasks: Task[]; loading: boolean }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  return (
    <div className="kanban-grid">
      {STATUSES.map((status) => {
        const column = tasks.filter((task) => task.status === status);
        return (
          <div
            className={`kanban-column ${dragOver === status ? "drag-over" : ""}`}
            key={status}
            onDragOver={(event) => {
              event.preventDefault();
              setDragOver(status);
            }}
            onDragLeave={() => setDragOver(null)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(null);
              const task = tasks.find((item) => item.id === dragId);
              setDragId(null);
              if (task) onStatusChange(task, status);
            }}
          >
            <div className="kanban-title">
              <span>{STATUS_LABEL[status]}</span>
              <strong>{column.length}</strong>
            </div>
            {loading && tasks.length === 0 && <div className="empty-projects">Memuat...</div>}
            {column.map((task) => (
              <article
                className="kanban-card"
                key={task.id}
                draggable
                onDragStart={() => setDragId(task.id)}
                onDragEnd={() => {
                  setDragId(null);
                  setDragOver(null);
                }}
              >
                <button
                  className="kanban-card-details"
                  type="button"
                  onClick={() => onOpenTask(task)}
                  aria-label={`Lihat detail tugas ${task.title}`}
                >
                  <strong>{task.title}</strong>
                  <span>{task.project?.name ?? "Tanpa proyek"}</span>
                  <span>{task.assignee?.name ?? "Belum ditetapkan"}</span>
                  <small>
                    {PRIORITY_LABEL[task.priority]} · {formatDate(task.dueDate)}
                  </small>
                  {!!task.links?.length && (
                    <span className="kanban-link-count">↗ {task.links.length} tautan</span>
                  )}
                  {!!task.tags?.length && (
                    <span className="kanban-link-count kanban-tag-count">
                      ✎ {task.tags.length} tag
                    </span>
                  )}
                </button>
                <StatusSelect
                  status={task.status}
                  title={task.title}
                  stopClick
                  onChange={(next) => onStatusChange(task, next)}
                />
              </article>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function TaskTable({
  tasks,
  loading,
  userId,
  onOpenTask,
  onStatusChange,
}: TaskHandlers & { tasks: Task[]; loading: boolean; userId: string }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>NAMA TUGAS</th>
            <th>PROYEK / DIVISI</th>
            <th>PENANGGUNG JAWAB</th>
            <th>PRIORITAS</th>
            <th>STATUS</th>
            <th>TENGGAT</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <EmptyRow colSpan={6}>Memuat data dari PostgreSQL...</EmptyRow>
          ) : tasks.length === 0 ? (
            <EmptyRow colSpan={6}>Tidak ada tugas yang cocok dengan filter.</EmptyRow>
          ) : (
            tasks.map((task) => (
              <tr key={task.id}>
                <td>
                  <div className="task-name">
                    <span
                      className={`task-indicator ${task.status === "DONE" ? "indicator-done" : ""}`}
                    />
                    <button type="button" className="task-title" onClick={() => onOpenTask(task)}>
                      {task.title}
                    </button>
                    {task.tags?.some((tag) => tag.user.id === userId) && (
                      <span className="task-tag-badge">Ditandai</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="project-tag">
                    {task.project?.name ?? task.division?.name ?? "Umum"}
                  </span>
                </td>
                <td>{task.assignee?.name ?? "Belum ditetapkan"}</td>
                <td>
                  <PriorityBadge priority={task.priority} />
                </td>
                <td>
                  <StatusSelect
                    status={task.status}
                    title={task.title}
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
  );
}
