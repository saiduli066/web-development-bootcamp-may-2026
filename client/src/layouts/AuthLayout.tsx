import { ReactNode } from "react";

type AuthLayoutProps = {
  children: ReactNode;
};

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="min-h-screen bg-[#f5f5f5] px-4 py-10 sm:py-12">
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-[32px] bg-white shadow-[0_18px_60px_-30px_rgba(0,0,0,0.45)]">
      <div className="relative h-40 bg-[#f4c34a] sm:h-48">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[size:28px_28px]" />
        <div className="absolute left-5 top-6 w-[70%] rounded-2xl border border-[#dcdcdc] bg-white px-4 py-3 text-sm font-semibold text-[#1f1f1f] shadow-sm">
          <span className="absolute -top-4 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#2b7de9] shadow-md">
            <span className="h-3 w-3 rounded-full bg-white" />
          </span>
          <p className="text-base font-bold">Hola!</p>
          <p>Nice to hear from you.</p>
        </div>
        <div className="absolute right-6 top-28 w-[55%] rounded-2xl border border-[#6ea6dc] bg-[#cfe6ff] px-4 py-3 text-sm font-semibold text-[#1f3e5a] shadow-sm">
          <span className="absolute -top-4 left-6 flex h-7 w-7 items-center justify-center rounded-full bg-[#2b7de9] shadow-md">
            <span className="h-3 w-3 rounded-full bg-white" />
          </span>
          And you, too!
        </div>
      </div>
      <div className="px-6 pb-8 pt-6 sm:px-8">{children}</div>
    </div>
  </div>
);

export { AuthLayout };
