"use client";

import { PRIORITY_LABEL, RECURRENCE_LABEL, STATUS_LABEL } from "../constants";
import { formatDate, formatDateTime } from "../lib/format";
import type { Label, Member, Project, Task, TaskPatcher } from "../types";
import { LabelChips, Modal, ModalHeading } from "../ui";
import TaskActivitySection from "./task-activity-section";
import TaskAssigneesSection from "./task-assignees-section";
import TaskAttachmentsSection from "./task-attachments-section";
import TaskCommentsSection from "./task-comments-section";
import TaskDependenciesSection from "./task-dependencies-section";
import TaskEditSection from "./task-edit-section";
import TaskIssuesSection from "./task-issues-section";
import TaskLinksSection from "./task-links-section";
import TaskSubtasksSection from "./task-subtasks-section";
import TaskTimeSection from "./task-time-section";
import TaskTagsSection from "./task-tags-section";

export default function TaskDetailModal({
  task,
  userId,
  members,
  projects,
  labels,
  allTasks,
  canEdit,
  canManage,
  isGuest,
  onPatch,
  onChanged,
  onOpenTask,
  onClose,
}: {
  task: Task;
  userId: string;
  members: Member[];
  projects: Project[];
  labels: Label[];
  allTasks: Task[];
  canEdit: boolean;
  canManage: boolean;
  isGuest: boolean;
  onPatch: TaskPatcher;
  onChanged: () => void;
  onOpenTask: (taskId: string) => void;
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose}>
      <section
        className="task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <ModalHeading
          eyebrow="DETAIL TUGAS"
          title={task.title}
          titleId="task-modal-title"
          closeLabel="Tutup detail tugas"
          inlineEyebrow
          onClose={onClose}
        />

        <div className="task-modal-meta">
          <span className={`status-select status-${task.status.toLowerCase()}`}>
            {STATUS_LABEL[task.status]}
          </span>
          <span className={`priority priority-${task.priority.toLowerCase()}`}>
            {PRIORITY_LABEL[task.priority]}
          </span>
          <span>{task.project?.name ?? "Tanpa proyek"}</span>
          <LabelChips labels={task.labels} />
          {task.isMilestone && <span className="milestone-pill">Milestone</span>}
          {task.recurrence && task.recurrence !== "NONE" && (
            <span className="milestone-pill recurring-pill">{RECURRENCE_LABEL[task.recurrence]}</span>
          )}
        </div>

        <div className="task-modal-details">
          <div>
            <span>Penanggung jawab</span>
            <strong>{task.assignee?.name ?? "Belum ditetapkan"}</strong>
          </div>
          <div>
            <span>Jadwal</span>
            <strong>
              {task.startDate ? `${formatDate(task.startDate)} → ` : ""}
              {formatDate(task.dueDate)}
            </strong>
          </div>
          {task.completedAt && (
            <div>
              <span>Selesai pada</span>
              <strong>{formatDateTime(task.completedAt)}</strong>
            </div>
          )}
          <div>
            <span>Dibuat oleh</span>
            <strong>{task.creator?.name ?? "—"}</strong>
          </div>
        </div>

        <div className="task-modal-description">
          <h3>Deskripsi</h3>
          <p>{task.description || "Belum ada deskripsi untuk tugas ini."}</p>
        </div>

        {canManage && (
          <TaskEditSection
            task={task}
            members={members}
            projects={projects}
            labels={labels}
            onPatch={onPatch}
            onChanged={onChanged}
          />
        )}
        <TaskSubtasksSection task={task} canEdit={canEdit} onPatch={onPatch} onChanged={onChanged} />
        <TaskDependenciesSection
          task={task}
          allTasks={allTasks}
          canEdit={canEdit}
          onPatch={onPatch}
          onOpenTask={onOpenTask}
        />
        <TaskAssigneesSection task={task} members={members} canEdit={canEdit} onPatch={onPatch} />
        <TaskTagsSection
          task={task}
          userId={userId}
          members={members}
          canEdit={canEdit}
          onPatch={onPatch}
        />
        <TaskLinksSection task={task} canEdit={canEdit} onPatch={onPatch} onClose={onClose} />
        <TaskCommentsSection
          task={task}
          userId={userId}
          members={members}
          canModerate={canManage}
          onPatch={onPatch}
        />
        <TaskAttachmentsSection task={task} userId={userId} canModerate={canManage} onPatch={onPatch} />
        {!isGuest && (
          <TaskTimeSection task={task} userId={userId} canModerate={canManage} onChanged={onChanged} />
        )}
        <TaskIssuesSection task={task} onPatch={onPatch} />
        <TaskActivitySection taskId={task.id} version={task.updatedAt} />
      </section>
    </Modal>
  );
}
