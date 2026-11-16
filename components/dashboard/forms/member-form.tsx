"use client";

import { useState } from "react";
import { ROLES, ROLE_LABEL } from "../constants";
import type { MemberInput } from "../hooks/use-workspace";
import type { UserRole } from "../types";
import FormShell from "./form-shell";

export default function MemberForm({
  currentRole,
  saving,
  onSubmit,
  onInvalid,
  onCancel,
}: {
  currentRole: UserRole;
  saving: boolean;
  onSubmit: (input: MemberInput) => Promise<boolean>;
  onInvalid: (message: string) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MemberInput>({
    name: "",
    email: "",
    password: "",
    role: "MEMBER",
  });

  // Hanya Super Admin yang boleh membuat Super Admin lain.
  const roles = ROLES.filter((role) => role !== "SUPER_ADMIN" || currentRole === "SUPER_ADMIN");

  function submit() {
    if (!form.name.trim() || !form.email.trim()) {
      onInvalid("Nama dan email anggota wajib diisi.");
      return;
    }
    void onSubmit(form);
  }

  return (
    <FormShell
      title="Tambah anggota tim"
      subtitle="Akun baru akan dibuat di database."
      submitLabel="Simpan Anggota"
      saving={saving}
      onSubmit={submit}
      onCancel={onCancel}
    >
      <label>
        Nama lengkap *
        <input
          required
          maxLength={120}
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          placeholder="Nama anggota"
        />
      </label>

      <label>
        Email *
        <input
          required
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
          placeholder="nama@perusahaan.com"
        />
      </label>

      <label>
        Peran
        <select
          value={form.role}
          onChange={(event) => setForm({ ...form, role: event.target.value as UserRole })}
        >
          {roles.map((role) => (
            <option key={role} value={role}>
              {ROLE_LABEL[role]}
            </option>
          ))}
        </select>
      </label>

      <label className="description-field">
        Kata sandi awal
        <input
          type="password"
          minLength={8}
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
          placeholder="Minimal 8 karakter"
        />
      </label>
    </FormShell>
  );
}
