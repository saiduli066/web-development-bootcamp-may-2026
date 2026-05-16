import { ApiError } from "../utils/apiError.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";
import { Attachment } from "../models/Attachment.js";
import { VoiceMessage } from "../models/VoiceMessage.js";
import { User } from "../models/User.js";

const listConversations = async (userId) =>
  Conversation.find({ participants: userId })
    .populate("participants", "name username avatar isOnline lastSeen")
    .sort({ updatedAt: -1 });

const findOrCreateConversation = async (userId, participantId) => {
  if (userId === participantId) {
    throw new ApiError(400, "Cannot create conversation with yourself");
  }

  const participant = await User.findById(participantId);
  if (!participant) {
    throw new ApiError(404, "Participant not found");
  }

  const existing = await Conversation.findOne({
    participants: { $all: [userId, participantId] },
    $expr: { $eq: [{ $size: "$participants" }, 2] }
  }).populate("participants", "name username avatar isOnline lastSeen");

  if (existing) {
    return existing;
  }

  const conversation = await Conversation.create({
    participants: [userId, participantId],
    unreadCounts: {
      [userId]: 0,
      [participantId]: 0
    }
  });

  return conversation.populate("participants", "name username avatar isOnline lastSeen");
};

const getConversationById = async (userId, conversationId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  }).populate("participants", "name username avatar isOnline lastSeen");

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  return conversation;
};

const deleteConversation = async (userId, conversationId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });

  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }

  const messages = await Message.find({ conversationId }).select("_id");
  const messageIds = messages.map((message) => message._id);

  await Message.deleteMany({ conversationId });
  if (messageIds.length) {
    await Attachment.deleteMany({ messageId: { $in: messageIds } });
    await VoiceMessage.deleteMany({ messageId: { $in: messageIds } });
  }
  await conversation.deleteOne();
};

export {
  listConversations,
  findOrCreateConversation,
  getConversationById,
  deleteConversation
};
