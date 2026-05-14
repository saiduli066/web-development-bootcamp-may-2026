import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema(
  {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["image", "video", "file", "audio"],
      required: true,
    },
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    filename: { type: String, default: "" },
    mimetype: { type: String, default: "" },
    size: { type: Number, default: 0 },
    duration: { type: Number, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

const Attachment = mongoose.model("Attachment", attachmentSchema);

export { Attachment };
