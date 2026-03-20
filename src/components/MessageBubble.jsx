"use client";

export default function MessageBubble({ message, isOwn }) {
  return (
    <div
      className={`flex flex-col max-w-[75%] gap-1.5 ${
        isOwn ? "items-end self-end" : "items-start self-start"
      }`}
    >
      <div className={`flex items-baseline gap-2 px-1 ${isOwn ? "flex-row-reverse" : "flex-row"}`}>
        <span className="text-[11px] font-semibold text-slate-400 tracking-wide">
          {isOwn ? "You" : message.author}
        </span>
        <span className="text-[10px] text-slate-600 font-medium">{message.time}</span>
      </div>
      <div
        className={`px-5 py-3 shadow-md text-[15px] leading-relaxed break-words ${
          isOwn
            ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm shadow-blue-900/20"
            : "bg-slate-800 text-slate-200 rounded-2xl rounded-tl-sm border border-slate-700/50 shadow-black/20"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}