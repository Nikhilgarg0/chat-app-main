"use client";

import { useEffect, useRef, useState } from "react";
import { pusherClient } from "@/lib/pusher";

export function useSocket(channelId) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!channelId) return;

    let active = true;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`/api/messages?channelId=${channelId}`);
        const data = await res.json();
        if (data.success && active) {
          setMessages(data.messages);
        }
      } catch (err) {
        console.error("Failed to fetch message history:", err);
      }
    };

    fetchHistory();

    const channelName = `chat-${channelId}`;
    const channel = pusherClient.subscribe(channelName);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => {
      setConnected(true);
    });

    channel.bind("new-message", (data) => {
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
    });

    // Also monitor global connection state
    const handleStateChange = (states) => {
      setConnected(states.current === "connected");
    };
    pusherClient.connection.bind("state_change", handleStateChange);

    return () => {
      active = false;
      channel.unbind_all();
      channel.unsubscribe();
      pusherClient.connection.unbind("state_change", handleStateChange);
    };
  }, [channelId]);

  const sendMessage = async (author, content) => {
    if (!content.trim()) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const msgId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const messageData = { channelId, author, content, time, msgId };

    // Optimistic UI update
    setMessages((prev) => [...prev, messageData]);

    // Save to DB and trigger Pusher broadcast
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