import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="flex min-h-screen items-center justify-center bg-background px-4">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm">
      {children}
    </div>
  </div>
);

export { AuthLayout };
