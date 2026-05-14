import { memo } from "react";
import type { Message } from "../../types/message";

type MessageBubbleProps = {
  message: Message;
};

const MessageBubble = ({ message }: MessageBubbleProps) => (
  <div className="rounded-lg bg-muted p-3 text-sm">{message.content}</div>
);

const MemoMessageBubble = memo(MessageBubble);

export { MemoMessageBubble };
