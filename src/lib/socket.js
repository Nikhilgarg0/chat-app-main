import { io } from "socket.io-client";

let socket;

export const getSocket = () => {
  if (!socket) {
    // Let socket.io auto-detect the origin in both dev and prod
    socket = io({
      path: "/socket.io",
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};  