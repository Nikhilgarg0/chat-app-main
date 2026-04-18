"use client";
import { authFetch } from "@/lib/authFetch";
import { useEffect, useRef, useState, useCallback } from "react";
import { pusherClient } from "@/lib/pusher-client";
import { showNotification, playNotificationSound } from "@/lib/notifications";

interface MessageData {
  _id?: string;
  channelId: string;
  author: string;
  content: string;
  time?: string;
  timestamp?: string;
  createdAt?: string;
  msgId?: string;
  type?: string;
  reactions?: Record<string, string[]>;
  replyTo?: {
    author: string;
    content: string;
    msgId?: string;
  };
  status?: string;
  highlight?: boolean;
  avatarUrl?: string;
}

interface NotificationPrefs {
  mentions?: boolean;
  allMessages?: boolean;
  sounds?: boolean;
}

export function useSocket(channelId: string, currentUsername: string, notificationPrefs: NotificationPrefs = {}) {
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const channelRef = useRef<any>(null);

  const refetchMessages = useCallback(async () => {
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
  }, [channelId]);

  const loadMoreMessages = useCallback(async () => {
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
  }, [channelId, messages]);

  useEffect(() => {
    if (!channelId) return;

    refetchMessages();

    const channelName = `chat-${channelId}`;
    const channel = pusherClient.subscribe(channelName);
    channelRef.current = channel;

    channel.bind("pusher:subscription_succeeded", () => {
      setConnected(true);
    });

    channel.bind("new-message", (data: MessageData) => {
      setMessages((prev) => {
        // If we already have this message by msgId, update its status/id
        if (data.msgId && prev.some((m) => m.msgId === data.msgId)) {
          return prev.map((m) =>
            m.msgId === data.msgId
              ? { ...m, _id: data._id, status: "sent", timestamp: data.timestamp, createdAt: data.createdAt }
              : m
          );
        }

        // Handle notifications
        if (currentUsername && data.author !== currentUsername) {
          let shouldNotify = false;
          let shouldHighlight = false;

          if (notificationPrefs?.mentions && data.content.toLowerCase().includes(`@${currentUsername.toLowerCase()}`)) {
            shouldNotify = true;
            shouldHighlight = true;
          } else if (notificationPrefs?.allMessages) {
            shouldNotify = true;
          }

          if (shouldNotify) {
            showNotification(`New message from ${data.author}`, data.content);
          }
          if (notificationPrefs?.sounds) {
            playNotificationSound();
          }

          if (shouldHighlight) {
            data.highlight = true;
          }
        }

        return [...prev, data];
      });
    });

    channel.bind("user-typing", ({ username, isTyping }: { username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (isTyping) {
          if (!prev.includes(username)) return [...prev, username];
          return prev;
        } else {
          return prev.filter((u) => u !== username);
        }
      });
    });

    channel.bind("reaction-update", (data: { messageId: string; reactions: Record<string, string[]> }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data.messageId
            ? { ...msg, reactions: data.reactions }
            : msg
        )
      );
    });

    channel.bind("message-deleted", (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== data.messageId));
    });

    const handleStateChange = (states: { current: string }) => {
      setConnected(states.current === "connected");
    };
    pusherClient.connection.bind("state_change", handleStateChange);
    
    // Also check current state in case we're already connected
    if (pusherClient.connection.state === "connected") {
      setConnected(true);
    }

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
      pusherClient.connection.unbind("state_change", handleStateChange);
    };
  }, [channelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendMessage = useCallback(async (author: string, content: string, replyTo: MessageData["replyTo"] | null = null) => {
    if (!content.trim()) return;

    const timestamp = new Date().toISOString();

    const msgId = crypto.randomUUID();
    const messageData: MessageData = {
      channelId, author, content, timestamp, msgId,
      ...(replyTo ? { replyTo } : {}),
      status: "sending",
    };

    setMessages((prev) => [...prev, messageData]);

    try {
      const res = await authFetch("/api/messages", {
        method: "POST",
        body: JSON.stringify({ channelId, author, content, timestamp, msgId, ...(replyTo ? { replyTo } : {}) }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (err) {
      console.error("Failed to save message:", err);
      setMessages((prev) => prev.filter((m) => m.msgId !== msgId));
    }
  }, [channelId]);

  const sendTyping = useCallback((username: string, isTyping: boolean) => {
    // Fire-and-forget, but don't await getIdToken on every keystroke.
    // authFetch handles the token internally.
    authFetch("/api/pusher/typing", {
      method: "POST",
      body: JSON.stringify({ channelId, username, isTyping }),
    }).catch(() => { });
  }, [channelId]);

  return { messages, setMessages, connected, sendMessage, sendTyping, typingUsers, refetchMessages, loadMoreMessages, hasMore };
}
