import { verifyAccessToken } from "../utils/tokens.js";
import { User } from "../models/User.js";
import { Conversation } from "../models/Conversation.js";
import { Call } from "../models/Call.js";
import {
  sendMessage,
  markMessagesDelivered,
  markMessagesSeen,
  markPendingDeliveredOnReconnect,
} from "../services/messageService.js";
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

const emitToUserExcept = (io, userId, excludedSocketId, event, payload) => {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.forEach((socketId) => {
    if (socketId !== excludedSocketId) {
      io.to(socketId).emit(event, payload);
    }
  });
};

const normalizeMessageIds = (payload) => {
  const messageIds = [];
  if (Array.isArray(payload?.messageIds)) {
    payload.messageIds.forEach((messageId) => {
      if (typeof messageId === "string" && messageId) {
        messageIds.push(messageId);
      }
    });
  }

  if (typeof payload?.messageId === "string" && payload.messageId) {
    messageIds.push(payload.messageId);
  }

  return Array.from(new Set(messageIds));
};

const emitStatusTargets = (io, targets, state, actorId) => {
  targets.forEach((target) => {
    emitToUser(io, target.senderId, "message:status", {
      state,
      conversationId: target.conversationId,
      messageIds: target.messageIds,
      userId: actorId,
    });
  });
};

const emitStatusToOwnDevices = (io, targets, state, actorId, socketId) => {
  targets.forEach((target) => {
    emitToUserExcept(io, actorId, socketId, "message:status", {
      state,
      conversationId: target.conversationId,
      messageIds: target.messageIds,
      userId: actorId,
    });
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

      const reconnectTargets = await markPendingDeliveredOnReconnect(userId);
      emitStatusTargets(io, reconnectTargets, "delivered", userId);
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

    socket.on("message:send", async (payload, ack) => {
      try {
        const { message, conversation } = await sendMessage({
          conversationId: payload.conversationId,
          senderId: userId,
          type: payload.type,
          content: payload.content,
          attachmentId: payload.attachmentId,
          replyTo: payload.replyTo,
        });

        emitToUserExcept(io, userId, socket.id, "message:new", {
          message,
          conversation,
        });
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
        emitToUserExcept(io, userId, socket.id, "conversation:update", {
          conversation,
        });
        if (typeof ack === "function") {
          ack({ message, conversation });
        }
      } catch (error) {
        socket.emit("message:error", { message: "Failed to send message" });
        if (typeof ack === "function") {
          ack({ error: "Failed to send message" });
        }
      }
    });

    socket.on("message:delivered", async (payload, ack) => {
      try {
        if (!payload?.conversationId) {
          if (typeof ack === "function") {
            ack({ error: "conversationId is required" });
          }
          return;
        }

        const targets = await markMessagesDelivered({
          conversationId: payload.conversationId,
          userId,
          messageIds: normalizeMessageIds(payload),
        });

        emitStatusTargets(io, targets, "delivered", userId);
        emitStatusToOwnDevices(io, targets, "delivered", userId, socket.id);
        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (error) {
        socket.emit("message:error", { message: "Failed to mark delivered" });
        if (typeof ack === "function") {
          ack({ error: "Failed to mark delivered" });
        }
      }
    });

    socket.on("message:seen", async (payload, ack) => {
      try {
        if (!payload?.conversationId) {
          if (typeof ack === "function") {
            ack({ error: "conversationId is required" });
          }
          return;
        }

        const { targets, conversation } = await markMessagesSeen({
          conversationId: payload.conversationId,
          userId,
          messageIds: normalizeMessageIds(payload),
        });

        emitStatusTargets(io, targets, "seen", userId);
        emitStatusToOwnDevices(io, targets, "seen", userId, socket.id);
        await emitToConversation(io, payload.conversationId, userId, "conversation:update", {
          conversation,
        });

        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (error) {
        socket.emit("message:error", { message: "Failed to mark seen" });
        if (typeof ack === "function") {
          ack({ error: "Failed to mark seen" });
        }
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
