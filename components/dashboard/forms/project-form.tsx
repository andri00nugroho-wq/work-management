"use client";

import { useState } from "react";
import type { ProjectInput } from "../hooks/use-workspace";
import FormShell from "./form-shell";

export default function ProjectForm({
  saving,
  onSubmit,
  onInvalid,
  onCancel,
}: {
  saving: boolean;
  onSubmit: (input: ProjectInput) => Promise<boolean>;
  onInvalid: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ProjectInput>({ name: "", description: "" });

  function submit() {
    if (!form.name.trim()) {
      onInvalid("Nama proyek wajib diisi.");
      return;
    }
    void onSubmit(form);
  }

  return (
    <FormShell
      title="Buat proyek baru"
      subtitle="Data akan dikirim ke server untuk disimpan."
      submitLabel="Simpan Proyek"
      saving={saving}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <label>
        Nama proyek *
        <input
          required
          maxLength={180}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Contoh: Kampanye Q4"
        />
      </label>

      <label className="description-field">
        Deskripsi
        <textarea
          maxLength={5000}
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
          placeholder="Jelaskan tujuan proyek..."
          rows={3}
        />
      </label>
    </FormShell>
  );
}
