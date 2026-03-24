"use client";

import { useEffect, useRef, useState } from "react";
import { pusherClient } from "@/lib/pusher";

export function useSocket(channelId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const channelRef = useRef(null);

  const refetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?channelId=${channelId}`);
      const data = await res.json();
      if (data.success) {
        setMessages(data.messages);
        setHasMore(data.hasMore ?? false);
      }
    } catch (err) {
      console.error("Failed to fetch message history:", err);
    }
  };

  const loadMoreMessages = async () => {
    if (!messages.length) return;
    const oldest = messages[0];
    const cursor = oldest.createdAt;
    if (!cursor) return;
    try {
      const res = await fetch(`/api/messages?channelId=${channelId}&before=${encodeURIComponent(cursor)}`);
      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [...data.messages, ...prev]);
        setHasMore(data.hasMore ?? false);
      }
    } catch (err) {
      console.error("Failed to load more messages:", err);
    }
  };

  useEffect(() => {
    if (!channelId) return;

    refetchMessages();

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

    channel.bind("user-typing", ({ username, isTyping }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (!prev.includes(username)) return [...prev, username];
          return prev;
        } else {
          return prev.filter((u) => u !== username);
        }
      });
    });

    channel.bind("reaction-update", (data) => {
      setMessages((prev) => 
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    });

    channel.bind("message-deleted", (data) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
    });

    // Also monitor global connection state
    const handleStateChange = (states) => {
      setConnected(states.current === "connected");
    };
    pusherClient.connection.bind("state_change", handleStateChange);

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusherClient.connection.unbind("state_change", handleStateChange);
    };
  }, [channelId]);

  const sendMessage = async (author, content, replyTo = null) => {
    if (!content.trim()) return;

    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const msgId = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    const messageData = { channelId, author, content, time, msgId, ...(replyTo ? { replyTo } : {}), status: "sending" };

    // Optimistic UI update
    setMessages((prev) => [...prev, messageData]);

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Strip the UI-only status field before sending to the API
        body: JSON.stringify({ channelId, author, content, time, msgId, ...(replyTo ? { replyTo } : {}) }),
      });
      if (!res.ok) throw new Error("Failed");
      setMessages((prev) =>
        prev.map((m) => m.msgId === msgId ? { ...m, status: "sent" } : m)
      );
    } catch (err) {
      console.error("Failed to save message:", err);
      setMessages((prev) =>
        prev.map((m) => m.msgId === msgId ? { ...m, status: "failed" } : m)
      );
    }
  };

  const sendTyping = (username, isTyping) => {
    fetch("/api/pusher/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channelId, username, isTyping }),
    }).catch(() => {});
  };

  return { messages, setMessages, connected, sendMessage, sendTyping, typingUsers, refetchMessages, loadMoreMessages, hasMore };
}