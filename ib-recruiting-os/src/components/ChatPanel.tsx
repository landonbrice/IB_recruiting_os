"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message, CandidateProfile } from "@/lib/types";

interface ChatPanelProps {
  messages: Message[];
  isStreaming: boolean;
  onSend: (content: string) => void;
  mode: string;
  candidateProfile: CandidateProfile;
}

const SCHOOL_TIER_LABELS: Record<string, string> = {
  target: "Target",
  "semi-target": "Semi-target",
  "non-target": "Non-target",
};

const BANK_TIER_LABELS: Record<string, string> = {
  "bulge-bracket": "Bulge bracket",
  "elite-boutique": "Elite boutique",
  "middle-market": "Middle market",
  regional: "Regional",
};

const NETWORKING_LABELS: Record<string, string> = {
  cold: "No network",
  "some-contact": "Some contacts",
  "internal-champion": "Has champion",
};

const MODE_LABELS: Record<string, string> = {
  diagnostic: "Diagnostic",
  editing: "Editing",
  story: "Story",
  targeting: "Targeting",
  feasibility: "Feasibility",
};

export default function ChatPanel({ messages, isStreaming, onSend, mode, candidateProfile }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    onSend(trimmed);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  return (
    <div className="flex h-full flex-col bg-stone-950">
      {/* Header */}
      <div className="border-b border-stone-800 px-5 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            <span className="text-xs font-medium text-stone-400">Coach</span>
          </div>
          <span className="rounded-full bg-stone-800 px-2.5 py-0.5 text-xs text-stone-400">
            {MODE_LABELS[mode] ?? "Diagnostic"}
          </span>
        </div>
        {buildProfileChips(candidateProfile).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {buildProfileChips(candidateProfile).map((chip) => (
              <span
                key={chip}
                className="rounded-full bg-stone-800/80 px-2 py-0.5 text-xs text-stone-500"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="scrollable flex-1 space-y-6 px-5 py-5">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-stone-600">Upload your resume to begin.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {msg.role === "user" ? (
              <div className="chat-message-user max-w-[85%]">{msg.content}</div>
            ) : (
              <div className="chat-message-assistant max-w-[95%]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-stone-200">{children}</strong>,
                    em: ({ children }) => <em className="italic text-stone-400">{children}</em>,
                    ul: ({ children }) => <ul className="mb-2 pl-4 space-y-1 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 pl-4 space-y-1 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="text-stone-300">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-amber-600 pl-3 text-stone-400 italic my-2">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2">
                        <table className="w-full text-xs border-collapse border border-stone-700">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-stone-800">{children}</thead>,
                    th: ({ children }) => (
                      <th className="px-3 py-1.5 text-left border border-stone-700 font-semibold text-stone-300">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-1.5 text-left border border-stone-700 text-stone-400">{children}</td>
                    ),
                    h1: ({ children }) => <h1 className="text-base font-bold text-stone-200 mb-2 mt-3">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-sm font-bold text-stone-200 mb-1.5 mt-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-sm font-semibold text-stone-300 mb-1 mt-2">{children}</h3>,
                    code: ({ children }) => (
                      <code className="rounded bg-stone-800 px-1 py-0.5 text-xs font-mono text-amber-400">
                        {children}
                      </code>
                    ),
                    hr: () => <hr className="border-stone-700 my-3" />,
                  }}
                >
                  {stripCodeBlocks(msg.content)}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1 px-1 py-2">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-stone-500" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-stone-500" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-stone-500" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-800 px-4 py-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Reply..."
            rows={1}
            className="flex-1 resize-none rounded-xl bg-stone-900 px-4 py-3 text-sm text-stone-100 placeholder:text-stone-600 focus:outline-none focus:ring-1 focus:ring-stone-700"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-600 text-white transition hover:bg-amber-500 disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-stone-700">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

function stripCodeBlocks(text: string): string {
  return text
    .replace(/```resume-update[\s\S]*?```/g, "")
    .replace(/```cover-letter[\s\S]*?```/g, "")
    .replace(/```feasibility-score[\s\S]*?```/g, "")
    .replace(/```profile-update[\s\S]*?```/g, "")
    .replace(/```resume-score[\s\S]*?```/g, "")
    .trim();
}

function buildProfileChips(profile: CandidateProfile): string[] {
  const chips: string[] = [];
  if (profile.schoolTier) chips.push(SCHOOL_TIER_LABELS[profile.schoolTier] ?? profile.schoolTier);
  if (profile.stage) chips.push(profile.stage.charAt(0).toUpperCase() + profile.stage.slice(1));
  if (profile.targetBank) {
    chips.push(profile.targetBank);
  } else if (profile.targetBankTier) {
    chips.push(BANK_TIER_LABELS[profile.targetBankTier] ?? profile.targetBankTier);
  }
  if (profile.networkingPosture) chips.push(NETWORKING_LABELS[profile.networkingPosture] ?? profile.networkingPosture);
  return chips;
}
