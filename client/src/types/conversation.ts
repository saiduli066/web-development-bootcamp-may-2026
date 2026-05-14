import type { User } from "./user";

export type LastMessage = {
  text: string;
  type: string;
  senderId: string;
  createdAt: string;
};

export type Conversation = {
  _id: string;
  participants: User[];
  lastMessage?: LastMessage | null;
  unreadCounts?: Record<string, number>;
  updatedAt?: string;
};
