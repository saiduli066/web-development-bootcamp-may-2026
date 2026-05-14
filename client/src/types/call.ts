export type Call = {
  _id: string;
  conversationId: string;
  callerId: string;
  receiverId: string;
  type: "voice" | "video";
  status?: "missed" | "rejected" | "ended";
  startedAt?: string;
  endedAt?: string | null;
  duration?: number | null;
};
