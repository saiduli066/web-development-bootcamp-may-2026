import mongoose from "mongoose";

const voiceMessageSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    duration: { type: Number, required: true },
    waveformData: { type: [Number], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const VoiceMessage = mongoose.model("VoiceMessage", voiceMessageSchema);

export { VoiceMessage };
