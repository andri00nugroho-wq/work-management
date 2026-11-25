import { authorize } from "@/lib/api";
import { publishChatEvent, subscribeChatEvents } from "@/lib/chat-events";
import {
  markChatUserOffline,
  markChatUserOnline,
  onlineChatUserIds,
  touchChatUser,
} from "@/lib/chat-presence";

const HEARTBEAT_MS = 25000;

export async function GET(request: Request) {
  const auth = await authorize();
  if ("response" in auth) return auth.response;
  const userId = auth.user.id;

  const encoder = new TextEncoder();
  let detach = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      let released = false;

      function send(event: string, data: unknown) {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      }

      function releasePresence() {
        if (released) return;
        released = true;
        if (markChatUserOffline(userId)) {
          publishChatEvent({ type: "presence", onlineUserIds: onlineChatUserIds() });
        }
      }

      function close() {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        unsubscribe();
        releasePresence();
        try {
          controller.close();
        } catch {
          // Stream sudah ditutup oleh klien.
        }
      }

      const unsubscribe = subscribeChatEvents((event) => {
        if (event.type === "presence") {
          send("presence", { onlineUserIds: event.onlineUserIds });
          return;
        }
        if (!event.memberIds.includes(userId)) return;
        if (event.type === "message") {
          send("message", event.message);
        } else if (event.type === "notification") {
          send("notification", event.notification);
        } else {
          send("conversation", { conversationId: event.conversationId });
        }
      });

      const heartbeat = setInterval(() => {
        if (closed) return;
        touchChatUser(userId);
        try {
          controller.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          close();
        }
      }, HEARTBEAT_MS);

      request.signal.addEventListener("abort", close);
      detach = close;

      markChatUserOnline(userId);
      send("ready", { userId });
      send("presence", { onlineUserIds: onlineChatUserIds() });
      publishChatEvent({ type: "presence", onlineUserIds: onlineChatUserIds() });
    },
    cancel() {
      detach();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
