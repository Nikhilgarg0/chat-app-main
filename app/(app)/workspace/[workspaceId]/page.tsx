"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSidebar } from "@/components/SidebarContext";

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState<any>(null);
  const { isSidebarOpen, toggleSidebar } = useSidebar();

  useEffect(() => {
    const fetchWS = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data.workspace);
        }
      } catch (err) {}
    };
    if (workspaceId) fetchWS();
  }, [workspaceId]);

  return (
    <div className="flex flex-1 flex-col relative h-full bg-[var(--bg-base)] w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 lg:px-6 py-3 lg:py-4 border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-[20px] backdrop-saturate-[180%] z-20 shrink-0 sticky top-0">
        <div className="flex items-center gap-2">
          {!isSidebarOpen && (
            <button 
              onClick={toggleSidebar}
              className="p-1 -ml-1 mr-1 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              title="Open Sidebar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
          )}
          <span className="text-[var(--text-primary)] font-display font-semibold text-base lg:text-lg tracking-tight">Overview</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center p-8 z-10 text-center animate-slide-up relative">
        <div className="w-20 h-20 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-apple flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
        </div>
        <h1 className="text-3xl font-display font-semibold tracking-tight text-[var(--text-primary)] mb-4">
          {workspace?.name || "Workspace"}
        </h1>
        
        {workspace && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <div className="px-3 py-1 bg-[var(--bg-surface)] rounded-full text-[var(--text-secondary)] font-mono border border-[var(--border)] shadow-sm text-xs">
              Invite: <span className="text-[var(--text-primary)] ml-1 font-semibold tracking-widest">{workspace.inviteCode}</span>
            </div>
            <div className="w-1 h-1 rounded-full bg-[var(--text-tertiary)] hidden sm:block"></div>
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">
              {workspace.members?.length || 1} Member{workspace.members?.length !== 1 ? 's' : ''}
            </span>
            <div className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]"></div>
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">
              {workspace.channels?.length || 0} Channel{workspace.channels?.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        <p className="text-[var(--text-secondary)] max-w-sm text-[15px] leading-relaxed mb-6">
          This is your central hub for secure team communication.
        </p>

        {!isSidebarOpen && (
          <button 
            onClick={toggleSidebar}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium transition-all shadow-apple active:scale-[0.98]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            Select a Channel
          </button>
        )}
      </div>
    </div>
  );
}
