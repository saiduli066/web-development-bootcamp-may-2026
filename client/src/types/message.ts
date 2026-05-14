export type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "video" | "file" | "audio" | "call";
  content?: string;
  attachmentId?: string;
  status?: "sent" | "delivered" | "read";
  replyTo?: string;
  createdAt: string;
};
