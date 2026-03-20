"use client";

export default function MessageBubble({ message, isOwn }) {
  return (
    <div
      className={`flex flex-col max-w-[70%] gap-1 ${
        isOwn ? "items-end self-end" : "items-start self-start"
      }`}
    >
      {!isOwn && (
        <span className="text-xs text-slate-400 px-1">{message.author}</span>
      )}
      <div
        className={`px-4 py-2 rounded-2xl text-sm break-words ${
          isOwn
            ? "bg-slate-800 text-white rounded-br-sm"
            : "bg-slate-100 text-slate-800 rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
      <span className="text-[10px] text-slate-400 px-1">{message.time}</span>
    </div>
  );
}