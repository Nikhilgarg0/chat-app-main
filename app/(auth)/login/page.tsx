"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { getErrorMessage } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) return;
    setIsLoading(true);
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const token = await result.user.getIdToken();
      const profRes = await fetch(`/api/users/profile?firebaseUid=${result.user.uid}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const profData = await profRes.json();
      if (profData.user?.onboardingComplete) {
        router.push("/home");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const result = await signInWithGoogle();
      const user = result.user;
      
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split("@")[0],
          avatarUrl: user.photoURL || ""
        }),
      });
      
      const data = await res.json();
      if (data.user?.onboardingComplete) {
        router.push("/home");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Heading */}
      <div className="space-y-2 mb-2">
        <h2 className="text-[32px] font-semibold tracking-[-0.03em] text-white leading-tight">
          Welcome Back
        </h2>
        <p className="text-[15px] text-white/40">
          Enter your email and password to access your account
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-medium">
          {error}
        </div>
      )}

      {/* Form */}
      <form className="flex flex-col gap-5" onSubmit={handleLogin}>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-white/70">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-[15px] focus:border-white/20 focus:bg-white/[0.06] outline-none transition-all placeholder:text-white/20"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-medium text-white/70">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 pr-11 py-3 text-white text-[15px] focus:border-white/20 focus:bg-white/[0.06] outline-none transition-all placeholder:text-white/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={isLoading}
          className="w-full min-h-[48px] flex items-center justify-center gap-2 bg-white text-black rounded-xl px-5 py-3 font-semibold text-[15px] hover:bg-white/90 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
          Sign In
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center text-[12px]">
          <span className="bg-[#0a0a0a] px-4 text-white/25">
            or
          </span>
        </div>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="w-full min-h-[48px] flex items-center justify-center gap-3 bg-transparent border border-white/[0.08] text-white/70 rounded-xl px-5 py-3 font-medium text-[15px] hover:bg-white/[0.04] hover:border-white/[0.12] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px]" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Sign In with Google
      </button>

      {/* Footer Link */}
      <div className="text-center mt-4">
        <span className="text-[14px] text-white/30">Don&apos;t have an account? </span>
        <Link href="/register" className="text-[14px] text-white font-medium hover:underline transition-all">
          Sign Up
        </Link>
      </div>
    </>
  );
}
