"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import MessageBubble from "@/components/chat/MessageBubble";
import Toast from "@/components/ui/Toast";
import { auth } from "@/lib/firebase";
import { useSidebar } from "@/components/SidebarContext";

const AI_COMMANDS = [
  { command: "/ask", description: "Ask AI a question about this conversation" },
  { command: "/summarize", description: "Summarize the conversation" },
  { command: "/todo", description: "Extract action items" }
];

export default function ChannelPage() {
  const { channelId, workspaceId } = useParams();
  const [username, setUsername] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [activeCommand, setActiveCommand] = useState<string | null>(null);
  const [restInput, setRestInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [channelName, setChannelName] = useState(channelId as string);
  const [replyTo, setReplyTo] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { messages, setMessages, connected, sendMessage, sendTyping, typingUsers, refetchMessages, loadMoreMessages, hasMore } = useSocket(channelId as string);
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const res = await fetch(`/api/users/profile?firebaseUid=${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setUsername(data.user?.displayName || user.email?.split("@")[0] || "User");
          } else {
            setUsername(user.email?.split("@")[0] || "User");
          }
        } catch (e) {
          setUsername(user.email?.split("@")[0] || "User");
        }
      }
    });

    const fetchChannelName = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          const channel = data.workspace?.channels?.find((c: any) => c._id === channelId);
          if (channel) {
            setChannelName(channel.name);
          }
        }
      } catch (e) { }
    };
    fetchChannelName();

    return () => unsub();
  }, [workspaceId, channelId]);

  const lastMessageId = (messages[messages.length - 1] as any)?._id
    ?? (messages[messages.length - 1] as any)?.msgId
    ?? null;

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [lastMessageId]);

  const filteredCommands = AI_COMMANDS.filter((c) =>
    c.command.toLowerCase().startsWith(messageInput.toLowerCase())
  );

  useEffect(() => {
    if (messageInput.startsWith("/") && !messageInput.includes(" ") && filteredCommands.length > 0) {
      setShowMenu(true);
    } else {
      setShowMenu(false);
    }
  }, [messageInput, filteredCommands]);

  const COMMAND_PLACEHOLDERS: Record<string, string> = {
    "/ask": "Ask anything about this conversation...",
    "/summarize": "Press Enter to summarize...",
    "/todo": "Press Enter to extract action items...",
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    if (showMenu) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleSelectCommand = (cmd: string) => {
    setActiveCommand(cmd);
    setRestInput("");
    setMessageInput(cmd + " ");
    setShowMenu(false);
    inputRef.current?.focus();
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (activeCommand) {
      setRestInput(val);
      setMessageInput(activeCommand + " " + val);
    } else {
      setMessageInput(val);
    }
    sendTyping(username, true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(username, false);
    }, 2000);
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !username || isSending) return;
    setIsSending(true);
    const text = messageInput.trim();
    setMessageInput("");
    setActiveCommand(null);
    setRestInput("");
    sendTyping(username, false);

    try {
      if (text.startsWith("/ask ") || text.startsWith("/summarize") || text.startsWith("/todo")) {
        const parts = text.split(" ");
        const command = parts[0].substring(1);
        const arg = parts.slice(1).join(" ");

        setIsThinking(true);
        try {
          const res = await fetch("/api/ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              command,
              messages: arg,
              channelId,
              workspaceId
            })
          });

          if (res.ok) {
            await refetchMessages();
          }
        } catch (err) {
          console.error(err);
        } finally {
          setIsThinking(false);
        }
      } else {
        const replyContext = replyTo
          ? { author: replyTo.author, content: (replyTo.content || "").slice(0, 60), msgId: replyTo.msgId }
          : null;
        sendMessage(username, text, replyContext as any);
        setReplyTo(null);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMenu && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => (i + 1) % filteredCommands.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => (i - 1 + filteredCommands.length) % filteredCommands.length);
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelectCommand(filteredCommands[selectedIndex].command);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setShowMenu(false);
        return;
      }
    }

    // Backspace on empty restInput clears the command pill
    if (e.key === "Backspace" && activeCommand && restInput === "") {
      e.preventDefault();
      setActiveCommand(null);
      setRestInput("");
      setMessageInput("");
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const onReact = async (messageId: string, emoji: string) => {
    if (!auth.currentUser) return;
    const firebaseUid = auth.currentUser.uid;

    // Snapshot current state for rollback
    let prevMessages: any[];
    (setMessages as any)((prev: any[]) => {
      prevMessages = prev;
      return prev.map((msg: any) => {
        if (msg._id !== messageId) return msg;
        const reactions = { ...(msg.reactions || {}) };
        const users: string[] = reactions[emoji] ? [...reactions[emoji]] : [];
        const idx = users.indexOf(firebaseUid);
        if (idx === -1) users.push(firebaseUid);
        else users.splice(idx, 1);
        reactions[emoji] = users;
        if (reactions[emoji].length === 0) delete reactions[emoji];
        return { ...msg, reactions };
      });
    });

    try {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji, firebaseUid, username })
      });
    } catch (e) {
      console.error(e);
      // Roll back to the state before the optimistic update
      (setMessages as any)(() => prevMessages);
    }
  };

  const onDelete = useCallback(async (messageId: string) => {
    // Optimistic removal
    (setMessages as any)((prev: any[]) => prev.filter((m: any) => m._id !== messageId));
    try {
      await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: username }),
      });
    } catch (e) {
      console.error(e);
    }
  }, [username, setMessages]);

  const handleRetry = useCallback((failedMsg: any) => {
    (setMessages as any)((prev: any[]) => prev.filter((m: any) => m.msgId !== failedMsg.msgId));
    sendMessage(username, failedMsg.content, failedMsg.replyTo || null);
  }, [username, sendMessage, setMessages]);

  const handleLoadMore = async () => {
    const container = scrollContainerRef.current;
    const prevScrollHeight = container?.scrollHeight ?? 0;
    await loadMoreMessages();
    requestAnimationFrame(() => {
      if (container) {
        container.scrollTop = container.scrollHeight - prevScrollHeight;
      }
    });
  };

  const showToast = useCallback((msg: string) => setToast(msg), []);
  const onReply = useCallback((msg: any) => {
    setReplyTo(msg);
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[var(--bg-base)] w-full">
      {/* Header - Glassmorphism */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-[20px] backdrop-saturate-[180%] z-20 shrink-0 sticky top-0">

        {/* Left Side: Hamburger */}
        <div className="flex items-center flex-1">
          {!isSidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-2 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Open Sidebar"
            >
              <svg className="w-6 h-6 lg:w-5 lg:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          )}
        </div>

        {/* Center: Channel Name */}
        <div className="flex items-center justify-center gap-1 flex-1 lg:flex-none">
          <span className="text-[var(--text-tertiary)] font-mono text-base">#</span>
          <h2 className="text-[var(--text-primary)] font-display font-bold text-base lg:text-lg tracking-tight truncate max-w-[140px] sm:max-w-none text-center">{channelName}</h2>
        </div>

        {/* Right Side: Status Pill */}
        <div className="flex items-center justify-end flex-1">
          <div className="flex items-center gap-1.5 px-2 py-1 lg:px-3 lg:py-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--bg-surface)] shadow-sm">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[var(--success)]" : "bg-red-400 animate-pulse"}`}></div>
            <span className="text-[9px] lg:text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-wider">{connected ? "Live" : "Offline"}</span>
          </div>
        </div>

      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-0 py-4 scroll-smooth [&::-webkit-scrollbar]:hidden z-10 overscroll-contain flex flex-col" style={{ WebkitOverflowScrolling: "touch" }}>

        {hasMore && (
          <div className="flex justify-center py-3">
            <button
              onClick={handleLoadMore}
              className="text-[13px] text-[var(--accent)] font-medium px-4 py-1.5 rounded-full border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Load earlier messages
            </button>
          </div>
        )}
        {messages.length === 0 && connected && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4 pt-10">
            <div className="w-16 h-16 rounded-[24px] bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] shadow-apple">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div className="text-center font-body">
              <p className="text-[15px] font-semibold text-[var(--text-primary)] tracking-tight">Encrypted Hub</p>
              <p className="text-[13px] text-[var(--text-secondary)] mt-1">Beginning of # {channelName}</p>
            </div>
          </div>
        )}

        {messages.map((msg: any, i: number) => {
          const isGrouped = i > 0 && (messages[i - 1] as any).author === msg.author;

          return (
            <MessageBubble
              key={msg._id || i}
              message={msg}
              isOwn={msg.author === username}
              isGrouped={isGrouped}
              firebaseUid={auth.currentUser?.uid}
              onReact={onReact}
              onDelete={onDelete}
              onReply={onReply}
              username={username}
              onShowToast={showToast}
              onRetry={handleRetry}
            />
          );
        })}

        {isThinking && (
          <div className="flex items-start gap-3 px-4 py-2 mt-4 mb-2 animate-slide-up">
            <div className="w-8 h-8 rounded-lg shrink-0 bg-transparent flex items-center justify-center border border-[var(--ai-accent)] border-opacity-30 shadow-[0_0_12px_var(--ai-bg)_inset] opacity-80 backdrop-blur-sm">
              <span className="text-[10px] text-[var(--ai-accent)] font-bold">AI</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[12px] font-semibold tracking-wide text-[var(--ai-accent)] flex items-center gap-2">
                Nexus AI
              </span>
              <div className="flex gap-1 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input wrapper - Glassmorphism */}
      <div className="p-4 bg-[var(--bg-glass)] backdrop-blur-[20px] backdrop-saturate-[180%] border-t border-[var(--border)] z-20 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1000px] mx-auto flex flex-col gap-0">

          {/* Reply bar — normal flow, sits above the input bar */}
          {replyTo && (
            <div style={{
              background: "var(--bg-elevated)",
              borderTop: "2px solid var(--accent)",
              borderBottom: "none",
              borderRadius: "8px 8px 0 0",
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--accent)", marginBottom: 2 }}>
                  ↩ Replying to {replyTo.author}
                </div>
                <div style={{
                  fontSize: 12, color: "var(--text-secondary)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                }}>
                  {(replyTo.content || "").slice(0, 60)}{(replyTo.content || "").length > 60 ? "…" : ""}
                </div>
              </div>
              <button
                onClick={() => setReplyTo(null)}
                style={{
                  background: "transparent", border: "none",
                  color: "var(--text-tertiary)", fontSize: 16,
                  cursor: "pointer", flexShrink: 0, padding: 4,
                  lineHeight: 1,
                }}
              >✕</button>
            </div>
          )}

          {/* Typing Indicator — normal flow, sits above the input bar */}
          {(() => {
            const activeTypers = typingUsers.filter((u: string) => u !== username);
            if (activeTypers.length === 0) return null;
            const verb = activeTypers.length === 1 ? 'is' : 'are';
            let names: string;
            if (activeTypers.length === 1) {
              names = activeTypers[0];
            } else if (activeTypers.length === 2) {
              names = `${activeTypers[0]} and ${activeTypers[1]}`;
            } else {
              names = `${activeTypers[0]}, ${activeTypers[1]} and ${activeTypers.length - 2} other${activeTypers.length - 2 > 1 ? 's' : ''}`;
            }
            return (
              <div className="flex items-center gap-1.5 animate-slide-up px-2 py-1 mb-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] shadow-sm self-start">
                <span className="text-[11px] text-[var(--text-tertiary)] font-medium italic">
                  {names} {verb} typing
                </span>
                <div className="flex gap-0.5 ml-1">
                  <div className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-1 h-1 bg-[var(--text-tertiary)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            );
          })()}

          {/* Input bar row — relative so the command menu can anchor to it */}
          <div className="relative group">

            {/* Splash Command Menu */}
            {showMenu && filteredCommands.length > 0 && (
              <div
                ref={menuRef}
                className="absolute bottom-full left-0 right-0 lg:left-4 lg:right-auto mb-3 w-full lg:w-80 bg-[var(--bg-surface)] border border-[var(--border)] rounded-[12px] p-1.5 shadow-apple z-50 animate-in fade-in slide-in-from-bottom-2 duration-200"
              >
                <div className="text-[var(--ai-accent)] text-[10px] font-bold tracking-widest uppercase mb-1 px-2 pt-1 flex items-center gap-1.5">
                  ✦ AI Command
                </div>
                {filteredCommands.map((item, idx) => (
                  <div
                    key={item.command}
                    onClick={() => handleSelectCommand(item.command)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex flex-row items-center gap-3 px-[12px] py-[8px] rounded-[8px] cursor-pointer transition-colors ${idx === selectedIndex ? "bg-[var(--bg-elevated)]" : "hover:bg-[var(--bg-elevated)]"
                      }`}
                  >
                    <span className="text-[var(--accent)] font-mono font-medium text-[13px] shrink-0">{item.command}</span>
                    <span className="text-[var(--text-secondary)] text-[13px] truncate">{item.description}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <div className={`w-full flex items-center gap-1 bg-[var(--bg-elevated)] border border-[var(--border)] focus-within:border-[var(--accent)] focus-within:shadow-[0_0_0_3px_var(--accent-glow)] p-[4px] lg:pr-[6px] transition-all relative z-10 min-h-[48px] ${replyTo ? "rounded-b-[20px] rounded-t-none" : "rounded-[20px]"}`}>
              <div className="pl-3 md:pl-4 py-1 flex-1 flex items-center gap-2 h-full">
                {activeCommand && (
                  <span style={{
                    background: 'var(--ai-bg)',
                    color: 'var(--ai-accent)',
                    borderRadius: '999px',
                    padding: '2px 10px',
                    fontSize: '13px',
                    fontWeight: 500,
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {activeCommand}
                  </span>
                )}
                <input
                  ref={inputRef}
                  placeholder={activeCommand ? (COMMAND_PLACEHOLDERS[activeCommand] ?? "Message channel...") : "Message channel..."}
                  value={activeCommand ? restInput : messageInput}
                  onChange={handleMessageChange}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent border-0 ring-0 focus:ring-0 text-[15px] font-body text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
                  autoFocus
                  disabled={!connected}
                />
              </div>

              <button
                onClick={handleSend}
                disabled={!messageInput.trim() || !connected || !username || isThinking || isSending}
                className="w-[44px] h-[44px] lg:w-8 lg:h-8 rounded-[16px] lg:rounded-xl bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white flex items-center justify-center shrink-0 transition-all active:scale-[0.92] disabled:opacity-30 disabled:hover:scale-100 disabled:hover:bg-[var(--accent)] disabled:cursor-not-allowed group/btn shadow-sm"
              >
                {(isThinking || isSending) ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 lg:w-4 lg:h-4 ml-[1px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
