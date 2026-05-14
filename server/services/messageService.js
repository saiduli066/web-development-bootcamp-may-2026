import { ApiError } from "../utils/apiError.js";
import { Conversation } from "../models/Conversation.js";
import { Message } from "../models/Message.js";

const ensureParticipant = async (conversationId, userId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId
  });
  if (!conversation) {
    throw new ApiError(404, "Conversation not found");
  }
  return conversation;
};

const getMessages = async ({ conversationId, userId, cursor, limit = 20 }) => {
  await ensureParticipant(conversationId, userId);

  const query = { conversationId };
  if (cursor) {
    const cursorMessage = await Message.findById(cursor);
    if (cursorMessage) {
      query.createdAt = { $lt: cursorMessage.createdAt };
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  return messages;
};

const sendMessage = async ({
  conversationId,
  senderId,
  type,
  content,
  attachmentId,
  replyTo
}) => {
  const conversation = await ensureParticipant(conversationId, senderId);
  const message = await Message.create({
    conversationId,
    senderId,
    type,
    content: content || "",
    attachmentId: attachmentId || null,
    replyTo: replyTo || null,
    status: "sent"
  });

  const preview =
    type === "text"
      ? content?.trim() || ""
      : `[${type.charAt(0).toUpperCase()}${type.slice(1)}]`;

  const unreadCounts = conversation.unreadCounts || new Map();
  conversation.participants.forEach((participantId) => {
    const key = participantId.toString();
    if (key !== senderId.toString()) {
      unreadCounts.set(key, (unreadCounts.get(key) || 0) + 1);
    }
  });

  conversation.lastMessage = {
    text: preview,
    type,
    senderId,
    createdAt: message.createdAt,
  };
  conversation.unreadCounts = unreadCounts;
  await conversation.save();

  return { message, conversation };
};

const markRead = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  const conversation = await ensureParticipant(message.conversationId, userId);
  message.status = "read";
  await message.save();

  const key = userId.toString();
  const unreadCounts = conversation.unreadCounts || new Map();
  unreadCounts.set(key, 0);
  conversation.unreadCounts = unreadCounts;
  await conversation.save();

  return message;
};

const deleteMessage = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }
  if (message.senderId.toString() !== userId.toString()) {
    throw new ApiError(403, "Not allowed to delete this message");
  }

  const conversation = await ensureParticipant(message.conversationId, userId);
  await message.deleteOne();

  if (
    conversation.lastMessage &&
    conversation.lastMessage.createdAt?.getTime() ===
      message.createdAt.getTime()
  ) {
    const latestMessage = await Message.findOne({
      conversationId: conversation.id
    }).sort({ createdAt: -1 });

    conversation.lastMessage = latestMessage
      ? {
          text:
            latestMessage.type === "text"
              ? latestMessage.content
              : `[${latestMessage.type}]`,
          type: latestMessage.type,
          senderId: latestMessage.senderId,
          createdAt: latestMessage.createdAt
        }
      : null;
    await conversation.save();
  }
};

export { getMessages, sendMessage, markRead, deleteMessage };
