import { create } from "zustand";
import type { Socket } from "socket.io-client";
import { createSocket } from "../lib/socket";
import { getAccessToken } from "../lib/tokenStorage";

type SocketState = {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
  emit: (event: string, payload?: unknown, callback?: (...args: any[]) => void) => void;
};

export const useSocketStore = create<SocketState>((set, get) => ({
  socket: null,
  connect: () => {
    const token = getAccessToken();
    if (!token) return;
    const socket = createSocket(token);
    set({ socket });
  },
  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
  emit: (event, payload, callback) => {
    const socket = get().socket;
    if (socket) {
      socket.emit(event, payload, callback);
    }
  },
}));
