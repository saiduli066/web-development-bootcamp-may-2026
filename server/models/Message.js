import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["text", "image", "video", "file", "audio", "call"],
      default: "text",
    },
    content: { type: String, default: "" },
    attachmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Attachment" },
    deliveredTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    seenBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, conversationId: 1 });
messageSchema.index({ deliveredTo: 1 });
messageSchema.index({ seenBy: 1 });

const Message = mongoose.model("Message", messageSchema);

export { Message };
