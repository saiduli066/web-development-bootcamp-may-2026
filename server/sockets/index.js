import { verifyAccessToken } from "../utils/tokens.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Call } from "../models/Call.js";
import { sendMessage, markRead } from "../services/messageService.js";
import { createCall, updateCallStatus } from "../services/callService.js";

const onlineUsers = new Map();

const addSocket = (userId, socketId) => {
  const existing = onlineUsers.get(userId) || new Set();
  existing.add(socketId);
  onlineUsers.set(userId, existing);
  return existing.size === 1;
};

const removeSocket = (userId, socketId) => {
  const existing = onlineUsers.get(userId);
  if (!existing) return false;
  existing.delete(socketId);
  if (existing.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }
  return false;
};

const emitToUser = (io, userId, event, payload) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.forEach((socketId) => {
    io.to(socketId).emit(event, payload);
  });
};

const emitToConversation = async (
  io,
  conversationId,
  senderId,
  event,
  payload,
) => {
  const conversation =
    await Conversation.findById(conversationId).select("participants");
  if (!conversation) return;
  conversation.participants.forEach((participantId) => {
    if (participantId.toString() !== senderId.toString()) {
      emitToUser(io, participantId.toString(), event, payload);
    }
  });
};

const initSockets = (io) => {
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];
    if (!token) {
      return next(new Error("Unauthorized"));
    }
    try {
      const payload = verifyAccessToken(token);
      socket.userId = payload.sub;
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.userId;
    const isFirstConnection = addSocket(userId, socket.id);
    if (isFirstConnection) {
      await User.findByIdAndUpdate(userId, {
        isOnline: true,
        lastSeen: null,
      });
      socket.broadcast.emit("user:online", { userId });
    }

    socket.on("user:typing", async ({ conversationId }) => {
      await emitToConversation(io, conversationId, userId, "user:typing", {
        userId,
        conversationId,
      });
    });

    socket.on("user:stopTyping", async ({ conversationId }) => {
      await emitToConversation(io, conversationId, userId, "user:stopTyping", {
        userId,
        conversationId,
      });
    });

    socket.on("message:send", async (payload) => {
      try {
        const { message, conversation } = await sendMessage({
          conversationId: payload.conversationId,
          senderId: userId,
          type: payload.type,
          content: payload.content,
          attachmentId: payload.attachmentId,
          replyTo: payload.replyTo,
        });

        emitToUser(io, userId, "message:delivered", { messageId: message.id });
        await emitToConversation(
          io,
          payload.conversationId,
          userId,
          "message:new",
          {
            message,
            conversation,
          },
        );
        await emitToConversation(
          io,
          payload.conversationId,
          userId,
          "conversation:update",
          { conversation },
        );
      } catch (error) {
        socket.emit("message:error", { message: "Failed to send message" });
      }
    });

    socket.on("message:read", async ({ messageId, conversationId }) => {
      try {
        const message = await markRead(messageId, userId);
        await emitToConversation(io, conversationId, userId, "message:read", {
          messageId: message.id,
          readBy: userId,
        });
      } catch (error) {
        socket.emit("message:error", { message: "Failed to mark read" });
      }
    });

    socket.on(
      "call:initiate",
      async ({ receiverId, conversationId, offer }) => {
        try {
          const call = await createCall({
            conversationId,
            callerId: userId,
            receiverId,
            type: "voice",
          });
          socket.emit("call:initiated", { callId: call.id });
          emitToUser(io, receiverId, "call:incoming", {
            callId: call.id,
            callerId: userId,
            offer,
          });
        } catch (error) {
          socket.emit("call:error", { message: "Failed to initiate call" });
        }
      },
    );

    socket.on("call:accept", async ({ callId, answer }) => {
      const call = await Call.findById(callId);
      if (!call) return;
      emitToUser(io, call.callerId.toString(), "call:accepted", {
        callId,
        answer
      });
    });

    socket.on("call:reject", async ({ callId }) => {
      await updateCallStatus(callId, "rejected");
      const call = await Call.findById(callId);
      if (call) {
        emitToUser(io, call.callerId.toString(), "call:rejected", { callId });
      }
    });

    socket.on("call:end", async ({ callId }) => {
      await updateCallStatus(callId, "ended");
      const call = await Call.findById(callId);
      if (call) {
        emitToUser(io, call.callerId.toString(), "call:ended", { callId });
        emitToUser(io, call.receiverId.toString(), "call:ended", { callId });
      }
    });

    socket.on("call:iceCandidate", async ({ callId, candidate }) => {
      const call = await Call.findById(callId);
      if (!call) return;
      const targetId =
        call.callerId.toString() === userId ? call.receiverId : call.callerId;
      emitToUser(io, targetId.toString(), "call:iceCandidate", {
        callId,
        candidate,
      });
    });

    socket.on("disconnect", async () => {
      const isLastConnection = removeSocket(userId, socket.id);
      if (isLastConnection) {
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen,
        });
        socket.broadcast.emit("user:offline", { userId, lastSeen });
      }
    });
  });
};

export { initSockets };
