"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function WorkspacePage() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState<any>(null);

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
    <div className="flex flex-1 flex-col items-center justify-center p-8 z-10 text-center animate-[fadeInUp_0.4s_ease-out]">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 border border-blue-500/30 shadow-lg flex items-center justify-center mb-8 backdrop-blur-md">
        <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4 drop-shadow-md">
        {workspace?.name || "Workspace Overview"}
      </h1>
      
      {workspace && (
        <div className="flex items-center gap-4 mb-8">
          <Badge variant="outline" className="px-3 py-1 bg-slate-800/80 text-slate-300 font-mono border-slate-700/80 shadow-inner">
            Invite Code: <span className="text-blue-400 ml-2 font-bold tracking-widest text-sm">{workspace.inviteCode}</span>
          </Badge>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
          <span className="text-sm font-medium text-slate-400">
            {workspace.members?.length || 1} Member{workspace.members?.length !== 1 ? 's' : ''}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
          <span className="text-sm font-medium text-slate-400">
            {workspace.channels?.length || 0} Channel{workspace.channels?.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      <p className="text-slate-400 max-w-md text-sm leading-relaxed">
        This is your central hub for secure team communication. Select an existing channel from the sidebar or click <span className="text-blue-400 font-bold px-1">+</span> to expand your network.
      </p>
    </div>
  );
}
