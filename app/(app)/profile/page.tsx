"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import { auth } from "@/lib/firebase";
import AvatarUpload from "@/components/ui/AvatarUpload";
import { Twitter, Github, Linkedin, Globe, ArrowLeft, CheckCircle, AlertCircle, Copy } from "lucide-react";
import Toast from "@/components/ui/Toast";
import PageLoader from "@/components/ui/PageLoader";
import { ProfileSkeleton } from "@/components/ui/Skeletons";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState<any>({
    displayName: "",
    email: "",
    bio: "",
    customStatus: "",
    timezone: "UTC",
    coverColor: "#3B82F6",
    socialLinks: { twitter: "", github: "", linkedin: "", website: "" },
    notificationPrefs: { mentions: true, allMessages: false, sounds: true },
    theme: "system",
    avatarUrl: "",
  });

  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const res = await authFetch(`/api/users/profile?firebaseUid=${user.uid}`);
          const data = await res.json();
          if (data.success && data.user) {
            const loaded = {
              ...data.user,
              socialLinks: data.user.socialLinks || { twitter: "", github: "", linkedin: "", website: "" },
              notificationPrefs: data.user.notificationPrefs || { mentions: true, allMessages: false, sounds: true },
              coverColor: data.user.coverColor || "#3B82F6",
              theme: data.user.theme || "system",
              bio: data.user.bio || "",
              customStatus: data.user.customStatus || "",
              timezone: data.user.timezone || "UTC",
              avatarUrl: data.user.avatarUrl || ""
            };
            setOriginalData(loaded);
            setFormData(loaded);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });
    return unsub;
  }, [router]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => {
      const next = { ...prev };
      const keys = field.split(".");
      if (keys.length === 2) {
        next[keys[0]] = { ...next[keys[0]], [keys[1]]: value };
      } else {
        next[field] = value;
      }
      return next;
    });
    setIsDirty(true);
  };

  const handleDiscard = () => {
    setFormData(JSON.parse(JSON.stringify(originalData)));
    setIsDirty(false);
    setErrorVisible(null);
  };

  const handleSave = async (dataToSave = formData, isSilent = false) => {
    if (!isSilent) setSaving(true);
    setErrorVisible(null);

    try {
      const res = await authFetch("/api/users/profile", {
        method: "POST",
        body: JSON.stringify({
          firebaseUid: auth.currentUser?.uid,
          ...dataToSave,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginalData(JSON.parse(JSON.stringify(dataToSave)));
        setIsDirty(false);
        setToastMessage("Profile saved successfully.");
      } else {
        if (!isSilent) setErrorVisible(data.error || "Failed to save profile.");
      }
    } catch (e: any) {
      if (!isSilent) setErrorVisible(e.message || "An error occurred.");
    } finally {
      if (!isSilent) setSaving(false);
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    const newPrefs = { ...formData.notificationPrefs, [key]: value };
    const newData = { ...formData, notificationPrefs: newPrefs };
    setFormData(newData);
    handleSave(newData, true);
  };
  
  const copyUserId = () => {
    if (auth.currentUser?.uid) {
      navigator.clipboard.writeText(auth.currentUser.uid);
      setToastMessage("User ID copied to clipboard!");
    }
  };

  if (loading) return <ProfileSkeleton />;

  return (
    <div className="flex-1 relative flex flex-col items-center bg-[var(--bg-base)] overflow-y-auto">
      {/* Top Banner Area */}
      <div 
        className="w-full relative h-48 md:h-64 flex-shrink-0"
        style={{ backgroundColor: formData.coverColor }}
      >
        <button 
          onClick={() => router.back()} 
          className="absolute top-4 left-4 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        <div className="absolute top-4 right-4 bg-white/90 p-1 rounded-md shadow-sm">
          <input 
            type="color" 
            value={formData.coverColor} 
            onChange={(e) => handleChange("coverColor", e.target.value)} 
            title="Change cover color"
            className="w-8 h-8 cursor-pointer rounded border-0 p-0"
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl w-full px-6 -mt-16 relative z-10 pb-24">
        <div className="flex flex-col items-center">
          <AvatarUpload 
            currentAvatarUrl={formData.avatarUrl}
            displayName={formData.displayName}
            onUploadComplete={(url) => {
              handleChange("avatarUrl", url);
            }}
            onError={(msg) => setErrorVisible(msg)}
          />
          <div className="mt-4 text-center w-full">
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">{formData.displayName || "Unknown User"}</h1>
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-[var(--text-secondary)]">{formData.email}</p>
              <button onClick={copyUserId} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition" title="Copy User ID">
                <Copy className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <div className="mt-4 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Set a custom status..."
                className="w-full p-2.5 bg-[var(--bg-elevated)] text-[var(--text-primary)] rounded-[10px] border border-[var(--border)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all text-center placeholder:text-[var(--text-tertiary)]"
                value={formData.customStatus}
                onChange={(e) => handleChange("customStatus", e.target.value)}
                maxLength={80}
              />
            </div>
          </div>
        </div>

        {/* Form Sections */}
        <div className="mt-10 space-y-8">
          
          <section>
            <h2 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-3">Basic Info</h2>
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[var(--text-primary)]">Display Name</label>
                <input 
                  type="text" 
                  className="w-full p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all" 
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="flex justify-between text-[13px] font-medium text-[var(--text-primary)]">
                  <span>Bio</span>
                  <span className="text-[var(--text-tertiary)] text-[11px]">{formData.bio?.length || 0} / 160</span>
                </label>
                <textarea 
                  className="w-full p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all resize-none" 
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  maxLength={160}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-medium text-[var(--text-primary)]">Timezone</label>
                <select 
                  className="w-full p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all appearance-none cursor-pointer"
                  value={formData.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                >
                  {Intl.supportedValuesOf('timeZone').map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-3">Social Links</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] border-r-0 rounded-l-[10px] text-[var(--text-secondary)]"><Twitter className="w-4 h-4"/></span>
                <input type="text" className="flex-1 p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-r-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]" value={formData.socialLinks.twitter} onChange={(e) => handleChange("socialLinks.twitter", e.target.value)} placeholder="Twitter Username" />
              </div>
              <div className="flex items-center">
                <span className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] border-r-0 rounded-l-[10px] text-[var(--text-secondary)]"><Github className="w-4 h-4"/></span>
                <input type="text" className="flex-1 p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-r-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]" value={formData.socialLinks.github} onChange={(e) => handleChange("socialLinks.github", e.target.value)} placeholder="GitHub Username" />
              </div>
              <div className="flex items-center">
                <span className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] border-r-0 rounded-l-[10px] text-[var(--text-secondary)]"><Linkedin className="w-4 h-4"/></span>
                <input type="text" className="flex-1 p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-r-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]" value={formData.socialLinks.linkedin} onChange={(e) => handleChange("socialLinks.linkedin", e.target.value)} placeholder="LinkedIn Profile URL" />
              </div>
              <div className="flex items-center">
                <span className="p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] border-r-0 rounded-l-[10px] text-[var(--text-secondary)]"><Globe className="w-4 h-4"/></span>
                <input type="text" className="flex-1 p-2.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-r-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]" value={formData.socialLinks.website} onChange={(e) => handleChange("socialLinks.website", e.target.value)} placeholder="Personal Website URL" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold mb-4 text-[var(--text-secondary)] uppercase tracking-wider border-b border-[var(--border)] pb-3">Preferences</h2>
            
            <div className="mb-6">
              <label className="block text-[13px] font-medium mb-2 text-[var(--text-primary)]">Theme</label>
              <div className="flex rounded-[10px] overflow-hidden border border-[var(--border)] max-w-sm">
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleChange("theme", t)}
                    className={`flex-1 py-2.5 text-[13px] capitalize transition-all font-medium ${formData.theme === t ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] hover:text-[var(--text-primary)]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-[13px] font-medium mb-2 text-[var(--text-primary)]">Notifications</label>
              <label className="flex items-center gap-3 text-[var(--text-primary)] cursor-pointer group">
                <input type="checkbox" checked={formData.notificationPrefs.mentions} onChange={(e) => handleNotificationChange("mentions", e.target.checked)} className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer" />
                <span className="text-[14px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Notify on @mentions</span>
              </label>
              <label className="flex items-center gap-3 text-[var(--text-primary)] cursor-pointer group">
                <input type="checkbox" checked={formData.notificationPrefs.allMessages} onChange={(e) => handleNotificationChange("allMessages", e.target.checked)} className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer" />
                <span className="text-[14px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Notify on all messages</span>
              </label>
              <label className="flex items-center gap-3 text-[var(--text-primary)] cursor-pointer group">
                <input type="checkbox" checked={formData.notificationPrefs.sounds} onChange={(e) => handleNotificationChange("sounds", e.target.checked)} className="w-4 h-4 rounded accent-[var(--accent)] cursor-pointer" />
                <span className="text-[14px] text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">Play notification sounds</span>
              </label>
            </div>
          </section>

        </div>

        {/* Global Error/Success Inline Messages */}
        {errorVisible && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-[13px] font-medium flex items-center">
            <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
            {errorVisible}
          </div>
        )}
        
        {/* Sticky Save Actions */}
        {isDirty && (
          <div className="sticky bottom-6 mx-auto mt-8 bg-[var(--bg-base)] border border-[var(--border)] shadow-xl rounded-full px-6 py-3 flex items-center justify-center space-x-4 max-w-max z-50 animate-slide-up">
            <span className="text-sm font-medium text-[var(--text-primary)] mr-4">Unsaved changes</span>
            <button onClick={handleDiscard} disabled={saving} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving} className="bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-full text-sm font-medium transition flex items-center">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Success toast */}
        {toastMessage && (
          <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
        )}

      </div>
    </div>
  );
}
