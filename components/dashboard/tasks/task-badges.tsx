"use client";

import { faComment, faListCheck, faLock, faPaperclip, faRepeat } from "@fortawesome/free-solid-svg-icons";
import { RECURRENCE_LABEL } from "../constants";
import Icon from "@/components/icon";
import type { Task } from "../types";

/** Indikator ringkas: progres sub-tugas, jumlah komentar & lampiran. */
export default function TaskBadges({ task }: { task: Task }) {
  const subtasks = task.subtasks ?? [];
  const done = subtasks.filter((subtask) => subtask.done).length;
  const comments = task._count?.comments ?? 0;
  const attachments = task._count?.attachments ?? 0;
  const blocked = task.dependsOn?.filter(({ dependsOn }) => dependsOn.status !== "DONE") ?? [];
  const recurring = task.recurrence && task.recurrence !== "NONE";
  if (!subtasks.length && !comments && !attachments && !blocked.length && !recurring) return null;
  return (
    <span className="task-badges">
      {recurring && (
        <span title={RECURRENCE_LABEL[task.recurrence!]}>
          <Icon icon={faRepeat} />
        </span>
      )}
      {blocked.length > 0 && (
        <span className="blocked" title={`Menunggu: ${blocked.map(({ dependsOn }) => dependsOn.title).join(", ")}`}>
          <Icon icon={faLock} /> menunggu {blocked.length}
        </span>
      )}
      {subtasks.length > 0 && (
        <span
          className={done === subtasks.length ? "complete" : ""}
          title={`${done} dari ${subtasks.length} sub-tugas selesai`}
        >
          <Icon icon={faListCheck} /> {done}/{subtasks.length}
        </span>
      )}
      {comments > 0 && (
        <span title={`${comments} komentar`}>
          <Icon icon={faComment} /> {comments}
        </span>
      )}
      {attachments > 0 && (
        <span title={`${attachments} lampiran`}>
          <Icon icon={faPaperclip} /> {attachments}
        </span>
      )}
    </span>
  );
}
