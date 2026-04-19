"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { authFetch } from "@/lib/authFetch";

import AppSidebar from "@/components/layout/AppSidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!auth.currentUser) {
        router.push("/login");
      }
    }, 5000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(timeoutId);
      if (!currentUser) {
        router.push("/login");
      } else {
        try {
          const profRes = await authFetch(`/api/users/profile?firebaseUid=${currentUser.uid}`);
          if (profRes.ok) {
            const profData = await profRes.json();
            if (profData.user && !profData.user.onboardingComplete) {
              if (pathname !== "/onboarding") {
                router.push("/onboarding");
                return;
              }
            }
          }
        } catch (e) {}
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-[var(--bg-base)] px-4 relative overflow-hidden">
        {/* Subtle ambient glow — matches the design system */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[var(--accent)]/8 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-[var(--ai-accent)]/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col items-center gap-5 z-10 animate-slide-up">
          <div className="w-10 h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center text-white font-bold text-lg shadow-[var(--shadow)]">
            N
          </div>
          <div className="w-6 h-6 rounded-full border-[3px] border-[var(--border-strong)] border-t-[var(--accent)] animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] font-body selection:bg-[var(--accent)]/30">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] relative overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
