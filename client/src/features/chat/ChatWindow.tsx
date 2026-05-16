import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowLeft, Paperclip, Smile, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import { MemoMessageBubble } from "./MessageBubble";
import type { Message } from "../../types/message";

type ChatWindowProps = {
  loading: boolean;
  groupedMessages: Record<string, Message[]>;
  typingUsers: string[];
  draft: string;
  onDraftChange: (value: string) => void;
  onDraftFocus?: () => void;
  onDraftBlur?: () => void;
  onSend: () => void;
  onInsertEmoji?: (emoji: string) => void;
  onBack?: () => void;
  selectedConversationId?: string | null;
  currentUserId?: string;
  conversationName?: string;
  typingLabel?: string;
  participantIds?: string[];
};

const emojiList = ["😀", "😁", "😂", "🙂", "😍", "😭", "😎", "🔥", "👍", "🎉", "❤️", "🙏"];

const ChatWindow = ({
  loading,
  groupedMessages,
  typingUsers,
  draft,
  onDraftChange,
  onDraftFocus,
  onDraftBlur,
  onSend,
  onInsertEmoji,
  onBack,
  selectedConversationId,
  currentUserId,
  conversationName,
  typingLabel,
  participantIds
}: ChatWindowProps) => {
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasConversation = !!selectedConversationId;

  const allMessages = Object.values(groupedMessages).flat();
  const latestMessageId = allMessages[allMessages.length - 1]?._id || "";
  const lastMessageId = allMessages[allMessages.length - 1]?._id || "";

  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return false;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const threshold = 150;
    return scrollHeight - (scrollTop + clientHeight) < threshold;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, []);

  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const nearBottom = isNearBottom();
    setIsAtBottom(nearBottom);
    setShowJumpButton(!nearBottom && allMessages.length > 0);
  }, [isNearBottom, allMessages.length]);

  // Scroll listener effect
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Auto-scroll when user is at bottom and new messages arrive
  useEffect(() => {
    if (isAtBottom) {
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom();
      }, 50);
    }

    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [latestMessageId, typingUsers.length, selectedConversationId, isAtBottom, scrollToBottom]);

  if (!hasConversation) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Smile className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-semibold">No Conversation Selected</h3>
            <p className="text-sm text-muted-foreground">
              Select a conversation or start a new one
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-lg transition md:hidden"
            aria-label="Go back"
          >
            <ArrowLeft size={20} className="text-foreground" />
          </button>
          <div>
            <h2 className="font-semibold text-foreground">{conversationName}</h2>
            {typingLabel && (
              <p className="text-xs text-muted-foreground">{typingLabel}</p>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area with Jump Button */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="flex-1 overflow-y-auto p-4 bg-[#2a2a2a] space-y-4 h-full"
          ref={messagesContainerRef}
        >
          {loading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((item) => (
                <Skeleton key={item} className="h-12 w-3/4" />
              ))}
            </div>
          ) : Object.keys(groupedMessages).length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-sm text-muted-foreground">
                No messages yet. Start the conversation!
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMessages).map(([date, items]) => (
                <div key={date} className="space-y-3">
                  <div className="text-center text-xs text-muted-foreground">
                    {date}
                  </div>
                  {items.map((message) => (
                    <MemoMessageBubble
                      key={message._id}
                      message={message}
                      currentUserId={currentUserId}
                      participantIds={participantIds}
                      isLastMessage={message._id === lastMessageId}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}
          {typingUsers.length > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <span>typing...</span>
              <span className="flex gap-1">
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Jump to Latest Button - WhatsApp/Messenger Style */}
        {showJumpButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 bg-[#16a5c8] text-white rounded-full shadow-lg hover:bg-[#1391a8] transition-all z-10 animate-pulse"
            aria-label="Jump to latest message"
          >
            <span className="text-sm font-medium">New messages</span>
            <ChevronDown size={16} />
          </button>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t border-border bg-background p-4">
        <div className="relative flex items-center gap-2">
          <button className="p-2 hover:bg-muted rounded-lg transition">
            <Paperclip size={18} className="text-muted-foreground" />
          </button>
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            onFocus={onDraftFocus}
            onBlur={onDraftBlur}
            onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={() => setShowEmojiPicker((value) => !value)}
            className="p-2 hover:bg-muted rounded-lg transition"
            aria-label="Open emoji picker"
          >
            <Smile size={18} className="text-muted-foreground" />
          </button>
          <Button
            onClick={onSend}
            disabled={!draft.trim()}
            className="rounded-full w-10 h-10 p-0 bg-[#1d1d1d] hover:bg-black"
          >
            <span>➤</span>
          </Button>
          {showEmojiPicker && (
            <div className="absolute bottom-14 right-14 z-10 grid w-48 grid-cols-6 gap-2 rounded-2xl border border-border bg-white p-3 shadow-lg">
              {emojiList.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onInsertEmoji?.(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-lg hover:bg-muted"
                  aria-label={`Insert ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { ChatWindow };
