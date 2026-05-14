import mongoose from "mongoose";

const callSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    callerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: { type: String, enum: ["voice", "video"], default: "voice" },
    status: { type: String, enum: ["missed", "rejected", "ended"] },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: null },
    duration: { type: Number, default: null },
  },
  { timestamps: false },
);

const Call = mongoose.model("Call", callSchema);

export { Call };
