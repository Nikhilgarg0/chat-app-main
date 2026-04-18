"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ArrowLeft, Mail, ShieldCheck } from "lucide-react";
import { auth, signInWithGoogle } from "@/lib/firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { getErrorMessage } from "@/lib/utils";

type Step = "details" | "otp";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("details");

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");

  // OTP
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpTimer, setOtpTimer] = useState(0);

  // UI state
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Countdown timer for resend
  useEffect(() => {
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [otpTimer]);

  // ── Step 1: Send OTP ──────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim() || !displayName.trim()) return;
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to send OTP");
      }

      // Move to OTP step
      setStep("otp");
      setOtpDigits(["", "", "", "", "", ""]);
      setOtpTimer(300); // 5 minute countdown
      // Auto-focus first OTP input after render
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      setError(err.message || "Failed to send verification email");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Step 2: Verify OTP & Create Account ───────────────────────
  const handleVerifyOtp = async (e?: React.FormEvent, otpOverride?: string) => {
    e?.preventDefault();
    setError("");

    const otpCode = otpOverride || otpDigits.join("");
    if (otpCode.length !== 6) {
      setError("Please enter the complete 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify the OTP through our proxy
      const verifyRes = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otpCode }),
      });

      const verifyData = await verifyRes.json();

      if (!verifyRes.ok || !verifyData.verified) {
        throw new Error(verifyData.error || "Invalid OTP code");
      }

      // 2. OTP verified — now create the Firebase account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: displayName.trim() });

      // 3. Create profile in MongoDB
      const profileRes = await fetch("/api/users/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firebaseUid: result.user.uid,
          email: result.user.email,
          displayName: displayName.trim(),
        }),
      });

      if (!profileRes.ok) {
        throw new Error("Failed to create profile in database");
      }

      router.push("/onboarding");
    } catch (err: any) {
      setError(getErrorMessage(err));
      setIsLoading(false);
    }
  };

  // ── OTP Input Handlers ────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled — pass the complete code directly
    // to avoid reading stale state before React re-renders
    if (digit && index === 5 && newDigits.every((d) => d !== "")) {
      const completeOtp = newDigits.join("");
      setTimeout(() => handleVerifyOtp(undefined, completeOtp), 150);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pastedData.length === 0) return;

    const newDigits = [...otpDigits];
    for (let i = 0; i < pastedData.length; i++) {
      newDigits[i] = pastedData[i];
    }
    setOtpDigits(newDigits);

    // Focus the next empty input or the last one
    const nextEmpty = newDigits.findIndex((d) => d === "");
    otpRefs.current[nextEmpty !== -1 ? nextEmpty : 5]?.focus();

    // Auto-submit if all 6 digits pasted — pass directly to avoid stale state
    if (pastedData.length === 6) {
      setTimeout(() => handleVerifyOtp(undefined, pastedData), 150);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setError("");
    setIsSendingOtp(true);

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to resend OTP");
      }

      setOtpDigits(["", "", "", "", "", ""]);
      setOtpTimer(300);
      otpRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend OTP");
    } finally {
      setIsSendingOtp(false);
    }
  };

  // ── Google Sign-In (unchanged) ────────────────────────────────
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
          avatarUrl: user.photoURL || "",
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

  // Format the countdown timer as M:SS
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <>
      {/* Mobile Brand Title */}
      <div className="lg:hidden text-center mb-8 mt-4">
        <h1 className="text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)] mb-2">Nexus</h1>
        <p className="text-[var(--text-secondary)] text-sm px-2">Your team's second brain. Secure, fast, and remarkably intelligent.</p>
      </div>

      {/* ─── Step 1: Details Form ──────────────────────────────── */}
      {step === "details" && (
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

          <form className="flex flex-col gap-4 mt-2" onSubmit={handleSendOtp}>
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] px-[14px] pr-[40px] py-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all placeholder:text-[var(--text-tertiary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-[14px] top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <div className="mt-1.5 flex gap-1.5 items-center">
                  <span className={`h-1 flex-1 rounded-full transition-colors ${password.length === 0 ? 'bg-[var(--border)]' : password.length < 6 ? 'bg-red-500' : 'bg-green-500'}`} />
                  <span className="text-[11px] text-[var(--text-tertiary)] flex-shrink-0 w-24 text-right">
                    {password.length === 0 ? "Min 6 chars" : password.length < 6 ? "Too short" : "Looks good"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSendingOtp}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-[980px] px-[20px] py-[12px] font-medium hover:bg-[var(--accent-hover)] transition-colors mt-2 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSendingOtp ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
              Send Verification Code
            </button>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--border)]" />
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="bg-[var(--bg-base)] px-3 text-[var(--text-tertiary)]">
                or continue with
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isSendingOtp}
            className="w-full min-h-[44px] flex items-center justify-center gap-3 bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-[980px] px-[20px] py-[11px] font-medium hover:bg-[var(--bg-elevated)] transition-colors text-[15px] shadow-[var(--shadow-sm)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>

          <div className="text-center mt-6">
            <Link href="/login" className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors">
              Already have an account? Sign in
            </Link>
          </div>
        </>
      )}

      {/* ─── Step 2: OTP Verification ─────────────────────────── */}
      {step === "otp" && (
        <>
          <button
            type="button"
            onClick={() => { setStep("details"); setError(""); }}
            className="flex items-center gap-1.5 text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-2 -mt-1"
          >
            <ArrowLeft size={14} />
            Back
          </button>

          <div className="space-y-1.5 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 flex items-center justify-center">
                <ShieldCheck size={18} className="text-[var(--accent)]" />
              </div>
              <h2 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">Verify Email</h2>
            </div>
            <p className="text-[14px] text-[var(--text-secondary)] mt-2">
              We sent a 6-digit code to <span className="font-medium text-[var(--text-primary)]">{email}</span>
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[13px] font-medium">
              {error}
            </div>
          )}

          <form className="flex flex-col gap-5 mt-3" onSubmit={handleVerifyOtp}>
            {/* 6-digit OTP input */}
            <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { otpRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  className="w-[46px] h-[52px] text-center text-xl font-semibold bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[10px] text-[var(--text-primary)] focus:border-[var(--accent)] focus:shadow-[0_0_0_3px_var(--accent-glow)] outline-none transition-all selection:bg-transparent"
                />
              ))}
            </div>

            {/* Timer & Resend */}
            <div className="flex items-center justify-center gap-2 text-[13px]">
              {otpTimer > 0 ? (
                <span className="text-[var(--text-tertiary)]">
                  Code expires in <span className="font-medium text-[var(--text-secondary)]">{formatTimer(otpTimer)}</span>
                </span>
              ) : (
                <span className="text-[var(--text-tertiary)]">Code expired.</span>
              )}
              <span className="text-[var(--border)]">·</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={otpTimer > 0 || isSendingOtp}
                className="text-[var(--accent)] font-medium hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed transition-opacity"
              >
                {isSendingOtp ? "Sending..." : "Resend"}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || otpDigits.some((d) => d === "")}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 bg-[var(--accent)] text-white rounded-[980px] px-[20px] py-[12px] font-medium hover:bg-[var(--accent-hover)] transition-colors text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Verify & Create Account
            </button>
          </form>
        </>
      )}
    </>
  );
}
