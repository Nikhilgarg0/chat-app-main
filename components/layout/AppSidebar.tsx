"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { pusherClient } from "@/lib/pusher-client";
import { authFetch } from "@/lib/authFetch";
import { useTheme } from "@/components/ThemeProvider";
import { useSidebar } from "@/components/SidebarContext";
import UserAvatar from "@/components/ui/UserAvatar";

export default function AppSidebar() {
  const { workspaceId, channelId } = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useSidebar();

  const [workspace, setWorkspace] = useState<any>(null);
  const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Map<string, string>>(new Map());
  const [showChannelInput, setShowChannelInput] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUserAndWorkspaces = async () => {
      if (!auth.currentUser) return;
      try {
        const [profRes, wssRes] = await Promise.all([
          authFetch(`/api/users/profile?firebaseUid=${auth.currentUser.uid}`),
          authFetch(`/api/workspaces?firebaseUid=${auth.currentUser.uid}`)
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setUserProfile(profData.user);
        }

        if (wssRes.ok) {
          const wssData = await wssRes.json();
          if (wssData.success) {
            setAllWorkspaces(wssData.workspaces);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchUserAndWorkspaces();
  }, [pathname]);

  useEffect(() => {
    if (!workspaceId || typeof workspaceId !== "string" || !auth.currentUser) {
      setWorkspace(null);
      return;
    }

    const fetchWorkspaceDetails = async () => {
      try {
        const wsRes = await authFetch(`/api/workspaces/${workspaceId}?firebaseUid=${auth.currentUser?.uid}`);
        if (wsRes.ok) {
          const wsData = await wsRes.json();
          setWorkspace({ 
            ...wsData.workspace, 
            channels: wsData.joinedChannels || wsData.workspace.channels 
          });
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchWorkspaceDetails();
  }, [workspaceId]);

  useEffect(() => {
    if (!userProfile?.displayName || !workspaceId || typeof workspaceId !== "string") return;

    const uname = userProfile.displayName;

    authFetch("/api/pusher/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, username: uname, status: "online" })
    }).catch(() => { });

    const presenceChannel = `workspace-${workspaceId}`;
    const channel = pusherClient.subscribe(presenceChannel);

    channel.bind("presence-update", ({ username, status, firebaseUid }: { username: string, status: string, firebaseUid: string }) => {
      setOnlineUsers((prev) => {
        const next = new Map(prev);
        if (status === "online") next.set(username, firebaseUid);
        else next.delete(username);
        return next;
      });
    });

    channel.bind("channel-joined", ({ channel: newChannel, firebaseUid }: { channel: any; firebaseUid: string }) => {
      const currentUser = auth.currentUser;
      if (!currentUser || currentUser.uid !== firebaseUid) return;
      setWorkspace((prev: any) => {
        if (!prev) return prev;
        const alreadyExists = prev.channels?.some((c: any) => c._id === newChannel._id);
        if (alreadyExists) return prev;
        return { ...prev, channels: [...(prev.channels || []), newChannel] };
      });
    });

    channel.bind("channel-created", ({ channel: newChannel }: { channel: any }) => {
      setWorkspace((prev: any) => {
        if (!prev) return prev;
        const alreadyExists = prev.channels?.some((c: any) => c._id === newChannel._id);
        if (alreadyExists) return prev;
        return { ...prev, channels: [...(prev.channels || []), newChannel] };
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

  // Hide sidebar entirely on onboarding (after all hooks)
  if (pathname === "/onboarding") {
    return null;
  }

  return (
    <>
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-30 animate-in fade-in duration-200"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed md:relative z-40 h-full bg-[var(--bg-surface)] border-r border-[var(--border)] shrink-0 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden flex flex-col
          ${isSidebarOpen
            ? "translate-x-0 w-[80vw] max-w-[300px] shadow-[var(--shadow)] md:shadow-none md:w-[260px] md:opacity-100"
            : "-translate-x-full w-[80vw] max-w-[300px] md:translate-x-0 md:w-0 md:opacity-0 md:border-r-0"
          }
        `}
      >
        <div className="w-[80vw] max-w-[300px] md:w-[260px] h-full flex flex-col pt-4 relative">
          
          {/* Top Header - App Brand */}
          <div className="px-5 pb-4 flex items-center justify-between border-b border-[var(--border)] mb-2 shrink-0">
            <Link href="/home" className="flex items-center gap-2 hover:opacity-80 transition flex-1">
              <div className="w-7 h-7 rounded-md bg-[var(--accent)] flex items-center justify-center text-white font-bold font-display text-sm">N</div>
              <span className="font-display font-semibold text-lg tracking-tight truncate">Nexus</span>
            </Link>

            <button
              onClick={toggleSidebar}
              className="p-1.5 -me-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 hidden md:flex"
              title="Hide Sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path></svg>
            </button>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 -me-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0 md:hidden flex"
              title="Close Sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto scroll-smooth [&::-webkit-scrollbar]:hidden flex flex-col gap-6">
            
            {/* Workspaces Section */}
            <div className="pt-2">
              <div className="px-5 mb-1.5 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider">WORKSPACES</span>
                <Link href="/home" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors p-1" title="Manage Workspaces">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </Link>
              </div>
              <div className="px-3 space-y-0.5">
                {allWorkspaces.map(ws => {
                  const isActive = ws._id === workspaceId;
                  return (
                    <Link
                      key={ws._id}
                      href={`/workspace/${ws._id}`}
                      className={`flex items-center px-3 py-1.5 min-h-[40px] md:min-h-[32px] text-[14px] rounded-lg transition-colors truncate group ${isActive
                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                        : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                        }`}
                    >
                      <div className={`w-5 h-5 rounded flex items-center justify-center mr-2.5 text-[10px] font-bold ${isActive ? "bg-[var(--accent)] text-white" : "bg-[var(--border)] text-[var(--text-secondary)] group-hover:bg-[var(--border-strong)]"}`}>
                        {ws.name[0]?.toUpperCase()}
                      </div>
                      <span className="truncate flex-1">{ws.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Channels Section - Only if in a workspace */}
            {workspace && (
              <div>
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
                        onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }}
                        className={`flex items-center px-3 py-1.5 min-h-[40px] md:min-h-[28px] text-[13px] rounded-lg transition-colors truncate relative group ${isActive
                          ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium"
                          : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                          }`}
                      >
                        <span className={`mr-2.5 font-mono ${isActive ? "text-[var(--text-secondary)]" : "text-[var(--text-tertiary)] group-hover:text-[var(--text-secondary)]"}`}>#</span>
                        {ch.name}
                      </Link>
                    );
                  })}
                  
                  <Link href={`/workspace/${workspace._id}/browse`} onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`flex items-center gap-2 px-3 py-1.5 mt-1 text-[12px] rounded-lg transition group ${pathname === `/workspace/${workspace._id}/browse` ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium' : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'}`}>
                    <svg className={`w-3.5 h-3.5 ${pathname === `/workspace/${workspace._id}/browse` ? 'text-[var(--text-secondary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect></svg>
                    <span className="font-medium tracking-wide">Browse channels</span>
                  </Link>

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
                          background: "var(--accent)", border: "none", borderRadius: 6,
                          color: "#fff", width: 28, height: 28, fontSize: 14, cursor: "pointer", flexShrink: 0,
                          opacity: !newChannelName.trim() || isCreatingChannel ? 0.4 : 1, transition: "opacity 0.15s",
                        }}
                      >✓</button>
                      <button
                        onClick={() => { setShowChannelInput(false); setNewChannelName(""); }}
                        title="Cancel"
                        style={{
                          background: "transparent", border: "none", borderRadius: 6,
                          color: "var(--text-tertiary)", width: 28, height: 28, fontSize: 14, cursor: "pointer", flexShrink: 0,
                        }}
                      >✕</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Online Users Section */}
            {workspace && onlineUsers.size > 0 && (
              <div>
                <div className="px-5 mb-1.5 flex items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider">ONLINE</span>
                  <span className="text-[11px] font-mono text-[var(--success)]">{onlineUsers.size}</span>
                </div>
                <div className="px-3 space-y-0.5">
                  {Array.from(onlineUsers.entries()).map(([uname, uid]) => (
                    <Link href={`/user/${encodeURIComponent(uid)}`} key={uname} onClick={() => { if (window.innerWidth < 1024) setIsSidebarOpen(false); }} className="flex items-center px-3 py-1 min-h-[40px] md:min-h-[28px] text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-lg transition-colors cursor-pointer">
                      <div className="w-1.5 h-1.5 rounded-full bg-[var(--success)] mr-2.5"></div>
                      <span className="truncate">{uname}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          {/* Bottom Actions - Setup for user */}
          <div className="p-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-[var(--border)] shrink-0 flex flex-col gap-2">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 p-2 w-full rounded-md hover:bg-[var(--bg-elevated)] transition cursor-pointer"
            >
              <div className="shrink-0 rounded-full ring-2 ring-transparent transition-all">
                <UserAvatar avatarUrl={userProfile?.avatarUrl} displayName={userProfile?.displayName || "Guest"} size={36} />
              </div>
              <div className="flex flex-col min-w-0 pr-2 overflow-hidden w-full">
                <span className="text-sm font-medium text-[var(--text-primary)] truncate">{userProfile?.displayName || "Guest"}</span>
                {userProfile?.customStatus && (
                  <span className="text-[11px] text-[var(--text-secondary)] truncate">{userProfile.customStatus}</span>
                )}
              </div>
            </Link>

            <div className="flex items-center justify-between w-full px-2 mt-1">
              <Link
                href="/profile"
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--bg-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] transition"
                title="Settings"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </Link>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleTheme}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition"
                  title="Toggle Theme"
                >
                  {theme === "light" && <span className="text-sm text-yellow-500">☀️</span>}
                  {theme === "dark" && <span className="text-sm text-indigo-400">🌙</span>}
                  {theme === "system" && <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>}
                </button>

                <button
                  onClick={handleLogout}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--bg-elevated)] hover:text-red-500 transition text-red-400"
                  title="Sign out"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </>
  );
}
