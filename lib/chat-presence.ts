type ChatPresenceStore = {
  connections: Map<string, number>;
  lastSeen: Map<string, number>;
};

const globalStore = globalThis as typeof globalThis & {
  __reiChatPresence?: ChatPresenceStore;
};

function store(): ChatPresenceStore {
  if (!globalStore.__reiChatPresence) {
    globalStore.__reiChatPresence = {
      connections: new Map(),
      lastSeen: new Map(),
    };
  }
  return globalStore.__reiChatPresence;
}

export function markChatUserOnline(userId: string) {
  const current = store().connections.get(userId) ?? 0;
  store().connections.set(userId, current + 1);
  store().lastSeen.set(userId, Date.now());
  return current === 0;
}

export function markChatUserOffline(userId: string) {
  const current = store().connections.get(userId) ?? 0;
  if (current <= 1) {
    store().connections.delete(userId);
    return current === 1;
  }
  store().connections.set(userId, current - 1);
  return false;
}

export function touchChatUser(userId: string) {
  store().lastSeen.set(userId, Date.now());
}

export function onlineChatUserIds() {
  return Array.from(store().connections.keys());
}
