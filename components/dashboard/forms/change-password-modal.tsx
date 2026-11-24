"use client";

import { useState } from "react";
import { useAsyncAction } from "../hooks/use-async-action";
import { request } from "../lib/http";
import { Modal, ModalHeading, SectionMessages } from "../ui";

/** Ganti kata sandi sendiri; sesi di perangkat lain otomatis terputus. */
export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const action = useAsyncAction();
  const [done, setDone] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (next.length < 8) return action.setError("Kata sandi baru minimal 8 karakter.");
    if (next !== confirm) return action.setError("Konfirmasi kata sandi tidak sama.");
    void action.run(async () => {
      await request(
        "/api/auth/password",
        { method: "PATCH", body: JSON.stringify({ currentPassword: current, newPassword: next }) },
        "Kata sandi gagal diganti."
      );
      setDone(true);
      setCurrent("");
      setNext("");
      setConfirm("");
      return "Kata sandi berhasil diganti. Sesi di perangkat lain telah diakhiri.";
    }, "Kata sandi gagal diganti.");
  }

  return (
    <Modal onClose={onClose}>
      <section className="task-modal small-modal" role="dialog" aria-modal="true" aria-labelledby="pw-title">
        <ModalHeading eyebrow="AKUN" title="Ganti kata sandi" titleId="pw-title" onClose={onClose} />
        {!done && (
          <form className="form-grid single-column" onSubmit={submit}>
            <label>
              Kata sandi saat ini
              <input
                type="password"
                autoComplete="current-password"
                required
                value={current}
                onChange={(event) => setCurrent(event.target.value)}
              />
            </label>
            <label>
              Kata sandi baru
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={next}
                onChange={(event) => setNext(event.target.value)}
              />
            </label>
            <label>
              Ulangi kata sandi baru
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
              />
            </label>
            <div className="task-modal-actions">
              <button type="button" className="secondary-button" onClick={onClose}>
                Batal
              </button>
              <button className="primary-button" disabled={action.busy}>
                {action.busy ? "Menyimpan..." : "Simpan kata sandi"}
              </button>
            </div>
          </form>
        )}
        <SectionMessages error={action.error} notice={action.notice} />
        {done && (
          <div className="task-modal-actions">
            <button type="button" className="primary-button" onClick={onClose}>
              Selesai
            </button>
          </div>
        )}
      </section>
    </Modal>
  );
}
