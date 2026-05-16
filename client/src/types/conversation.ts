import type { User } from "./user";

export type LastMessage = {
  _id?: string;
  text?: string;
  content?: string;
  type: string;
  senderId: string;
  createdAt: string;
};

export type Conversation = {
  _id: string;
  participants: User[];
  lastMessage?: LastMessage | null;
  unreadCounts?: Record<string, number>;
  unreadCount?: number;
  updatedAt?: string;
};
