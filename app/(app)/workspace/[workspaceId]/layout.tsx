"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { pusherClient } from "@/lib/pusher";
import { useTheme } from "@/components/ThemeProvider";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { workspaceId, channelId } = useParams();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [showChannelInput, setShowChannelInput] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const [profRes, wsRes] = await Promise.all([
          fetch(`/api/users/profile?firebaseUid=${user.uid}`),
          fetch(`/api/workspaces/${workspaceId}`)
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

    fetch("/api/pusher/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId, username: uname, status: "online" })
    }).catch(() => {});

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
      fetch("/api/pusher/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, username: uname, status: "offline" })
      }).catch(() => {});
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [userProfile?.displayName, workspaceId]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {}
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !workspaceId) return;
    setIsCreatingChannel(true);
    try {
      const res = await fetch("/api/channels", {
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
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="w-6 h-6 rounded-full border-[3px] border-[var(--border-strong)] border-t-[var(--accent)] animate-spin"></div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden font-body">
      {/* Sidebar - Apple Aesthetic */}
      <div className="w-[260px] bg-[var(--bg-surface)] border-r border-[var(--border)] flex flex-col pt-4 relative z-20 shrink-0">
        
        {/* Workspace Brand Header */}
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2.5 mb-2 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center text-white font-bold font-display text-[11px] shrink-0">
              {workspace.name[0]?.toUpperCase()}
            </div>
            <h2 className="font-display font-semibold text-[15px] truncate flex-1">{workspace.name}</h2>
            <svg className="w-3.5 h-3.5 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"></path></svg>
          </div>
          
          <div className="flex items-center group cursor-pointer">
            <span className="bg-[var(--bg-elevated)] border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-colors rounded-full px-2.5 py-0.5 text-[10px] font-mono text-[var(--text-secondary)]">
              {workspace.inviteCode}
            </span>
          </div>
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
                  className={`flex items-center px-3 py-1.5 text-[14px] rounded-lg transition-colors truncate relative group ${
                    isActive 
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
              <div className="px-3 py-1.5 animate-slide-up flex gap-2">
                <input
                  value={newChannelName}
                  onChange={e => setNewChannelName(e.target.value)}
                  placeholder="channel"
                  autoFocus
                  disabled={isCreatingChannel}
                  onKeyDown={e => e.key === "Enter" && handleCreateChannel()}
                  className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[8px] px-3 h-8 text-sm focus:border-[var(--accent)] outline-none focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all"
                />
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
                  <div key={uname} className="flex items-center px-3 py-1 text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-default">
                    <div className="w-2 h-2 rounded-full bg-[var(--success)] mr-3"></div>
                    <span className="truncate">{uname}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom User Area */}
        <div className="p-4 border-t border-[var(--border)] shrink-0 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 truncate flex-1 min-w-0 pr-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--bg-elevated)] to-[var(--border-strong)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] text-xs font-bold shrink-0 shadow-sm cursor-pointer" onClick={handleLogout}>
              {userProfile?.displayName?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{userProfile?.displayName || "Guest"}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => console.log("settings")}
              className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border-strong)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              title="Settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border-strong)] transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] overflow-hidden relative"
              title="Toggle Theme"
            >
              <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${theme === 'dark' ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
                ☀️
              </div>
              <div className={`absolute inset-0 flex items-center justify-center transition-transform duration-300 ${theme === 'light' ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
                🌙
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative w-full h-full bg-[var(--bg-base)]">
        {children}
      </div>
    </div>
  );
}
