"use client";

import { faLock, faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useMemo, useState } from "react";
import { STATUS_LABEL } from "../constants";
import { useAsyncAction } from "../hooks/use-async-action";
import { request } from "../lib/http";
import type { Task, TaskPatcher, TaskRef } from "../types";
import { SectionMessages, TaskSection } from "../ui";

/** Prasyarat (tugas yang ditunggu) dan tugas yang terblokir oleh tugas ini. */
export default function TaskDependenciesSection({
  task,
  allTasks,
  canEdit,
  onPatch,
  onOpenTask,
}: {
  task: Task;
  allTasks: Task[];
  canEdit: boolean;
  onPatch: TaskPatcher;
  onOpenTask: (taskId: string) => void;
}) {
  const [selected, setSelected] = useState("");
  const action = useAsyncAction();
  const dependsOn = useMemo(() => (task.dependsOn ?? []).map(({ dependsOn }) => dependsOn), [task.dependsOn]);
  const blocking = (task.blocking ?? []).map(({ task: blocked }) => blocked);
  const waiting = dependsOn.filter((item) => item.status !== "DONE");
  const candidates = useMemo(
    () => allTasks.filter((item) => item.id !== task.id && !dependsOn.some((dep) => dep.id === item.id)),
    [allTasks, task.id, dependsOn]
  );

  const call = (url: string, init: RequestInit, fallback: string) =>
    action.run(async () => {
      const result = await request<{ dependsOn: Array<{ dependsOn: TaskRef }> }>(url, init, fallback);
      onPatch(task.id, { dependsOn: result.dependsOn });
    }, fallback);

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    void call(
      `/api/tasks/${task.id}/dependencies`,
      { method: "POST", body: JSON.stringify({ dependsOnId: selected }) },
      "Dependensi gagal ditambahkan."
    ).then((ok) => ok && setSelected(""));
  }

  const item = (ref: TaskRef, removable: boolean) => (
    <li key={ref.id} className={ref.status === "DONE" ? "dep-done" : ""}>
      <button type="button" className="dep-link" onClick={() => onOpenTask(ref.id)}>
        {ref.title}
      </button>
      <span className={`status-select status-${ref.status.toLowerCase()} dep-status`}>{STATUS_LABEL[ref.status]}</span>
      {removable && canEdit && (
        <button
          type="button"
          className="task-tag-remove"
          disabled={action.busy}
          aria-label={`Lepas dependensi ${ref.title}`}
          onClick={() =>
            void call(
              `/api/tasks/${task.id}/dependencies?dependsOnId=${encodeURIComponent(ref.id)}`,
              { method: "DELETE" },
              "Dependensi gagal dilepas."
            )
          }
        >
          <Icon icon={faXmark} />
        </button>
      )}
    </li>
  );

  return (
    <TaskSection
      title="Dependensi"
      subtitle="Tugas ini baru bisa dimulai setelah semua prasyaratnya selesai."
      aside={waiting.length ? `${waiting.length} menunggu` : dependsOn.length ? "Siap dikerjakan" : "Tidak ada"}
    >
      {waiting.length > 0 && task.status === "TODO" && (
        <p className="dep-warning">
          <Icon icon={faLock} /> Terkunci: status tidak bisa diubah sampai {waiting.length} prasyarat selesai.
        </p>
      )}
      {dependsOn.length > 0 && (
        <>
          <h4 className="dep-heading">Menunggu</h4>
          <ul className="dep-list">{dependsOn.map((ref) => item(ref, true))}</ul>
        </>
      )}
      {blocking.length > 0 && (
        <>
          <h4 className="dep-heading">Memblokir</h4>
          <ul className="dep-list">{blocking.map((ref) => item(ref, false))}</ul>
        </>
      )}
      {canEdit && (
        <form className="task-tag-form" onSubmit={add}>
          <select value={selected} onChange={(event) => setSelected(event.target.value)} aria-label="Pilih tugas prasyarat">
            <option value="">Tambah prasyarat...</option>
            {candidates.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.title} · {STATUS_LABEL[candidate.status]}
              </option>
            ))}
          </select>
          <button className="secondary-button" disabled={action.busy || !selected}>
            + Tambah
          </button>
        </form>
      )}
      <SectionMessages error={action.error} notice={action.notice} />
    </TaskSection>
  );
}
