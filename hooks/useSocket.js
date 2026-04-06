"use client";
import { authFetch } from "@/lib/authFetch";
import { useEffect, useRef, useState } from "react";
import { pusherClient } from "@/lib/pusher-client";

export function useSocket(channelId) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const channelRef = useRef(null);

  const refetchMessages = async () => {
    try {
      const res = await authFetch(`/api/messages?channelId=${channelId}`);
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
      const res = await authFetch(`/api/messages?channelId=${channelId}&before=${encodeURIComponent(cursor)}`);
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
        if (data.msgId && prev.some((m) => m.msgId === data.msgId)) {
          // B3 — optimistic message exists, patch it with the real _id from server
          return prev.map((m) =>
            m.msgId === data.msgId
              ? { ...m, _id: data._id, status: "sent" }
              : m
          );
        }
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

    const msgId = crypto.randomUUID();
    const messageData = {
      channelId, author, content, time, msgId,
      ...(replyTo ? { replyTo } : {}),
      status: "sending",
    };

    setMessages((prev) => [...prev, messageData]);

    try {
      const res = await authFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ channelId, author, content, time, msgId, ...(replyTo ? { replyTo } : {}) }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (err) {
      console.error("Failed to save message:", err);
      // B5 — mark as failed so the UI can show a retry option, remove the ghost
      setMessages((prev) => prev.filter((m) => m.msgId !== msgId));
    }
  };

  const sendTyping = (username, isTyping) => {
    authFetch("/api/pusher/typing", {
      method: "POST",
      body: JSON.stringify({ channelId, username, isTyping }),
    }).catch(() => { });
  };

  return { messages, setMessages, connected, sendMessage, sendTyping, typingUsers, refetchMessages, loadMoreMessages, hasMore };
}
