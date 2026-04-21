"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { authFetch } from "@/lib/authFetch";

import AppSidebar from "@/components/layout/AppSidebar";
import PageLoader from "@/components/ui/PageLoader";

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

  if (loading) return <PageLoader />;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-[var(--bg-base)] text-[var(--text-primary)] font-body selection:bg-[var(--accent)]/30">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 h-[100dvh] relative overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
