"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { Badge } from "@/components/ui/badge";

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
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="mb-10 text-center animate-[fadeInUp_0.4s_ease-out] z-10">
        <Badge className="mb-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 text-xs uppercase tracking-widest">
          Nexus
        </Badge>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
          Authentication
        </h1>
      </div>
      
      <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 w-full max-w-sm flex flex-col gap-6 transform transition-all hover:scale-[1.01] animate-[fadeInUp_0.5s_ease-out] z-10">
        {children}
      </div>
    </main>
  );
}
