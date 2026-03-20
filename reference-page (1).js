"use client";

import { useState, useRef, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import MessageBubble from "@/components/MessageBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export default function ChatPage() {
  const [screen, setScreen] = useState("home"); // home | chat
  const [username, setUsername] = useState("");
  const [inputName, setInputName] = useState("");
  const [room, setRoom] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [copied, setCopied] = useState(false);
  const bottomRef = useRef(null);

  const { messages, connected, sendMessage } = useSocket(room);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCreateRoom = () => {
    if (!inputName.trim()) return;
    const newRoom = generateRoomId();
    setUsername(inputName.trim());
    setRoom(newRoom);
    setScreen("chat");
  };

  const handleJoinRoom = () => {
    if (!inputName.trim() || !roomInput.trim()) return;
    setUsername(inputName.trim());
    setRoom(roomInput.trim().toUpperCase());
    setScreen("chat");
  };

  const handleSend = () => {
    if (!messageInput.trim()) return;
    sendMessage(username, messageInput.trim());
    setMessageInput("");
  };

  const handleCopyRoom = () => {
    navigator.clipboard.writeText(room);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // HOME SCREEN
  if (screen === "home") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-sm flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-slate-800">💬 Chat App</h1>
            <p className="text-sm text-slate-400 mt-1">Real-time 2-user chat</p>
          </div>

          <Input
            placeholder="Your username"
            value={inputName}
            onChange={(e) => setInputName(e.target.value)}
            autoFocus
          />

          {/* Create Room */}
          <Button
            onClick={handleCreateRoom}
            disabled={!inputName.trim()}
            className="w-full"
          >
            Create New Room
          </Button>

          <div className="flex items-center gap-2">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-xs text-slate-400">or join existing</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Join Room */}
          <div className="flex gap-2">
            <Input
              placeholder="Room code"
              value={roomInput}
              onChange={(e) => setRoomInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
              className="uppercase"
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!inputName.trim() || !roomInput.trim()}
              variant="outline"
            >
              Join
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // CHAT SCREEN
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-lg flex flex-col h-[600px]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-medium">
              {username[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">{username}</p>
              <button
                onClick={handleCopyRoom}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1"
              >
                Room: <span className="font-mono font-medium">{room}</span>
                <span className="ml-1">{copied ? "✓ copied" : "📋"}</span>
              </button>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`text-xs ${
              connected
                ? "border-green-400 text-green-600"
                : "border-red-300 text-red-400"
            }`}
          >
            {connected ? "● Live" : "○ Offline"}
          </Badge>
        </div>

        {/* Room share hint */}
        {messages.length === 0 && (
          <div className="mx-5 mt-4 p-3 bg-slate-50 rounded-xl text-center">
            <p className="text-xs text-slate-500">
              Share room code{" "}
              <span
                onClick={handleCopyRoom}
                className="font-mono font-semibold text-slate-700 cursor-pointer hover:underline"
              >
                {room}
              </span>{" "}
              with the other user to start chatting
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-center text-xs text-slate-300 mt-4">
              No messages yet. Say hello!
            </p>
          )}
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              message={msg}
              isOwn={msg.author === username}
            />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-slate-100">
          <Input
            placeholder="Type a message..."
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            autoFocus
          />
          <Button onClick={handleSend} disabled={!messageInput.trim()}>
            Send
          </Button>
        </div>

      </div>
    </main>
  );
}
