"use client";

import { faPaperPlane, faPen, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAsyncAction } from "../hooks/use-async-action";
import { errorText, formatDateTime, formatRelative, initials } from "../lib/format";
import { request } from "../lib/http";
import type { Member, Task, TaskComment, TaskPatcher } from "../types";
import { SectionMessages, TaskSection } from "../ui";

/** Sorot "@Nama" untuk orang yang benar-benar di-mention. */
function renderBody(comment: TaskComment, members: Member[]): ReactNode {
  const names = members
    .filter((member) => comment.mentionIds.includes(member.id))
    .map((member) => member.name)
    .sort((a, b) => b.length - a.length);
  if (!names.length) return comment.body;
  const escaped = names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const parts = comment.body.split(new RegExp(`(@(?:${escaped.join("|")}))`, "g"));
  return parts.map((part, index) =>
    part.startsWith("@") && names.includes(part.slice(1)) ? (
      <mark key={index} className="mention">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function TaskCommentsSection({
  task,
  userId,
  members,
  canModerate,
  onPatch,
}: {
  task: Task;
  userId: string;
  members: Member[];
  canModerate: boolean;
  onPatch: TaskPatcher;
}) {
  const [comments, setComments] = useState<TaskComment[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [text, setText] = useState("");
  const [mentions, setMentions] = useState<Member[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; body: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Posisi kursor setelah memilih mention; diterapkan sinkron sesudah render
  // agar ketikan berikutnya tidak tersisip di tempat yang salah.
  const pendingCaret = useRef<number | null>(null);
  const action = useAsyncAction();

  useLayoutEffect(() => {
    const caret = pendingCaret.current;
    const textarea = textareaRef.current;
    if (caret === null || !textarea) return;
    pendingCaret.current = null;
    textarea.focus();
    textarea.setSelectionRange(caret, caret);
  }, [text]);

  useEffect(() => {
    let cancelled = false;
    request<{ comments: TaskComment[] }>(`/api/tasks/${task.id}/comments`, {}, "Komentar gagal dimuat.")
      .then((result) => !cancelled && setComments(result.comments))
      .catch((err) => !cancelled && setLoadError(errorText(err, "Komentar gagal dimuat.")));
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  const suggestions = useMemo(() => {
    if (query === null) return [];
    const q = query.toLowerCase();
    return members.filter((member) => member.id !== userId && member.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query, members, userId]);

  /** Deteksi "@nama" (boleh berspasi) tepat sebelum kursor, selama masih cocok dengan anggota. */
  function onType(value: string) {
    setText(value);
    const caret = textareaRef.current?.selectionStart ?? value.length;
    const match = /(^|\s)@([^@\n]{0,30})$/.exec(value.slice(0, caret));
    const q = match?.[2].toLowerCase();
    const matches =
      q !== undefined && members.some((member) => member.id !== userId && member.name.toLowerCase().includes(q));
    setQuery(matches ? match![2] : null);
  }

  function pick(member: Member) {
    const caret = textareaRef.current?.selectionStart ?? text.length;
    const before = text.slice(0, caret).replace(/@([^@\n]{0,30})$/, `@${member.name} `);
    const next = before + text.slice(caret);
    setText(next);
    setQuery(null);
    setMentions((list) => (list.some((item) => item.id === member.id) ? list : [...list, member]));
    pendingCaret.current = before.length;
  }

  function send(event?: React.FormEvent) {
    event?.preventDefault();
    const body = text.trim();
    if (!body) return;
    // Hanya mention yang namanya masih ada di teks.
    const mentionIds = mentions.filter((member) => body.includes(`@${member.name}`)).map((member) => member.id);
    void action.run(async () => {
      const result = await request<{ comment: TaskComment; taggedIds: string[] }>(
        `/api/tasks/${task.id}/comments`,
        { method: "POST", body: JSON.stringify({ body, mentionIds }) },
        "Komentar gagal dikirim."
      );
      setComments((list) => [...(list ?? []), result.comment]);
      onPatch(task.id, { _count: { ...task._count, comments: (task._count?.comments ?? 0) + 1 } });
      setText("");
      setMentions([]);
      return result.taggedIds.length
        ? `${result.taggedIds.length} orang yang di-mention otomatis di-tag agar bisa melihat tugas.`
        : "";
    }, "Komentar gagal dikirim.");
  }

  function saveEdit(event: React.FormEvent) {
    event.preventDefault();
    if (!editing?.body.trim()) return;
    void action.run(async () => {
      const result = await request<{ comment: TaskComment }>(
        `/api/tasks/${task.id}/comments/${editing.id}`,
        { method: "PATCH", body: JSON.stringify({ body: editing.body }) },
        "Komentar gagal disunting."
      );
      setComments((list) => (list ?? []).map((item) => (item.id === result.comment.id ? result.comment : item)));
      setEditing(null);
    }, "Komentar gagal disunting.");
  }

  function remove(comment: TaskComment) {
    if (!window.confirm("Hapus komentar ini?")) return;
    void action.run(async () => {
      await request(`/api/tasks/${task.id}/comments/${comment.id}`, { method: "DELETE" }, "Komentar gagal dihapus.");
      setComments((list) => (list ?? []).filter((item) => item.id !== comment.id));
      onPatch(task.id, { _count: { ...task._count, comments: Math.max(0, (task._count?.comments ?? 1) - 1) } });
    }, "Komentar gagal dihapus.");
  }

  return (
    <TaskSection
      title="Diskusi"
      subtitle="Komentar di dalam tugas. Ketik @ untuk menyebut rekan."
      aside={comments ? `${comments.length} komentar` : "Memuat..."}
    >
      {loadError && <p className="task-link-error">{loadError}</p>}
      {comments && comments.length === 0 && <p className="task-tag-empty">Belum ada diskusi.</p>}
      {comments && comments.length > 0 && (
        <ul className="comment-list">
          {comments.map((comment) => (
            <li key={comment.id} className={comment.author.id === userId ? "mine" : ""}>
              <span className="task-tag-avatar">{initials(comment.author.name)}</span>
              <div className="comment-body">
                <div className="comment-meta">
                  <strong>{comment.author.name}</strong>
                  <time dateTime={comment.createdAt} title={formatDateTime(comment.createdAt)}>
                    {formatRelative(comment.createdAt)}
                    {comment.editedAt ? " · disunting" : ""}
                  </time>
                  <span className="comment-actions">
                    {comment.author.id === userId && (
                      <button
                        type="button"
                        aria-label="Sunting komentar"
                        onClick={() => setEditing({ id: comment.id, body: comment.body })}
                      >
                        <Icon icon={faPen} />
                      </button>
                    )}
                    {(comment.author.id === userId || canModerate) && (
                      <button type="button" aria-label="Hapus komentar" onClick={() => remove(comment)}>
                        <Icon icon={faTrashCan} />
                      </button>
                    )}
                  </span>
                </div>
                {editing?.id === comment.id ? (
                  <form className="comment-edit" onSubmit={saveEdit}>
                    <textarea
                      rows={3}
                      maxLength={5000}
                      value={editing.body}
                      onChange={(event) => setEditing({ id: comment.id, body: event.target.value })}
                      aria-label="Sunting komentar"
                    />
                    <div>
                      <button type="button" className="text-button" onClick={() => setEditing(null)}>
                        Batal
                      </button>
                      <button className="secondary-button" disabled={action.busy}>
                        Simpan
                      </button>
                    </div>
                  </form>
                ) : (
                  <p>{renderBody(comment, members)}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <form className="comment-composer" onSubmit={send}>
        <textarea
          ref={textareaRef}
          rows={2}
          maxLength={5000}
          value={text}
          onChange={(event) => onType(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && query !== null) {
              event.stopPropagation();
              setQuery(null);
            }
            if (event.key === "Enter" && suggestions.length && query !== null) {
              event.preventDefault();
              pick(suggestions[0]);
            } else if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              send();
            }
          }}
          placeholder="Tulis komentar… (@ untuk mention, Ctrl+Enter untuk kirim)"
          aria-label="Tulis komentar"
        />
        {suggestions.length > 0 && (
          <ul className="mention-suggestions" role="listbox" aria-label="Saran mention">
            {suggestions.map((member) => (
              <li key={member.id}>
                <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => pick(member)}>
                  <span className="task-tag-avatar">{initials(member.name)}</span>
                  {member.name}
                </button>
              </li>
            ))}
          </ul>
        )}
        <button className="primary-button" disabled={action.busy || !text.trim()}>
          <Icon icon={faPaperPlane} /> Kirim
        </button>
      </form>
      <SectionMessages error={action.error} notice={action.notice} />
    </TaskSection>
  );
}
