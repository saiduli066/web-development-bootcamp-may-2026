import mongoose from "mongoose";

const lastMessageSchema = new mongoose.Schema(
  {
    text: { type: String, default: "" },
    type: { type: String, default: "text" },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date },
  },
  { _id: false },
);

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    lastMessage: { type: lastMessageSchema, default: null },
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true },
);

conversationSchema.index({ participants: 1, updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversationSchema);

export { Conversation };
