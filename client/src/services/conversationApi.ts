import { api } from "../lib/axios";
import type { Conversation } from "../types/conversation";

export const fetchConversations = async () => {
  const { data } = await api.get<{ conversations: Conversation[] }>(
    "/api/conversations",
  );
  return data.conversations;
};

export const createConversation = async (participantId: string) => {
  const { data } = await api.post<{ conversation: Conversation }>(
    "/api/conversations",
    {
      participantId,
    },
  );
  return data.conversation;
};

export const fetchConversation = async (id: string) => {
  const { data } = await api.get<{ conversation: Conversation }>(
    `/api/conversations/${id}`,
  );
  return data.conversation;
};

export const deleteConversation = async (id: string) => {
  await api.delete(`/api/conversations/${id}`);
};
