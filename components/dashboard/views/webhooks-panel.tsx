"use client";

import { faPaperPlane, faPlus, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useState } from "react";
import { useAsyncAction } from "../hooks/use-async-action";
import { formatRelative } from "../lib/format";
import { request } from "../lib/http";
import type { WebhookItem } from "../types";
import { EmptyRow, Panel, SectionMessages } from "../ui";

const EVENT_LABEL: Record<string, string> = {
  "task.created": "Tugas dibuat",
  "task.status_changed": "Status berubah",
  "task.completed": "Tugas selesai",
  "comment.created": "Komentar baru",
  "request.submitted": "Permintaan masuk",
};
const FORMAT_LABEL: Record<string, string> = { json: "JSON (HMAC)", slack: "Slack", teams: "Microsoft Teams" };

/** Webhook keluar ke Slack/Teams/sistem lain (khusus admin). */
export default function WebhooksPanel() {
  const [hooks, setHooks] = useState<WebhookItem[]>([]);
  const [draft, setDraft] = useState({ name: "", url: "", format: "json", events: ["task.created", "task.completed"] });
  const [secret, setSecret] = useState("");
  const action = useAsyncAction();

  const load = () =>
    request<{ webhooks: WebhookItem[] }>("/api/webhooks", {}, "Webhook gagal dimuat.")
      .then((result) => setHooks(result.webhooks))
      .catch(() => {});

  useEffect(() => {
    void load();
  }, []);

  function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void action.run(async () => {
      const result = await request<{ webhook: WebhookItem; secret: string }>(
        "/api/webhooks",
        { method: "POST", body: JSON.stringify(draft) },
        "Webhook gagal dibuat."
      );
      setHooks((list) => [result.webhook, ...list]);
      setSecret(draft.format === "json" ? result.secret : "");
      setDraft({ ...draft, name: "", url: "" });
      return `Webhook "${result.webhook.name}" dibuat.`;
    }, "Webhook gagal dibuat.");
  }

  function toggleEvent(name: string) {
    setDraft((current) => ({
      ...current,
      events: current.events.includes(name) ? current.events.filter((item) => item !== name) : [...current.events, name],
    }));
  }

  return (
    <Panel
      className="tasks-panel settings-panel settings-wide"
      headingClassName="tasks-heading"
      title="Webhook & integrasi"
      subtitle="Kirim event ke Slack, Microsoft Teams, atau sistem Anda sendiri (JSON bertanda tangan HMAC-SHA256)."
    >
      <form className="settings-inline-form webhook-form" onSubmit={create}>
        <input value={draft.name} maxLength={80} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nama, mis. Kanal #operasional" aria-label="Nama webhook" />
        <input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://hooks.slack.com/services/..." aria-label="URL webhook" />
        <select value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} aria-label="Format">
          {Object.entries(FORMAT_LABEL).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <div className="event-chips" role="group" aria-label="Event">
          {Object.entries(EVENT_LABEL).map(([value, label]) => (
            <label key={value} className={`event-chip ${draft.events.includes(value) ? "active" : ""}`}>
              <input type="checkbox" checked={draft.events.includes(value)} onChange={() => toggleEvent(value)} />
              {label}
            </label>
          ))}
        </div>
        <button className="primary-button" disabled={action.busy || !draft.name.trim() || !draft.url.trim() || !draft.events.length}>
          <Icon icon={faPlus} /> Tambah
        </button>
      </form>

      {secret && (
        <div className="secret-box" role="status">
          <strong>Rahasia penanda tangan (hanya ditampilkan sekali):</strong>
          <code>{secret}</code>
          <small>Verifikasi header X-REI-Signature = sha256=HMAC_SHA256(rahasia, isi permintaan).</small>
          <button type="button" className="text-button" onClick={() => setSecret("")}>
            Sudah saya simpan
          </button>
        </div>
      )}

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>WEBHOOK</th>
              <th>EVENT</th>
              <th>PENGIRIMAN TERAKHIR</th>
              <th>AKTIF</th>
              <th aria-label="Aksi" />
            </tr>
          </thead>
          <tbody>
            {hooks.length === 0 ? (
              <EmptyRow colSpan={5}>Belum ada webhook.</EmptyRow>
            ) : (
              hooks.map((hook) => (
                <tr key={hook.id}>
                  <td>
                    <div className="settings-name">
                      <strong>
                        {hook.name} <span className="project-tag">{FORMAT_LABEL[hook.format] ?? hook.format}</span>
                      </strong>
                      <small className="truncate">{hook.url}</small>
                    </div>
                  </td>
                  <td>
                    <small>{hook.events.map((event) => EVENT_LABEL[event] ?? event).join(", ")}</small>
                  </td>
                  <td>
                    {hook.lastDeliveredAt ? (
                      <span className={hook.lastError ? "delivery-fail" : "delivery-ok"} title={hook.lastError ?? undefined}>
                        {hook.lastError ? `Gagal (${hook.lastError})` : `OK ${hook.lastStatus}`} · {formatRelative(hook.lastDeliveredAt)}
                      </span>
                    ) : (
                      <small>Belum pernah</small>
                    )}
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      role="switch"
                      className="switch"
                      checked={hook.isActive}
                      aria-label={`Aktifkan ${hook.name}`}
                      onChange={(event) =>
                        void action.run(async () => {
                          await request(`/api/webhooks/${hook.id}`, { method: "PATCH", body: JSON.stringify({ isActive: event.target.checked }) });
                          await load();
                        }, "Webhook gagal diperbarui.")
                      }
                    />
                  </td>
                  <td className="row-actions">
                    <button
                      type="button"
                      className="icon-action"
                      title="Kirim uji"
                      aria-label={`Uji ${hook.name}`}
                      onClick={() =>
                        void action.run(async () => {
                          const result = await request<{ ok: boolean; status: number }>(`/api/webhooks/${hook.id}/test`, { method: "POST" });
                          await load();
                          if (!result.ok) throw new Error(`Uji gagal (status ${result.status || "tidak terhubung"}).`);
                          return `Uji "${hook.name}" berhasil (HTTP ${result.status}).`;
                        }, "Uji webhook gagal.")
                      }
                    >
                      <Icon icon={faPaperPlane} />
                    </button>
                    <button
                      type="button"
                      className="icon-action danger"
                      aria-label={`Hapus ${hook.name}`}
                      onClick={() => {
                        if (!window.confirm(`Hapus webhook "${hook.name}"?`)) return;
                        void action.run(async () => {
                          await request(`/api/webhooks/${hook.id}`, { method: "DELETE" });
                          setHooks((list) => list.filter((item) => item.id !== hook.id));
                        }, "Webhook gagal dihapus.");
                      }}
                    >
                      <Icon icon={faTrashCan} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="automation-messages">
        <SectionMessages error={action.error} notice={action.notice} />
      </div>
    </Panel>
  );
}
