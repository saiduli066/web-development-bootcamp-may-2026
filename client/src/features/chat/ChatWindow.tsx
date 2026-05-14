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
  onSend: () => void;
};

const ChatWindow = ({
  loading,
  groupedMessages,
  typingUsers,
  draft,
  onDraftChange,
  onSend
}: ChatWindowProps) => (
  <div className="flex h-full flex-col">
    <div className="border-b border-border p-4">
      <h2 className="text-lg font-semibold">Conversation</h2>
    </div>
    <div className="flex-1 overflow-y-auto p-4">
      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((item) => (
            <Skeleton key={item} className="h-12 w-3/4" />
          ))}
        </div>
      ) : Object.keys(groupedMessages).length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No messages yet. Start the conversation.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMessages).map(([date, items]) => (
            <div key={date} className="space-y-3">
              <div className="text-center text-xs text-muted-foreground">
                {date}
              </div>
              {items.map((message) => (
                <MemoMessageBubble key={message._id} message={message} />
              ))}
            </div>
          ))}
        </div>
      )}
      {typingUsers.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Typing</span>
          <span className="flex gap-1">
            <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
            <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
          </span>
        </div>
      )}
    </div>
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button onClick={onSend} disabled={!draft.trim()}>
          Send
        </Button>
      </div>
    </div>
  </div>
);

export { ChatWindow };
