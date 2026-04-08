"use client";

import { useState } from "react";
import { authFetch } from "@/lib/authFetch";

interface ProfileSettingsModalProps {
  userProfile: any;
  onClose: () => void;
  onUpdate: (updatedProfile: any) => void;
}

export default function ProfileSettingsModal({ userProfile, onClose, onUpdate }: ProfileSettingsModalProps) {
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatarUrl || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    setLoading(true);

    try {
      const res = await authFetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: userProfile.firebaseUid,
          email: userProfile.email,
          displayName,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update profile");
      }

      onUpdate(data.user);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--bg-surface)] border border-[var(--border)] rounded-[20px] w-full max-w-md shadow-[0_12px_40px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col scale-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-[var(--border)]">
          <h2 className="text-lg font-bold font-display text-[var(--text-primary)]">Profile Settings</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Satoshi Nakamoto"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-[15px] focus:border-[var(--accent)] outline-none focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.png"
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl px-4 py-3 text-[15px] focus:border-[var(--accent)] outline-none focus:shadow-[0_0_0_3px_var(--accent-glow)] transition-all"
            />
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Leave empty to use the default avatar.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--border)] bg-[var(--bg-elevated)] flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-[14px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !displayName.trim()}
            className="px-6 py-2.5 rounded-full text-[14px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
