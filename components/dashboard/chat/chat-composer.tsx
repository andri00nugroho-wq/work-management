"use client";

import { useRef, useState } from "react";
import { CHAT_MAX_FILES, CHAT_MAX_FILE_SIZE } from "../constants";
import { errorText, formatFileSize } from "../lib/format";

export default function ChatComposer({
  onSend,
  onError,
}: {
  onSend: (text: string, files: File[]) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function pickFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    if (incoming.length === 0) return;

    const tooLarge = incoming.find((file) => file.size > CHAT_MAX_FILE_SIZE);
    if (tooLarge) {
      onError(`Berkas "${tooLarge.name}" melebihi 50 MB.`);
      return;
    }

    onError("");
    setFiles((prev) => [...prev, ...incoming].slice(0, CHAT_MAX_FILES));
  }

  async function send(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const text = draft.trim();
    if (sending || (!text && files.length === 0)) return;

    setSending(true);
    onError("");
    try {
      await onSend(text, files);
      setDraft("");
      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      onError(errorText(err, "Pesan gagal dikirim."));
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      className={`chat-composer ${dragging ? "dragging" : ""}`}
      onSubmit={send}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        pickFiles(event.dataTransfer.files);
      }}
    >
      {files.length > 0 && (
        <div className="chat-pending-files">
          {files.map((file, index) => (
            <span className="chat-pending-file" key={`${file.name}-${index}`}>
              <span className="chat-pending-name">{file.name}</span>
              <small>{formatFileSize(file.size)}</small>
              <button
                type="button"
                aria-label={`Hapus ${file.name}`}
                onClick={() => setFiles((prev) => prev.filter((_, i) => i !== index))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          if (event.target.files) pickFiles(event.target.files);
          event.target.value = "";
        }}
      />

      <div className="chat-composer-row">
        <button
          type="button"
          className="chat-attach"
          title="Lampirkan berkas apa pun"
          aria-label="Lampirkan berkas"
          onClick={() => fileInputRef.current?.click()}
        >
          ＋
        </button>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
          placeholder="Tulis pesan... (Enter kirim, Shift+Enter baris baru)"
          rows={1}
          maxLength={8000}
        />
        <button
          className="primary-button chat-send"
          disabled={sending || (!draft.trim() && files.length === 0)}
        >
          {sending ? "Mengirim..." : "Kirim"}
        </button>
      </div>
      <span className="chat-composer-hint">
        Berkas apa pun · maks 50 MB per berkas · 10 berkas per pesan
      </span>
    </form>
  );
}
