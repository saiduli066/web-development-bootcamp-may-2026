import { ReactNode } from "react";

type ChatLayoutProps = {
  sidebar: ReactNode;
  children: ReactNode;
};

const ChatLayout = ({ sidebar, children }: ChatLayoutProps) => (
  <div className="flex h-screen bg-background">
    <aside className="hidden w-80 border-r border-border lg:block">
      {sidebar}
    </aside>
    <main className="flex-1">{children}</main>
  </div>
);

export { ChatLayout };
