import { ApiError } from "../utils/apiError.js";
import { uploadBuffer } from "../utils/cloudinaryUpload.js";
import { Attachment } from "../models/Attachment.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

const detectType = (mimetype) => {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "file";
};

const ensureParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
};

const uploadMedia = async (userId, file) => {
  if (!file) {
    throw new ApiError(400, "File is required");
  }

  const type = detectType(file.mimetype);
  const options = {
    folder: "chat/media",
    resource_type: "auto"
  };

  if (type === "image") {
    options.transformation = [
      { width: 1280, height: 1280, crop: "limit", quality: "auto" }
    ];
  }

  const result = await uploadBuffer(file.buffer, options);
  const attachment = await Attachment.create({
    uploadedBy: userId,
    type,
    url: result.secure_url,
    publicId: result.public_id,
    filename: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });

  return attachment;
};

const getSharedMedia = async (conversationId, userId, type) => {
  await ensureParticipant(conversationId, userId);

  if (type === "links") {
    return Message.find({
      conversationId,
      type: "text",
      content: { $regex: /(https?:\/\/[^\s]+)/i }
    }).select("content senderId createdAt");
  }

  const messages = await Message.find({
    conversationId,
    attachmentId: { $ne: null }
  }).populate("attachmentId");

  return messages
    .filter((message) => {
      const attachment = message.attachmentId;
      if (!attachment) return false;
      if (type === "images") {
        return attachment.type === "image" || attachment.type === "video";
      }
      if (type === "files") {
        return attachment.type === "file";
      }
      if (type === "voice") {
        return attachment.type === "audio";
      }
      return false;
    })
    .map((message) => ({
      messageId: message.id,
      attachment: message.attachmentId
    }));
};

export { uploadMedia, getSharedMedia };
