"use client";

import { useState } from "react";
import UserAvatar from "@/components/ui/UserAvatar";

export default function MessageBubble({ message, isOwn, firebaseUid, onReact, isConsecutive }) {
  const isAI = message.type === "ai";
  const [showPicker, setShowPicker] = useState(false);
  const emojis = ["👍", "❤️", "😂", "🔥", "🎉"];

  const handleReact = (emoji) => {
    if (!message._id || !onReact) return;
    onReact(message._id, emoji);
    setShowPicker(false);
  };

  const reactionEntries = message.reactions ? Object.entries(message.reactions) : [];

  return (
    <div
      className={`flex flex-col animate-slide-up relative group/message w-full hover:bg-[var(--bg-elevated)] hover:bg-opacity-50 px-4 py-[6px] transition-colors rounded-[12px] ${
        isConsecutive ? "mt-0" : "mt-2"
      }`}
      onMouseEnter={() => setShowPicker(true)}
      onMouseLeave={() => setShowPicker(false)}
    >
      <div className="flex items-start gap-4 max-w-full">
        
        {/* Avatar Area */}
        <div className="w-9 flex justify-end shrink-0 pt-0.5">
          {isConsecutive ? (
            <span className="text-[10px] text-[var(--text-tertiary)] font-mono opacity-0 group-hover/message:opacity-100 transition-opacity select-none leading-relaxed mt-1">
              {message.time}
            </span>
          ) : isAI ? (
            <div className="w-[36px] h-[36px] rounded-[10px] flex flex-col items-center justify-center text-[12px] font-bold shrink-0 shadow-sm border bg-[var(--bg-surface)] border-[var(--ai-accent)]/30 text-[var(--ai-accent)] shadow-[0_2px_8px_var(--ai-bg)]">
              AI
            </div>
          ) : (
            <UserAvatar avatarUrl={message.avatarUrl} displayName={message.author} size={36} />
          )}
        </div>

        {/* Message Content Area */}
        <div className="flex-1 min-w-0 pb-[2px]">
          {!isConsecutive && (
            <div className="flex items-baseline gap-2 mb-1">
              <span className={`text-[14px] font-semibold tracking-tight ${isAI ? "text-[var(--ai-accent)]" : "text-[var(--text-primary)]"}`}>
                {isAI ? "Nexus AI" : message.author}
              </span>
              <span className="text-[11px] text-[var(--text-tertiary)] font-medium">
                {message.time}
              </span>
            </div>
          )}

          <div className="relative mt-0.5">
            {isAI ? (
              <div className="w-full bg-[var(--ai-bg)] border-l-2 border-[var(--ai-accent)] rounded-none rounded-r-[12px] px-[16px] py-[14px] text-[var(--text-primary)] text-[15px] leading-[1.6]">
                <div className="text-[var(--ai-accent)] text-[11px] font-semibold mb-2 tracking-wider">✦ NEXUS AI</div>
                {message.content}
              </div>
            ) : isOwn ? (
              <div className="w-full bg-transparent border-l-[3px] border-[var(--accent)]/50 pl-[16px] text-[var(--text-primary)] opacity-90 text-[15px] leading-[1.6] py-0.5">
                {message.content}
              </div>
            ) : (
              <div className="w-full bg-transparent text-[var(--text-primary)] text-[15px] leading-[1.6] py-0.5">
                {message.content}
              </div>
            )}

            {/* Floating Picker */}
            {showPicker && message._id && (
              <div className="absolute -top-8 right-0 flex items-center bg-[var(--bg-surface)] border border-[var(--border)] rounded-full px-2 py-1 shadow-apple z-10 gap-1 lg:-right-4 animate-in fade-in zoom-in duration-200">
                {emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="hover:scale-125 hover:-translate-y-1 transition-transform text-[15px] select-none p-1 block"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reaction Bar beneath text */}
          {reactionEntries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {reactionEntries.map(([emoji, users]) => {
                const hasReacted = users.includes(firebaseUid);
                return (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className={`flex items-center gap-1.5 text-[12px] px-2.5 py-[3px] rounded-full border transition-colors ${
                      hasReacted 
                        ? "bg-[var(--accent-glow)] border-[var(--accent)]/40 text-[var(--accent)] hover:bg-[var(--accent)]/20" 
                        : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                    }`}
                  >
                    <span>{emoji}</span>
                    <span className="font-medium text-[10px]">{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}