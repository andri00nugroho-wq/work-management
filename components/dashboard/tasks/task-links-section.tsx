"use client";

import { useState } from "react";
import { TASK_LINK_LIMIT } from "../constants";
import { errorText } from "../lib/format";
import { request } from "../lib/http";
import type { Task, TaskLinkDraft, TaskPatcher } from "../types";

const EMPTY_LINK: TaskLinkDraft = { label: "", url: "" };

function toDrafts(task: Task): TaskLinkDraft[] {
  return (task.links ?? []).map(({ label, url }) => ({ label, url }));
}

/** Validasi tautan baru; mengembalikan pesan error atau URL yang sudah dinormalisasi. */
function validateLink(link: TaskLinkDraft, count: number): { error: string } | { url: string } {
  const label = link.label.trim();
  const url = link.url.trim();

  if (!label || label.length > 80 || !url || url.length > 2048) {
    return {
      error: "Nama tautan wajib diisi (maksimal 80 karakter) dan URL maksimal 2048 karakter.",
    };
  }
  if (count >= TASK_LINK_LIMIT) {
    return { error: "Maksimal 20 tautan dapat ditambahkan ke satu tugas." };
  }
  try {
    const parsed = new URL(url);
    if (["http:", "https:"].includes(parsed.protocol) && parsed.hostname) {
      return { url: parsed.toString() };
    }
  } catch {
    // Jatuh ke pesan error di bawah.
  }
  return { error: "Gunakan URL HTTP atau HTTPS yang valid." };
}

export default function TaskLinksSection({
  task,
  canEdit,
  onPatch,
  onClose,
}: {
  task: Task;
  canEdit: boolean;
  onPatch: TaskPatcher;
  onClose: () => void;
}) {
  const [drafts, setDrafts] = useState<TaskLinkDraft[]>(() => toDrafts(task));
  const [newLink, setNewLink] = useState<TaskLinkDraft>(EMPTY_LINK);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  function addLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = validateLink(newLink, drafts.length);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setDrafts((links) => [...links, { label: newLink.label.trim(), url: result.url }]);
    setNewLink(EMPTY_LINK);
    setError("");
    setNotice("");
  }

  async function save() {
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const result = await request<{ task: Task }>(
        `/api/tasks/${task.id}`,
        { method: "PATCH", body: JSON.stringify({ links: drafts }) },
        "Tautan tugas gagal disimpan."
      );
      onPatch(task.id, result.task);
      setDrafts(toDrafts(result.task));
      setNotice("Tautan berhasil disimpan.");
    } catch (err) {
      setError(errorText(err, "Gagal menyimpan tautan tugas."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="task-links-section">
      <div className="task-links-heading">
        <div>
          <h3>Tautan tugas</h3>
          <p>Tambahkan GitHub, dokumen, desain, atau referensi lainnya.</p>
        </div>
        <span>
          {drafts.length}/{TASK_LINK_LIMIT}
        </span>
      </div>

      {drafts.length > 0 ? (
        <ul className="task-links-list">
          {drafts.map((link, index) => (
            <li key={`${link.url}-${index}`}>
              <a href={link.url} target="_blank" rel="noopener noreferrer">
                <span>{link.label}</span>
                <small>{link.url}</small>
              </a>
              <button
                type="button"
                aria-label={`Hapus tautan ${link.label}`}
                onClick={() => {
                  setDrafts((links) => links.filter((_, i) => i !== index));
                  setNotice("");
                }}
              >
                Hapus
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="task-links-empty">Belum ada tautan pada tugas ini.</p>
      )}

      {canEdit && (
        <form className="task-link-form" onSubmit={addLink}>
          <label>
            Nama tautan
            <input
              value={newLink.label}
              maxLength={80}
              onChange={(event) => setNewLink({ ...newLink, label: event.target.value })}
              placeholder="Contoh: GitHub repository"
              required
            />
          </label>
          <label>
            URL
            <input
              type="url"
              value={newLink.url}
              maxLength={2048}
              onChange={(event) => setNewLink({ ...newLink, url: event.target.value })}
              placeholder="https://..."
              required
            />
          </label>
          <button className="secondary-button" type="submit">
            + Tambah tautan
          </button>
        </form>
      )}

      {error && (
        <p className="task-link-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="task-link-notice" role="status">
          {notice}
        </p>
      )}

      <div className="task-modal-actions">
        <button className="secondary-button" type="button" onClick={onClose}>
          Tutup
        </button>
        {canEdit && (
          <button
            className="primary-button"
            type="button"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? "Menyimpan..." : "Simpan tautan"}
          </button>
        )}
      </div>
    </div>
  );
}
