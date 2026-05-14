import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ChatLayout } from "../layouts/ChatLayout";
import { useChatStore } from "../store/chatStore";
import { useSocketStore } from "../store/socketStore";
import { fetchConversations } from "../services/conversationApi";
import { fetchMessages, sendMessage } from "../services/messageApi";
import { groupMessagesByDate } from "../features/chat/messageUtils";
import { ChatSidebar } from "../features/chat/ChatSidebar";
import { ChatWindow } from "../features/chat/ChatWindow";
import { useDebounce } from "../hooks/useDebounce";

const ChatPage = () => {
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const conversations = useChatStore((state) => state.conversations);
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const messages = useChatStore((state) => state.messages);
  const typing = useChatStore((state) => state.typing);
  const setConversations = useChatStore((state) => state.setConversations);
  const setActiveConversation = useChatStore((state) => state.setActiveConversation);
  const addMessage = useChatStore((state) => state.addMessage);
  const setMessages = useChatStore((state) => state.setMessages);
  const replaceMessage = useChatStore((state) => state.replaceMessage);
  const connect = useSocketStore((state) => state.connect);
  const disconnect = useSocketStore((state) => state.disconnect);
  const emit = useSocketStore((state) => state.emit);
  const typingTimeout = useRef<number | null>(null);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

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
        if (data[0]) {
          setActiveConversation(data[0]._id);
        }
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

  const activeMessages =
    (activeConversationId && messages[activeConversationId]) || [];
  const typingUsers =
    (activeConversationId && typing[activeConversationId]) || [];
  const groupedMessages = groupMessagesByDate([...activeMessages].reverse());

  const handleSend = async () => {
    if (!activeConversationId || !draft.trim()) return;
    const tempId = `temp-${Date.now()}`;
    addMessage(activeConversationId, {
      _id: tempId,
      conversationId: activeConversationId,
      senderId: "me",
      type: "text",
      content: draft.trim(),
      status: "sent",
      createdAt: new Date().toISOString()
    });
    try {
      const data = await sendMessage(activeConversationId, {
        type: "text",
        content: draft.trim()
      });
      replaceMessage(activeConversationId, tempId, data.message);
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

  return (
    <ChatLayout
      sidebar={
        <ChatSidebar
          conversations={filteredConversations}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          onSelectConversation={setActiveConversation}
        />
      }
    >
      <ChatWindow
        loading={loading}
        groupedMessages={groupedMessages}
        typingUsers={typingUsers}
        draft={draft}
        onDraftChange={handleDraftChange}
        onSend={handleSend}
      />
    </ChatLayout>
  );
};

export { ChatPage };
