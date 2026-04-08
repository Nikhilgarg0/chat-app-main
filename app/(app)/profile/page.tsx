"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/authFetch";
import { auth } from "@/lib/firebase";
import AvatarUpload from "@/components/ui/AvatarUpload";
import { Twitter, Github, Linkedin, Globe, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorVisible, setErrorVisible] = useState<string | null>(null);
  const [successVisible, setSuccessVisible] = useState(false);

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

  const handleSave = async () => {
    setSaving(true);
    setErrorVisible(null);
    setSuccessVisible(false);

    try {
      const res = await authFetch("/api/users/profile", {
        method: "POST",
        body: JSON.stringify({
          firebaseUid: auth.currentUser?.uid,
          ...formData,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOriginalData(JSON.parse(JSON.stringify(formData)));
        setIsDirty(false);
        setSuccessVisible(true);
        setTimeout(() => setSuccessVisible(false), 3000);
      } else {
        setErrorVisible(data.error || "Failed to save profile.");
      }
    } catch (e: any) {
      setErrorVisible(e.message || "An error occurred.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex-1 flex items-center justify-center p-8">Loading profile...</div>;

  return (
    <div className="flex-1 relative flex flex-col items-center bg-[var(--background)] overflow-y-auto">
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
            <h1 className="text-3xl font-bold text-[var(--foreground)]">{formData.displayName || "Unknown User"}</h1>
            <p className="text-[var(--muted-foreground)] mt-1">{formData.email}</p>
            
            <div className="mt-4 max-w-sm mx-auto">
              <input
                type="text"
                placeholder="Set a custom status..."
                className="w-full p-2 bg-[var(--muted)] text-[var(--foreground)] rounded-md border border-[var(--border)] focus:outline-none focus:ring-1 text-center"
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
            <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)] border-b border-[var(--border)] pb-2">Basic Info</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Display Name</label>
                <input 
                  type="text" 
                  className="w-full p-2 bg-[var(--muted)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none" 
                  value={formData.displayName}
                  onChange={(e) => handleChange("displayName", e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 flex justify-between text-[var(--foreground)]">
                  <span>Bio</span>
                  <span className="text-[var(--muted-foreground)] text-xs">{formData.bio?.length || 0} / 160</span>
                </label>
                <textarea 
                  className="w-full p-2 bg-[var(--muted)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none resize-none" 
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  maxLength={160}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-[var(--foreground)]">Timezone</label>
                <select 
                  className="w-full p-2 bg-[var(--muted)] border border-[var(--border)] rounded-md text-[var(--foreground)] focus:outline-none"
                  value={formData.timezone}
                  onChange={(e) => handleChange("timezone", e.target.value)}
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Kolkata">Asia/Kolkata</option>
                  <option value="Asia/Dubai">Asia/Dubai</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="America/Los_Angeles">America/Los_Angeles</option>
                  <option value="Australia/Sydney">Australia/Sydney</option>
                  <option value="Asia/Tokyo">Asia/Tokyo</option>
                  <option value="Europe/Paris">Europe/Paris</option>
                  <option value="Africa/Cairo">Africa/Cairo</option>
                </select>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)] border-b border-[var(--border)] pb-2">Social Links</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="p-2 bg-[var(--border)] rounded-l-md text-[var(--foreground)]"><Twitter className="w-5 h-5"/></span>
                <input type="text" className="flex-1 p-2 bg-[var(--muted)] border border-[var(--border)] rounded-r-md text-[var(--foreground)] outline-none" value={formData.socialLinks.twitter} onChange={(e) => handleChange("socialLinks.twitter", e.target.value)} placeholder="Twitter Username" />
              </div>
              <div className="flex items-center">
                <span className="p-2 bg-[var(--border)] rounded-l-md text-[var(--foreground)]"><Github className="w-5 h-5"/></span>
                <input type="text" className="flex-1 p-2 bg-[var(--muted)] border border-[var(--border)] rounded-r-md text-[var(--foreground)] outline-none" value={formData.socialLinks.github} onChange={(e) => handleChange("socialLinks.github", e.target.value)} placeholder="GitHub Username" />
              </div>
              <div className="flex items-center">
                <span className="p-2 bg-[var(--border)] rounded-l-md text-[var(--foreground)]"><Linkedin className="w-5 h-5"/></span>
                <input type="text" className="flex-1 p-2 bg-[var(--muted)] border border-[var(--border)] rounded-r-md text-[var(--foreground)] outline-none" value={formData.socialLinks.linkedin} onChange={(e) => handleChange("socialLinks.linkedin", e.target.value)} placeholder="LinkedIn Profile URL" />
              </div>
              <div className="flex items-center">
                <span className="p-2 bg-[var(--border)] rounded-l-md text-[var(--foreground)]"><Globe className="w-5 h-5"/></span>
                <input type="text" className="flex-1 p-2 bg-[var(--muted)] border border-[var(--border)] rounded-r-md text-[var(--foreground)] outline-none" value={formData.socialLinks.website} onChange={(e) => handleChange("socialLinks.website", e.target.value)} placeholder="Personal Website URL" />
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-[var(--foreground)] border-b border-[var(--border)] pb-2">Preferences</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Theme</label>
              <div className="flex rounded-md overflow-hidden border border-[var(--border)] max-w-sm">
                {['light', 'dark', 'system'].map((t) => (
                  <button
                    key={t}
                    onClick={() => handleChange("theme", t)}
                    className={`flex-1 py-2 text-sm capitalize transition ${formData.theme === t ? 'bg-indigo-600 text-white' : 'bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--border)]'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-2 text-[var(--foreground)]">Notifications</label>
              <label className="flex items-center space-x-2 text-[var(--foreground)]">
                <input type="checkbox" checked={formData.notificationPrefs.mentions} onChange={(e) => handleChange("notificationPrefs.mentions", e.target.checked)} className="rounded text-indigo-600 outline-none" />
                <span>Notify on @mentions</span>
              </label>
              <label className="flex items-center space-x-2 text-[var(--foreground)]">
                <input type="checkbox" checked={formData.notificationPrefs.allMessages} onChange={(e) => handleChange("notificationPrefs.allMessages", e.target.checked)} className="rounded text-indigo-600 outline-none" />
                <span>Notify on all messages</span>
              </label>
              <label className="flex items-center space-x-2 text-[var(--foreground)]">
                <input type="checkbox" checked={formData.notificationPrefs.sounds} onChange={(e) => handleChange("notificationPrefs.sounds", e.target.checked)} className="rounded text-indigo-600 outline-none" />
                <span>Play notification sounds</span>
              </label>
            </div>
          </section>

        </div>

        {/* Global Error/Success Inline Messages */}
        {errorVisible && (
          <div className="mt-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            {errorVisible}
          </div>
        )}
        
        {/* Floating Save Actions */}
        {isDirty && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[var(--background)] border border-[var(--border)] shadow-xl rounded-full px-6 py-3 flex items-center space-x-4 z-50">
            <span className="text-sm font-medium text-[var(--foreground)] mr-4">Unsaved changes</span>
            <button onClick={handleDiscard} disabled={saving} className="text-sm font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition">
              Discard
            </button>
            <button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-full text-sm font-medium transition flex items-center">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Success toast (simple absolute placement for demo) */}
        {successVisible && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-500 text-white shadow-xl rounded-full px-6 py-3 flex items-center z-50 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle className="w-5 h-5 mr-2" />
            Profile saved successfully
          </div>
        )}

      </div>
    </div>
  );
}
