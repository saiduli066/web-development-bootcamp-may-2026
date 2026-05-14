import { create } from "zustand";

type UIState = {
  modals: Record<string, boolean>;
  activeTab: string;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  toggleModal: (key: string, value?: boolean) => void;
  setActiveTab: (tab: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: "light" | "dark") => void;
};

export const useUIStore = create<UIState>((set, get) => ({
  modals: {},
  activeTab: "media",
  sidebarOpen: true,
  theme: "light",
  toggleModal: (key, value) => {
    const current = get().modals[key] || false;
    set({ modals: { ...get().modals, [key]: value ?? !current } });
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setTheme: (theme) => set({ theme }),
}));
