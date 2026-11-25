"use client";

import { faDiamond, faLink, faTag } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useState } from "react";
import { PRIORITY_LABEL, STATUSES, STATUS_LABEL } from "../constants";
import { formatDate } from "../lib/format";
import type { Task, TaskStatus, WipLimits } from "../types";
import { LabelChips, StatusSelect } from "../ui";
import TaskBadges from "./task-badges";

/** Papan Kanban dengan seret-lepas dan batas WIP per kolom. */
export default function KanbanBoard({
  tasks,
  loading,
  wipLimits,
  readOnly = false,
  onOpenTask,
  onStatusChange,
}: {
  tasks: Task[];
  loading: boolean;
  wipLimits: WipLimits;
  readOnly?: boolean;
  onOpenTask: (task: Task) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  /** Konfirmasi bila kolom tujuan sudah mencapai batas WIP. */
  function move(task: Task, status: TaskStatus) {
    if (task.status === status) return;
    const limit = wipLimits[status];
    const count = tasks.filter((item) => item.status === status).length;
    if (
      limit &&
      count >= limit &&
      !window.confirm(
        `Kolom "${STATUS_LABEL[status]}" sudah mencapai batas WIP (${count}/${limit}). Tetap pindahkan "${task.title}"?`
      )
    ) {
      return;
    }
    onStatusChange(task, status);
  }

  return (
    <div className="kanban-grid">
      {STATUSES.map((status) => {
        const column = tasks.filter((task) => task.status === status);
        const limit = wipLimits[status];
        const over = Boolean(limit && column.length > limit);
        const full = Boolean(limit && column.length === limit);
        return (
          <div
            className={`kanban-column ${dragOver === status ? "drag-over" : ""} ${over ? "wip-over" : ""}`}
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
              if (task) move(task, status);
            }}
          >
            <div className="kanban-title">
              <span>{STATUS_LABEL[status]}</span>
              <strong
                className={over ? "wip-count over" : full ? "wip-count full" : ""}
                title={limit ? `Batas WIP: ${limit}` : undefined}
              >
                {column.length}
                {limit ? `/${limit}` : ""}
              </strong>
            </div>
            {over && <div className="wip-warning">Melebihi batas WIP — selesaikan dulu sebelum menarik pekerjaan baru.</div>}
            {loading && tasks.length === 0 && <div className="empty-projects">Memuat...</div>}
            {column.map((task) => (
              <article
                className={`kanban-card ${task.isMilestone ? "milestone" : ""}`}
                key={task.id}
                draggable={!readOnly}
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
                  <strong>
                    {task.isMilestone && <Icon icon={faDiamond} title="Milestone" />} {task.title}
                  </strong>
                  <span>{task.project?.name ?? "Tanpa proyek"}</span>
                  <span>{task.assignee?.name ?? "Belum ditetapkan"}</span>
                  <small>
                    {PRIORITY_LABEL[task.priority]} · {formatDate(task.dueDate)}
                  </small>
                  <LabelChips labels={task.labels} small />
                  {!!task.links?.length && (
                    <span className="kanban-link-count">
                      <Icon icon={faLink} /> {task.links.length} tautan
                    </span>
                  )}
                  {!!task.tags?.length && (
                    <span className="kanban-link-count kanban-tag-count">
                      <Icon icon={faTag} /> {task.tags.length} tag
                    </span>
                  )}
                  <TaskBadges task={task} />
                </button>
                <StatusSelect
                  status={task.status}
                  title={task.title}
                  stopClick
                  disabled={readOnly}
                  onChange={(next) => move(task, next)}
                />
              </article>
            ))}
          </div>
        );
      })}
    </div>
  );
}
