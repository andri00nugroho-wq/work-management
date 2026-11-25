"use client";

import { faCalendarDays, faCopy, faKey, faRotate } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useState } from "react";
import { useAsyncAction } from "../hooks/use-async-action";
import { formatRelative } from "../lib/format";
import { request } from "../lib/http";
import type { ApiKeyItem } from "../types";
import { Modal, ModalHeading, SectionMessages } from "../ui";

/** Feed kalender .ics pribadi dan kunci API (untuk integrasi). */
export default function IntegrationsModal({ canUseApi, onClose }: { canUseApi: boolean; onClose: () => void }) {
  const [token, setToken] = useState<string | null | undefined>(undefined);
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState("");
  const action = useAsyncAction();
  const feedUrl = token ? `${window.location.origin}/api/calendar/${token}` : "";

  useEffect(() => {
    request<{ token: string | null }>("/api/calendar/token").then((result) => setToken(result.token)).catch(() => setToken(null));
    if (canUseApi) request<{ keys: ApiKeyItem[] }>("/api/api-keys").then((result) => setKeys(result.keys)).catch(() => {});
  }, [canUseApi]);

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      void action.run(async () => `${label} disalin.`, "");
    } catch {
      window.prompt("Salin:", text);
    }
  }

  return (
    <Modal onClose={onClose}>
      <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="int-title">
        <ModalHeading eyebrow="AKUN" title="Integrasi & kalender" titleId="int-title" onClose={onClose} />

        <div className="task-tags-section">
          <div className="task-tags-heading">
            <div>
              <h3>
                <Icon icon={faCalendarDays} /> Feed kalender (.ics)
              </h3>
              <p>
                Langganan di Google Calendar (Tambah kalender → Dari URL) atau Outlook (Tambah kalender → Berlangganan dari
                web). Berisi tugas yang Anda pegang atau ikuti. Rahasiakan tautan ini.
              </p>
            </div>
          </div>
          {token === undefined ? (
            <p className="task-tag-empty">Memuat...</p>
          ) : token ? (
            <div className="copy-row">
              <code>{feedUrl}</code>
              <button type="button" className="icon-action" aria-label="Salin tautan kalender" onClick={() => void copy(feedUrl, "Tautan kalender")}>
                <Icon icon={faCopy} />
              </button>
              <button
                type="button"
                className="icon-action"
                title="Ganti tautan (yang lama tidak berlaku)"
                aria-label="Ganti tautan kalender"
                onClick={() =>
                  void action.run(async () => {
                    setToken((await request<{ token: string }>("/api/calendar/token", { method: "POST" })).token);
                    return "Tautan baru dibuat; tautan lama tidak berlaku.";
                  }, "Gagal mengganti tautan.")
                }
              >
                <Icon icon={faRotate} />
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() =>
                  void action.run(async () => {
                    await request("/api/calendar/token", { method: "DELETE" });
                    setToken(null);
                    return "Feed kalender dimatikan.";
                  }, "Gagal mematikan feed.")
                }
              >
                Matikan
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                void action.run(async () => {
                  setToken((await request<{ token: string }>("/api/calendar/token", { method: "POST" })).token);
                  return "Tautan kalender dibuat.";
                }, "Gagal membuat tautan.")
              }
            >
              Buat tautan kalender
            </button>
          )}
        </div>

        {canUseApi && (
          <div className="task-tags-section">
            <div className="task-tags-heading">
              <div>
                <h3>
                  <Icon icon={faKey} /> Kunci API
                </h3>
                <p>
                  Akses REST API sebagai Anda: kirim header <code>Authorization: Bearer &lt;kunci&gt;</code>. Contoh:{" "}
                  <code>GET /api/tasks?limit=50</code>.
                </p>
              </div>
            </div>
            {newKey && (
              <div className="secret-box" role="status">
                <strong>Kunci baru (hanya ditampilkan sekali):</strong>
                <code>{newKey}</code>
                <button type="button" className="text-button" onClick={() => void copy(newKey, "Kunci API")}>
                  Salin
                </button>
              </div>
            )}
            <ul className="time-list">
              {keys.map((key) => (
                <li key={key.id}>
                  <span>
                    <strong>{key.name}</strong> · {key.prefix}…{" "}
                    {key.revokedAt ? "· dicabut" : key.lastUsedAt ? `· dipakai ${formatRelative(key.lastUsedAt)}` : "· belum dipakai"}
                  </span>
                  {!key.revokedAt && (
                    <button
                      type="button"
                      className="text-button danger-text"
                      onClick={() =>
                        void action.run(async () => {
                          await request(`/api/api-keys/${key.id}`, { method: "DELETE" });
                          setKeys((list) => list.map((item) => (item.id === key.id ? { ...item, revokedAt: new Date().toISOString() } : item)));
                          return `Kunci "${key.name}" dicabut.`;
                        }, "Gagal mencabut kunci.")
                      }
                    >
                      Cabut
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <form
              className="task-tag-form"
              onSubmit={(event) => {
                event.preventDefault();
                if (!keyName.trim()) return;
                void action.run(async () => {
                  const result = await request<{ key: string; apiKey: ApiKeyItem }>(
                    "/api/api-keys",
                    { method: "POST", body: JSON.stringify({ name: keyName.trim() }) },
                    "Kunci gagal dibuat."
                  );
                  setKeys((list) => [result.apiKey, ...list]);
                  setNewKey(result.key);
                  setKeyName("");
                }, "Kunci gagal dibuat.");
              }}
            >
              <input className="inline-input" value={keyName} maxLength={60} onChange={(e) => setKeyName(e.target.value)} placeholder="Nama kunci, mis. Integrasi ERP" aria-label="Nama kunci API" />
              <button className="secondary-button" disabled={action.busy || !keyName.trim()}>
                + Buat kunci
              </button>
            </form>
          </div>
        )}
        <SectionMessages error={action.error} notice={action.notice} />
      </section>
    </Modal>
  );
}
