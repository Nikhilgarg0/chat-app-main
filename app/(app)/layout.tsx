"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { authFetch } from "@/lib/authFetch";

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
      <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-900 text-slate-100 font-sans selection:bg-blue-500/30">
      {children}
    </div>
  );
}
