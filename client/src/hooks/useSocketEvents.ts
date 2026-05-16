import { useEffect } from "react";
import { useSocketStore } from "../store/socketStore";
import { useChatStore } from "../store/chatStore";
import { useCallStore } from "../store/callStore";
import { useAuthStore } from "../store/authStore";

const useSocketEvents = () => {
  const socket = useSocketStore((state) => state.socket);
  const addMessage = useChatStore((state) => state.addMessage);
  const applyDelivered = useChatStore((state) => state.applyDelivered);
  const applySeen = useChatStore((state) => state.applySeen);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const setTyping = useChatStore((state) => state.setTyping);
  const receiveIncomingCall = useCallStore(
    (state) => state.receiveIncomingCall,
  );
  const setCallId = useCallStore((state) => state.setCallId);
  const handleCallAccepted = useCallStore((state) => state.handleCallAccepted);
  const handleCallEnded = useCallStore((state) => state.handleCallEnded);
  const handleIceCandidate = useCallStore((state) => state.handleIceCandidate);

  useEffect(() => {
    if (!socket) return;

    socket.on("message:new", ({ message, conversation }) => {
      addMessage(message.conversationId, message);
      if (conversation) {
        updateConversation(conversation);
      }

      const currentUserId = useAuthStore.getState().user?._id;
      if (!currentUserId || message.senderId === currentUserId) {
        return;
      }

      socket.emit("message:delivered", {
        conversationId: message.conversationId,
        messageIds: [message._id],
      });

      const activeConversationId = useChatStore.getState().activeConversationId;
      if (activeConversationId === message.conversationId) {
        socket.emit("message:seen", {
          conversationId: message.conversationId,
          messageIds: [message._id],
        });
      }
    });

    socket.on("message:status", ({ state, conversationId, messageIds, userId }) => {
      if (!conversationId || !Array.isArray(messageIds) || !userId) {
        return;
      }
      if (state === "seen") {
        applySeen(conversationId, messageIds, userId);
        return;
      }
      if (state === "delivered") {
        applyDelivered(conversationId, messageIds, userId);
      }
    });

    socket.on("conversation:update", ({ conversation }) => {
      if (conversation) {
        updateConversation(conversation);
      }
    });

    socket.on("user:typing", ({ userId, conversationId }) => {
      setTyping(conversationId, userId, true);
    });

    socket.on("user:stopTyping", ({ userId, conversationId }) => {
      setTyping(conversationId, userId, false);
    });

    socket.on("call:initiated", ({ callId }) => {
      if (callId && socket) {
        setCallId(callId, socket);
      }
    });

    socket.on("call:incoming", ({ callId, callerId, offer }) => {
      receiveIncomingCall({ callId, callerId, offer });
    });

    socket.on("call:accepted", ({ answer }) => {
      handleCallAccepted(answer);
    });

    socket.on("call:rejected", () => {
      handleCallEnded();
    });

    socket.on("call:ended", () => {
      handleCallEnded();
    });

    socket.on("call:iceCandidate", ({ candidate }) => {
      handleIceCandidate(candidate);
    });

    return () => {
      socket.off("message:new");
      socket.off("message:status");
      socket.off("conversation:update");
      socket.off("user:typing");
      socket.off("user:stopTyping");
      socket.off("call:initiated");
      socket.off("call:incoming");
      socket.off("call:accepted");
      socket.off("call:rejected");
      socket.off("call:ended");
      socket.off("call:iceCandidate");
    };
  }, [
    socket,
    addMessage,
    applyDelivered,
    applySeen,
    updateConversation,
    setTyping,
    receiveIncomingCall,
    setCallId,
    handleCallAccepted,
    handleCallEnded,
    handleIceCandidate,
  ]);
};

export { useSocketEvents };
