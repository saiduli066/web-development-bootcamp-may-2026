import { io, Socket } from "socket.io-client";

const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL;

export const createSocket = (token: string): Socket =>
  io(socketUrl, {
    auth: { token },
    transports: ["websocket"],
  });
