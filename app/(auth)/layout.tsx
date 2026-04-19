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
      <main className="flex min-h-[100dvh] items-center justify-center bg-[#0a0a0a]">
        <div className="w-6 h-6 rounded-full border-[3px] border-white/10 border-t-white/70 animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="flex min-h-[100dvh] w-full bg-[#0a0a0a] text-white overflow-hidden">

      {/* ── Left Panel — Vibrant Gradient Art ────────────────── */}
      <div className="hidden lg:flex flex-1 relative m-3 mr-0">
        {/* Rounded art panel */}
        <div className="relative w-full rounded-[24px] overflow-hidden border border-white/[0.06]">
          {/* Background image */}
          <img
            src="/auth-bg.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Subtle overlay gradient for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

          {/* Top branding */}
          <div className="relative z-10 p-10 flex items-center gap-3">
            <span className="text-[11px] font-semibold text-white/50 uppercase tracking-[0.2em]">Nexus Platform</span>
            <div className="h-px flex-1 max-w-[80px] bg-white/15" />
          </div>

          {/* Bottom quote text */}
          <div className="absolute bottom-0 left-0 right-0 p-10 z-10">
            <h2
              className="text-5xl xl:text-6xl font-semibold leading-[1.1] tracking-[-0.03em] text-white mb-4"
              style={{ fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif" }}
            >
              Connect.<br />
              Collaborate.<br />
              Create.
            </h2>
            <p className="text-white/40 text-[15px] max-w-xs leading-relaxed">
              Your team&apos;s second brain — secure, fast, and remarkably intelligent.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form ───────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-16 xl:px-24 py-8 relative">
        {/* Subtle radial glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_70%)] pointer-events-none" />

        <div className="w-full max-w-[380px] relative z-10 flex flex-col gap-6">
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-4">
            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <span className="text-[11px] font-bold text-black">N</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">Nexus</span>
            </div>
          </div>

          {/* Desktop brand */}
          <div className="hidden lg:flex items-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <span className="text-[11px] font-bold text-black">N</span>
            </div>
            <span className="font-semibold text-lg tracking-tight">Nexus</span>
          </div>

          {children}
        </div>
      </div>
    </main>
  );
}
