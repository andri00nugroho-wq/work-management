"use client";

import { faCloudArrowUp, faDownload, faFile, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAsyncAction } from "../hooks/use-async-action";
import { errorText, formatFileSize, formatRelative } from "../lib/format";
import { request } from "../lib/http";
import { isImageMime } from "../lib/tasks";
import type { Task, TaskAttachment, TaskPatcher } from "../types";
import { SectionMessages, TaskSection } from "../ui";

const MAX_BYTES = 25 * 1024 * 1024;

/** Lampiran tugas; unggah ulang nama yang sama = versi revisi baru. */
export default function TaskAttachmentsSection({
  task,
  userId,
  canModerate,
  onPatch,
}: {
  task: Task;
  userId: string;
  canModerate: boolean;
  onPatch: TaskPatcher;
}) {
  const [attachments, setAttachments] = useState<TaskAttachment[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [openHistory, setOpenHistory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const action = useAsyncAction();

  useEffect(() => {
    let cancelled = false;
    request<{ attachments: TaskAttachment[] }>(`/api/tasks/${task.id}/attachments`, {}, "Lampiran gagal dimuat.")
      .then((result) => !cancelled && setAttachments(result.attachments))
      .catch((err) => !cancelled && setLoadError(errorText(err, "Lampiran gagal dimuat.")));
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  /** Kelompokkan per nama berkas; versi terbaru di depan. */
  const groups = useMemo(() => {
    const map = new Map<string, TaskAttachment[]>();
    for (const item of attachments ?? []) map.set(item.name, [...(map.get(item.name) ?? []), item]);
    return Array.from(map.values()).map((versions) => versions.sort((a, b) => b.version - a.version));
  }, [attachments]);

  const isRevision = Boolean(file && groups.some((versions) => versions[0].name === file.name.trim()));
  const url = (item: TaskAttachment, download = false) =>
    `/api/tasks/${task.id}/attachments/${item.id}${download ? "?download" : ""}`;

  function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) return;
    if (file.size > MAX_BYTES) return action.setError("Ukuran berkas maksimal 25 MB.");
    const form = new FormData();
    form.set("file", file);
    if (note.trim()) form.set("note", note.trim());
    void action.run(async () => {
      const result = await request<{ attachment: TaskAttachment }>(
        `/api/tasks/${task.id}/attachments`,
        { method: "POST", body: form },
        "Berkas gagal diunggah."
      );
      setAttachments((list) => [...(list ?? []), result.attachment]);
      onPatch(task.id, { _count: { ...task._count, attachments: (task._count?.attachments ?? 0) + 1 } });
      setFile(null);
      setNote("");
      if (inputRef.current) inputRef.current.value = "";
      return result.attachment.version > 1
        ? `Revisi v${result.attachment.version} "${result.attachment.name}" diunggah.`
        : `"${result.attachment.name}" dilampirkan.`;
    }, "Berkas gagal diunggah.");
  }

  function remove(item: TaskAttachment) {
    if (!window.confirm(`Hapus "${item.name}" v${item.version}?`)) return;
    void action.run(async () => {
      await request(`/api/tasks/${task.id}/attachments/${item.id}`, { method: "DELETE" }, "Lampiran gagal dihapus.");
      setAttachments((list) => (list ?? []).filter((entry) => entry.id !== item.id));
      onPatch(task.id, { _count: { ...task._count, attachments: Math.max(0, (task._count?.attachments ?? 1) - 1) } });
    }, "Lampiran gagal dihapus.");
  }

  return (
    <TaskSection
      title="Lampiran & revisi"
      subtitle="Dokumen, desain, atau gambar. Unggah ulang berkas bernama sama untuk mencatat revisi."
      aside={attachments ? `${groups.length} berkas` : "Memuat..."}
    >
      {loadError && <p className="task-link-error">{loadError}</p>}
      {groups.length > 0 && (
        <ul className="attachment-list">
          {groups.map((versions) => {
            const latest = versions[0];
            return (
              <li key={latest.name}>
                <div className="attachment-row">
                  {isImageMime(latest.mimeType) ? (
                    // eslint-disable-next-line @next/next/no-img-element -- pratinjau berkas privat via API
                    <img className="attachment-thumb" src={url(latest)} alt="" />
                  ) : (
                    <span className="attachment-thumb">
                      <Icon icon={faFile} />
                    </span>
                  )}
                  <div className="attachment-info">
                    <a href={url(latest)} target="_blank" rel="noreferrer">
                      {latest.name}
                    </a>
                    <small>
                      v{latest.version} · {formatFileSize(latest.size)} · {latest.uploadedBy.name} ·{" "}
                      {formatRelative(latest.createdAt)}
                    </small>
                    {latest.note && <small className="attachment-note">“{latest.note}”</small>}
                  </div>
                  <a className="icon-action" href={url(latest, true)} aria-label={`Unduh ${latest.name}`}>
                    <Icon icon={faDownload} />
                  </a>
                  {(latest.uploadedBy.id === userId || canModerate) && (
                    <button
                      type="button"
                      className="icon-action danger"
                      aria-label={`Hapus ${latest.name} v${latest.version}`}
                      onClick={() => remove(latest)}
                    >
                      <Icon icon={faTrashCan} />
                    </button>
                  )}
                </div>
                {versions.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="text-button attachment-history-toggle"
                      onClick={() => setOpenHistory(openHistory === latest.name ? null : latest.name)}
                    >
                      {openHistory === latest.name ? "Sembunyikan" : "Lihat"} {versions.length - 1} revisi sebelumnya
                    </button>
                    {openHistory === latest.name && (
                      <ol className="attachment-versions">
                        {versions.slice(1).map((item) => (
                          <li key={item.id}>
                            <a href={url(item)} target="_blank" rel="noreferrer">
                              v{item.version}
                            </a>{" "}
                            · {item.uploadedBy.name} · {formatRelative(item.createdAt)}
                            {item.note ? ` · “${item.note}”` : ""}
                          </li>
                        ))}
                      </ol>
                    )}
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {attachments && groups.length === 0 && <p className="task-tag-empty">Belum ada lampiran.</p>}

      <form className="attachment-form" onSubmit={upload}>
        <label className="attachment-picker">
          <Icon icon={faCloudArrowUp} />
          <span>{file ? `${file.name} (${formatFileSize(file.size)})` : "Pilih berkas (maks. 25 MB)"}</span>
          <input
            ref={inputRef}
            type="file"
            onChange={(event) => {
              action.clear();
              setFile(event.target.files?.[0] ?? null);
            }}
          />
        </label>
        {file && (
          <input
            className="inline-input"
            value={note}
            maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder={isRevision ? "Catatan revisi (apa yang berubah?)" : "Catatan (opsional)"}
            aria-label="Catatan lampiran"
          />
        )}
        <button className="secondary-button" disabled={!file || action.busy}>
          {action.busy ? "Mengunggah..." : isRevision ? "Unggah revisi" : "Unggah"}
        </button>
      </form>
      <SectionMessages error={action.error} notice={action.notice} />
    </TaskSection>
  );
}
