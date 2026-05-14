import { useEffect } from "react";
import { useSocketStore } from "../store/socketStore";
import { useChatStore } from "../store/chatStore";
import { useCallStore } from "../store/callStore";

const useSocketEvents = () => {
  const socket = useSocketStore((state) => state.socket);
  const addMessage = useChatStore((state) => state.addMessage);
  const updateConversation = useChatStore((state) => state.updateConversation);
  const setTyping = useChatStore((state) => state.setTyping);
  const markRead = useChatStore((state) => state.markRead);
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

    socket.on("message:read", ({ messageId, conversationId }) => {
      markRead(conversationId, messageId);
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
      socket.off("conversation:update");
      socket.off("user:typing");
      socket.off("user:stopTyping");
      socket.off("message:read");
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
    updateConversation,
    setTyping,
    markRead,
    receiveIncomingCall,
    setCallId,
    handleCallAccepted,
    handleCallEnded,
    handleIceCandidate,
  ]);
};

export { useSocketEvents };
