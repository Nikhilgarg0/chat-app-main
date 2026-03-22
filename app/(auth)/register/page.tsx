"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password.trim() || !displayName.trim()) return;

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(result.user, { displayName: displayName.trim() });
      
      const res = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: result.user.uid,
          email: result.user.email,
          displayName: displayName.trim()
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create profile in database");
      }

      router.push("/home");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create Account</h1>
        <p className="text-sm text-slate-400">Register for end-to-end encrypted messaging</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl animate-[bounce_0.3s_ease-in-out]">
          <p className="text-red-400 text-xs text-center font-medium">{error}</p>
        </div>
      )}

      <form className="flex flex-col gap-4" onSubmit={handleRegister}>
        <div className="space-y-1">
          <Input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            autoFocus
            className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500 h-12 rounded-xl"
          />
        </div>
        <div className="space-y-1">
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
          Register
        </Button>
      </form>

      <div className="text-center mt-4">
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:text-blue-400 font-semibold transition-colors">
            Login
          </Link>
        </p>
      </div>
    </>
  );
}
