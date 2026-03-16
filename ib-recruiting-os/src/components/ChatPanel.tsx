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

const QUICK_PROMPTS = [
  "Score my resume",
  "Rewrite my weakest bullet",
  "Help me tighten my Why IB story",
  "Give me this week’s networking plan",
];

const ERROR_MSG = "Something went wrong. Please try again.";

export default function ChatPanel({ messages, isStreaming, onSend, mode, candidateProfile }: ChatPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const visibleMessages = deduplicateMessages(messages.filter((m) => m.content !== "__resume_uploaded__"));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [visibleMessages, isStreaming]);

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
        <div className="flex items-center justify-between gap-2">
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
        {visibleMessages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <div className="max-w-sm rounded-xl border border-stone-800 bg-stone-900/60 px-4 py-3 text-center">
              <p className="text-sm text-stone-400">Resume uploaded. Ready when you are.</p>
              <p className="mt-1 text-xs text-stone-600">Try one of the quick prompts below.</p>
            </div>
          </div>
        )}

        {visibleMessages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {msg.role === "user" ? (
              <div className="chat-message-user max-w-[85%]">{msg.content}</div>
            ) : msg._isError ? (
              <div className="max-w-[95%] rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
                Something went wrong — try sending again.
              </div>
            ) : (
              <div className="chat-message-assistant max-w-[95%]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-stone-200">{children}</strong>,
                    em: ({ children }) => <em className="italic text-stone-400">{children}</em>,
                    ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-4">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-4">{children}</ol>,
                    li: ({ children }) => <li className="text-stone-300">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="my-2 border-l-2 border-amber-600 pl-3 text-stone-400 italic">
                        {children}
                      </blockquote>
                    ),
                    table: ({ children }) => (
                      <div className="my-2 overflow-x-auto">
                        <table className="w-full border-collapse border border-stone-700 text-xs">{children}</table>
                      </div>
                    ),
                    thead: ({ children }) => <thead className="bg-stone-800">{children}</thead>,
                    th: ({ children }) => (
                      <th className="border border-stone-700 px-3 py-1.5 text-left font-semibold text-stone-300">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-stone-700 px-3 py-1.5 text-left text-stone-400">{children}</td>
                    ),
                    h1: ({ children }) => <h1 className="mb-2 mt-3 text-base font-bold text-stone-200">{children}</h1>,
                    h2: ({ children }) => <h2 className="mb-1.5 mt-3 text-sm font-bold text-stone-200">{children}</h2>,
                    h3: ({ children }) => <h3 className="mb-1 mt-2 text-sm font-semibold text-stone-300">{children}</h3>,
                    code: ({ children }) => (
                      <code className="rounded bg-stone-800 px-1 py-0.5 font-mono text-xs text-amber-400">
                        {children}
                      </code>
                    ),
                    hr: () => <hr className="my-3 border-stone-700" />,
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
            <div className="flex items-center gap-2 rounded-lg border border-stone-800 bg-stone-900/60 px-3 py-2">
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-stone-500" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-stone-500" />
              <span className="typing-dot h-1.5 w-1.5 rounded-full bg-stone-500" />
              <span className="ml-1 text-xs text-stone-600">thinking</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-stone-800 px-4 py-4">
        <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => !isStreaming && onSend(prompt)}
              disabled={isStreaming}
              className="shrink-0 rounded-full border border-stone-700 bg-stone-900 px-3 py-1 text-[11px] text-stone-400 transition hover:border-amber-700/60 hover:text-amber-300 disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>

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

function deduplicateMessages(messages: Message[]): (Message & { _isError?: boolean })[] {
  const out: (Message & { _isError?: boolean })[] = [];
  for (const msg of messages) {
    const isErr = msg.role === "assistant" && msg.content === ERROR_MSG;
    if (isErr) {
      const last = out[out.length - 1];
      if (last?._isError) continue;
      out.push({ ...msg, _isError: true });
      continue;
    }
    out.push({ ...msg });
  }
  return out;
}
