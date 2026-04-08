"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/ui/UserAvatar";
import { Twitter, Github, Linkedin, Globe, ArrowLeft, MessageSquare } from "lucide-react";

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

  if (loading) return <div className="flex-1 flex items-center justify-center">Loading profile...</div>;
  if (error) return <div className="flex-1 flex items-center justify-center flex-col"><p className="text-red-500 mb-4">{error}</p><button onClick={() => router.back()} className="text-indigo-600 hover:underline">Go back</button></div>;
  if (!profile) return null;

  return (
    <div className="flex-1 flex flex-col bg-[var(--background)] overflow-y-auto">
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
          <div style={{ width: 100, height: 100 }} className="rounded-full overflow-hidden border-4 border-[var(--background)]">
            <UserAvatar size={100} avatarUrl={profile.avatarUrl} displayName={profile.displayName} />
          </div>
          
          <div className="mt-4 text-center w-full">
            <div className="flex items-center justify-center space-x-2">
              <h1 className="text-3xl font-bold text-[var(--foreground)]">{profile.displayName}</h1>
              {/* Online status indicator can be expanded by parent components if needed. Currently UI is just here. */}
              {/* We'll pass a fixed grey dot here, but if we need to sync online status we should pass it via context or props. */}
            </div>
            
            {profile.customStatus && (
              <p className="mt-2 text-[var(--foreground)] bg-[var(--muted)] inline-block px-4 py-1 rounded-full text-sm">
                {profile.customStatus}
              </p>
            )}
            
            <div className="mt-4 flex justify-center">
              <button 
                onClick={() => alert("DMs coming soon")} 
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-full font-medium transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Send message</span>
              </button>
            </div>
            
            {profile.timezone && localTime && (
              <p className="mt-4 text-sm text-[var(--muted-foreground)]">
                Local time: {localTime}
              </p>
            )}

            {profile.bio && (
              <div className="mt-6 max-w-lg mx-auto text-[var(--foreground)]">
                <p>{profile.bio}</p>
              </div>
            )}
            
            {profile.socialLinks && Object.values(profile.socialLinks).some(val => val) && (
              <div className="mt-8 flex justify-center space-x-4">
                {profile.socialLinks.twitter && (
                  <a href={`https://twitter.com/${profile.socialLinks.twitter}`} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--muted-foreground)] hover:text-[#1DA1F2] hover:bg-[var(--muted)] rounded-full transition">
                    <Twitter className="w-6 h-6" />
                  </a>
                )}
                {profile.socialLinks.github && (
                  <a href={`https://github.com/${profile.socialLinks.github}`} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition">
                    <Github className="w-6 h-6" />
                  </a>
                )}
                {profile.socialLinks.linkedin && (
                  <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--muted-foreground)] hover:text-[#0077b5] hover:bg-[var(--muted)] rounded-full transition">
                    <Linkedin className="w-6 h-6" />
                  </a>
                )}
                {profile.socialLinks.website && (
                  <a href={profile.socialLinks.website.startsWith('http') ? profile.socialLinks.website : `https://${profile.socialLinks.website}`} target="_blank" rel="noopener noreferrer" className="p-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-full transition">
                    <Globe className="w-6 h-6" />
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
