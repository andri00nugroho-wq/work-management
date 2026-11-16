"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { errorText } from "../lib/format";
import { request } from "../lib/http";
import { chatPreviewFromMessage } from "../lib/tasks";
import type {
  ChatConversation,
  ChatLiveState,
  ChatMessage,
  ChatPresenceUser,
  ChatStatus,
  MenuName,
} from "../types";

const OFFLINE_POLL_MS = 15000;
const RECONNECT_MS = 5000;

function byNewest(a: ChatConversation, b: ChatConversation) {
  return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
}

/**
 * State dan aksi chat. Berjalan sepanjang sesi (bukan hanya di menu Chat)
 * agar badge pesan belum dibaca selalu akurat.
 */
export function useChat(userId: string, activeMenu: MenuName) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState("");
  const [live, setLive] = useState<ChatLiveState>("connecting");
  const [presenceUsers, setPresenceUsers] = useState<ChatPresenceUser[]>([]);
  const [myStatus, setMyStatus] = useState<ChatStatus>("AVAILABLE");
  const [myStatusNote, setMyStatusNote] = useState("");
  const [statusBusy, setStatusBusy] = useState(false);
  const activeConversationRef = useRef<string | null>(null);

  /* ---------- Pemuatan data ---------- */

  const loadConversations = useCallback(async (silent = false) => {
    try {
      const result = await request<{ conversations: ChatConversation[] }>(
        "/api/chat/conversations",
        { method: "GET" },
        "Gagal mengambil percakapan."
      );
      setConversations(result.conversations ?? []);
    } catch (err) {
      if (!silent) setError(errorText(err, "Gagal memuat percakapan."));
    } finally {
      setLoading(false);
    }
  }, []);

  /** Melempar error agar pemanggil (modal tim) bisa menampilkannya. */
  const fetchPresence = useCallback(async () => {
    const result = await request<{ users: ChatPresenceUser[] }>(
      "/api/chat/presence",
      { method: "GET" },
      "Gagal mengambil status tim."
    );
    const users = result.users ?? [];
    setPresenceUsers(users);
    const me = users.find((item) => item.id === userId);
    if (me) {
      setMyStatus(me.status);
      setMyStatusNote(me.note ?? "");
    }
  }, [userId]);

  const syncPresence = useCallback(() => {
    fetchPresence().catch(() => {});
  }, [fetchPresence]);

  const markRead = useCallback(async (conversationId: string) => {
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId && conversation.unreadCount > 0
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    );
    try {
      await fetch(`/api/chat/conversations/${conversationId}/read`, {
        method: "POST",
        cache: "no-store",
      });
    } catch {
      // Status baca akan disinkronkan saat percakapan dibuka kembali.
    }
  }, []);

  const loadMessages = useCallback(
    async (conversationId: string, options: { before?: string; silent?: boolean } = {}) => {
      const { before, silent = false } = options;
      try {
        const query = before ? `?before=${encodeURIComponent(before)}` : "";
        const result = await request<{ messages: ChatMessage[]; hasMore: boolean }>(
          `/api/chat/conversations/${conversationId}/messages${query}`,
          { method: "GET" },
          "Gagal memuat pesan."
        );
        setMessages((prev) => {
          if (!before) return result.messages;
          const existing = new Set(prev.map((message) => message.id));
          return [...result.messages.filter((message) => !existing.has(message.id)), ...prev];
        });
        setHasMore(result.hasMore);
        if (!before) void markRead(conversationId);
      } catch (err) {
        if (!silent) setError(errorText(err, "Gagal memuat pesan."));
      } finally {
        if (!before) setMessagesLoading(false);
      }
    },
    [markRead]
  );

  /** Masukkan pesan baru (dari SSE atau kiriman sendiri) ke thread dan daftar. */
  const appendMessage = useCallback(
    (message: ChatMessage) => {
      const isActive = activeConversationRef.current === message.conversationId;
      const isOwn = message.sender.id === userId;

      setMessages((prev) =>
        isActive && !prev.some((item) => item.id === message.id) ? [...prev, message] : prev
      );
      setConversations((prev) => {
        if (!prev.some((conversation) => conversation.id === message.conversationId)) {
          void loadConversations(true);
          return prev;
        }
        return prev
          .map((conversation) =>
            conversation.id === message.conversationId
              ? {
                  ...conversation,
                  updatedAt: message.createdAt,
                  lastMessage: {
                    id: message.id,
                    preview: chatPreviewFromMessage(message),
                    createdAt: message.createdAt,
                    senderName: message.sender.name,
                    attachmentCount: message.attachments.length,
                  },
                  unreadCount: isActive || isOwn ? 0 : conversation.unreadCount + 1,
                }
              : conversation
          )
          .sort(byNewest);
      });
      if (isActive && !isOwn) void markRead(message.conversationId);
    },
    [loadConversations, markRead, userId]
  );

  /* ---------- Efek: sinkronisasi & real-time ---------- */

  // Muat daftar saat aplikasi dibuka agar badge belum dibaca langsung tampil,
  // lalu segarkan tanpa mode senyap ketika menu Chat dibuka.
  useEffect(() => {
    queueMicrotask(() => {
      void loadConversations(activeMenu !== "Chat");
      syncPresence();
    });
  }, [activeMenu, loadConversations, syncPresence]);

  // Koneksi real-time (SSE) untuk semua percakapan pengguna.
  useEffect(() => {
    let source: EventSource | null = null;
    let retry: number | null = null;
    let disposed = false;

    function connect() {
      source = new EventSource("/api/chat/stream");

      source.addEventListener("ready", () => setLive("online"));

      source.addEventListener("message", (event) => {
        try {
          const message = JSON.parse((event as MessageEvent).data) as ChatMessage;
          setLive("online");
          appendMessage(message);
        } catch {
          // Abaikan payload yang tidak valid.
        }
      });

      source.addEventListener("conversation", () => void loadConversations(true));

      source.addEventListener("presence", (event) => {
        try {
          const payload = JSON.parse((event as MessageEvent).data) as {
            onlineUserIds?: string[];
          };
          const online = new Set(payload.onlineUserIds ?? []);
          setPresenceUsers((prev) =>
            prev.map((member) => ({ ...member, online: online.has(member.id) }))
          );
        } catch {
          // Abaikan payload yang tidak valid.
        }
        syncPresence();
      });

      source.onerror = () => {
        setLive("offline");
        source?.close();
        source = null;
        if (!disposed) {
          retry = window.setTimeout(() => {
            setLive("connecting");
            connect();
          }, RECONNECT_MS);
        }
      };
    }

    connect();
    return () => {
      disposed = true;
      if (retry) window.clearTimeout(retry);
      source?.close();
    };
  }, [appendMessage, loadConversations, syncPresence]);

  // Saat real-time terputus, sinkronkan daftar dan pesan secara berkala.
  useEffect(() => {
    if (live !== "offline") return;
    const timer = window.setInterval(() => {
      void loadConversations(true);
      syncPresence();
      if (activeConversationRef.current) {
        void loadMessages(activeConversationRef.current, { silent: true });
      }
    }, OFFLINE_POLL_MS);
    return () => window.clearInterval(timer);
  }, [live, loadConversations, syncPresence, loadMessages]);

  /* ---------- Turunan ---------- */

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversations]
  );

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const presenceById = useMemo(
    () => new Map(presenceUsers.map((person) => [person.id, person])),
    [presenceUsers]
  );

  const onlineCount = useMemo(
    () => presenceUsers.filter((person) => person.online).length,
    [presenceUsers]
  );

  /* ---------- Aksi ---------- */

  const openConversation = useCallback(
    (conversationId: string) => {
      activeConversationRef.current = conversationId;
      setActiveConversationId(conversationId);
      setMessages([]);
      setHasMore(false);
      setMessagesLoading(true);
      setError("");
      void loadMessages(conversationId);
    },
    [loadMessages]
  );

  function closeConversation() {
    activeConversationRef.current = null;
    setActiveConversationId(null);
  }

  function loadOlderMessages() {
    const first = messages[0];
    if (!activeConversationId || !first) return;
    setMessagesLoading(true);
    void loadMessages(activeConversationId, { before: first.createdAt });
  }

  /** Buat (atau buka yang sudah ada) percakapan, lalu tampilkan. Melempar error. */
  async function startConversation(
    memberIds: string[],
    name?: string,
    fallback = "Percakapan gagal dibuat."
  ) {
    const result = await request<{ conversation: ChatConversation }>(
      "/api/chat/conversations",
      { method: "POST", body: JSON.stringify({ memberIds, name }) },
      fallback
    );
    setConversations((prev) => [
      result.conversation,
      ...prev.filter((item) => item.id !== result.conversation.id),
    ]);
    openConversation(result.conversation.id);
  }

  /** Kirim pesan ke percakapan aktif. Melempar error. */
  async function sendMessage(text: string, files: File[]) {
    const conversationId = activeConversationRef.current;
    if (!conversationId) return;

    let body: BodyInit;
    if (files.length > 0) {
      const form = new FormData();
      form.set("body", text);
      files.forEach((file) => form.append("files", file));
      body = form;
    } else {
      body = JSON.stringify({ body: text });
    }

    const result = await request<{ message: ChatMessage }>(
      `/api/chat/conversations/${conversationId}/messages`,
      { method: "POST", body },
      "Pesan gagal dikirim."
    );
    appendMessage(result.message);
  }

  /** Simpan status kehadiran saya. Melempar error. */
  async function saveStatus() {
    if (statusBusy) return;
    setStatusBusy(true);
    try {
      const result = await request<{
        user: { id: string; status: ChatStatus; note: string | null };
      }>(
        "/api/chat/presence",
        { method: "PATCH", body: JSON.stringify({ status: myStatus, note: myStatusNote }) },
        "Status gagal disimpan."
      );
      setMyStatus(result.user.status);
      setMyStatusNote(result.user.note ?? "");
      setPresenceUsers((prev) =>
        prev.map((person) =>
          person.id === result.user.id
            ? { ...person, status: result.user.status, note: result.user.note }
            : person
        )
      );
    } finally {
      setStatusBusy(false);
    }
  }

  return {
    conversations,
    activeConversation,
    messages,
    hasMore,
    loading,
    messagesLoading,
    error,
    setError,
    live,
    presenceUsers,
    presenceById,
    onlineCount,
    unreadTotal,
    myStatus,
    setMyStatus,
    myStatusNote,
    setMyStatusNote,
    statusBusy,
    openConversation,
    closeConversation,
    loadOlderMessages,
    startConversation,
    sendMessage,
    fetchPresence,
    saveStatus,
  };
}

export type ChatState = ReturnType<typeof useChat>;
