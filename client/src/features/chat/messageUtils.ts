import type { Message } from "../../types/message";

export const groupMessagesByDate = (messages: Message[]) => {
  const groups: Record<string, Message[]> = {};
  messages.forEach((message) => {
    const date = new Date(message.createdAt);
    const key = date.toLocaleDateString();
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(message);
  });
  return groups;
};
