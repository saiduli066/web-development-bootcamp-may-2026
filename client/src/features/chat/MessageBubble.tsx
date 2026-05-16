import { memo } from "react";
import { Check, CheckCheck } from "lucide-react";
import type { Message } from "../../types/message";

type MessageBubbleProps = {
  message: Message;
  currentUserId?: string;
  participantIds?: string[];
  isLastMessage?: boolean;
};

type StatusType = "sent" | "delivered" | "seen";

const normalizeIds = (ids?: (string | { toString(): string })[]): string[] => {
  if (!Array.isArray(ids)) return [];
  return ids
    .map((id) => (typeof id === "string" ? id : id?.toString?.()))
    .filter((id): id is string => typeof id === "string" && id.length > 0);
};

const getMessageStatus = (
  message: Message,
  currentUserId?: string,
  participantIds?: string[],
): StatusType => {
  if (!currentUserId) return "sent";
  if (message.senderId !== currentUserId) return "sent";

  const safeParticipants = (participantIds || []).filter(
    (id): id is string => typeof id === "string" && id.length > 0,
  );

  const otherParticipants = safeParticipants.filter(
    (id) => id !== currentUserId,
  );

  if (otherParticipants.length === 0) {
    return "sent";
  }

  const deliveredTo = new Set(normalizeIds(message.deliveredTo));
  const seenBy = new Set(normalizeIds(message.seenBy));

  const allSeen = otherParticipants.every((id) => seenBy.has(id));
  if (allSeen) return "seen";

  const allDelivered = otherParticipants.every((id) => deliveredTo.has(id));
  if (allDelivered) return "delivered";

  return "sent";
};

const MessageBubble = ({ message, currentUserId, participantIds, isLastMessage }: MessageBubbleProps) => {
  const isOwn = currentUserId ? message.senderId === currentUserId : false;
  const statusType = isOwn && isLastMessage
    ? getMessageStatus(message, currentUserId, participantIds)
    : null;

  const containerClass = isOwn ? "justify-end" : "justify-start";
  const bubbleColor = isOwn ? "bg-[#16a5c8] text-white" : "bg-[#e7e7eb] text-[#121212]";
  const tailClass = isOwn
    ? "after:absolute after:-right-1 after:bottom-0 after:h-3 after:w-3 after:rotate-45 after:rounded-[2px] after:bg-[#16a5c8]"
    : "after:absolute after:-left-1 after:bottom-0 after:h-3 after:w-3 after:rotate-45 after:rounded-[2px] after:bg-[#e7e7eb]";

  const isVoice = message.type === "audio";

  return (
    <div className={`flex items-end ${containerClass} gap-2`}>
      <div className={`relative max-w-xs rounded-2xl px-4 py-2 shadow-sm ${bubbleColor} ${tailClass}`}>
        {isVoice ? (
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-black/20">
              <span className="ml-[1px] text-[10px]">&gt;</span>
            </div>
            <div className="flex h-4 items-end gap-[2px]">
              <span className="h-1 w-[3px] rounded bg-current/80" />
              <span className="h-2 w-[3px] rounded bg-current/80" />
              <span className="h-3 w-[3px] rounded bg-current/80" />
              <span className="h-2 w-[3px] rounded bg-current/80" />
              <span className="h-4 w-[3px] rounded bg-current/80" />
              <span className="h-2 w-[3px] rounded bg-current/80" />
              <span className="h-3 w-[3px] rounded bg-current/80" />
              <span className="h-1 w-[3px] rounded bg-current/80" />
              <span className="h-2 w-[3px] rounded bg-current/80" />
            </div>
            <span className="text-[11px] opacity-80">0:00</span>
          </div>
        ) : (
          <p className="text-sm break-words">{message.content}</p>
        )}
        {statusType && (
          <div className="mt-1 flex items-center justify-end gap-1">
            {statusType === "sent" && (
              <Check
                size={13}
                className="text-white/70"
                strokeWidth={2.5}
              />
            )}
            {statusType === "delivered" && (
              <CheckCheck
                size={13}
                className="text-white/70"
                strokeWidth={2.5}
              />
            )}
            {statusType === "seen" && (
              <CheckCheck
                size={13}
                className="text-[#64d9ff]"
                strokeWidth={2.5}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const MemoMessageBubble = memo(MessageBubble);

export { MemoMessageBubble };
