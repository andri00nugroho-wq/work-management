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

export type ChatEvent =
  | { type: "message"; memberIds: string[]; message: ChatMessagePayload }
  | { type: "conversation"; memberIds: string[]; conversationId: string }
  | { type: "presence"; onlineUserIds: string[] };

type ChatBus = EventEmitter & { onChatEvent: unknown };

// Satu event bus per proses server. Cukup untuk deployment mandiri satu instance;
// beberapa instance butuh broker eksternal (mis. Redis atau PostgreSQL LISTEN/NOTIFY).
const globalStore = globalThis as typeof globalThis & { __reiChatBus?: ChatBus };

function bus(): ChatBus {
  if (!globalStore.__reiChatBus) {
    const emitter = new EventEmitter() as ChatBus;
    emitter.setMaxListeners(0);
    emitter.onChatEvent = true;
    globalStore.__reiChatBus = emitter;
  }
  return globalStore.__reiChatBus;
}

export function publishChatEvent(event: ChatEvent) {
  bus().emit("chat", event);
}

export function subscribeChatEvents(listener: (event: ChatEvent) => void) {
  bus().on("chat", listener);
  return () => {
    bus().off("chat", listener);
  };
}
