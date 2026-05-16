import { api } from "../lib/axios";
import type { Message } from "../types/message";

export const fetchMessages = async (
  conversationId: string,
  cursor?: string,
  limit = 20,
) => {
  const { data } = await api.get<{ messages: Message[] }>(
    `/api/messages/${conversationId}`,
    { params: { cursor, limit } },
  );
  return data.messages;
};

export const sendMessage = async (
  conversationId: string,
  payload: { type: Message["type"]; content?: string; attachmentId?: string },
) => {
  const { data } = await api.post<{ message: Message; conversation: unknown }>(
    `/api/messages/${conversationId}`,
    payload,
  );
  return data;
};

export const markMessageRead = async (messageId: string) => {
  const { data } = await api.patch<{ message: Message }>(
    `/api/messages/${messageId}/read`,
  );
  return data.message;
};

export const markConversationSeen = async (
  conversationId: string,
  messageIds?: string[],
) => {
  const { data } = await api.patch<{ conversation: unknown }>(
    `/api/messages/${conversationId}/seen`,
    { messageIds },
  );
  return data;
};
