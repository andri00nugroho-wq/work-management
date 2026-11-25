import { faUserGroup } from "@fortawesome/free-solid-svg-icons";
import Icon from "@/components/icon";
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
      {conversation.kind === "GROUP" ? <Icon icon={faUserGroup} /> : initials(conversation.title)}
      {online && <span className="chat-presence-dot online" title="Online" aria-label="Online" />}
    </span>
  );
}
