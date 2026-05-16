import { create } from "zustand";
import type { Conversation } from "../types/conversation";
import type { Message } from "../types/message";

const normalizeMessage = (message: Message): Message => {
  const deliveredTo = message.deliveredTo?.length
    ? message.deliveredTo
    : [message.senderId];
  const seenBy = message.seenBy?.length ? message.seenBy : [message.senderId];

  return {
    ...message,
    deliveredTo,
    seenBy,
  };
};

const includeUser = (ids: string[] | undefined, userId: string) => {
  const current = ids || [];
  if (current.includes(userId)) {
    return current;
  }
  return [...current, userId];
};

type ChatState = {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: Record<string, Message[]>;
  typing: Record<string, string[]>;
  setConversations: (conversations: Conversation[]) => void;
  setActiveConversation: (conversationId: string | null) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
  updateMessage: (conversationId: string, message: Message) => void;
  replaceMessage: (conversationId: string, tempId: string, message: Message) => void;
  applyDelivered: (
    conversationId: string,
    messageIds: string[],
    userId: string,
  ) => void;
  applySeen: (
    conversationId: string,
    messageIds: string[],
    userId: string,
  ) => void;
  setTyping: (
    conversationId: string,
    userId: string,
    isTyping: boolean,
  ) => void;
  updateConversation: (conversation: Conversation) => void;
};

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {},
  typing: {},
  setConversations: (conversations) => set({ conversations }),
  setActiveConversation: (conversationId) =>
    set({ activeConversationId: conversationId }),
  addMessage: (conversationId, message) => {
    const current = get().messages[conversationId] || [];
    set({
      messages: {
        ...get().messages,
        [conversationId]: [normalizeMessage(message), ...current],
      },
    });
  },
  setMessages: (conversationId, messages) => {
    set({
      messages: {
        ...get().messages,
        [conversationId]: messages.map(normalizeMessage),
      },
    });
  },
  updateMessage: (conversationId, message) => {
    const current = get().messages[conversationId] || [];
    set({
      messages: {
        ...get().messages,
        [conversationId]: current.map((item) =>
          item._id === message._id ? normalizeMessage(message) : item,
        ),
      },
    });
  },
  replaceMessage: (conversationId, tempId, message) => {
    const current = get().messages[conversationId] || [];
    set({
      messages: {
        ...get().messages,
        [conversationId]: current.map((item) =>
          item._id === tempId ? normalizeMessage(message) : item,
        ),
      },
    });
  },
  applyDelivered: (conversationId, messageIds, userId) => {
    const targetIds = new Set(messageIds);
    if (!targetIds.size) return;

    const current = get().messages[conversationId] || [];
    set({
      messages: {
        ...get().messages,
        [conversationId]: current.map((item) =>
          targetIds.has(item._id)
            ? {
                ...item,
                deliveredTo: includeUser(item.deliveredTo, userId),
              }
            : item,
        ),
      },
    });
  },
  applySeen: (conversationId, messageIds, userId) => {
    const targetIds = new Set(messageIds);
    if (!targetIds.size) return;

    const current = get().messages[conversationId] || [];
    set({
      messages: {
        ...get().messages,
        [conversationId]: current.map((item) =>
          targetIds.has(item._id)
            ? {
                ...item,
                deliveredTo: includeUser(item.deliveredTo, userId),
                seenBy: includeUser(item.seenBy, userId),
              }
            : item,
        ),
      },
    });
  },
  setTyping: (conversationId, userId, isTyping) => {
    const current = get().typing[conversationId] || [];
    const next = isTyping
      ? Array.from(new Set([...current, userId]))
      : current.filter((id) => id !== userId);
    set({
      typing: {
        ...get().typing,
        [conversationId]: next,
      },
    });
  },
  updateConversation: (conversation) => {
    const conversations = get().conversations.map((item) =>
      item._id === conversation._id ? conversation : item,
    );
    set({ conversations });
  },
}));
