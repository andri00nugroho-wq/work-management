"use client";

import { useState } from "react";
import { PRIORITY_LABEL, RECURRENCE_LABEL, ROLE_LABEL } from "../constants";
import type { TaskInput } from "../hooks/use-workspace";
import type { DashboardUser, Label, Member, Project, TaskPriority } from "../types";
import { LabelPicker } from "../ui";
import FormShell from "./form-shell";

const PRIORITIES = Object.keys(PRIORITY_LABEL) as TaskPriority[];

export default function TaskForm({
  user,
  members,
  projects,
  labels,
  saving,
  onSubmit,
  onInvalid,
  onCancel,
}: {
  user: DashboardUser;
  members: Member[];
  projects: Project[];
  labels: Label[];
  saving: boolean;
  onSubmit: (input: TaskInput) => Promise<boolean>;
  onInvalid: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<TaskInput>({
    title: "",
    description: "",
    priority: "MEDIUM",
    startDate: "",
    dueDate: "",
    projectId: "",
    assigneeId: user.id,
    labelIds: [],
    recurrence: "NONE",
  });

  const set = (field: keyof TaskInput) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm({ ...form, [field]: event.target.value });

  function submit() {
    if (!form.title.trim()) {
      onInvalid("Nama tugas wajib diisi.");
      return;
    }
    if (form.startDate && form.dueDate && form.startDate > form.dueDate) {
      onInvalid("Tanggal mulai tidak boleh setelah tenggat.");
      return;
    }
    void onSubmit(form);
  }

  return (
    <FormShell
      title="Buat tugas baru"
      subtitle="Data akan dikirim ke server untuk disimpan."
      submitLabel="Simpan Tugas"
      saving={saving}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <label>
        Nama tugas *
        <input
          required
          maxLength={180}
          value={form.title}
          onChange={set("title")}
          placeholder="Contoh: Evaluasi kinerja tim"
        />
      </label>

      <label>
        Prioritas
        <select value={form.priority} onChange={set("priority")}>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {PRIORITY_LABEL[priority]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Tanggal mulai
        <input type="date" value={form.startDate} max={form.dueDate || undefined} onChange={set("startDate")} />
      </label>

      <label>
        Tenggat waktu
        <input type="date" value={form.dueDate} min={form.startDate || undefined} onChange={set("dueDate")} />
      </label>

      <label>
        Ditugaskan kepada *
        <select required value={form.assigneeId} onChange={set("assigneeId")}>
          {!members.some((member) => member.id === user.id) && (
            <option value={user.id}>{user.name} (Saya)</option>
          )}
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.name} · {ROLE_LABEL[member.role]}
              {member.id === user.id ? " (Saya)" : ""}
            </option>
          ))}
        </select>
      </label>

      <label>
        Pengulangan
        <select value={form.recurrence} onChange={set("recurrence")}>
          {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label>
        Proyek
        <select value={form.projectId} onChange={set("projectId")}>
          <option value="">Tanpa proyek</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <LabelPicker
        labels={labels}
        value={form.labelIds}
        onChange={(labelIds) => setForm({ ...form, labelIds })}
      />

      <label className="description-field">
        Deskripsi
        <textarea
          maxLength={5000}
          value={form.description}
          onChange={set("description")}
          placeholder="Jelaskan pekerjaan yang perlu dilakukan..."
          rows={3}
        />
      </label>
    </FormShell>
  );
}
