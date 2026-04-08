"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        router.push("/home");
      } else {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] items-center justify-center bg-[var(--bg-base)]">
        <div className="w-6 h-6 rounded-full border-[3px] border-[var(--border-strong)] border-t-[var(--accent)] animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] w-full bg-[var(--bg-base)] text-[var(--text-primary)]">
      {/* Left Half */}
      <div className="hidden lg:flex flex-1 flex-col justify-between p-12 lg:p-24 bg-[var(--bg-elevated)] border-r border-[var(--border)] relative overflow-hidden">
        
        <div className="relative z-10 space-y-4 max-w-lg mt-20">
          <h1 className="text-5xl lg:text-7xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
            Nexus
          </h1>
          <p className="text-[var(--text-secondary)] text-xl font-medium tracking-tight">
            Your team's second brain. Secure, fast, and remarkably intelligent.
          </p>
        </div>

        <div className="relative z-10 mt-auto flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-[var(--ai-bg)] border border-[var(--border)] flex items-center justify-center">
            <span className="text-[10px] font-bold text-[var(--ai-accent)]">AI</span>
          </div>
          <span className="text-xs font-semibold text-[var(--text-secondary)] tracking-wide">
            BUILT WITH GEMINI 
          </span>
        </div>
      </div>

      {/* Right Half */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-24 bg-[var(--bg-base)]">
        <div className="w-full max-w-[360px] animate-slide-up flex flex-col gap-6">
          {children}
        </div>
      </div>
    </main>
  );
}
