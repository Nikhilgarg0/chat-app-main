"use client";

/* ─────────────────────────────────────────
   Shared pulse animation wrapper
   ───────────────────────────────────────── */
function Bone({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-lg bg-[var(--bg-elevated)] animate-pulse ${className}`}
    />
  );
}

/* ─────────────────────────────────────────
   Workspace card skeleton  (home page grid)
   ───────────────────────────────────────── */
export function WorkspaceCardSkeleton() {
  return (
    <div className="flex flex-col justify-between p-5 rounded-[16px] bg-[var(--bg-surface)] border border-[var(--border)] shadow-apple-sm h-[140px]">
      {/* Top row: name + badge */}
      <div className="flex justify-between items-start mb-4">
        <Bone className="h-5 w-2/3" />
        <Bone className="h-5 w-16 rounded-full" />
      </div>
      {/* Bottom row: members + button */}
      <div className="flex items-end justify-between mt-auto">
        <div className="flex items-center gap-2">
          <Bone className="h-4 w-20" />
        </div>
        <Bone className="h-9 w-20 rounded-full" />
      </div>
    </div>
  );
}

/* Grid of workspace skeletons for the home page */
export function WorkspacesGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <WorkspaceCardSkeleton key={i} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Channel row skeleton  (browse page)
   ───────────────────────────────────────── */
export function ChannelRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-surface)]">
      {/* Icon + name + member count */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Bone className="w-10 h-10 shrink-0 rounded-lg" />
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <Bone className="h-4 w-32" />
          <Bone className="h-3 w-20" />
        </div>
      </div>
      {/* Action button */}
      <Bone className="h-8 w-16 rounded-lg ml-4 shrink-0" />
    </div>
  );
}

/* List of channel skeletons for the browse page */
export function ChannelListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <ChannelRowSkeleton key={i} />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────
   Profile page skeleton
   ───────────────────────────────────────── */
export function ProfileSkeleton() {
  return (
    <div className="flex-1 relative flex flex-col items-center bg-[var(--bg-base)] overflow-y-auto">
      {/* Banner */}
      <div className="w-full h-48 md:h-64 bg-[var(--bg-elevated)] animate-pulse flex-shrink-0" />

      {/* Avatar + name block */}
      <div className="max-w-3xl w-full px-6 -mt-16 relative z-10 pb-24">
        <div className="flex flex-col items-center">
          {/* Avatar circle */}
          <div className="w-[100px] h-[100px] rounded-full bg-[var(--bg-elevated)] animate-pulse border-4 border-[var(--bg-base)]" />

          <div className="mt-6 flex flex-col items-center gap-3 w-full">
            <Bone className="h-8 w-48" />
            <Bone className="h-4 w-36" />
            <Bone className="h-10 w-72 mt-2" />
          </div>

          {/* Form sections */}
          <div className="mt-10 space-y-8 w-full">
            {/* Basic info section */}
            <div>
              <Bone className="h-4 w-20 mb-4" />
              <div className="space-y-4">
                <Bone className="h-10 w-full" />
                <Bone className="h-24 w-full" />
                <Bone className="h-10 w-full" />
              </div>
            </div>
            {/* Social links section */}
            <div>
              <Bone className="h-4 w-24 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <Bone key={i} className="h-10 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Public user profile skeleton
   ───────────────────────────────────────── */
export function PublicProfileSkeleton() {
  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-base)] overflow-y-auto">
      {/* Banner */}
      <div className="w-full h-48 md:h-64 bg-[var(--bg-elevated)] animate-pulse flex-shrink-0" />

      <div className="max-w-3xl w-full mx-auto px-6 -mt-16 relative z-10 pb-24">
        <div className="flex flex-col items-center">
          {/* Avatar */}
          <div className="w-[100px] h-[100px] rounded-full bg-[var(--bg-elevated)] animate-pulse border-4 border-[var(--bg-base)]" />

          <div className="mt-6 flex flex-col items-center gap-3 w-full">
            <Bone className="h-8 w-44" />
            <Bone className="h-8 w-32 rounded-full" />
            <Bone className="h-10 w-40 rounded-full mt-2" />
            <Bone className="h-4 w-28 mt-2" />
            <Bone className="h-16 w-full max-w-lg mt-4" />
            {/* Social icons row */}
            <div className="flex gap-3 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <Bone key={i} className="w-10 h-10 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Workspace overview page skeleton
   ───────────────────────────────────────── */
export function WorkspaceOverviewSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center p-8 z-10 relative overflow-y-auto">
      {/* Hero area */}
      <div className="text-center mb-10 flex flex-col items-center gap-4">
        <Bone className="w-20 h-20 rounded-[20px]" />
        <Bone className="h-9 w-52" />
        <div className="flex gap-3 mt-2">
          <Bone className="h-7 w-32 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" />
        </div>
        <Bone className="h-4 w-64 mt-2" />
        <Bone className="h-10 w-40 rounded-full mt-2" />
      </div>
    </div>
  );
}
