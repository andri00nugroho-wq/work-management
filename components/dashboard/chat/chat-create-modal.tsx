"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useState } from "react";
import { ROLE_LABEL } from "../constants";
import { errorText, initials } from "../lib/format";
import type { Member } from "../types";
import { Modal, ModalHeading } from "../ui";

export default function ChatCreateModal({
  userId,
  members,
  loadError,
  onClose,
  onCreate,
}: {
  userId: string;
  members: Member[];
  loadError: string;
  onClose: () => void;
  onCreate: (memberIds: string[], name?: string) => Promise<void>;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const others = members.filter((member) => member.id !== userId);
  const isGroup = selected.length > 1;

  function toggle(memberId: string) {
    setSelected((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) {
      setError("Pilih minimal satu anggota.");
      return;
    }

    setBusy(true);
    setError("");
    try {
      await onCreate(selected, isGroup ? name.trim() : undefined);
    } catch (err) {
      setError(errorText(err, "Percakapan gagal dibuat."));
      setBusy(false);
    }
  }

  const shownError = error || loadError;

  return (
    <Modal onClose={onClose}>
      <form className="task-modal chat-create-modal" onSubmit={submit}>
        <ModalHeading eyebrow="PESAN BARU" title="Mulai percakapan" onClose={onClose} />

        <p className="chat-create-hint">
          Pilih satu orang untuk chat pribadi, atau beberapa orang untuk grup tim.
        </p>

        <label className="chat-create-name">
          Nama grup (opsional)
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder="Contoh: Tim Marketing"
            disabled={!isGroup}
          />
        </label>

        <div className="chat-member-list" role="group" aria-label="Pilih anggota">
          {others.map((member) => {
            const checked = selected.includes(member.id);
            return (
              <label key={member.id} className={`chat-member ${checked ? "selected" : ""}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(member.id)} />
                <span className="member-avatar">{initials(member.name)}</span>
                <span className="chat-member-info">
                  <strong>{member.name}</strong>
                  <small>
                    {ROLE_LABEL[member.role]}
                    {member.division?.name ? ` · ${member.division.name}` : ""}
                  </small>
                </span>
                <span className="chat-member-check" aria-hidden="true">
                  <Icon icon={faCheck} />
                </span>
              </label>
            );
          })}
          {others.length === 0 && <p className="chat-member-empty">Belum ada anggota lain.</p>}
        </div>

        {shownError && <p className="task-link-error">{shownError}</p>}

        <div className="task-modal-actions">
          <button type="button" className="secondary-button" onClick={onClose} disabled={busy}>
            Batal
          </button>
          <button className="primary-button" disabled={busy || selected.length === 0}>
            {busy ? "Membuat..." : isGroup ? "Buat Grup" : "Mulai Chat"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
