"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

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
      <div className="space-y-1.5 mb-2">
        <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Create Account</h2>
        <p className="text-[14px] text-[var(--text-secondary)]">Sign up to get started.</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] font-medium">
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4 mt-2" onSubmit={handleRegister}>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--text-primary)]">Display Name</label>
            <input
              type="text"
              placeholder="Steve Jobs"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoFocus
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] px-[14px] py-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--text-primary)]">Email</label>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] px-[14px] py-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[13px] font-medium text-[var(--text-primary)]">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] px-[14px] py-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]"
            />
          </div>
        </div>
        
        <button 
          type="submit" 
          className="w-full bg-[var(--accent)] text-white rounded-[980px] px-[20px] py-[12px] font-medium hover:bg-[var(--accent-hover)] transition-colors mt-2 text-[15px]"
        >
          Create Account
        </button>
      </form>

      <div className="text-center mt-6">
        <Link href="/login" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
          Already have an account? Sign in
        </Link>
      </div>
    </>
  );
}
