import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { Skeleton } from "../../components/ui/skeleton";
import type { Conversation } from "../../types/conversation";

type ChatSidebarProps = {
  conversations: Conversation[];
  loading: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  onSelectConversation: (id: string) => void;
};

const ChatSidebar = ({
  conversations,
  loading,
  search,
  onSearchChange,
  onSelectConversation
}: ChatSidebarProps) => (
  <div className="flex h-full flex-col">
    <div className="space-y-3 border-b border-border p-4">
      <h2 className="text-lg font-semibold">Chats</h2>
      <input
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p className="text-xs text-muted-foreground">
        {conversations.length} conversations
      </p>
    </div>
    <div className="flex-1 overflow-y-auto">
      {loading ? (
        <div className="space-y-4 p-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      ) : conversations.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          No conversations yet.
        </div>
      ) : (
        conversations.map((conversation) => {
          const partner = conversation.participants[0];
          return (
            <button
              key={conversation._id}
              onClick={() => onSelectConversation(conversation._id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent"
            >
              <Avatar>
                <AvatarImage src={partner?.avatar?.url} />
                <AvatarFallback>{partner?.name?.slice(0, 1)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{partner?.name}</p>
                <p className="text-xs text-muted-foreground">
                  {conversation.lastMessage?.text || "No messages yet"}
                </p>
              </div>
            </button>
          );
        })
      )}
    </div>
  </div>
);

export { ChatSidebar };
