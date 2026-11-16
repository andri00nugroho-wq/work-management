"use client";

import { useMemo, useState } from "react";
import { ROLE_LABEL } from "../constants";
import { errorText, initials } from "../lib/format";
import { request } from "../lib/http";
import type { Member, Task, TaskPatcher, TaskTag } from "../types";

export default function TaskTagsSection({
  task,
  userId,
  members,
  canEdit,
  onPatch,
}: {
  task: Task;
  userId: string;
  members: Member[];
  canEdit: boolean;
  onPatch: TaskPatcher;
}) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const tags = useMemo(() => task.tags ?? [], [task.tags]);

  const availableMembers = useMemo(() => {
    const tagged = new Set(tags.map((tag) => tag.user.id));
    return members.filter((member) => member.id !== userId && !tagged.has(member.id));
  }, [members, tags, userId]);

  async function run(action: () => Promise<string>, fallback: string) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      setNotice(await action());
    } catch (err) {
      setError(errorText(err, fallback));
    } finally {
      setBusy(false);
    }
  }

  function addTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUserId || busy) return;

    const name = members.find((member) => member.id === selectedUserId)?.name ?? "Rekan";
    void run(async () => {
      const result = await request<{ tags: TaskTag[]; added: boolean }>(
        `/api/tasks/${task.id}/tags`,
        { method: "POST", body: JSON.stringify({ userId: selectedUserId }) },
        "Rekan gagal ditandai."
      );
      onPatch(task.id, { tags: result.tags });
      setSelectedUserId("");
      return result.added
        ? `${name} sekarang bisa melihat tugas ini.`
        : `${name} sudah ditandai sebelumnya.`;
    }, "Gagal menandai rekan.");
  }

  function removeTag(memberId: string) {
    if (busy) return;

    const name = tags.find((tag) => tag.user.id === memberId)?.user.name ?? "Rekan";
    void run(async () => {
      const result = await request<{ tags: TaskTag[]; removed: boolean }>(
        `/api/tasks/${task.id}/tags?userId=${encodeURIComponent(memberId)}`,
        { method: "DELETE" },
        "Tanda rekan gagal dilepas."
      );
      onPatch(task.id, { tags: result.tags });
      return result.removed
        ? `${name} tidak lagi ditandai pada tugas ini.`
        : `${name} memang belum ditandai.`;
    }, "Gagal melepas tanda rekan.");
  }

  return (
    <div className="task-tags-section">
      <div className="task-tags-heading">
        <div>
          <h3>Tag rekan</h3>
          <p>
            Rekan yang di-tag otomatis bisa melihat tugas ini beserta perubahan status dan
            riwayatnya.
          </p>
        </div>
        <span>{tags.length} rekan</span>
      </div>

      {tags.length ? (
        <ul className="task-tag-list">
          {tags.map((tag) => (
            <li key={tag.id}>
              <span className="task-tag-avatar">{initials(tag.user.name)}</span>
              <span className="task-tag-info">
                <strong>{tag.user.name}</strong>
                <small>ditandai oleh {tag.taggedBy.name}</small>
              </span>
              {canEdit && (
                <button
                  type="button"
                  className="task-tag-remove"
                  onClick={() => removeTag(tag.user.id)}
                  disabled={busy}
                  aria-label={`Lepas tanda ${tag.user.name}`}
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="task-tag-empty">Belum ada rekan yang di-tag.</p>
      )}

      {canEdit ? (
        <form className="task-tag-form" onSubmit={addTag}>
          <select
            value={selectedUserId}
            onChange={(event) => {
              setSelectedUserId(event.target.value);
              setError("");
              setNotice("");
            }}
            aria-label="Pilih rekan untuk di-tag"
          >
            <option value="">{members.length === 0 ? "Memuat anggota..." : "Pilih rekan..."}</option>
            {availableMembers.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} · {ROLE_LABEL[member.role]}
                {member.division?.name ? ` · ${member.division.name}` : ""}
              </option>
            ))}
          </select>
          <button
            className="secondary-button"
            disabled={busy || !selectedUserId || members.length === 0}
          >
            {busy ? "Memproses..." : "+ Tag rekan"}
          </button>
        </form>
      ) : (
        <p className="task-tag-hint">
          Hanya pembuat, penanggung jawab, atau manajer yang dapat mengubah tag.
        </p>
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
    </div>
  );
}
