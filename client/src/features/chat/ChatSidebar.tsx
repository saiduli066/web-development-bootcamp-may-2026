import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MessageCircle, Phone, Sliders, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Skeleton } from "../../components/ui/skeleton";
import type { Conversation } from "../../types/conversation";

type ChatSidebarProps = {
  conversations: Conversation[];
  loading: boolean;
  search: string;
  currentUserId?: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (id: string) => void;
  onAddUser: (username: string) => Promise<{ success: boolean; message?: string }>;
};

const ChatSidebar = ({
  conversations,
  loading,
  search,
  currentUserId,
  onSearchChange,
  onSelectConversation,
  onAddUser
}: ChatSidebarProps) => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleOpen = () => {
    setIsModalOpen(true);
    setUsername("");
    setError("");
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setUsername("");
    setError("");
  };

  const handleSubmit = async () => {
    if (!username.trim()) {
      setError("Username is required");
      return;
    }
    setIsSubmitting(true);
    setError("");
    const result = await onAddUser(username.trim());
    setIsSubmitting(false);
    if (!result.success) {
      setError(result.message || "Unable to add user");
      return;
    }
    handleClose();
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header */}
      <div className="space-y-4 p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Messages</h1>
          <button
            onClick={handleOpen}
            className="w-10 h-10 rounded-full bg-[#1d1d1d] text-white flex items-center justify-center hover:bg-black transition"
            aria-label="Add new chat"
          >
            <Plus size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search"
            className="w-full rounded-full border border-[#e6e6e6] bg-white px-4 py-2 pl-10 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4 p-4">
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex items-center gap-3">
                <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground text-center">
            No conversations yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conversation) => {
              const partner =
                conversation.participants.find(
                  (participant) => participant._id !== currentUserId,
                ) || conversation.participants[0];
              const unread = currentUserId
                ? conversation.unreadCounts?.[currentUserId] ?? 0
                : 0;
              const isUnread = unread > 0;
              const lastMessageTime = conversation.lastMessage?.createdAt
                ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true
                    },
                  )
                : "";

              return (
                <button
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation._id)}
                  className="flex w-full items-center gap-3 px-4 py-3 hover:bg-[#f9f9f9] transition text-left"
                >
                  <div className="flex-shrink-0">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={partner?.avatar?.url} />
                      <AvatarFallback className="text-base font-semibold">
                        {partner?.name?.slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {partner?.name}
                      </p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {lastMessageTime}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-muted-foreground truncate max-w-xs">
                        {conversation.lastMessage?.text ||
                          conversation.lastMessage?.content ||
                          "No messages yet"}
                      </p>
                      {isUnread && (
                        <span className="bg-[#ff9500] text-white text-xs font-bold px-2 py-1 rounded flex-shrink-0">
                          NEW
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="border-t border-border p-3 flex items-center justify-around bg-white">
        <button className="p-3 hover:bg-muted rounded-lg transition">
          <MessageCircle size={20} className="text-muted-foreground" />
        </button>
        <button className="p-3 hover:bg-muted rounded-lg transition">
          <Phone size={20} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => navigate("/profile")}
          className="p-3 hover:bg-muted rounded-lg transition"
          aria-label="Open settings"
        >
          <Sliders size={20} className="text-muted-foreground" />
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Start a new chat</h3>
              <button
                onClick={handleClose}
                className="rounded-full p-2 hover:bg-muted"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Enter a username (ex: @gmail)
            </p>
            <div className="mt-4 space-y-2">
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="@username"
                className="w-full rounded-full border border-[#e6e6e6] bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={handleClose}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-full bg-[#1d1d1d] px-4 py-2 text-sm font-semibold text-white hover:bg-black disabled:opacity-60"
              >
                {isSubmitting ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export { ChatSidebar };
