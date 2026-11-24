import { EventEmitter } from "node:events";

export type ChatMessagePayload = {
  id: string;
  conversationId: string;
  body: string | null;
  createdAt: string;
  sender: { id: string; name: string };
  attachments: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
    url: string;
  }>;
};

export type NotificationPayload = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  taskId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type ChatEvent =
  | { type: "message"; memberIds: string[]; message: ChatMessagePayload }
  | { type: "notification"; memberIds: string[]; notification: NotificationPayload }
  | { type: "conversation"; memberIds: string[]; conversationId: string }
  | { type: "presence"; onlineUserIds: string[] };

type ChatBus = EventEmitter & { onChatEvent: unknown };

/*
 * Backend real-time:
 * - "memory" (bawaan): EventEmitter per proses. Cukup untuk satu instance.
 * - "postgres" (REALTIME_BACKEND=postgres): PostgreSQL LISTEN/NOTIFY sehingga
 *   event tersebar ke semua instance yang memakai database yang sama.
 */
const CHANNEL = "rei_events";
const MAX_NOTIFY_BYTES = 7800; // batas payload NOTIFY = 8000 byte
const isPostgresBackend = () => process.env.REALTIME_BACKEND === "postgres";

const globalStore = globalThis as typeof globalThis & {
  __reiChatBus?: ChatBus;
  __reiPgListener?: Promise<void>;
};

function bus(): ChatBus {
  if (!globalStore.__reiChatBus) {
    const emitter = new EventEmitter() as ChatBus;
    emitter.setMaxListeners(0);
    emitter.onChatEvent = true;
    globalStore.__reiChatBus = emitter;
  }
  return globalStore.__reiChatBus;
}

/** Satu koneksi LISTEN per proses; tersambung ulang otomatis bila putus. */
function ensurePgListener() {
  if (globalStore.__reiPgListener) return globalStore.__reiPgListener;
  const connect = async (): Promise<void> => {
    const { Client } = await import("pg");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    const retry = () => {
      globalStore.__reiPgListener = undefined;
      client.removeAllListeners();
      client.end().catch(() => {});
      setTimeout(() => void ensurePgListener(), 3000);
    };
    client.on("error", retry);
    client.on("end", retry);
    client.on("notification", (message) => {
      if (message.channel !== CHANNEL || !message.payload) return;
      try {
        bus().emit("chat", JSON.parse(message.payload) as ChatEvent);
      } catch {
        // Abaikan payload rusak.
      }
    });
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
  };
  globalStore.__reiPgListener = connect().catch((error) => {
    console.error("[realtime] LISTEN gagal, mencoba lagi", error);
    globalStore.__reiPgListener = undefined;
    setTimeout(() => void ensurePgListener(), 3000);
  });
  return globalStore.__reiPgListener;
}

/** Pesan chat yang terlalu besar untuk NOTIFY dikirim sebagai sinyal "muat ulang percakapan". */
function compact(event: ChatEvent): ChatEvent | null {
  if (event.type === "message") {
    return { type: "conversation", memberIds: event.memberIds, conversationId: event.message.conversationId };
  }
  return null;
}

async function pgPublish(event: ChatEvent) {
  let payload = JSON.stringify(event);
  if (Buffer.byteLength(payload) > MAX_NOTIFY_BYTES) {
    const smaller = compact(event);
    if (!smaller) {
      console.error("[realtime] event terlalu besar untuk NOTIFY, dilewati", event.type);
      return;
    }
    payload = JSON.stringify(smaller);
  }
  const { prisma } = await import("@/lib/prisma");
  await prisma.$executeRaw`SELECT pg_notify(${CHANNEL}, ${payload})`;
}

export function publishChatEvent(event: ChatEvent) {
  if (isPostgresBackend()) {
    // Semua instance (termasuk yang ini) menerima event lewat LISTEN.
    void ensurePgListener();
    pgPublish(event).catch((error) => {
      console.error("[realtime] NOTIFY gagal; kirim lokal saja", error);
      bus().emit("chat", event);
    });
    return;
  }
  bus().emit("chat", event);
}

export function subscribeChatEvents(listener: (event: ChatEvent) => void) {
  if (isPostgresBackend()) void ensurePgListener();
  bus().on("chat", listener);
  return () => {
    bus().off("chat", listener);
  };
}
