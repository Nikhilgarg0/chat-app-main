import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(err) {
  const code = err?.code || err?.message || "";
  if (typeof code !== "string") return "An unexpected error occurred.";
  if (code.includes('invalid-credential') || code.includes('user-not-found') || code.includes('wrong-password') || code.includes('auth/invalid-email')) return 'Invalid email or password.';
  if (code.includes('too-many-requests')) return 'Too many failed attempts. Please try again later.';
  if (code.includes('email-already-in-use')) return 'An account with this email already exists.';
  if (code.includes('weak-password')) return 'Password should be at least 6 characters.';
  if (code.includes('popup-closed')) return 'Google sign-in was cancelled.';
  if (code.includes('network-request-failed')) return 'Network error. Please check your connection.';
  
  // If it's a generic server error returned from our API
  if (code.includes('Internal Server Error')) return 'An unexpected error occurred. Please try again.';
  
  // Fallback for random firebase errors we didn't map (clean formatting)
  if (code.startsWith('Firebase:')) return 'Authentication failed. Please check your credentials.';
  
  return code || 'An unexpected error occurred. Please try again.';
}