"use client";

import { faArrowDown, faArrowUp, faPlus, faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useState } from "react";
import { useAsyncAction } from "../hooks/use-async-action";
import { percent } from "../lib/format";
import { request } from "../lib/http";
import type { Subtask, Task, TaskPatcher } from "../types";
import { ProgressBar, SectionMessages, TaskSection } from "../ui";

/** Checklist sub-tugas dengan progres, centang, urutan, dan hapus. */
export default function TaskSubtasksSection({
  task,
  canEdit,
  onPatch,
  onChanged,
}: {
  task: Task;
  canEdit: boolean;
  onPatch: TaskPatcher;
  onChanged: () => void;
}) {
  const [title, setTitle] = useState("");
  const action = useAsyncAction();
  const subtasks = task.subtasks ?? [];
  const done = subtasks.filter((subtask) => subtask.done).length;

  const call = (url: string, init: RequestInit, fallback: string) =>
    action.run(async () => {
      const result = await request<{ subtasks: Subtask[]; autoReview?: boolean }>(url, init, fallback);
      if (result.autoReview) {
        onPatch(task.id, { subtasks: result.subtasks, status: "REVIEW" });
        onChanged();
        return "Semua sub-tugas selesai — status dipindah otomatis ke Menunggu Review.";
      }
      onPatch(task.id, { subtasks: result.subtasks });
    }, fallback);

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = title.trim();
    if (!value) return;
    void call(`/api/tasks/${task.id}/subtasks`, { method: "POST", body: JSON.stringify({ title: value }) }, "Sub-tugas gagal ditambahkan.").then(
      (ok) => ok && setTitle("")
    );
  }

  function toggle(subtask: Subtask) {
    // Optimistic: langsung centang, server menyusul.
    onPatch(task.id, {
      subtasks: subtasks.map((item) => (item.id === subtask.id ? { ...item, done: !item.done } : item)),
    });
    void call(
      `/api/tasks/${task.id}/subtasks/${subtask.id}`,
      { method: "PATCH", body: JSON.stringify({ done: !subtask.done }) },
      "Sub-tugas gagal diperbarui."
    );
  }

  /** Geser satu langkah; server menomori ulang seluruh urutan. */
  function move(subtask: Subtask, index: number, direction: -1 | 1) {
    void call(
      `/api/tasks/${task.id}/subtasks/${subtask.id}`,
      { method: "PATCH", body: JSON.stringify({ position: index + direction }) },
      "Urutan gagal disimpan."
    );
  }

  return (
    <TaskSection
      title="Sub-tugas"
      subtitle="Pecah pekerjaan menjadi langkah-langkah kecil."
      aside={subtasks.length ? `${done}/${subtasks.length} selesai` : "Belum ada"}
    >
      {subtasks.length > 0 && (
        <>
          <div className="subtask-progress">
            <ProgressBar value={percent(done, subtasks.length)} />
          </div>
          <ul className="subtask-list">
            {subtasks.map((subtask, index) => (
              <li key={subtask.id} className={subtask.done ? "done" : ""}>
                <label>
                  <input
                    type="checkbox"
                    checked={subtask.done}
                    disabled={!canEdit}
                    onChange={() => toggle(subtask)}
                  />
                  <span>{subtask.title}</span>
                </label>
                {canEdit && (
                  <span className="subtask-actions">
                    <button
                      type="button"
                      aria-label={`Naikkan ${subtask.title}`}
                      disabled={index === 0 || action.busy}
                      onClick={() => move(subtask, index, -1)}
                    >
                      <Icon icon={faArrowUp} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Turunkan ${subtask.title}`}
                      disabled={index === subtasks.length - 1 || action.busy}
                      onClick={() => move(subtask, index, 1)}
                    >
                      <Icon icon={faArrowDown} />
                    </button>
                    <button
                      type="button"
                      aria-label={`Hapus ${subtask.title}`}
                      disabled={action.busy}
                      onClick={() =>
                        void call(
                          `/api/tasks/${task.id}/subtasks/${subtask.id}`,
                          { method: "DELETE" },
                          "Sub-tugas gagal dihapus."
                        )
                      }
                    >
                      <Icon icon={faXmark} />
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
      {canEdit && (
        <form className="task-tag-form" onSubmit={add}>
          <input
            className="inline-input"
            value={title}
            maxLength={200}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Tambah langkah, mis. Siapkan materi presentasi"
            aria-label="Judul sub-tugas baru"
          />
          <button className="secondary-button" disabled={action.busy || !title.trim()}>
            <Icon icon={faPlus} /> Tambah
          </button>
        </form>
      )}
      <SectionMessages error={action.error} notice={action.notice} />
    </TaskSection>
  );
}
