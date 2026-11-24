"use client";

import { faCircle, faDownload, faFile } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
import { useEffect, useRef } from "react";
import { CHAT_STATUS_META } from "../constants";
import type { ChatState } from "../hooks/use-chat";
import { formatChatStamp, formatFileSize, initials } from "../lib/format";
import { isImageMime } from "../lib/tasks";
import type { ChatConversation, ChatMessage } from "../types";
import ChatComposer from "./chat-composer";
import ConversationAvatar from "./conversation-avatar";

export default function ChatThread({
  chat,
  conversation,
  userId,
  onOpenTeam,
}: {
  chat: ChatState;
  conversation: ChatConversation;
  userId: string;
  onOpenTeam: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const { messages, messagesLoading } = chat;

  const partner =
    conversation.kind === "DIRECT"
      ? conversation.members.find((member) => member.id !== userId) ?? null
      : null;
  const partnerPresence = partner ? chat.presenceById.get(partner.id) ?? null : null;
  const onlineMembers = conversation.members.filter(
    (member) => chat.presenceById.get(member.id)?.online
  ).length;

  // Selalu gulir ke pesan terbaru.
  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, messagesLoading]);

  return (
    <>
      <header className="chat-thread-head">
        <button
          type="button"
          className="chat-back"
          aria-label="Kembali ke daftar percakapan"
          onClick={chat.closeConversation}
        >
          ‹
        </button>
        <ConversationAvatar conversation={conversation} online={partnerPresence?.online} />
        <div className="chat-thread-info">
          <strong>{conversation.title}</strong>
          {conversation.kind === "GROUP" ? (
            <span>
              {conversation.members.length} anggota · {onlineMembers} online
            </span>
          ) : (
            <span className="chat-thread-presence">
              <span
                className={`chat-presence-dot ${partnerPresence?.online ? "online" : ""}`}
                aria-hidden="true"
              />
              {partnerPresence?.online ? "Online" : "Offline"}
              {partnerPresence && partnerPresence.status !== "AVAILABLE" && (
                <span
                  className={`chat-status-chip tone-${CHAT_STATUS_META[partnerPresence.status].tone}`}
                >
                  {CHAT_STATUS_META[partnerPresence.status].label}
                </span>
              )}
              {partnerPresence?.note && (
                <span className="chat-status-note">{partnerPresence.note}</span>
              )}
            </span>
          )}
        </div>
        <button
          type="button"
          className="chat-thread-team"
          onClick={onOpenTeam}
          title="Lihat status tim"
        >
          <Icon icon={faCircle} /> {chat.onlineCount} online
        </button>
      </header>

      <div className="chat-messages" ref={scrollRef}>
        {chat.hasMore && (
          <button
            type="button"
            className="chat-load-more"
            disabled={messagesLoading}
            onClick={chat.loadOlderMessages}
          >
            {messagesLoading ? "Memuat pesan lama..." : "Muat pesan sebelumnya"}
          </button>
        )}

        {messagesLoading && messages.length === 0 && (
          <div className="chat-thread-empty">Memuat pesan...</div>
        )}

        {!messagesLoading && messages.length === 0 && (
          <div className="chat-thread-empty">
            <strong>Mulai percakapan</strong>
            <p>Kirim pesan atau berkas pertama di sini.</p>
          </div>
        )}

        {messages.map((message) => (
          <MessageItem key={message.id} message={message} own={message.sender.id === userId} />
        ))}
      </div>

      <ChatComposer onSend={chat.sendMessage} onError={chat.setError} />
    </>
  );
}

function MessageItem({ message, own }: { message: ChatMessage; own: boolean }) {
  return (
    <article className={`chat-message ${own ? "own" : ""}`}>
      {!own && <span className="chat-message-avatar">{initials(message.sender.name)}</span>}
      <div className="chat-message-body">
        {!own && <span className="chat-message-sender">{message.sender.name}</span>}
        <div className="chat-bubble">
          {message.body && <p>{message.body}</p>}
          {message.attachments.length > 0 && (
            <div className="chat-attachments">
              {message.attachments.map((attachment) =>
                isImageMime(attachment.mimeType) ? (
                  <a
                    key={attachment.id}
                    className="chat-image"
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={attachment.url} alt={attachment.name} loading="lazy" />
                    <span>{attachment.name}</span>
                  </a>
                ) : (
                  <a key={attachment.id} className="chat-file" href={attachment.url}>
                    <span className="chat-file-icon">
                      {attachment.mimeType === "application/pdf" ? "PDF" : <Icon icon={faFile} />}
                    </span>
                    <span className="chat-file-text">
                      <strong>{attachment.name}</strong>
                      <small>{formatFileSize(attachment.size)}</small>
                    </span>
                    <span className="chat-file-download"><Icon icon={faDownload} /></span>
                  </a>
                )
              )}
            </div>
          )}
        </div>
        <time className="chat-message-time">{formatChatStamp(message.createdAt)}</time>
      </div>
    </article>
  );
}
