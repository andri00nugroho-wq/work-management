import { initials } from "../lib/format";
import type { ChatConversation } from "../types";

export default function ConversationAvatar({
  conversation,
  online,
}: {
  conversation: ChatConversation;
  online?: boolean;
}) {
  return (
    <span className="chat-conversation-avatar">
      {conversation.kind === "GROUP" ? "◍" : initials(conversation.title)}
      {online && <span className="chat-presence-dot online" title="Online" aria-label="Online" />}
    </span>
  );
}
