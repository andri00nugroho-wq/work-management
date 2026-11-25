"use client";

import { useState } from "react";
import { PRIORITY_LABEL, RECURRENCE_LABEL, ROLE_LABEL } from "../constants";
import { useAsyncAction } from "../hooks/use-async-action";
import { toDateInput } from "../lib/format";
import { request } from "../lib/http";
import type { Label, Member, Project, Recurrence, Task, TaskPatcher, TaskPriority } from "../types";
import { LabelPicker, SectionMessages, TaskSection } from "../ui";

const PRIORITIES = Object.keys(PRIORITY_LABEL) as TaskPriority[];

type Draft = {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string;
  projectId: string;
  startDate: string;
  dueDate: string;
  labelIds: string[];
  isMilestone: boolean;
  recurrence: Recurrence;
  estimateHours: string;
};

function draftOf(task: Task): Draft {
  return {
    title: task.title,
    description: task.description ?? "",
    priority: task.priority,
    assigneeId: task.assignee?.id ?? "",
    projectId: task.project?.id ?? "",
    startDate: toDateInput(task.startDate),
    dueDate: toDateInput(task.dueDate),
    labelIds: (task.labels ?? []).map(({ label }) => label.id),
    isMilestone: Boolean(task.isMilestone),
    recurrence: task.recurrence ?? "NONE",
    estimateHours: task.estimateMinutes ? String(Math.round((task.estimateMinutes / 60) * 100) / 100) : "",
  };
}

/** Form edit tugas untuk peran manajemen. */
export default function TaskEditSection({
  task,
  members,
  projects,
  labels,
  onPatch,
  onChanged,
}: {
  task: Task;
  members: Member[];
  projects: Project[];
  labels: Label[];
  onPatch: TaskPatcher;
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => draftOf(task));
  const action = useAsyncAction();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));


  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim()) {
      action.setError("Nama tugas wajib diisi.");
      return;
    }
    if (draft.startDate && draft.dueDate && draft.startDate > draft.dueDate) {
      action.setError("Tanggal mulai tidak boleh setelah tenggat.");
      return;
    }
    void action.run(async () => {
      const result = await request<{ task: Task }>(
        `/api/tasks/${task.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: draft.title.trim(),
            description: draft.description.trim() || null,
            priority: draft.priority,
            assigneeId: draft.assigneeId || undefined,
            projectId: draft.projectId || null,
            startDate: draft.startDate || null,
            dueDate: draft.dueDate || null,
            labelIds: draft.labelIds,
            isMilestone: draft.isMilestone,
            recurrence: draft.recurrence,
            estimateMinutes: draft.estimateHours ? Math.round(Number(draft.estimateHours) * 60) : null,
          }),
        },
        "Tugas gagal diperbarui."
      );
      onPatch(task.id, result.task);
      onChanged();
      setOpen(false);
      return "Perubahan tugas tersimpan.";
    }, "Gagal memperbarui tugas.");
  }

  return (
    <TaskSection
      title="Edit tugas"
      subtitle="Ubah detail, jadwal, penanggung jawab, dan label."
      aside={
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setDraft(draftOf(task));
            action.clear();
            setOpen((value) => !value);
          }}
        >
          {open ? "Tutup" : "Ubah"}
        </button>
      }
    >
      {open && (
        <form className="task-edit-form form-grid" onSubmit={save}>
          <label className="description-field">
            Nama tugas *
            <input
              required
              maxLength={180}
              value={draft.title}
              onChange={(event) => set("title", event.target.value)}
            />
          </label>
          <label>
            Prioritas
            <select
              value={draft.priority}
              onChange={(event) => set("priority", event.target.value as TaskPriority)}
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_LABEL[priority]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Penanggung jawab
            <select value={draft.assigneeId} onChange={(event) => set("assigneeId", event.target.value)}>
              {!draft.assigneeId && <option value="">Pilih anggota...</option>}
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} · {ROLE_LABEL[member.role]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Proyek
            <select value={draft.projectId} onChange={(event) => set("projectId", event.target.value)}>
              <option value="">Tanpa proyek</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tanggal mulai
            <input
              type="date"
              value={draft.startDate}
              max={draft.dueDate || undefined}
              onChange={(event) => set("startDate", event.target.value)}
            />
          </label>
          <label>
            Tenggat
            <input
              type="date"
              value={draft.dueDate}
              min={draft.startDate || undefined}
              onChange={(event) => set("dueDate", event.target.value)}
            />
          </label>
          <label>
            Estimasi (jam)
            <input
              type="number"
              min={0.25}
              step={0.25}
              max={1600}
              value={draft.estimateHours}
              onChange={(event) => set("estimateHours", event.target.value)}
              placeholder="mis. 4"
            />
          </label>
          <label>
            Pengulangan
            <select
              value={draft.recurrence}
              onChange={(event) => set("recurrence", event.target.value as Recurrence)}
            >
              {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={draft.isMilestone}
              onChange={(event) => set("isMilestone", event.target.checked)}
            />
            Tandai sebagai milestone (titik pencapaian utama)
          </label>
          <LabelPicker labels={labels} value={draft.labelIds} onChange={(ids) => set("labelIds", ids)} />
          <label className="description-field">
            Deskripsi
            <textarea
              rows={4}
              maxLength={5000}
              value={draft.description}
              onChange={(event) => set("description", event.target.value)}
            />
          </label>
          <div className="description-field task-modal-actions">
            <button type="button" className="secondary-button" onClick={() => setOpen(false)}>
              Batal
            </button>
            <button className="primary-button" disabled={action.busy}>
              {action.busy ? "Menyimpan..." : "Simpan perubahan"}
            </button>
          </div>
        </form>
      )}
      <SectionMessages error={action.error} notice={action.notice} />
    </TaskSection>
  );
}
