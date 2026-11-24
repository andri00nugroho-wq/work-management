"use client";

import { useState } from "react";
import ReiLogo from "@/components/rei-logo";

type Status = { kind: "idle" | "sending" | "done" | "error"; message?: string };

/** Formulir permintaan kerja; hasilnya menjadi tugas di papan kerja. */
export default function RequestForm({
  slug,
  name,
  description,
  user,
}: {
  slug: string;
  name: string;
  description: string | null;
  user: { name: string; email: string } | null;
}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    setStatus({ kind: "sending" });
    try {
      const response = await fetch(`/api/intake/${slug}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) throw new Error(result?.message ?? "Permintaan gagal dikirim.");
      setStatus({ kind: "done" });
    } catch (err) {
      setStatus({ kind: "error", message: err instanceof Error ? err.message : "Permintaan gagal dikirim." });
    }
  }

  return (
    <main className="request-shell">
      <section className="request-card">
        <ReiLogo compact />
        <span className="request-eyebrow">FORMULIR PERMINTAAN</span>
        <h1>{name}</h1>
        {description && <p className="request-lead">{description}</p>}

        {status.kind === "done" ? (
          <div className="request-done" role="status">
            <strong>Terima kasih!</strong>
            <p>Permintaan Anda sudah diterima dan masuk ke papan kerja tim. Kami akan menindaklanjutinya.</p>
            <button type="button" onClick={() => setStatus({ kind: "idle" })}>
              Kirim permintaan lain
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            {!user && (
              <div className="request-row">
                <label>
                  Nama *
                  <input name="name" required maxLength={120} autoComplete="name" />
                </label>
                <label>
                  Email *
                  <input name="email" type="email" required maxLength={160} autoComplete="email" />
                </label>
              </div>
            )}
            {user && (
              <p className="request-as">
                Dikirim sebagai <strong>{user.name}</strong> ({user.email})
              </p>
            )}
            <label>
              Judul permintaan *
              <input name="title" required maxLength={180} placeholder="Contoh: Desain banner promo akhir tahun" />
            </label>
            <label>
              Rincian
              <textarea name="details" rows={5} maxLength={5000} placeholder="Jelaskan kebutuhan, konteks, dan hasil yang diharapkan..." />
            </label>
            <label>
              Dibutuhkan paling lambat
              <input name="dueDate" type="date" />
            </label>
            {/* Honeypot anti-bot: disembunyikan dari pengguna. */}
            <div className="request-hp" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
            {status.kind === "error" && (
              <p className="request-error" role="alert">
                {status.message}
              </p>
            )}
            <button className="request-submit" disabled={status.kind === "sending"}>
              {status.kind === "sending" ? "Mengirim..." : "Kirim permintaan"}
            </button>
          </form>
        )}
      </section>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap');
        body { margin: 0; background: var(--rei-bg); color: var(--rei-text); font-family: 'DM Sans', system-ui, sans-serif; }
      `}</style>
      <style jsx>{`
        .request-shell { display: grid; min-height: 100vh; place-items: center; padding: 32px 16px; }
        .request-card { width: min(560px, 100%); padding: 32px; border: 1px solid var(--rei-border); border-radius: 18px; background: var(--rei-surface); box-shadow: var(--rei-shadow); }
        .request-eyebrow { display: block; margin-top: 18px; color: var(--rei-gold-text); font-size: 10px; font-weight: 800; letter-spacing: 1.4px; text-align: center; }
        h1 { margin: 6px 0 0; color: var(--rei-heading); font-size: 22px; text-align: center; }
        .request-lead { margin: 8px 0 0; color: var(--rei-muted); font-size: 13px; line-height: 1.6; text-align: center; }
        form { display: flex; flex-direction: column; gap: 14px; margin-top: 24px; }
        .request-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        label { display: flex; flex-direction: column; gap: 6px; color: var(--rei-muted); font-size: 12px; font-weight: 700; }
        input, textarea { padding: 11px 12px; border: 1px solid var(--rei-border-strong); border-radius: 9px; outline: none; background: var(--rei-input-bg); color: var(--rei-text); font: inherit; font-size: 13px; font-weight: 400; }
        input:focus, textarea:focus { border-color: var(--rei-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--rei-accent) 14%, transparent); }
        textarea { resize: vertical; }
        .request-as { margin: 0; padding: 10px 12px; border-radius: 9px; background: var(--rei-surface-2); color: var(--rei-muted); font-size: 12px; }
        .request-hp { position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden; }
        .request-submit, .request-done button { min-height: 44px; border: 0; border-radius: 10px; background: var(--rei-accent); color: var(--rei-accent-contrast); font: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
        .request-submit:disabled { opacity: .7; cursor: wait; }
        .request-error { margin: 0; color: var(--rei-danger-text); font-size: 12px; }
        .request-done { margin-top: 24px; padding: 20px; border-radius: 12px; background: var(--rei-success-soft); color: var(--rei-success-text); text-align: center; }
        .request-done p { margin: 8px 0 16px; font-size: 13px; line-height: 1.6; }
        .request-done button { padding: 0 18px; }
        @media (max-width: 520px) { .request-card { padding: 22px; } .request-row { grid-template-columns: 1fr; } }
      `}</style>
    </main>
  );
}
