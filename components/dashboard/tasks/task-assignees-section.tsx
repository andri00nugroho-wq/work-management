"use client";

import { faXmark } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useMemo, useState } from "react";
import { ROLE_LABEL, STATUS_LABEL } from "../constants";
import { useAsyncAction } from "../hooks/use-async-action";
import { initials } from "../lib/format";
import { request } from "../lib/http";
import type { Member, Task, TaskAssignment, TaskPatcher } from "../types";
import { SectionMessages, TaskSection } from "../ui";

/** Penanggung jawab utama + anggota pelaksana tambahan. */
export default function TaskAssigneesSection({
  task,
  members,
  canEdit,
  onPatch,
}: {
  task: Task;
  members: Member[];
  canEdit: boolean;
  onPatch: TaskPatcher;
}) {
  const [selected, setSelected] = useState("");
  const action = useAsyncAction();
  const assignments = useMemo(() => task.assignments ?? [], [task.assignments]);
  const available = useMemo(
    () => members.filter((member) => !assignments.some((item) => item.user.id === member.id)),
    [members, assignments]
  );

  const call = (url: string, init: RequestInit, success: string, fallback: string) =>
    action.run(async () => {
      const result = await request<{ assignments: TaskAssignment[] }>(url, init, fallback);
      onPatch(task.id, { assignments: result.assignments });
      return success;
    }, fallback);

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const name = members.find((member) => member.id === selected)?.name ?? "Anggota";
    void call(
      `/api/tasks/${task.id}/assignees`,
      { method: "POST", body: JSON.stringify({ userId: selected }) },
      `${name} ditambahkan sebagai pelaksana.`,
      "Anggota gagal ditambahkan."
    ).then((ok) => ok && setSelected(""));
  }

  return (
    <TaskSection
      title="Anggota pelaksana"
      subtitle="Penanggung jawab utama dan rekan yang ikut mengerjakan tugas ini."
      aside={`${assignments.length} orang`}
    >
      <ul className="task-tag-list">
        {assignments.map((assignment) => {
          const primary = assignment.user.id === task.assignee?.id;
          return (
            <li key={assignment.user.id}>
              <span className="task-tag-avatar">{initials(assignment.user.name)}</span>
              <span className="task-tag-info">
                <strong>{assignment.user.name}</strong>
                <small>{primary ? "Penanggung jawab utama" : STATUS_LABEL[assignment.status]}</small>
              </span>
              {canEdit && !primary && (
                <button
                  type="button"
                  className="task-tag-remove"
                  disabled={action.busy}
                  aria-label={`Lepas ${assignment.user.name}`}
                  onClick={() =>
                    void call(
                      `/api/tasks/${task.id}/assignees?userId=${encodeURIComponent(assignment.user.id)}`,
                      { method: "DELETE" },
                      `${assignment.user.name} dilepas dari tugas.`,
                      "Anggota gagal dilepas."
                    )
                  }
                >
                  <Icon icon={faXmark} />
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {canEdit && (
        <form className="task-tag-form" onSubmit={add}>
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            aria-label="Pilih anggota pelaksana"
          >
            <option value="">{members.length ? "Pilih anggota..." : "Memuat anggota..."}</option>
            {available.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} · {ROLE_LABEL[member.role]}
              </option>
            ))}
          </select>
          <button className="secondary-button" disabled={action.busy || !selected}>
            + Tambah pelaksana
          </button>
        </form>
      )}
      <SectionMessages error={action.error} notice={action.notice} />
    </TaskSection>
  );
}
