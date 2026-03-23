"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSocket } from "@/hooks/useSocket";
import MessageBubble from "@/components/chat/MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { auth } from "@/lib/firebase";

export default function ChannelPage() {
  const { channelId, workspaceId } = useParams();
  const [username, setUsername] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [channelName, setChannelName] = useState(channelId as string);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, connected, sendMessage, sendTyping, typingUsers } = useSocket(channelId as string);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const res = await fetch(`/api/users/profile?firebaseUid=${user.uid}`);
          if (res.ok) {
            const data = await res.json();
            setUsername(data.user?.displayName || user.email?.split("@")[0] || "User");
          }
        } catch (e) {
          setUsername("User");
        }
      }
    });

    const fetchChannelName = async () => {
      try {
        const res = await fetch(`/api/workspaces/${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          const channel = data.workspace?.channels?.find((c: any) => c._id === channelId);
          if (channel) {
            setChannelName(channel.name);
          }
        }
      } catch (e) {}
    };
    fetchChannelName();

    return () => unsub();
  }, [workspaceId, channelId]);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages.length]);


  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageInput(e.target.value);
    sendTyping(username, e.target.value.length > 0);
  };

  const handleSend = async () => {
    if (!messageInput.trim() || !username) return;
    const text = messageInput.trim();
    setMessageInput("");
    sendTyping(username, false);

    if (text.startsWith("/ask ") || text.startsWith("/summarize") || text.startsWith("/todo")) {
      const parts = text.split(" ");
      const command = parts[0].substring(1);
      const arg = parts.slice(1).join(" ");
      
      setIsThinking(true);
      try {
        await fetch("/api/ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command,
            messages: arg,
            channelId,
            workspaceId
          })
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsThinking(false);
      }
    } else {
      sendMessage(username, text);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <div className="flex flex-col h-full overflow-hidden z-10 w-full animate-[fadeInUp_0.4s_ease-out]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700/60 bg-slate-800/80 backdrop-blur-md z-20 shadow-[0_4px_30px_rgba(0,0,0,0.1)]">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="px-3 py-1 bg-slate-700 text-slate-300 font-mono border-slate-600 truncate max-w-xs block">
            #{channelName}
          </Badge>
          <span className="text-xs text-slate-400 flex items-center gap-1">
            {connected ? (
              <span className="text-green-400 font-medium">Encrypted Link</span>
            ) : (
              <span className="text-yellow-400 animate-pulse font-medium">Establishing...</span>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Badge
            variant="outline"
            className={`px-3 py-1 font-medium border-0 ${
              connected ? "text-green-300 bg-green-500/10" : "text-amber-300 bg-amber-500/10"
            }`}
          >
            <div className={`w-2 h-2 rounded-full mr-2 ${connected ? "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]" : "bg-amber-400 animate-bounce"}`}></div>
            {connected ? "LIVE" : "SYNCING"}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5 scroll-smooth [&::-webkit-scrollbar]:hidden z-10 overscroll-contain">
        {messages.length === 0 && connected && (
          <div className="flex-1 flex flex-col items-center justify-center opacity-40 space-y-4 pt-10">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-inner">
              <svg className="w-10 h-10 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-300">End-to-End Encrypted</p>
              <p className="text-xs text-slate-500 mt-1">Awaiting incoming transmissions...</p>
            </div>
          </div>
        )}
        {messages.map((msg: any, i: number) => (
          <MessageBubble
            key={i}
            message={msg}
            isOwn={msg.author === username}
          />
        ))}
        {isThinking && (
          <div className="flex animate-pulse items-center gap-2 p-2 bg-slate-800/40 rounded-xl rounded-bl-sm self-start max-w-[50%]">
             <div className="w-1.5 h-1.5 bg-fuchsia-400 rounded-full"></div>
             <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
             <div className="w-1.5 h-1.5 bg-fuchsia-600 rounded-full"></div>
             <span className="text-[10px] text-fuchsia-300 font-medium tracking-widest uppercase ml-1">Nexus AI is thinking...</span>
          </div>
        )}
        
        {typingUsers.filter(u => u !== username).length > 0 && (
          <div className="flex items-center gap-2 p-2 bg-slate-800/20 rounded-xl rounded-bl-sm self-start max-w-[50%] animate-in fade-in zoom-in duration-300">
             <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
             <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
             <div className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
             <span className="text-[10px] text-slate-400 font-medium tracking-widest ml-1 truncate">
               {typingUsers.filter(u => u !== username).join(', ')} is typing...
             </span>
          </div>
        )}
        
        <div ref={bottomRef} className="h-4" />
      </div>

      {/* Input */}
      <div className="p-6 bg-slate-800/80 backdrop-blur-xl border-t border-slate-700/60 z-20">
        <div className="max-w-6xl mx-auto flex items-end gap-3 bg-slate-900/80 p-2 rounded-2xl border border-slate-700 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/30 transition-all shadow-inner">
          <Input
            placeholder="Transmit message..."
            value={messageInput}
            onChange={handleMessageChange}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-0 focus-visible:ring-0 text-slate-100 placeholder:text-slate-500 px-4 py-3 h-auto shadow-none text-base"
            autoFocus
          />
          <Button
            onClick={handleSend}
            disabled={!messageInput.trim() || !connected || !username}
            className="bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white rounded-xl h-12 w-12 p-0 flex items-center justify-center shrink-0 transition-transform active:scale-95 disabled:opacity-50 border-0 shadow-lg"
          >
            <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </Button>
        </div>
        <div className="text-center mt-2 max-w-6xl mx-auto">
          <p className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Secured via TLS Protocol</p>
        </div>
      </div>
    </div>
  );
}
