"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import UserAvatar from "@/components/ui/UserAvatar";

const PRIMARY_EMOJIS = ["👍", "❤️", "😂", "🔥", "🎉"];
const EXTRA_EMOJIS = ["😮", "😢", "👏", "🎊", "💯"];
const SWIPE_THRESHOLD = 60;   // px to trigger reply
const SWIPE_MAX = 80;   // max visual travel

export default function MessageBubble({
  message,
  isOwn,
  isGrouped,
  firebaseUid,
  onReact,
  onDelete,
  onReply,
  onForward,
  username,
  onShowToast,
  onRetry,
}) {
  const isAI = message.type === "ai";

  // ── State ───────────────────────────────────────────────────────────────────
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuAbove, setMenuAbove] = useState(true);
  const [showExtraEmojis, setShowExtraEmojis] = useState(false);
  const [rowHovered, setRowHovered] = useState(false);

  // Swipe state
  const [swipeDx, setSwipeDx] = useState(0);   // current visual offset
  const [swipeSpring, setSwipeSpring] = useState(false); // spring-back transition

  const menuRef = useRef(null);
  const bubbleRef = useRef(null);
  const longPressRef = useRef(null);

  // Swipe tracking refs (not state, to avoid re-renders during drag)
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const swipeActive = useRef(false);
  const replyFired = useRef(false);

  // ── Context-menu open ───────────────────────────────────────────────────────
  const openMenu = useCallback((clientY) => {
    setMenuAbove(clientY > window.innerHeight / 2);
    setShowExtraEmojis(false);
    setMenuOpen(true);
  }, []);

  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    openMenu(e.clientY);
  }, [openMenu]);

  // ── Long-press (mobile) — separate from swipe ───────────────────────────────
  const handleTouchStart = useCallback((e) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    swipeActive.current = false;
    replyFired.current = false;

    longPressRef.current = setTimeout(() => {
      if (!swipeActive.current) openMenu(t.clientY);
    }, 500);
  }, [openMenu]);

  // ── Swipe move ──────────────────────────────────────────────────────────────
  const handleTouchMove = useCallback((e) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    // Cancel long-press the moment user moves
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
      if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
    }

    // Only count as a swipe if predominantly horizontal and going RIGHT
    if (dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      swipeActive.current = true;
      e.preventDefault(); // prevent scroll
      const clamped = Math.min(dx, SWIPE_MAX);
      setSwipeDx(clamped);
      setSwipeSpring(false);
    }
  }, []);

  // ── Swipe end ───────────────────────────────────────────────────────────────
  const handleTouchEnd = useCallback(() => {
    if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }

    if (swipeActive.current && swipeDx >= SWIPE_THRESHOLD && !replyFired.current) {
      replyFired.current = true;
      onReply?.(message);
    }

    // Spring back
    setSwipeSpring(true);
    setSwipeDx(0);
    swipeActive.current = false;
  }, [swipeDx, message, onReply]);

  // ── Close context-menu on outside tap ──────────────────────────────────────
  useEffect(() => {
    if (!menuOpen) return;
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close, { passive: true });
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close);
    };
  }, [menuOpen]);

  // ── Action handlers ─────────────────────────────────────────────────────────
  const handleReact = (emoji) => {
    if (!message._id || !onReact) return;
    onReact(message._id, emoji);
    setMenuOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    setMenuOpen(false);
    onShowToast?.("Copied!");
  };

  const handleDelete = () => { setMenuOpen(false); onDelete?.(message._id); };
  const handleReplyClick = () => { setMenuOpen(false); onReply?.(message); };
  const handleForward = () => { 
    setMenuOpen(false); 
    if (onForward) {
      onForward(message);
    } else {
      onShowToast?.("Forward coming soon!");
    }
  };

  const reactionEntries = message.reactions ? Object.entries(message.reactions) : [];

  const nameColor = isAI ? "var(--ai-accent)" : isOwn ? "var(--accent)" : "var(--text-primary)";
  const displayName = isAI ? "✦ Nexus AI" : isOwn ? (username || message.author) : message.author;
  // Always work with a plain string — guards against array/object content
  const contentStr = String(message.content ?? "");



  return (
    <>
      <style>{`
        @keyframes ctxFadeIn {
          from { opacity:0; transform:scale(0.95) translateY(4px); }
          to   { opacity:1; transform:scale(1)   translateY(0); }
        }
      `}</style>

      {/* Outer wrapper */}
      <div
        style={{
          position: "relative",
          marginTop: isGrouped ? 2 : 16,
        }}
      >
        {/* ── Reply icon that appears from the left as user swipes ── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: -40,
            top: "50%",
            transform: `translateY(-50%) scale(${Math.min(swipeDx / SWIPE_THRESHOLD, 1)})`,
            opacity: swipeDx / SWIPE_THRESHOLD,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontSize: 15,
            transition: swipeSpring ? "transform 0.2s ease, opacity 0.2s ease" : "none",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          ↩
        </div>

        {/* ── The actual message row (slides right on swipe) ── */}
        <div
          ref={bubbleRef}
          onContextMenu={handleContextMenu}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseEnter={() => setRowHovered(true)}
          onMouseLeave={() => setRowHovered(false)}
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "2px 16px",
            borderRadius: 4,
            overflow: "hidden",
            background: rowHovered ? "var(--bg-elevated)" : "transparent",
            transition: swipeSpring
              ? "transform 0.2s ease, background 0.1s"
              : "background 0.1s",
            transform: `translateX(${swipeDx}px)`,
            userSelect: "none",
            WebkitUserSelect: "none",
            position: "relative",
          }}
        >
          {/* ── Avatar column — hidden for grouped messages ── */}
          {!isGrouped ? (
            <div style={{ width: 36, flexShrink: 0, paddingTop: 2 }}>
              {isAI
                ? (
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 700,
                    border: "1px solid color-mix(in srgb, var(--ai-accent) 40%, transparent)",
                    color: "var(--ai-accent)", background: "var(--bg-surface)",
                  }}>AI</div>
                )
                : <UserAvatar avatarUrl={message.avatarUrl} displayName={message.author} size={36} />
              }
            </div>
          ) : (
            /* Grouped: phantom div keeps the left-indent — timestamp moves to content column */
            <div style={{ width: 36, flexShrink: 0 }} />
          )}

          {/* ── Content column ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Grouped hover timestamp — mirrors non-grouped header position */}
            {isGrouped && rowHovered && (
              <span style={{
                fontSize: 11, color: "var(--text-tertiary)", fontFamily: "monospace",
                display: "block", marginBottom: 2, lineHeight: 1,
              }}>
                {message.time}
              </span>
            )}

            {/* Header (name + time) — first message in group only */}
            {!isGrouped && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 15, fontWeight: 600, color: nameColor, lineHeight: 1 }}>
                  {displayName}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  {message.time}
                </span>
              </div>
            )}

            {/* ── Reply-to quote block ── */}
            {message.replyTo?.author && (
              <div style={{
                borderLeft: "2px solid var(--accent)",
                background: "var(--bg-elevated)",
                borderRadius: "0 4px 4px 0",
                padding: "4px 8px",
                marginBottom: 4,
                cursor: "default",
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", marginBottom: 1 }}>
                  {message.replyTo.author}
                </div>
                <div style={{
                  fontSize: 12, color: "var(--text-secondary)",
                  whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  maxWidth: "100%",
                }}>
                  {String(message.replyTo.content ?? "").slice(0, 60)}
                  {String(message.replyTo.content ?? "").length > 60 ? "…" : ""}
                </div>
              </div>
            )}

            {/* ── Message body ── */}
            <div style={{ position: "relative" }}>
              {isAI ? (
                <div style={{
                  borderLeft: "3px solid var(--ai-accent)",
                  background: "var(--ai-bg)",
                  borderRadius: "0 8px 8px 0",
                  padding: "10px 12px",
                  fontSize: 15, lineHeight: 1.5, color: "var(--text-primary)",
                }}>
                  <ReactMarkdown
                    components={{
                      strong: ({ children }) => <strong style={{ fontWeight: 600, color: "var(--text-primary)" }}>{children}</strong>,
                      p: ({ children }) => <p style={{ margin: "0 0 8px 0", lineHeight: 1.5 }}>{children}</p>,
                      ul: ({ children }) => <ul style={{ paddingLeft: 16, margin: "6px 0" }}>{children}</ul>,
                      ol: ({ children }) => <ol style={{ paddingLeft: 16, margin: "6px 0" }}>{children}</ol>,
                      li: ({ children }) => <li style={{ margin: "3px 0" }}>{children}</li>,
                    }}
                  >
                    {contentStr}
                  </ReactMarkdown>
                </div>
              ) : (
                <p style={{ fontSize: 15, lineHeight: 1.5, color: "var(--text-primary)", margin: 0, wordBreak: "break-word" }}>
                  {contentStr}
                </p>
              )}

              {/* Context menu */}
              {menuOpen && (
                <ContextMenu
                  menuRef={menuRef}
                  menuAbove={menuAbove}
                  showExtraEmojis={showExtraEmojis}
                  setShowExtraEmojis={setShowExtraEmojis}
                  onReact={handleReact}
                  onReply={handleReplyClick}
                  onCopy={handleCopy}
                  onForward={handleForward}
                  onDelete={handleDelete}
                  isOwn={isOwn}
                  time={message.time}
                />
              )}

              {/* ── Desktop reply button (shows on row hover, right side) ── */}
              {rowHovered && !menuOpen && (
                <button
                  onClick={handleReplyClick}
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    padding: "4px 8px",
                    background: "var(--bg-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  className="desktop-reply-btn hidden sm:flex"
                >
                  <span>↩</span>
                  <span>Reply</span>
                </button>
              )}
            </div>

            {/* ── Send failure indicator ── */}
            {message.status === "failed" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: 11, color: "#ff3b30" }}>⚠ Failed to send</span>
                {onRetry && (
                  <button
                    onClick={() => onRetry(message)}
                    style={{
                      fontSize: 11, color: "var(--accent)",
                      background: "transparent", border: "none",
                      cursor: "pointer", padding: 0, textDecoration: "underline",
                    }}
                  >
                    Retry
                  </button>
                )}
              </div>
            )}

            {/* ── Reactions ── */}
            {reactionEntries.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
                {reactionEntries.map(([emoji, users]) => {
                  const hasReacted = users.includes(firebaseUid);
                  return (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      style={{
                        display: "flex", alignItems: "center", gap: 5,
                        padding: "2px 8px", borderRadius: 999,
                        border: `1px solid ${hasReacted ? "var(--accent)" : "var(--border)"}`,
                        background: "var(--bg-elevated)",
                        color: hasReacted ? "var(--accent)" : "var(--text-secondary)",
                        fontSize: 13, cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      <span>{emoji}</span>
                      <span style={{ fontSize: 11, fontWeight: 500 }}>{users.length}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Small helpers ───────────────────────────────────────────────────────────────
function EmojiBtn({ emoji, onClick, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 36, height: 36,
        fontSize: small ? 13 : 20,
        fontWeight: small ? 600 : 400,
        display: "flex", alignItems: "center", justifyContent: "center",
        borderRadius: 8, border: "none",
        background: hov ? "var(--bg-elevated)" : "transparent",
        color: small ? "var(--text-tertiary)" : "inherit",
        cursor: "pointer",
        transform: (!small && hov) ? "scale(1.25) translateY(-2px)" : "scale(1)",
        transition: "transform 0.15s, background 0.1s",
      }}
    >
      {emoji}
    </button>
  );
}

function ActionItem({ icon, label, onClick, danger = false }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: "100%", height: 44,
        display: "flex", alignItems: "center", gap: 12,
        padding: "0 16px", border: "none",
        background: hov ? "var(--bg-elevated)" : "transparent",
        color: danger ? "#ff3b30" : "var(--text-primary)",
        fontSize: 14, cursor: "pointer", textAlign: "left",
        transition: "background 0.12s",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ── Context menu (stable module-level component) ──────────────────────────────
function ContextMenu({ menuRef, menuAbove, showExtraEmojis, setShowExtraEmojis, onReact, onReply, onCopy, onForward, onDelete, isOwn, time }) {
  const [leftOffset, setLeftOffset] = useState(0);

  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const overflow = rect.right - window.innerWidth + 8; // +8px breathing room
    if (overflow > 0) {
      setLeftOffset(-Math.max(0, overflow));
    }
  }, []);

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        [menuAbove ? "bottom" : "top"]: "calc(100% + 6px)",
        left: leftOffset,
        zIndex: 200,
        background: "var(--bg-surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        boxShadow: "0 8px 40px rgba(0,0,0,0.22)",
        backdropFilter: "blur(20px)",
        overflow: "hidden",
        minWidth: 200,
        animation: "ctxFadeIn 0.14s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", padding: "6px 8px", gap: 2, borderBottom: "1px solid var(--border)" }}>
        {(showExtraEmojis ? EXTRA_EMOJIS : PRIMARY_EMOJIS).map((emoji) => (
          <EmojiBtn key={emoji} emoji={emoji} onClick={() => onReact(emoji)} />
        ))}
        <EmojiBtn emoji={showExtraEmojis ? "←" : "+"} onClick={() => setShowExtraEmojis(v => !v)} small />
      </div>
      <div style={{ padding: "4px 0" }}>
        <ActionItem icon="↩" label="Reply" onClick={onReply} />
        <ActionItem icon="📋" label="Copy" onClick={onCopy} />
        <ActionItem icon="↪" label="Forward" onClick={onForward} />
        {isOwn && <ActionItem icon="🗑️" label="Delete" onClick={onDelete} danger />}
      </div>
      {time && (
        <div style={{ borderTop: "1px solid var(--border)", padding: "10px 16px", fontSize: 11, color: "var(--text-tertiary)", textAlign: "center", fontFamily: "monospace", letterSpacing: "0.02em" }}>
          Sent at {time}
        </div>
      )}
    </div>
  );
}