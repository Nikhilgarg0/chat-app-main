"use client";

import { useState, useRef, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import MessageBubble from "@/components/MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut 
} from "firebase/auth";

const ROOM = "general";

export default function ChatPage() {
  const [username, setUsername] = useState("");
  const [joined, setJoined] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [firebaseError, setFirebaseError] = useState("");
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState("");
  const bottomRef = useRef(null);

  const { messages, connected, sendMessage } = useSocket(ROOM);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setJoined(true);
        setUsername(currentUser.email.split('@')[0]);
      } else {
        setJoined(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (joined) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, joined]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setFirebaseError("");
    if (!email.trim() || !password.trim()) return;
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      setFirebaseError(error.message);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendMessage(username, messageInput.trim());
    setMessageInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing Secure Chat...</p>
        </div>
      </main>
    );
  }

  if (!joined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-8 w-full max-w-sm flex flex-col gap-6 transform transition-all hover:scale-[1.01]">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-slate-400">
              {isLogin ? "Enter your credentials to access the secure channel" : "Register to join the secure communication network"}
            </p>
          </div>
          {firebaseError && (
            <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg">
              <p className="text-red-400 text-xs text-center font-medium">{firebaseError}</p>
            </div>
          )}
          <form className="flex flex-col gap-4" onSubmit={handleAuth}>
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-950 border-slate-800 text-slate-200 placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-blue-500"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors mt-2 border-0">
              {isLogin ? "Authenticate" : "Register"}
            </Button>
          </form>
          <div className="text-center mt-2">
            <p className="text-xs text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button" 
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors" 
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? "Register now" : "Login"}
              </button>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen justify-center bg-slate-950 p-4 sm:p-8 font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col h-[calc(100vh-2rem)] sm:h-[85vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/60 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
                {username[0]?.toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-white leading-tight">{username}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">#{ROOM}</span>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  {connected ? <span className="text-green-500">Secure connection</span> : <span className="text-red-400 animate-pulse">Reconnecting...</span>}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`px-3 py-1 font-medium ${
                connected
                  ? "border-green-500/30 text-green-400 bg-green-500/10"
                  : "border-red-500/30 text-red-400 bg-red-500/10"
              }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${connected ? "bg-green-500" : "bg-red-500 animate-bounce"}`}></div>
              {connected ? "LIVE" : "OFFLINE"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-0">
              Disconnect
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scroll-smooth">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
              </div>
              <p className="text-sm font-medium text-slate-400">End-to-End Encrypted Channel</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              isOwn={msg.author === username}
            />
          ))}
          <div ref={bottomRef} className="h-4" />
        </div>

        {/* Input */}
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <div className="flex items-end gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
            <Input
              placeholder="Type a secure message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-slate-200 placeholder:text-slate-600 px-4 py-3 h-auto shadow-none text-base"
              autoFocus
            />
            <Button 
              onClick={handleSend} 
              disabled={!messageInput.trim() || !connected}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl h-12 w-12 p-0 flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 border-0"
            >
              <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </Button>
          </div>
          <div className="text-center mt-2">
             <p className="text-[10px] text-slate-600 font-medium tracking-wide uppercase">Messages are secured via Socket.IO TLS transmission</p>
          </div>
        </div>

      </div>
    </main>
  );
}