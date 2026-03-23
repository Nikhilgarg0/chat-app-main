"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
      <div className="w-20 h-20 rounded-2xl bg-slate-800/80 border border-slate-700/60 shadow-lg flex items-center justify-center mb-6">
        <svg className="w-10 h-10 text-blue-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">
        Welcome to {workspace?.name || "Workspace"}
      </h1>
      <p className="text-slate-400 max-w-md">
        This is your central hub for secure team communication. Select an existing channel from the sidebar or click <span className="text-blue-400 font-semibold">+</span> to deploy a new one.
      </p>
    </div>
  );
}
