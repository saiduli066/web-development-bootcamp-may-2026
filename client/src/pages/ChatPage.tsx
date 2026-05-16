import { useEffect, useRef, useState } from "react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../store/authStore";
import { useChatStore } from "../store/chatStore";
import { useSocketStore } from "../store/socketStore";
import {
  createConversation,
  fetchConversations
} from "../services/conversationApi";
import { fetchMessages, sendMessage } from "../services/messageApi";
import { getUserByUsername } from "../services/userApi";
import { groupMessagesByDate } from "../features/chat/messageUtils";
import { ChatSidebar } from "../features/chat/ChatSidebar";
import { ChatWindow } from "../features/chat/ChatWindow";
import { useDebounce } from "../hooks/useDebounce";
import type { Message } from "../types/message";

const ChatPage = () => {
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const debouncedSearch = useDebounce(search, 300);
  const user = useAuthStore((state) => state.user);
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const messages = useChatStore((state) => state.messages);
  const typing = useChatStore((state) => state.typing);
  const setConversations = useChatStore((state) => state.setConversations);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const setMessages = useChatStore((state) => state.setMessages);
  const replaceMessage = useChatStore((state) => state.replaceMessage);
  const socket = useSocketStore((state) => state.socket);
  const emit = useSocketStore((state) => state.emit);
  const typingTimeout = useRef<number | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimeout.current) {
        window.clearTimeout(typingTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchConversations();
        setConversations(data);
      } catch (error) {
        toast.error("Failed to load conversations");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [setConversations, setActiveConversation]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!activeConversationId) return;
      try {
        const data = await fetchMessages(activeConversationId);
        setMessages(activeConversationId, data);
      } catch (error) {
        toast.error("Failed to load messages");
      }
    };
    loadMessages();
  }, [activeConversationId, setMessages]);

  useEffect(() => {
    if (!activeConversationId || !socket?.connected || !user?._id) return;

    const pendingSeenIds = (messages[activeConversationId] || [])
      .filter(
        (message) =>
          message.senderId !== user._id &&
          !(message.seenBy || []).includes(user._id) &&
          !message._id.startsWith("temp-"),
      )
      .map((message) => message._id);

    if (!pendingSeenIds.length) return;

    emit("message:seen", {
      conversationId: activeConversationId,
      messageIds: pendingSeenIds,
    });
  }, [activeConversationId, emit, messages, socket?.connected, user?._id]);

  useEffect(() => {
    if (isMobile) {
      setShowChatWindow(!!activeConversationId);
    } else {
      setShowChatWindow(true);
    }
  }, [activeConversationId, isMobile]);

  const activeMessages =
    (activeConversationId && messages[activeConversationId]) || [];
  const typingUsers =
    (activeConversationId && typing[activeConversationId]) || [];
  const activeConversation = conversations.find(
    (conversation) => conversation._id === activeConversationId,
  );
  const otherParticipant = activeConversation?.participants.find(
    (participant) => participant._id !== user?._id,
  );
  const getFirstName = (name?: string) => name?.trim().split(/\s+/)[0] || "User";
  const typingLabel =
    typingUsers.length > 0 && otherParticipant
      ? `${getFirstName(otherParticipant.name)} typing...`
      : "typing...";
  const groupedMessages = groupMessagesByDate([...activeMessages].reverse());

  const handleSend = async () => {
    if (!activeConversationId || !draft.trim()) return;
    const tempId = `temp-${Date.now()}`;
    const content = draft.trim();
    addMessage(activeConversationId, {
      _id: tempId,
      conversationId: activeConversationId,
      senderId: user?._id || "me",
      type: "text",
      content,
      deliveredTo: [user?._id || "me"],
      seenBy: [user?._id || "me"],
      createdAt: new Date().toISOString()
    });
    try {
      if (socket?.connected) {
        emit(
          "message:send",
          {
            conversationId: activeConversationId,
            type: "text",
            content
          },
          (response: { message?: Message; error?: string }) => {
            if (response?.message) {
              replaceMessage(activeConversationId, tempId, response.message);
              return;
            }
            toast.error(response?.error ?? "Failed to send message");
          }
        );
      } else {
        const data = await sendMessage(activeConversationId, {
          type: "text",
          content
        });
        replaceMessage(activeConversationId, tempId, data.message);
      }
      setDraft("");
      emit("user:stopTyping", { conversationId: activeConversationId });
    } catch (error) {
      toast.error("Failed to send message");
    }
  };

  const filteredConversations = debouncedSearch
    ? conversations.filter((conversation) =>
      conversation.participants.some((participant) =>
        participant.name.toLowerCase().includes(debouncedSearch.toLowerCase())
      )
    )
    : conversations;

  const handleDraftChange = (value: string) => {
    setDraft(value);
    if (!activeConversationId) return;
    emit("user:typing", { conversationId: activeConversationId });
    if (typingTimeout.current) {
      window.clearTimeout(typingTimeout.current);
    }
    typingTimeout.current = window.setTimeout(() => {
      emit("user:stopTyping", { conversationId: activeConversationId });
    }, 500);
  };

  const handleDraftFocus = () => {
    if (!activeConversationId) return;
    emit("user:typing", { conversationId: activeConversationId });
  };

  const handleDraftBlur = () => {
    if (!activeConversationId) return;
    if (typingTimeout.current) {
      window.clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
    emit("user:stopTyping", { conversationId: activeConversationId });
  };

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
  };

  const handleAddUser = async (username: string) => {
    try {
      const target = await getUserByUsername(username);
      if (target._id === user?._id) {
        return { success: false, message: "You cannot chat with yourself" };
      }
      const conversation = await createConversation(target._id);
      const existingIndex = conversations.findIndex(
        (item) => item._id === conversation._id,
      );
      if (existingIndex >= 0) {
        const updated = [...conversations];
        updated.splice(existingIndex, 1);
        setConversations([conversation, ...updated]);
      } else {
        setConversations([conversation, ...conversations]);
      }
      setActiveConversation(conversation._id);
      return { success: true };
    } catch (error) {
      if (isAxiosError<{ message?: string }>(error)) {
        const message = error.response?.data?.message;
        return { success: false, message: message ?? "Unable to add user" };
      }
      return { success: false, message: "Unable to add user" };
    }
  };

  const handleBack = () => {
    setShowChatWindow(false);
    setActiveConversation(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - always visible on desktop, hidden when chat is shown on mobile */}
      {!isMobile || !showChatWindow ? (
        <aside className="w-full lg:w-80 border-r border-border flex flex-col">
          <ChatSidebar
            conversations={filteredConversations}
            loading={loading}
            search={search}
            currentUserId={user?._id}
            onSearchChange={setSearch}
            onSelectConversation={handleSelectConversation}
            onAddUser={handleAddUser}
          />
        </aside>
      ) : null}

      {/* Chat Window - full screen on mobile when selected, flex on desktop */}
      {!isMobile || showChatWindow ? (
        <main className="flex-1 flex flex-col">
          <ChatWindow
            loading={loading}
            groupedMessages={groupedMessages}
            typingUsers={typingUsers}
            draft={draft}
            onDraftChange={handleDraftChange}
            onDraftFocus={handleDraftFocus}
            onDraftBlur={handleDraftBlur}
            onSend={handleSend}
            onInsertEmoji={(emoji) => setDraft((value) => `${value}${emoji}`)}
            currentUserId={user?._id}
            conversationName={otherParticipant ? getFirstName(otherParticipant.name) : "Conversation"}
            typingLabel={typingLabel}
            participantIds={(activeConversation?.participants || []).map((participant) => participant._id)}
            onBack={isMobile ? handleBack : undefined}
            selectedConversationId={activeConversationId}
          />
        </main>
      ) : null}
    </div>
  );
};

export { ChatPage };
