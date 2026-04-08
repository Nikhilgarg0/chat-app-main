"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { authFetch } from "@/lib/authFetch";
import Toast from "@/components/ui/Toast";
import AvatarUpload from "@/components/ui/AvatarUpload";

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("");
  const [customStatus, setCustomStatus] = useState("");
  const [timezone, setTimezone] = useState("UTC");

  const [wsName, setWsName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [liveTime, setLiveTime] = useState("");

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const profRes = await authFetch(`/api/users/profile?firebaseUid=${user.uid}`);
        if (profRes.ok) {
          const profData = await profRes.json();
          if (profData.user?.onboardingComplete) {
            router.push("/home");
            return;
          }
        }
      } catch (err) {}

      setDisplayName(user.displayName || user.email?.split("@")[0] || "");
      setAvatarUrl(user.photoURL || "");

      try {
        const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detected) setTimezone(detected);
      } catch (e) {}

      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const timeStr = new Intl.DateTimeFormat("en-US", {
          timeZone: timezone,
          hour: "numeric",
          minute: "numeric",
          hour12: true,
        }).format(new Date());
        setLiveTime(timeStr);
      } catch (e) {
        setLiveTime("");
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [timezone]);

  const handleComplete = async (onSuccess: () => Promise<void>) => {
    const user = auth.currentUser;
    if (!user) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          onboardingComplete: true,
          displayName,
          avatarUrl,
          bio,
          customStatus,
          timezone,
        }),
      });
      if (res.ok) {
        await onSuccess();
      } else {
        setToast("Failed to complete onboarding.");
        setIsSubmitting(false);
      }
    } catch (err) {
      setToast("Error saving profile.");
      setIsSubmitting(false);
    }
  };

  const createWorkspace = () => {
    handleComplete(async () => {
      try {
        const res = await authFetch("/api/workspaces", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: wsName, firebaseUid: auth.currentUser?.uid }),
        });
        const data = await res.json();
        if (res.ok && data.success) router.push(`/workspace/${data.workspace._id}`);
        else { setToast(data.error); setIsSubmitting(false); }
      } catch (e) { setToast("Error creating workspace"); setIsSubmitting(false); }
    });
  };

  const joinWorkspace = () => {
    handleComplete(async () => {
      try {
        const res = await authFetch("/api/workspaces/join", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inviteCode: inviteCode.trim(), firebaseUid: auth.currentUser?.uid }),
        });
        const data = await res.json();
        if (res.ok && data.success) router.push(`/workspace/${data.workspaceId || data.workspace?._id}`);
        else { setToast(data.error); setIsSubmitting(false); }
      } catch (e) { setToast("Error joining workspace"); setIsSubmitting(false); }
    });
  };

  const skipWorkspace = () => {
    handleComplete(async () => {
      router.push("/home");
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-base)]">
        <div className="w-6 h-6 rounded-full border-[3px] border-[var(--border-strong)] border-t-[var(--accent)] animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)] px-4 font-body transition-opacity duration-300">
      <div className="w-full max-w-[480px] bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl p-8 shadow-apple transition-transform duration-300">
        
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className={`w-2 h-2 rounded-full transition-colors ${step <= currentStep ? "bg-[var(--accent)]" : "bg-[var(--border-strong)]"}`} />
          ))}
        </div>

        {currentStep === 1 && (
          <div className="flex flex-col items-center text-center animate-slide-up">
            <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] mb-6">Nexus</h1>
            <h2 className="text-2xl font-bold mb-2">Welcome, {displayName}</h2>
            <p className="text-[var(--text-secondary)] mb-8">Let's get your workspace set up in just a few steps.</p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              <span className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-4 py-2 text-sm font-medium">⚡ Real-time chat</span>
              <span className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-4 py-2 text-sm font-medium">🤖 AI assistant</span>
              <span className="flex items-center gap-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-full px-4 py-2 text-sm font-medium">🔒 Secure by default</span>
            </div>

            <button 
              onClick={() => setCurrentStep(2)} 
              className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full font-medium transition-colors active:scale-[0.98]"
            >
              Get started →
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div className="flex flex-col animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Make it yours</h2>
              <p className="text-[var(--text-secondary)]">This is how your teammates will see you.</p>
            </div>

            <div className="flex justify-center mb-6">
              <AvatarUpload 
                currentAvatarUrl={avatarUrl}
                displayName={displayName}
                onUploadComplete={setAvatarUrl}
                onError={setToast}
              />
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-medium mb-1.5">Display Name</label>
                <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg focus:border-[var(--accent)] outline-none transition-all" />
              </div>
              <div className="relative">
                <label className="block text-sm font-medium mb-1.5">Bio</label>
                <textarea rows={2} value={bio} onChange={e => setBio(e.target.value)} maxLength={160} className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg focus:border-[var(--accent)] outline-none transition-all resize-none" />
                <span className="absolute bottom-2 right-2 text-xs text-[var(--text-tertiary)]">{bio.length}/160</span>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Custom Status</label>
                <input type="text" value={customStatus} onChange={e => setCustomStatus(e.target.value)} maxLength={80} placeholder="e.g. Building something great 🚀" className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg focus:border-[var(--accent)] outline-none transition-all placeholder-[var(--text-tertiary)]" />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <button onClick={() => setCurrentStep(1)} className="px-6 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-full font-medium transition-colors">Back</button>
              <button disabled={!displayName.trim()} onClick={() => setCurrentStep(3)} className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white rounded-full font-medium transition-colors active:scale-[0.98]">Continue →</button>
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="flex flex-col animate-slide-up">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Set your timezone</h2>
              <p className="text-[var(--text-secondary)]">We'll show you teammates' local times correctly.</p>
            </div>

            <div className="mb-6">
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg focus:border-[var(--accent)] outline-none transition-all appearance-none cursor-pointer">
                <optgroup label="Asia">
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Asia/Singapore">Asia/Singapore</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Asia/Shanghai">Asia/Shanghai</option>
                </optgroup>
                <optgroup label="Europe">
                  <option value="Europe/London">Europe/London</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Europe/Berlin">Europe/Berlin</option>
                  <option value="Europe/Moscow">Europe/Moscow</option>
                </optgroup>
                <optgroup label="Americas">
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Chicago">America/Chicago</option>
                  <option value="America/Denver">America/Denver</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="America/Sao_Paulo">America/Sao_Paulo</option>
                </optgroup>
                <optgroup label="Pacific">
                  <option value="Pacific/Auckland">Pacific/Auckland</option>
                  <option value="Pacific/Sydney">Pacific/Sydney</option>
                </optgroup>
                <optgroup label="Other">
                  <option value="UTC">UTC</option>
                </optgroup>
              </select>
              {liveTime && <p className="mt-4 text-center text-sm font-medium text-[var(--accent)]">Your current time: {liveTime}</p>}
            </div>

            <div className="flex items-center justify-between gap-4 mt-auto">
              <button onClick={() => setCurrentStep(2)} className="px-6 py-2.5 text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-full font-medium transition-colors">Back</button>
              <button onClick={() => setCurrentStep(4)} className="px-6 py-2.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full font-medium transition-colors active:scale-[0.98]">Continue →</button>
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="flex flex-col animate-slide-up h-full">
            <div className="flex items-center mb-6">
              <button onClick={() => setCurrentStep(3)} className="px-4 py-1.5 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-full font-medium transition-colors">Back</button>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Join or create a workspace</h2>
              <p className="text-[var(--text-secondary)]">Workspaces are where your team communicates.</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1 border border-[var(--border)] rounded-xl p-5 bg-[var(--bg-surface)]">
                <h3 className="font-semibold mb-4">Create a workspace</h3>
                <input type="text" placeholder="Workspace name" value={wsName} onChange={e => setWsName(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg outline-none mb-3" />
                <button disabled={!wsName.trim() || isSubmitting} onClick={createWorkspace} className="w-full py-2 bg-[var(--accent)] text-white rounded-lg font-medium active:scale-[0.98] disabled:opacity-50">Create workspace</button>
              </div>
              <div className="flex-1 border border-[var(--border)] rounded-xl p-5 bg-[var(--bg-surface)]">
                <h3 className="font-semibold mb-4">Join with invite code</h3>
                <input type="text" placeholder="Invite code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} className="w-full px-3 py-2 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg outline-none mb-3" />
                <button disabled={!inviteCode.trim() || isSubmitting} onClick={joinWorkspace} className="w-full py-2 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg font-medium active:scale-[0.98] disabled:opacity-50">Join workspace</button>
              </div>
            </div>

            <button onClick={skipWorkspace} disabled={isSubmitting} className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-primary)] mx-auto underline transition-colors">
              Skip for now — I'll set this up later
            </button>
          </div>
        )}
      </div>
      
      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
