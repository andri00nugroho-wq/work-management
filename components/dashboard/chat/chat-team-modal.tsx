"use client";

import { faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useMemo, useState } from "react";
import { CHAT_STATUSES, CHAT_STATUS_META, ROLE_LABEL } from "../constants";
import type { ChatState } from "../hooks/use-chat";
import { errorText, initials } from "../lib/format";
import { Modal, ModalHeading } from "../ui";

export default function ChatTeamModal({
  chat,
  userId,
  onClose,
  onOpenDirect,
}: {
  chat: ChatState;
  userId: string;
  onClose: () => void;
  onOpenDirect: (memberId: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { fetchPresence, presenceUsers } = chat;

  // Segarkan status tim setiap kali modal dibuka.
  useEffect(() => {
    fetchPresence().catch((err) => setError(errorText(err, "Gagal memuat status tim.")));
  }, [fetchPresence]);

  const team = useMemo(() => {
    const query = search.trim().toLowerCase();
    const others = presenceUsers
      .filter((person) => person.id !== userId)
      .sort((a, b) => (a.online !== b.online ? (a.online ? -1 : 1) : a.name.localeCompare(b.name)));
    if (!query) return others;
    return others.filter((person) =>
      [person.name, person.division ?? "", CHAT_STATUS_META[person.status].label]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [presenceUsers, search, userId]);

  async function saveStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      await chat.saveStatus();
    } catch (err) {
      setError(errorText(err, "Status gagal disimpan."));
    }
  }

  async function openDirect(memberId: string) {
    if (busyId) return;
    setBusyId(memberId);
    setError("");
    try {
      await onOpenDirect(memberId);
    } catch (err) {
      setError(errorText(err, "Percakapan gagal dibuka."));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Modal onClose={onClose}>
      <div
        className="task-modal chat-team-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Tim dan kehadiran"
      >
        <ModalHeading eyebrow="KEHADIRAN TIM" title="Siapa yang online" onClose={onClose} />

        <form className="chat-status-form" onSubmit={saveStatus}>
          <div className="chat-status-form-label">
            Status saya
            <span>
              {chat.onlineCount} dari {presenceUsers.length} anggota online
            </span>
          </div>
          <div className="chat-status-options" role="group" aria-label="Pilih status kehadiran">
            {CHAT_STATUSES.map((status) => (
              <button
                key={status}
                type="button"
                className={`chat-status-option tone-${CHAT_STATUS_META[status].tone} ${
                  chat.myStatus === status ? "active" : ""
                }`}
                onClick={() => chat.setMyStatus(status)}
              >
                <span className="chat-status-icon"><Icon icon={CHAT_STATUS_META[status].icon} /></span>
                {CHAT_STATUS_META[status].label}
              </button>
            ))}
          </div>
          <div className="chat-status-note-row">
            <input
              value={chat.myStatusNote}
              onChange={(event) => chat.setMyStatusNote(event.target.value)}
              maxLength={80}
              placeholder="Catatan opsional, mis. Rapat sampai 14.00"
              aria-label="Catatan status"
            />
            <button className="primary-button" disabled={chat.statusBusy}>
              {chat.statusBusy ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
          <p className="chat-status-hint">
            Status ini terlihat oleh semua rekan di chat. Status otomatis menjadi Offline saat
            aplikasi ditutup.
          </p>
        </form>

        <div className="search-box chat-team-search">
          <span><Icon icon={faMagnifyingGlass} /></span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau divisi..."
            aria-label="Cari anggota tim"
          />
        </div>

        <div className="chat-team-list">
          {error && <p className="task-link-error chat-team-error">{error}</p>}
          {team.length === 0 && <p className="chat-member-empty">Tidak ada anggota yang cocok.</p>}
          {team.map((person) => {
            const meta = CHAT_STATUS_META[person.status];
            return (
              <button
                key={person.id}
                type="button"
                className="chat-team-row"
                onClick={() => void openDirect(person.id)}
                disabled={busyId === person.id}
              >
                <span className="chat-team-avatar">
                  {initials(person.name)}
                  <span
                    className={`chat-presence-dot ${person.online ? "online" : ""}`}
                    aria-hidden="true"
                  />
                </span>
                <span className="chat-team-info">
                  <strong>{person.name}</strong>
                  <small>
                    {ROLE_LABEL[person.role]}
                    {person.division ? ` · ${person.division}` : ""}
                  </small>
                  {person.note && <small className="chat-team-note">{person.note}</small>}
                </span>
                <span className="chat-team-right">
                  {person.status !== "AVAILABLE" && (
                    <span className={`chat-status-chip tone-${meta.tone}`}>{meta.short}</span>
                  )}
                  <span className={`chat-team-online ${person.online ? "online" : ""}`}>
                    {busyId === person.id ? "Membuka..." : person.online ? "Online" : "Offline"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <p className="chat-team-hint">Klik anggota untuk membuka chat pribadi.</p>
      </div>
    </Modal>
  );
}
