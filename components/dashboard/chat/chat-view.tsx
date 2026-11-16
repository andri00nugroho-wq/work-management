"use client";

import { useMemo, useState } from "react";
import { CHAT_STATUS_META } from "../constants";
import type { ChatState } from "../hooks/use-chat";
import { formatChatStamp } from "../lib/format";
import type { ChatConversation, DashboardUser, Member } from "../types";
import { Alert } from "../ui";
import ChatCreateModal from "./chat-create-modal";
import ConversationAvatar from "./conversation-avatar";
import ChatTeamModal from "./chat-team-modal";
import ChatThread from "./chat-thread";

const LIVE_LABEL = {
  online: "Real-time aktif",
  connecting: "Menyambung...",
  offline: "Offline",
} as const;

export default function ChatView({
  chat,
  user,
  members,
  ensureMembers,
}: {
  chat: ChatState;
  user: DashboardUser;
  members: Member[];
  ensureMembers: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [createError, setCreateError] = useState("");
  const status = CHAT_STATUS_META[chat.myStatus];

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return chat.conversations;
    return chat.conversations.filter((conversation) =>
      [conversation.title, ...conversation.members.map((member) => member.name)]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [chat.conversations, search]);

  function openCreate() {
    setShowCreate(true);
    setCreateError("");
    ensureMembers().catch(() => setCreateError("Gagal memuat daftar anggota."));
  }

  return (
    <section className="panel chat-panel">
      <Alert
        kind="error"
        className="chat-error"
        message={chat.error}
        onClose={() => chat.setError("")}
      />

      <div className={`chat-layout ${chat.activeConversation ? "has-active" : ""}`}>
        <aside className="chat-sidebar">
          <div className="chat-sidebar-head">
            <div>
              <h2>Pesan</h2>
              <p>
                {chat.conversations.length} percakapan
                <span className={`chat-live chat-live-${chat.live}`}>{LIVE_LABEL[chat.live]}</span>
              </p>
            </div>
            <button type="button" className="primary-button chat-new" onClick={openCreate}>
              ＋ Baru
            </button>
          </div>

          <div className="chat-presence-bar">
            <button
              type="button"
              className={`chat-self-status tone-${status.tone}`}
              onClick={() => setShowTeam(true)}
              title="Atur status kehadiran Anda"
            >
              <span className="chat-status-icon">{status.icon}</span>
              <span className="chat-self-status-text">
                <small>Status saya</small>
                <strong>{status.label}</strong>
              </span>
              <span className="chat-self-status-edit">Ubah</span>
            </button>
            <button
              type="button"
              className="chat-team-button"
              onClick={() => setShowTeam(true)}
              title="Lihat siapa yang online"
            >
              <span className="chat-presence-dot online" />
              <span>
                {chat.onlineCount} <small>online</small>
              </span>
            </button>
          </div>

          <div className="search-box chat-search">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari percakapan..."
              aria-label="Cari percakapan"
            />
          </div>

          <div className="chat-conversation-list">
            {chat.loading && chat.conversations.length === 0 && (
              <div className="chat-list-empty">Memuat percakapan...</div>
            )}
            {!chat.loading && filteredConversations.length === 0 && (
              <div className="chat-list-empty">
                Belum ada percakapan.
                <button type="button" className="text-button" onClick={openCreate}>
                  Mulai sekarang →
                </button>
              </div>
            )}
            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.id}
                conversation={conversation}
                chat={chat}
                userId={user.id}
              />
            ))}
          </div>
        </aside>

        <div className="chat-thread">
          {chat.activeConversation ? (
            <ChatThread
              key={chat.activeConversation.id}
              chat={chat}
              conversation={chat.activeConversation}
              userId={user.id}
              onOpenTeam={() => setShowTeam(true)}
            />
          ) : (
            <div className="chat-idle">
              <span className="chat-idle-mark">✉</span>
              <strong>Pilih percakapan</strong>
              <p>
                Pilih dari daftar di samping, atau mulai percakapan baru untuk mengirim pesan dan
                berkas secara real-time.
              </p>
              <button type="button" className="primary-button" onClick={openCreate}>
                ＋ Percakapan Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <ChatCreateModal
          userId={user.id}
          members={members}
          loadError={createError}
          onClose={() => setShowCreate(false)}
          onCreate={async (memberIds, name) => {
            await chat.startConversation(memberIds, name);
            setShowCreate(false);
          }}
        />
      )}

      {showTeam && (
        <ChatTeamModal
          chat={chat}
          userId={user.id}
          onClose={() => setShowTeam(false)}
          onOpenDirect={async (memberId) => {
            await chat.startConversation([memberId], undefined, "Percakapan gagal dibuka.");
            setShowTeam(false);
          }}
        />
      )}
    </section>
  );
}

function ConversationItem({
  conversation,
  chat,
  userId,
}: {
  conversation: ChatConversation;
  chat: ChatState;
  userId: string;
}) {
  const partner =
    conversation.kind === "DIRECT"
      ? conversation.members.find((member) => member.id !== userId) ?? null
      : null;
  const presence = partner ? chat.presenceById.get(partner.id) ?? null : null;
  const status = presence ? CHAT_STATUS_META[presence.status] : null;
  const active = conversation.id === chat.activeConversation?.id;

  return (
    <button
      type="button"
      className={`chat-conversation ${active ? "active" : ""} ${
        conversation.unreadCount > 0 ? "unread" : ""
      }`}
      onClick={() => chat.openConversation(conversation.id)}
    >
      <ConversationAvatar conversation={conversation} online={presence?.online} />
      <span className="chat-conversation-body">
        <span className="chat-conversation-top">
          <strong>{conversation.title}</strong>
          <time>
            {conversation.lastMessage ? formatChatStamp(conversation.lastMessage.createdAt) : ""}
          </time>
        </span>
        <span className="chat-conversation-bottom">
          {presence && status && presence.status !== "AVAILABLE" && (
            <span
              className={`chat-status-chip tone-${status.tone}`}
              title={presence.note ?? status.label}
            >
              {status.short}
            </span>
          )}
          <small>
            {conversation.lastMessage
              ? `${conversation.lastMessage.senderName}: ${conversation.lastMessage.preview}`
              : "Belum ada pesan"}
          </small>
          {conversation.unreadCount > 0 && (
            <span className="chat-unread">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}
