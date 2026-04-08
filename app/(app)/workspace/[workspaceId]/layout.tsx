"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { pusherClient } from "@/lib/pusher-client";
import { authFetch } from "@/lib/authFetch";
import { useTheme } from "@/components/ThemeProvider";
import { useSidebar } from "@/components/SidebarContext";
import UserAvatar from "@/components/ui/UserAvatar";
import Toast from "@/components/ui/Toast";
import ProfileSettingsModal from "@/components/ProfileSettingsModal";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { workspaceId, channelId } = useParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useSidebar();

  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showChannelInput, setShowChannelInput] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;

    if (distance > 50 && isSidebarOpen) {
      setIsSidebarOpen(false);
    }
    if (distance < -50 && !isSidebarOpen && touchStartX < 30) {
      setIsSidebarOpen(true);
    }
    setTouchStartX(0);
    setTouchEndX(0);
  };

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const [profRes, wsRes] = await Promise.all([
          authFetch(`/api/users/profile?firebaseUid=${user.uid}`),
          authFetch(`/api/workspaces/${workspaceId}`)
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setUserProfile(profData.user);
        }

        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setWorkspace(wsData.workspace);
        } else {
          router.push("/home");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [workspaceId, router]);

  useEffect(() => {
    if (!userProfile?.displayName || !workspaceId) return;

    const uname = userProfile.displayName;

    authFetch("/api/pusher/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, username: uname, status: "online" })
    }).catch(() => { });

    const presenceChannel = `workspace-${workspaceId}`;
    const channel = pusherClient.subscribe(presenceChannel);

    channel.bind("presence-update", ({ username, status }: { username: string, status: string }) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        if (status === "online") next.add(username);
        else next.delete(username);
        return next;
      });
    });

    return () => {
      authFetch("/api/pusher/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, username: uname, status: "offline" })
      }).catch(() => { });
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [userProfile?.displayName, workspaceId]);

  const handleLogout = async () => {
    setShowUserMenu(false);
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) { }
  };

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  // Persist last-visited channel per workspace for auto-redirect on next open
  useEffect(() => {
    if (channelId && workspaceId) {
      localStorage.setItem(`lastChannel:${workspaceId}`, channelId as string);
    }
  }, [channelId, workspaceId]);

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !workspaceId) return;
    setIsCreatingChannel(true);
    try {
      const res = await authFetch("/api/channels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: workspaceId,
          name: newChannelName.trim(),
          firebaseUid: auth.currentUser?.uid,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setWorkspace((prev: any) => ({
          ...prev,
          channels: [...prev.channels, data.channel]
        }));
        setNewChannelName("");
        setShowChannelInput(false);
        router.push(`/workspace/${workspaceId}/channel/${data.channel._id}`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingChannel(false);
    }
  };

  if (loading || !workspace) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-base)]">
        <div className="w-6 h-6 rounded-full border-[3px] border-[var(--border-strong)] border-t-[var(--accent)] animate-spin"></div>
      </main>
    );
  }

  return (
    <div
      className="flex h-[100dvh] bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden font-body relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Apple Aesthetic */}
      <div
        className={`fixed md:relative z-40 h-full bg-[var(--bg-surface)] border-r border-[var(--border)] shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden
          ${isSidebarOpen
            ? "translate-x-0 w-[80vw] max-w-[300px] shadow-[var(--shadow)] md:shadow-none md:w-[240px] md:opacity-100"
            : "-translate-x-full w-[80vw] max-w-[300px] md:translate-x-0 md:w-0 md:opacity-0 md:border-r-0"
          }
        `}
      >
        <div className="w-[80vw] max-w-[300px] md:w-[240px] h-full flex flex-col pt-4 relative">

          {/* Workspace Brand Header */}
          <div className="px-5 pb-4 flex items-start justify-between">
            <div className="flex flex-col gap-2 min-w-0 pr-2">
              <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity">
                <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center text-white font-bold font-display text-[11px] shrink-0">
                  {workspace.name[0]?.toUpperCase()}
                </div>
                <h2 className="font-display font-semibold text-[15px] truncate flex-1">{workspace.name}</h2>
                <svg className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
              </div>

              <div className="flex items-center group cursor-pointer w-fit">
                <span className="bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-colors rounded-full px-2.5 py-0.5 text-[10px] font-mono text-[var(--text-secondary)]">
                  {workspace.inviteCode}
                </span>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              className="p-1.5 -me-1 -mt-0.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 hidden md:flex"
              title="Hide Sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
            </button>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 -me-1 -mt-0.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 md:hidden flex"
              title="Close Sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto pt-2 pb-4 scroll-smooth [&::-webkit-scrollbar]:hidden">

            <div className="flex items-center justify-between px-5 mb-1.5">
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider">CHANNELS</span>
              <button
                onClick={() => setShowChannelInput(!showChannelInput)}
                className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
              </button>
            </div>

            <div className="px-3 space-y-0.5 relative">
              {workspace.channels?.map((ch: any) => {
                const isActive = ch._id === channelId;
                return (
                  <Link
                    key={ch._id}
                    href={`/workspace/${workspace._id}/channel/${ch._id}`}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-1.5 min-h-[48px] md:min-h-[32px] text-[14px] rounded-lg transition-colors truncate relative group ${isActive
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                      }`}
                  >
                    <span className={`mr-2.5 font-mono ${isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"}`}>#</span>
                    {ch.name}
                  </Link>
                );
              })}

              {showChannelInput && (
                <div className="px-3 py-1.5 animate-slide-up flex gap-2 items-center">
                  <input
                    value={newChannelName}
                    onChange={e => setNewChannelName(e.target.value)}
                    placeholder="channel"
                    autoFocus
                    disabled={isCreatingChannel}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleCreateChannel();
                      if (e.key === "Escape") { setShowChannelInput(false); setNewChannelName(""); }
                    }}
                    className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[8px] px-3 h-8 text-sm focus:border-[var(--accent)] outline-none focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all"
                  />
                  <button
                    onClick={handleCreateChannel}
                    disabled={!newChannelName.trim() || isCreatingChannel}
                    title="Create channel"
                    style={{
                      background: "var(--accent)",
                      border: "none", borderRadius: 6,
                      color: "#fff", width: 28, height: 28,
                      fontSize: 14, cursor: "pointer", flexShrink: 0,
                      opacity: !newChannelName.trim() || isCreatingChannel ? 0.4 : 1,
                      transition: "opacity 0.15s",
                    }}
                  >✓</button>
                  <button
                    onClick={() => { setShowChannelInput(false); setNewChannelName(""); }}
                    title="Cancel"
                    style={{
                      background: "transparent", border: "none", borderRadius: 6,
                      color: "var(--text-tertiary)", width: 28, height: 28,
                      fontSize: 14, cursor: "pointer", flexShrink: 0,
                    }}
                  >✕</button>
                </div>
              )}
            </div>

            {onlineUsers.size > 0 && (
              <div className="pt-6">
                <div className="px-5 mb-2 flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider">ONLINE</span>
                  <span className="text-[11px] font-mono text-[var(--success)]">{onlineUsers.size}</span>
                </div>
                <div className="px-3 space-y-0.5">
                  {Array.from(onlineUsers).map((uname) => (
                    <div key={uname} className="flex items-center px-3 py-1 min-h-[44px] md:min-h-[28px] text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-default">
                      <div className="w-2 h-2 rounded-full bg-[var(--success)] mr-3"></div>
                      <span className="truncate">{uname}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom User Area */}
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--border)] shrink-0 flex items-center justify-between gap-2" style={{ position: "relative" }}>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div
                ref={userMenuRef}
                style={{
                  position: "absolute",
                  bottom: "calc(100% + 6px)",
                  left: 12,
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                  overflow: "hidden",
                  minWidth: 160,
                  zIndex: 50,
                  animation: "ctxFadeIn 0.14s ease",
                }}
              >
                <div style={{ padding: "6px 0" }}>
                  <div style={{ padding: "8px 16px 6px", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {userProfile?.displayName || "Guest"}
                  </div>
                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%", padding: "10px 16px",
                      textAlign: "left", background: "transparent",
                      border: "none", color: "#ff3b30",
                      fontSize: 14, cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 8,
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
              <div
                className="cursor-pointer shrink-0 rounded-full ring-2 ring-transparent hover:ring-[var(--accent)] transition-all"
                onClick={() => setShowUserMenu(v => !v)}
                title="Account menu"
              >
                <UserAvatar avatarUrl={userProfile?.avatarUrl} displayName={userProfile?.displayName || "Guest"} size={32} />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)] truncate">{userProfile?.displayName || "Guest"}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleLogout}
                className="w-11 h-11 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex md:hidden items-center justify-center hover:bg-[var(--border-strong)] transition-colors text-red-500 hover:text-red-600"
                title="Sign out"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className="hidden md:flex w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] items-center justify-center hover:bg-[var(--border-strong)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                title="Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              <button
                onClick={toggleTheme}
                className="w-11 h-11 md:w-8 md:h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border-strong)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] overflow-hidden relative"
                title="Toggle Theme"
              >
                <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                  <span className="text-xl md:text-base">☀️</span>
                </div>
                <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${theme === 'light' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                  <span className="text-xl md:text-base">🌙</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative h-full bg-[var(--bg-base)] transition-all duration-300 min-w-0">
        {children}
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      
      {showSettingsModal && userProfile && (
        <ProfileSettingsModal
          userProfile={userProfile}
          onClose={() => setShowSettingsModal(false)}
          onUpdate={(newProfile) => setUserProfile(newProfile)}
        />
      )}
    </div>
  );
}
