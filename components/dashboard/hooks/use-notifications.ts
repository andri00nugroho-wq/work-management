"use client";

import { useCallback, useEffect, useState } from "react";
import { request } from "../lib/http";
import type { NotificationItem } from "../types";

const POLL_MS = 60_000;

/** Kotak masuk: dimuat awal, diperbarui real-time (SSE) dan berkala sebagai cadangan. */
export function useNotifications() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  const load = useCallback(async () => {
    try {
      const result = await request<{ notifications: NotificationItem[]; unreadCount: number }>(
        "/api/notifications",
        {},
        "Pemberitahuan gagal dimuat."
      );
      setItems(result.notifications);
      setUnread(result.unreadCount);
    } catch {
      // Diam: dicoba lagi pada polling berikutnya.
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
    const timer = window.setInterval(() => void load(), POLL_MS);
    function onPush(event: Event) {
      const item = (event as CustomEvent<NotificationItem>).detail;
      setItems((list) => [item, ...list.filter((entry) => entry.id !== item.id)].slice(0, 50));
      setUnread((count) => count + 1);
    }
    window.addEventListener("rei:notification", onPush);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("rei:notification", onPush);
    };
  }, [load]);

  const markRead = useCallback(async (item: NotificationItem) => {
    if (item.readAt) return;
    setItems((list) => list.map((entry) => (entry.id === item.id ? { ...entry, readAt: new Date().toISOString() } : entry)));
    setUnread((count) => Math.max(0, count - 1));
    await request(`/api/notifications/${item.id}`, { method: "PATCH", body: JSON.stringify({ read: true }) }).catch(
      () => void load()
    );
  }, [load]);

  const markAll = useCallback(async () => {
    setItems((list) => list.map((entry) => ({ ...entry, readAt: entry.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await request("/api/notifications/read-all", { method: "POST" }).catch(() => void load());
  }, [load]);

  return { items, unread, markRead, markAll, reload: load };
}

export type Notifications = ReturnType<typeof useNotifications>;
