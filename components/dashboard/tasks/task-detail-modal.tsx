"use client";

import { PRIORITY_LABEL, STATUS_LABEL } from "../constants";
import { formatDate } from "../lib/format";
import type { Member, Task, TaskPatcher } from "../types";
import { Modal, ModalHeading } from "../ui";
import TaskIssuesSection from "./task-issues-section";
import TaskLinksSection from "./task-links-section";
import TaskTagsSection from "./task-tags-section";

export default function TaskDetailModal({
  task,
  userId,
  members,
  canEdit,
  onPatch,
  onClose,
}: {
  task: Task;
  userId: string;
  members: Member[];
  canEdit: boolean;
  onPatch: TaskPatcher;
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
        </div>

        <div className="task-modal-details">
          <div>
            <span>Penanggung jawab</span>
            <strong>{task.assignee?.name ?? "Belum ditetapkan"}</strong>
          </div>
          <div>
            <span>Tenggat</span>
            <strong>{formatDate(task.dueDate)}</strong>
          </div>
        </div>

        <div className="task-modal-description">
          <h3>Deskripsi</h3>
          <p>{task.description || "Belum ada deskripsi untuk tugas ini."}</p>
        </div>

        <TaskTagsSection
          task={task}
          userId={userId}
          members={members}
          canEdit={canEdit}
          onPatch={onPatch}
        />
        <TaskLinksSection task={task} canEdit={canEdit} onPatch={onPatch} onClose={onClose} />
        <TaskIssuesSection task={task} onPatch={onPatch} />
      </section>
    </Modal>
  );
}
