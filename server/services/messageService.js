import { ApiError } from "../utils/apiError.js";
import mongoose from "mongoose";
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

const toObjectIds = (ids = []) =>
  ids
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));

const buildStatusTargets = (messages) => {
  const targets = new Map();

  messages.forEach((message) => {
    const senderId = message.senderId.toString();
    const conversationId = message.conversationId.toString();
    const key = `${senderId}:${conversationId}`;

    const existing = targets.get(key) || {
      senderId,
      conversationId,
      messageIds: [],
    };

    existing.messageIds.push(message.id);
    targets.set(key, existing);
  });

  return Array.from(targets.values());
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
    deliveredTo: [senderId],
    seenBy: [senderId],
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

const markMessagesDelivered = async ({ conversationId, userId, messageIds }) => {
  await ensureParticipant(conversationId, userId);

  const normalizedIds = toObjectIds(messageIds || []);
  const query = {
    conversationId,
    senderId: { $ne: userId },
    deliveredTo: { $ne: userId },
  };

  if (normalizedIds.length) {
    query._id = { $in: normalizedIds };
  }

  const pending = await Message.find(query).select("_id senderId conversationId");
  if (!pending.length) {
    return [];
  }

  await Message.updateMany(
    { _id: { $in: pending.map((message) => message._id) } },
    { $addToSet: { deliveredTo: userId } },
  );

  return buildStatusTargets(pending);
};

const markMessagesSeen = async ({ conversationId, userId, messageIds }) => {
  const conversation = await ensureParticipant(conversationId, userId);

  const normalizedIds = toObjectIds(messageIds || []);
  const query = {
    conversationId,
    senderId: { $ne: userId },
    seenBy: { $ne: userId },
  };

  if (normalizedIds.length) {
    query._id = { $in: normalizedIds };
  }

  const pending = await Message.find(query).select("_id senderId conversationId");
  if (pending.length) {
    await Message.updateMany(
      { _id: { $in: pending.map((message) => message._id) } },
      { $addToSet: { seenBy: userId, deliveredTo: userId } },
    );
  }

  const key = userId.toString();
  const unreadCounts = conversation.unreadCounts || new Map();
  if ((unreadCounts.get(key) || 0) !== 0) {
    unreadCounts.set(key, 0);
    conversation.unreadCounts = unreadCounts;
    await conversation.save();
  }

  return {
    targets: buildStatusTargets(pending),
    conversation,
  };
};

const markSingleMessageSeen = async (messageId, userId) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new ApiError(404, "Message not found");
  }

  await markMessagesSeen({
    conversationId: message.conversationId,
    userId,
    messageIds: [messageId],
  });

  return Message.findById(messageId);
};

const markPendingDeliveredOnReconnect = async (userId) => {
  const conversations = await Conversation.find({ participants: userId }).select("_id");
  const conversationIds = conversations.map((conversation) => conversation._id);

  if (!conversationIds.length) {
    return [];
  }

  const pending = await Message.find({
    conversationId: { $in: conversationIds },
    senderId: { $ne: userId },
    deliveredTo: { $ne: userId },
  }).select("_id senderId conversationId");

  if (!pending.length) {
    return [];
  }

  await Message.updateMany(
    { _id: { $in: pending.map((message) => message._id) } },
    { $addToSet: { deliveredTo: userId } },
  );

  return buildStatusTargets(pending);
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

export {
  getMessages,
  sendMessage,
  markMessagesDelivered,
  markMessagesSeen,
  markSingleMessageSeen,
  markPendingDeliveredOnReconnect,
  deleteMessage,
};
