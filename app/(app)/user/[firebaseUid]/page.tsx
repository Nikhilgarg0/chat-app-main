"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import { Twitter, Github, Linkedin, Globe, ArrowLeft, MessageSquare } from "lucide-react";
import { PublicProfileSkeleton } from "@/components/ui/Skeletons";

export default function PublicProfilePage({ params }: { params: Promise<{ firebaseUid: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localTime, setLocalTime] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/users/${unwrappedParams.firebaseUid}`);
        const data = await res.json();
        
        if (data.success && data.user) {
          setProfile(data.user);
        } else {
          setError(data.error || "User not found.");
        }
      } catch (e: any) {
        setError("Failed to load profile.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [unwrappedParams.firebaseUid]);

  useEffect(() => {
    if (profile?.timezone) {
      const interval = setInterval(() => {
        try {
          const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: profile.timezone,
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
          });
          setLocalTime(formatter.format(new Date()));
        } catch (e) {
          setLocalTime("");
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [profile?.timezone]);

  if (loading) return <PublicProfileSkeleton />;

  if (error) return (
    <div className="flex-1 flex items-center justify-center flex-col bg-[var(--bg-base)]">
      <p className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] font-medium mb-4">{error}</p>
      <button onClick={() => router.back()} className="text-[var(--accent)] hover:underline text-[14px] font-medium">Go back</button>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="flex-1 flex flex-col bg-[var(--bg-base)] overflow-y-auto">
      {/* Top Banner Area */}
      <div 
        className="w-full relative h-48 md:h-64 flex-shrink-0"
        style={{ backgroundColor: profile.coverColor || "#3B82F6" }}
      >
        <button 
          onClick={() => router.back()} 
          className="absolute top-4 left-4 p-2 bg-black/30 rounded-full text-white hover:bg-black/50 transition cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="max-w-3xl w-full mx-auto px-6 -mt-16 relative z-10 pb-24">
        <div className="flex flex-col items-center">
          <div style={{ width: 100, height: 100 }} className="rounded-full overflow-hidden border-4 border-[var(--bg-base)]">
            <UserAvatar size={100} avatarUrl={profile.avatarUrl} displayName={profile.displayName} />
          </div>
          
          <div className="mt-4 text-center w-full">
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">{profile.displayName}</h1>
            </div>
            
            {profile.customStatus && (
              <p className="mt-2 text-[var(--text-primary)] bg-[var(--bg-elevated)] border border-[var(--border)] inline-block px-4 py-1 rounded-full text-sm">
                {profile.customStatus}
              </p>
            )}
            
            <div className="mt-4 flex justify-center">
              <button 
                onClick={() => alert("DMs coming soon")} 
                className="flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-2.5 rounded-full font-medium transition-all active:scale-[0.98]"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send message</span>
              </button>
            </div>
            
            {profile.timezone && localTime && (
              <p className="mt-4 text-sm text-[var(--text-secondary)]">
                Local time: {localTime}
              </p>
            )}

            {profile.bio && (
              <div className="mt-6 max-w-lg mx-auto text-[var(--text-primary)]">
                <p>{profile.bio}</p>
              </div>
            )}
            
            {profile.socialLinks && Object.values(profile.socialLinks).some(val => val) && (
              <div className="mt-8 flex justify-center space-x-3">
                {profile.socialLinks.twitter && (
                  <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2.5 text-[var(--text-secondary)] hover:text-[#1DA1F2] hover:bg-[var(--bg-elevated)] rounded-xl border border-transparent hover:border-[var(--border)] transition-all">
                    <Twitter className="w-5 h-5" />
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a href={`https://github.com/${profile.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-xl border border-transparent hover:border-[var(--border)] transition-all">
                    <Github className="w-5 h-5" />
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2.5 text-[var(--text-secondary)] hover:text-[#0077b5] hover:bg-[var(--bg-elevated)] rounded-xl border border-transparent hover:border-[var(--border)] transition-all">
                    <Linkedin className="w-5 h-5" />
                  </a>
                )}
                {profile.socialLinks.website && (
                  <a href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="p-2.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] rounded-xl border border-transparent hover:border-[var(--border)] transition-all">
                    <Globe className="w-5 h-5" />
                  </a>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
