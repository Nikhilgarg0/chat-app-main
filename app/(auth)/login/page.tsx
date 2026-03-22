"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, provider } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim()) return;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      const result = await signInWithPopup(auth, provider);
      
      await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: result.user.uid,
          email: result.user.email,
          displayName: result.user.displayName || result.user.email?.split("@")[0],
          avatarUrl: result.user.photoURL,
        }),
      });
      
      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome Back</h1>
        <p className="text-sm text-slate-400">Authenticate to access Nexus</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl animate-[bounce_0.3s_ease-in-out]">
          <p className="text-red-400 text-xs text-center font-medium">{error}</p>
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleLogin}>
        <div className="space-y-1">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-12 rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <Input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-12 rounded-xl"
          />
        </div>
        <Button type="submit" className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-medium py-6 rounded-xl transition-all mt-2 border-0 shadow-lg hover:shadow-blue-500/25">
          Login
        </Button>
      </form>

      <div className="relative my-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-slate-700" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#1a2536] px-2 text-slate-400">Or</span>
        </div>
      </div>

      <Button
        type="button"
        onClick={handleGoogleLogin}
        variant="outline"
        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white h-12 rounded-xl transition-all"
      >
        Continue with Google
      </Button>

      <div className="text-center mt-2">
        <p className="text-sm text-slate-400">
          Don't have an account?{" "}
          <Link href="/register" className="text-white hover:text-blue-400 font-semibold transition-colors">
            Register now
          </Link>
        </p>
      </div>
    </>
  );
}
