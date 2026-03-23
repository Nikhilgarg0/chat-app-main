"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { signOut } from "firebase/auth";

export default function HomePage() {
  const router = useRouter();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [workspaceName, setWorkspaceName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { 
        router.push("/login"); 
        return; 
      }
      try {
        const [profRes, wsRes] = await Promise.all([
          fetch(`/api/users/profile?firebaseUid=${user.uid}`),
          fetch(`/api/workspaces?firebaseUid=${user.uid}`)
        ]);

        if (profRes.ok) {
          const profData = await profRes.json();
          setUserProfile(profData.user);
        }

        if (wsRes.ok) {
          const wsData = await wsRes.json();
          if (wsData.success) {
            setWorkspaces(wsData.workspaces);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const handleCreateWorkspace = async () => {
    setError("");
    if (!workspaceName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName.trim(),
          firebaseUid: auth.currentUser?.uid,
        }),
      });
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to create workspace");
      }
      
      router.push(`/workspace/${data.workspace._id}`); 
    } catch (err: any) {
      setError(err.message);
      setIsCreating(false);
    }
  };

  const handleJoinWorkspace = async () => {
    setError("");
    if (!inviteCode.trim()) return;
    setIsJoining(true);

    try {
      const res = await fetch("/api/workspaces/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: inviteCode.trim(),
          firebaseUid: auth.currentUser?.uid,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to join workspace");
      }
      
      router.push(`/workspace/${data.workspace._id}`);
    } catch (err: any) {
      setError(err.message);
      setIsJoining(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="mb-10 text-center animate-[fadeInUp_0.4s_ease-out] z-10">
        <Badge className="mb-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 text-xs uppercase tracking-widest">
          Dashboard
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md mb-3">
          Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{userProfile?.displayName || "Guest"}</span>
        </h1>
        <p className="text-base text-slate-400">Join an existing network or deploy a new secure workspace.</p>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 w-full max-w-sm flex flex-col gap-6 transform transition-all animate-[fadeInUp_0.5s_ease-out] z-10">
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl animate-[bounce_0.3s_ease-in-out]">
            <p className="text-red-400 text-xs text-center font-medium">{error}</p>
          </div>
        )}

        {workspaces.length > 0 && (
          <div className="space-y-3 mb-2">
            <div className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center justify-between">
              <span>Your Workspaces</span>
              <Badge variant="outline" className="text-xs py-0 px-2 bg-slate-800 border-slate-700">{workspaces.length}</Badge>
            </div>
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 scroll-smooth [&::-webkit-scrollbar]:hidden">
              {workspaces.map((ws: any) => (
                <div key={ws._id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-2xl border border-slate-800 group hover:border-slate-700 transition-colors">
                  <div className="flex flex-col overflow-hidden mr-3">
                    <span className="text-sm font-bold text-slate-200 truncate">{ws.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5">Code: {ws.inviteCode}</span>
                  </div>
                  <Button 
                    size="sm"
                    onClick={() => router.push(`/workspace/${ws._id}`)}
                    className="shrink-0 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white border border-blue-500/20 transition-all rounded-lg text-xs h-8 px-3"
                  >
                    Enter
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          <Input
            placeholder="NEW WORKSPACE NAME"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="uppercase bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500 text-center font-mono text-sm tracking-widest h-12 rounded-xl"
          />
          <Button
            onClick={handleCreateWorkspace}
            disabled={!workspaceName.trim() || isCreating || isJoining}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-6 rounded-xl transition-all border-0 shadow-lg hover:shadow-blue-500/25 disabled:opacity-50"
          >
            <span className="relative z-10 flex items-center justify-center gap-2 text-base">
              {isCreating ? "Deploying..." : "Deploy Workspace"}
            </span>
            <div className="absolute inset-0 h-full w-full bg-white/20 scale-0 group-hover:scale-100 transition-transform origin-center rounded-xl duration-300 z-0"></div>
          </Button>
        </div>

        <div className="flex items-center gap-4 py-2">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
             Connect
          </span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <div className="flex flex-col gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
          <Input
            placeholder="ENTER INVITE CODE"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="uppercase bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500/50 text-center font-mono text-lg tracking-widest h-12 rounded-xl"
          />
          <Button
            onClick={handleJoinWorkspace}
            disabled={!inviteCode.trim() || isCreating || isJoining}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50 h-12 rounded-xl"
          >
            {isJoining ? "Initializing..." : "Initialize Connection"}
          </Button>
        </div>
        
        <div className="flex justify-center mt-2">
          <Button 
            variant="ghost" 
            onClick={handleLogout} 
            className="text-slate-500 hover:text-red-400 text-xs transition-colors uppercase tracking-widest font-semibold"
          >
            Terminate Session
          </Button>
        </div>
      </div>
    </main>
  );
}
