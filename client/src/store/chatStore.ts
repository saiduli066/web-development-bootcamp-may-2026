import { create } from "zustand";
import type { Conversation } from "../types/conversation";
import type { Message } from "../types/message";

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
  markRead: (conversationId: string, messageId: string) => void;
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
        [conversationId]: [message, ...current],
      },
    });
  },
  setMessages: (conversationId, messages) => {
    set({
      messages: {
        ...get().messages,
        [conversationId]: messages,
      },
    });
  },
  updateMessage: (conversationId, message) => {
    const current = get().messages[conversationId] || [];
    set({
      messages: {
        ...get().messages,
        [conversationId]: current.map((item) =>
          item._id === message._id ? message : item,
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
          item._id === tempId ? message : item,
        ),
      },
    });
  },
  markRead: (conversationId, messageId) => {
    const current = get().messages[conversationId] || [];
    set({
      messages: {
        ...get().messages,
        [conversationId]: current.map((item) =>
          item._id === messageId ? { ...item, status: "read" } : item,
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
