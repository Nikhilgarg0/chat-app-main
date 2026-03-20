"use client";

import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

export function useSocket(room) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    let active = true;
    const socket = getSocket();
    socketRef.current = socket;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/messages?room=${room}`);
        const data = await res.json();
        if (data.success && active) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch message history:", err);
      }
    };

    fetchHistory();

    const onConnect = () => {
      setConnected(true);
      socket.emit("join_room", room); // Send room join
    };

    const onDisconnect = () => {
      setConnected(false);
    };

    const onReceiveMessage = (data) => {
      console.log("Received via socket:", data);
      setMessages((prev) => {
        // Robust dedup based on a unique client-generated ID
        if (data.msgId && prev.some((m) => m.msgId === data.msgId)) {
          return prev;
        }
        // Fallback dedup for old messages without msgId
        if (prev.some((m) => m.content === data.content && m.time === data.time && m.author === data.author)) {
          return prev;
        }
        return [...prev, data];
      });
    };

    // Attach listeners
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("receive_message", onReceiveMessage);

    // Initial explicit join in case it connects before listener is up
    socket.emit("join_room", room);

    if (socket.connected) {
      setConnected(true);
    }

    return () => {
      active = false;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("receive_message", onReceiveMessage);
    };
  }, [room]);

  const sendMessage = async (author, content) => {
    const socket = socketRef.current;
    if (!socket || !content.trim()) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const msgId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const messageData = { room, author, content, time, msgId };

    // Emit via socket instantly
    socket.emit("send_message", messageData);

    // Optimistic UI update (makes it visible instantly to sender)
    setMessages((prev) => [...prev, messageData]);

    // Save to DB in the background
    fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messageData),
    }).catch((err) => {
      console.error("Failed to save message:", err);
    });
  };

  return { messages, connected, sendMessage };
}