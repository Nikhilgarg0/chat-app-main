"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const { workspaceId } = useParams();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [newChannelName, setNewChannelName] = useState("");
  const [isCreatingChannel, setIsCreatingChannel] = useState(false);

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
      <main className="flex min-h-screen items-center justify-center bg-slate-900 overflow-hidden">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
      </main>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-800/80 border-r border-slate-700/60 flex flex-col pt-4">
        <div className="px-4 pb-4 border-b border-slate-700/50">
          <h2 className="text-lg font-bold text-white truncate drop-shadow-sm">{workspace.name}</h2>
          <p className="text-xs text-slate-400 font-mono mt-1">Code: {workspace.inviteCode}</p>
        </div>

        <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 scroll-smooth [&::-webkit-scrollbar]:hidden">
          <div className="px-2 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-widest">Channels</div>
          {workspace.channels?.map((ch: any) => (
            <Link 
              key={ch._id} 
              href={`/workspace/${workspace._id}/channel/${ch._id}`}
              className="block px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors truncate"
            >
              <span className="text-slate-500 mr-2">#</span>{ch.name}
            </Link>
          ))}
        </div>

        <div className="p-4 border-t border-slate-700/50 space-y-3">
          <div className="flex items-center gap-2">
            <Input 
              value={newChannelName}
              onChange={(e) => setNewChannelName(e.target.value)}
              placeholder="channel name"
              disabled={isCreatingChannel}
              className="h-8 bg-slate-900/50 border-slate-700 text-xs px-2 focus-visible:ring-1 focus-visible:ring-blue-500"
              onKeyDown={(e) => e.key === "Enter" && handleCreateChannel()}
            />
            <Button 
              size="sm" 
              onClick={handleCreateChannel}
              disabled={!newChannelName.trim() || isCreatingChannel}
              className="h-8 px-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 border border-blue-500/20 flex-shrink-0"
            >
              +
            </Button>
          </div>
        </div>

        <div className="p-4 bg-slate-900/50 border-t border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {userProfile?.displayName?.[0]?.toUpperCase() || "?"}
            </div>
            <span className="text-sm font-medium truncate">{userProfile?.displayName || "Guest"}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-red-400 px-2 border-0 shrink-0">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-900">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        {children}
      </div>
    </div>
  );
}
