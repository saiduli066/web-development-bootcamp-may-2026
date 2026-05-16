export type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  type: "text" | "image" | "video" | "file" | "audio" | "call";
  content?: string;
  attachmentId?: string;
  deliveredTo?: string[];
  seenBy?: string[];
  replyTo?: string;
  createdAt: string;
};
