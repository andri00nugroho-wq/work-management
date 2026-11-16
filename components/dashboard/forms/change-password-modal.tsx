"use client";

import { useState, type FormEvent } from "react";
import { errorText } from "../lib/format";
import { request } from "../lib/http";
import { Modal, ModalHeading } from "../ui";

export default function ChangePasswordModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (newPassword.length < 8) {
      setError("Kata sandi baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Ulangi kata sandi baru dengan benar.");
      return;
    }

    setSaving(true);
    try {
      await request(
        "/api/auth/password",
        {
          method: "PATCH",
          body: JSON.stringify({ currentPassword, newPassword }),
        },
        "Kata sandi gagal diubah."
      );
      onSuccess("Kata sandi berhasil diubah.");
    } catch (err) {
      setError(errorText(err, "Gagal mengubah kata sandi."));
      setSaving(false);
    }
  }

  return (
    <Modal onClose={onClose}>
      <section
        className="task-modal password-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-modal-title"
      >
        <ModalHeading
          eyebrow="KEAMANAN AKUN"
          title="Ganti kata sandi"
          titleId="password-modal-title"
          closeLabel="Tutup form ganti kata sandi"
          onClose={onClose}
        />

        <form className="password-form" onSubmit={submit}>
          {error && (
            <p className="password-error" role="alert">
              {error}
            </p>
          )}

          <div className="form-grid password-grid">
            <label>
              Kata sandi saat ini
              <input
                type="password"
                required
                autoFocus
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>

            <label>
              Kata sandi baru
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimal 8 karakter"
              />
            </label>

            <label>
              Ulangi kata sandi baru
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </label>
          </div>

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={saving}>
              Batal
            </button>
            <button className="primary-button" disabled={saving}>
              {saving ? "Menyimpan..." : "Simpan Kata Sandi"}
            </button>
          </div>
        </form>
      </section>
    </Modal>
  );
}
