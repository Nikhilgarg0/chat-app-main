"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
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
  
  // UI state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showJoinForm, setShowJoinForm] = useState(false);

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
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-base)]">
        <div className="w-6 h-6 rounded-full border-[3px] border-[var(--border-strong)] border-t-[var(--accent)] animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-[var(--bg-base)] text-[var(--text-primary)] font-body">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-[20px] backdrop-saturate-[180%] sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[var(--accent)] flex items-center justify-center text-white font-bold font-display text-xs">N</div>
          <span className="font-display font-semibold text-lg tracking-tight">Nexus</span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="text-[var(--text-secondary)] hover:text-red-400 text-sm h-8 px-3" onClick={handleLogout}>
            Logout
          </Button>
          <div className="w-8 h-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center font-medium text-xs text-[var(--text-primary)]">
            {userProfile?.displayName?.[0]?.toUpperCase() || "?"}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-col items-center w-full max-w-4xl mx-auto px-6 py-12 animate-slide-up">
        <div className="w-full mb-10">
          <h1 className="text-3xl font-bold font-display tracking-tight text-[var(--text-primary)]">
            Your Workspaces
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">Select a workspace or create a new one to get started.</p>
        </div>

        {error && (
          <div className="w-full p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {workspaces.map((ws: any) => (
            <div 
              key={ws._id} 
              className="group flex flex-col justify-between p-5 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-apple-sm hover:shadow-apple transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-display font-semibold text-lg truncate pr-3">{ws.name}</h3>
                <span className="flex-shrink-0 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-2.5 py-1 text-[10px] font-mono text-[var(--text-secondary)]">
                  Code: {ws.inviteCode}
                </span>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <div className="flex items-center gap-1.5 test-xs text-[var(--text-secondary)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                  <span className="text-xs font-medium">{ws.members?.length || 1} Members</span>
                </div>
                <Button 
                  onClick={() => router.push(`/workspace/${ws._id}`)}
                  className="h-9 px-4 rounded-[980px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-0 transition-all text-sm font-medium focus:ring-0 active:scale-[0.98]"
                >
                  Open
                </Button>
              </div>
            </div>
          ))}

          {/* New Workspace Card */}
          <div 
            onClick={() => { setShowCreateForm(true); setShowJoinForm(false); }}
            className={`group flex flex-col justify-center items-center p-5 rounded-[16px] border border-dashed transition-all cursor-pointer min-h-[140px]
              ${showCreateForm 
                ? "border-[var(--accent)] bg-[var(--bg-surface)] cursor-default shadow-apple" 
                : "border-[var(--border-strong)] hover:border-[var(--text-secondary)] hover:bg-[var(--bg-surface)]"}`}
          >
            {!showCreateForm ? (
              <div className="flex flex-col items-center gap-2 text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                <span className="text-sm font-medium">New Workspace</span>
              </div>
            ) : (
              <div className="w-full flex justify-between gap-3 animate-slide-up" onClick={e => e.stopPropagation()}>
                <input
                  placeholder="Workspace Name"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  autoFocus
                  onKeyDown={e => e.key === "Enter" && handleCreateWorkspace()}
                  className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] px-[14px] py-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]"
                />
                <Button 
                  onClick={handleCreateWorkspace}
                  disabled={!workspaceName.trim() || isCreating}
                  className="h-auto px-5 rounded-[980px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium border-0 transition-all active:scale-[0.98]"
                >
                  {isCreating ? "Creating..." : "Create"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Join Workspace Context */}
        <div className="w-full flex flex-col items-center mt-4">
          {!showJoinForm ? (
            <button 
              onClick={() => { setShowJoinForm(true); setShowCreateForm(false); }}
              className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors font-medium border-b border-transparent hover:border-[var(--text-secondary)] pb-0.5"
            >
              Join with code
            </button>
          ) : (
            <div className="w-full max-w-md flex justify-between gap-3 animate-slide-up bg-[var(--bg-surface)] p-2 rounded-[16px] border border-[var(--border)] shadow-apple">
              <input
                placeholder="Enter invite code"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                autoFocus
                onKeyDown={e => e.key === "Enter" && handleJoinWorkspace()}
                className="flex-1 bg-transparent border-0 ring-0 focus:ring-0 text-sm px-4 uppercase font-mono tracking-wider outline-none text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
              />
              <Button 
                onClick={handleJoinWorkspace}
                disabled={!inviteCode.trim() || isJoining}
                className="h-10 px-6 rounded-[980px] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white border-0 transition-all text-sm font-medium focus:ring-0 active:scale-[0.98]"
              >
                {isJoining ? "Joining..." : "Join"}
              </Button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
