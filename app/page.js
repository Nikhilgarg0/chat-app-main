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

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function ChatPage() {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [screen, setScreen] = useState("auth"); // auth | home | chat
  const [roomInput, setRoomInput] = useState("");
  const [copied, setCopied] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [firebaseError, setFirebaseError] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [messageInput, setMessageInput] = useState("");
  const bottomRef = useRef(null);

  const { messages, connected, sendMessage } = useSocket(room);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUsername(currentUser.email.split('@')[0]);
        // Handle room persistence on refresh
        const savedRoom = typeof window !== "undefined" ? sessionStorage.getItem("chatRoom") : null;
        if (savedRoom && !room) {
          setRoom(savedRoom);
          setScreen("chat");
        } else if (room) {
          setScreen("chat");
        } else {
          setScreen("home");
        }
      } else {
        setScreen("auth");
        setRoom("");
        if (typeof window !== "undefined") sessionStorage.removeItem("chatRoom");
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [room]);

  useEffect(() => {
    if (screen === "chat") {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages.length, screen]);

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
      setScreen("auth");
      setRoom("");
      if (typeof window !== "undefined") sessionStorage.removeItem("chatRoom");
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateRoom = () => {
    const newRoom = generateRoomId();
    setRoom(newRoom);
    if (typeof window !== "undefined") sessionStorage.setItem("chatRoom", newRoom);
    setScreen("chat");
  };

  const handleJoinRoom = () => {
    if (!roomInput.trim()) return;
    const cleanRoom = roomInput.trim().toUpperCase();
    setRoom(cleanRoom);
    if (typeof window !== "undefined") sessionStorage.setItem("chatRoom", cleanRoom);
    setScreen("chat");
  };

  const handleLeaveRoom = () => {
    setRoom("");
    if (typeof window !== "undefined") sessionStorage.removeItem("chatRoom");
    setScreen("home");
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="mb-8 text-center animate-[fadeInUp_0.4s_ease-out] z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm">
            Chat-App built for Bidyut Innovations
          </h1>
        </div>
        <div className="flex flex-col items-center gap-4 z-10">
          <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
          <p className="text-slate-400 text-sm font-medium animate-pulse">Initializing Secure Context...</p>
        </div>
      </main>
    );
  }

  if (screen === "auth") {
    // Premium Auth UI
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="mb-10 text-center animate-[fadeInUp_0.4s_ease-out] z-10">
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 text-xs uppercase tracking-widest">
            Bidyut Innovations
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
            Secure Channels
          </h1>
        </div>
        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 w-full max-w-sm flex flex-col gap-6 transform transition-all hover:scale-[1.01] animate-[fadeInUp_0.5s_ease-out] z-10">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {isLogin ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="text-sm text-slate-400">
              {isLogin ? "Authenticate to access your secure network" : "Register for end-to-end encrypted messaging"}
            </p>
          </div>
          {firebaseError && (
            <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl animate-[bounce_0.3s_ease-in-out]">
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
              {isLogin ? "Authenticate" : "Register"}
            </Button>
          </form>
          <div className="text-center mt-2">
            <p className="text-sm text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                className="text-white hover:text-blue-400 font-semibold transition-colors"
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

  if (screen === "home") {
    // Premium Home Dashboard UI
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 relative overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="mb-10 text-center animate-[fadeInUp_0.4s_ease-out] z-10">
          <Badge className="mb-4 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 text-xs uppercase tracking-widest">
            Dashboard
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white drop-shadow-md mb-3">
            Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{username}</span>
          </h1>
          <p className="text-base text-slate-400">Join an existing network or deploy a new secure channel.</p>
        </div>

        <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] p-8 w-full max-w-sm flex flex-col gap-6 transform transition-all animate-[fadeInUp_0.5s_ease-out] z-10 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] hover:border-slate-600/50 duration-300">
          
          <div className="space-y-4">
            <Button
              onClick={handleCreateRoom}
              className="w-full relative group overflow-hidden bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold py-6 rounded-xl transition-all border-0 shadow-lg hover:shadow-blue-500/25"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-base">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Deploy New Channel
              </span>
              <div className="absolute inset-0 h-full w-full bg-white/20 scale-0 group-hover:scale-100 transition-transform origin-center rounded-xl duration-300 z-0"></div>
            </Button>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-slate-700" />
            <span className="text-xs text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
              Connect
            </span>
            <div className="flex-1 h-px bg-slate-700" />
          </div>

          <div className="flex flex-col gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-800">
            <Input
              placeholder="ENTER ROOM CODE"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              className="uppercase bg-slate-800/80 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-1 focus-visible:ring-blue-500/50 text-center font-mono text-lg tracking-widest h-12 rounded-xl"
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!roomInput.trim()}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50 h-12 rounded-xl"
            >
              Initialize Connection
            </Button>
          </div>
          
          <Button variant="ghost" onClick={handleLogout} className="text-slate-500 hover:text-red-400 text-xs mt-2 transition-colors uppercase tracking-widest font-semibold">
            Terminate Session
          </Button>
        </div>
      </main>
    );
  }

  // CHAT SCREEN
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 sm:p-8 font-sans relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="mb-4 text-center animate-[fadeInUp_0.4s_ease-out] z-10">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">
          Bidyut Innovations Secure Chat
        </h1>
      </div>
      
      <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] w-full max-w-4xl flex flex-col h-[calc(100vh-8rem)] sm:h-[80vh] overflow-hidden z-10">

        {/* Header */}
        <div className="flex flex-wrap gap-4 items-center justify-between px-6 py-5 border-b border-slate-700/60 bg-slate-800/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-lg shadow-blue-500/20">
                {username[0]?.toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-slate-800 rounded-full"></div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-white leading-tight">{username}</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-medium text-slate-200 bg-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 cursor-pointer border border-slate-600 hover:border-blue-400 transition-colors" onClick={handleCopyRoom} title="Click to copy">
                  #{room}
                  <span className="text-blue-400">{copied ? "✓" : "📋"}</span>
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  {connected ? <span className="text-green-400 font-medium">Encrypted Link</span> : <span className="text-yellow-400 animate-pulse font-medium">Establishing...</span>}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={`px-3 py-1 font-medium border-0 ${connected
                  ? "text-green-300 bg-green-500/10"
                  : "text-amber-300 bg-amber-500/10"
                }`}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${connected ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-amber-400 animate-bounce"}`}></div>
              {connected ? "LIVE" : "SYNCING"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLeaveRoom} className="text-slate-400 hover:text-white hover:bg-slate-700 transition-colors border-0">
              Disconnect
            </Button>
          </div>
        </div>

        {/* Room share hint */}
        {messages.length === 0 && (
          <div className="mx-6 mt-6 p-4 bg-slate-900/50 border border-slate-700 rounded-xl text-center shadow-inner">
            <p className="text-sm text-slate-400">
              Provide this exact room code{" "}
              <span
                onClick={handleCopyRoom}
                className="font-mono font-bold text-blue-400 cursor-pointer hover:underline mx-1 bg-slate-800 px-2 py-1 rounded border border-slate-700"
              >
                {room}
              </span>{" "}
              to your counterpart to establish communication.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {messages.length === 0 && (
             <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4">
               <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
                 <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
               </div>
               <div className="text-center">
                 <p className="text-sm font-semibold text-slate-300">End-to-End Encrypted</p>
                 <p className="text-xs text-slate-500 mt-1">Awaiting incoming transmissions...</p>
               </div>
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
        <div className="p-4 bg-slate-800/80 backdrop-blur-md border-t border-slate-700/60">
          <div className="flex items-end gap-3 bg-slate-900/80 p-2 rounded-2xl border border-slate-700 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all shadow-inner">
            <Input
              placeholder="Transmit message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-slate-100 placeholder:text-slate-500 px-4 py-3 h-auto shadow-none text-base"
              autoFocus
            />
            <Button
              onClick={handleSend}
              disabled={!messageInput.trim() || !connected}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl h-12 w-12 p-0 flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 border-0 shadow-lg"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </Button>
          </div>
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Secured via TLS Protocol</p>
          </div>
        </div>

      </div>
    </main>
  );
}