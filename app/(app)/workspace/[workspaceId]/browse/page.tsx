"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Hash } from "lucide-react";
import { authFetch } from "@/lib/authFetch";
import { auth } from "@/lib/firebase";
import Toast from "@/components/ui/Toast";

export default function BrowseChannels({ params }: { params: Promise<{ workspaceId: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [allChannels, setAllChannels] = useState<any[]>([]);
  const [joinedIds, setJoinedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return;
      try {
        const res = await authFetch(`/api/workspaces/${unwrappedParams.workspaceId}?firebaseUid=${currentUser.uid}`);
        if (res.ok) {
          const data = await res.json();
          setAllChannels(data.allChannels || []);
          setJoinedIds(new Set((data.joinedChannels || []).map((c: any) => c._id)));
        }
      } catch (err) {} finally {
        setLoading(false);
      }
    };
    load();
  }, [unwrappedParams.workspaceId, currentUser]);

  const handleJoin = async (channelId: string) => {
    try {
      const res = await authFetch(`/api/channels/${channelId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join" }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setJoinedIds(prev => new Set(prev).add(channelId));
        // Force refresh layout to update sidebar
        router.refresh();
      } else {
        setToast(data.error || "Failed to join");
      }
    } catch (err) {
      setToast("Error joining channel");
    }
  };

  const filtered = allChannels.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="flex flex-1 flex-col relative h-full bg-[var(--bg-base)] w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 lg:px-6 py-3 lg:py-4 border-b border-[var(--border)] bg-[var(--bg-glass)] backdrop-blur-[20px] backdrop-saturate-[180%] z-20 shrink-0 sticky top-0">
        <button 
          onClick={() => router.back()} 
          className="p-1 -ml-1 rounded-md hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-[var(--text-primary)] font-display font-semibold text-base lg:text-lg tracking-tight">Browse channels</span>
      </div>

      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center">
        <div className="w-full max-w-3xl px-4 py-8">
          <div className="relative w-full mb-8">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-[var(--text-tertiary)]" />
            </div>
            <input
              type="text"
              placeholder="Search channels"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-[var(--border)] rounded-xl leading-5 bg-[var(--bg-elevated)] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] sm:text-sm transition-all"
            />
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="text-center text-[var(--text-tertiary)] py-8">Loading channels...</div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-[var(--text-tertiary)] py-8">No channels found</div>
            ) : (
              filtered.map((channel) => {
                const isJoined = joinedIds.has(channel._id);
                const isOwner = channel.createdBy === currentUser?.uid;

                return (
                  <div key={channel._id} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] transition-colors">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border)] shrink-0">
                        <Hash className="w-5 h-5 text-[var(--text-secondary)]" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[15px] font-semibold text-[var(--text-primary)] truncate">
                          {channel.name}
                        </span>
                        <span className="text-sm text-[var(--text-tertiary)]">
                          {channel.members?.length || 0} member{(channel.members?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className="shrink-0 ml-4">
                      {isOwner ? (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border)] rounded-full">
                          Owner
                        </span>
                      ) : isJoined ? (
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium text-[var(--success)]">
                          Joined ✓
                        </span>
                      ) : (
                        <button
                          onClick={() => handleJoin(channel._id)}
                          className="px-4 py-1.5 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-hover)] transition-colors active:scale-[0.98]"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
