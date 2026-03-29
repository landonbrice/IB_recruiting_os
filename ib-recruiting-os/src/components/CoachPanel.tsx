/**
 * CoachPanel.tsx
 *
 * Persistent chat sidebar (220px) powered by useCoachSession.
 * Renders messages with compact markdown, streaming indicator,
 * context-aware quick prompts, and chat input.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CoachSession } from "@/hooks/useCoachSession";
import type { Message } from "@/lib/types";

// ── Quick prompts by mode ────────────────────────────────────────────────────

const MODE_PROMPTS: Record<string, string[]> = {
  diagnostic: ["Score my resume", "Why IB story"],
  editing: ["Rewrite weakest bullet", "Check verbs"],
  story: ["Develop a story", "Tell me about yourself"],
  targeting: ["Networking plan", "Cover letter"],
  feasibility: ["Feasibility check", "What should I prioritize?"],
};

const MODE_LABELS: Record<string, string> = {
  diagnostic: "Diagnostic",
  editing: "Editing",
  story: "Story",
  targeting: "Targeting",
  feasibility: "Feasibility",
};

// ── Strip protocol blocks from display ───────────────────────────────────────

function stripCodeBlocks(text: string): string {
  return text
    .replace(/```resume-update[\s\S]*?```/g, "")
    .replace(/```cover-letter[\s\S]*?```/g, "")
    .replace(/```feasibility-score[\s\S]*?```/g, "")
    .replace(/```profile-update[\s\S]*?```/g, "")
    .replace(/```resume-score[\s\S]*?```/g, "")
    .replace(/```coach-response[\s\S]*?```/g, "")
    .replace(/```story-output[\s\S]*?```/g, "")
    .replace(/```networking-actions[\s\S]*?```/g, "")
    .trim();
}

// ── Component ────────────────────────────────────────────────────────────────

interface CoachPanelProps {
  session: CoachSession;
}

export default function CoachPanel({ session }: CoachPanelProps) {
  const { messages, isStreaming, mode, handleSend } = session;
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const prompts = MODE_PROMPTS[mode] ?? MODE_PROMPTS.diagnostic;

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: isStreaming ? "auto" : "smooth" });
  }, [messages, isStreaming]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isStreaming) return;
    setInput("");
    handleSend(trimmed);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex w-[220px] flex-shrink-0 flex-col border-l border-white/[0.06] bg-smoke-1">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-3">
        <div>
          <div className="text-[11px] font-semibold text-cream">Coach</div>
          <div className="text-[9px] text-cream/30">Contextual guidance</div>
        </div>
        <span className="rounded-full bg-smoke-2 px-2 py-0.5 text-[9px] text-cream/50">
          {MODE_LABELS[mode] ?? "Diagnostic"}
        </span>
      </div>

      {/* Messages */}
      <div className="sidebar-scrollable flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-center text-[10px] leading-relaxed text-cream/30 px-2">
              {session.resumeText
                ? "Resume loaded. Try a quick prompt below or ask anything."
                : "Upload a resume to get started."}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <ChatMessage key={i} msg={msg} />
        ))}

        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-1.5 py-1">
            <span className="typing-dot h-1 w-1 rounded-full bg-cream/40" />
            <span className="typing-dot h-1 w-1 rounded-full bg-cream/40" style={{ animationDelay: "0.2s" }} />
            <span className="typing-dot h-1 w-1 rounded-full bg-cream/40" style={{ animationDelay: "0.4s" }} />
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex flex-wrap gap-1 border-t border-white/[0.06] px-3 py-2">
        {prompts.map((p) => (
          <button
            key={p}
            onClick={() => !isStreaming && handleSend(p)}
            disabled={isStreaming}
            className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[9px] text-cream/40 transition hover:border-white/[0.15] hover:text-cream/60 disabled:opacity-30"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] px-3 py-2">
        <form onSubmit={handleSubmit} className="flex items-end gap-1.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
            }}
            onKeyDown={handleKeyDown}
            placeholder="Ask the coach..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-lg border border-white/[0.08] bg-smoke px-2.5 py-1.5 text-[11px] text-cream placeholder:text-cream/25 focus:border-white/[0.15] focus:outline-none disabled:opacity-40"
            style={{ maxHeight: 80 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-terracotta text-white transition hover:opacity-90 disabled:opacity-30"
          >
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Chat Message ─────────────────────────────────────────────────────────────

function ChatMessage({ msg }: { msg: Message }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[90%] rounded-lg rounded-br-sm bg-smoke px-2.5 py-1.5 text-[10px] leading-relaxed text-cream/80">
          {msg.content}
        </div>
      </div>
    );
  }

  const stripped = stripCodeBlocks(msg.content);
  if (!stripped) return null;

  return (
    <div className="text-[10px] leading-relaxed text-cream/70">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-cream/90">{children}</strong>,
          em: ({ children }) => <em className="italic text-cream/50">{children}</em>,
          ul: ({ children }) => <ul className="mb-1.5 list-disc pl-3 space-y-0.5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-1.5 list-decimal pl-3 space-y-0.5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          h1: ({ children }) => <p className="mb-1 font-bold text-cream/90">{children}</p>,
          h2: ({ children }) => <p className="mb-1 font-bold text-cream/90">{children}</p>,
          h3: ({ children }) => <p className="mb-0.5 font-semibold text-cream/80">{children}</p>,
          blockquote: ({ children }) => (
            <blockquote className="my-1 border-l border-terracotta/40 pl-2 text-cream/50 italic">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-smoke px-1 py-0.5 text-[9px] text-terracotta/80">
              {children}
            </code>
          ),
          table: ({ children }) => (
            <div className="my-1 overflow-x-auto">
              <table className="w-full border-collapse text-[9px]">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-white/[0.08] px-1.5 py-1 text-left font-semibold text-cream/60">{children}</th>,
          td: ({ children }) => <td className="border-b border-white/[0.04] px-1.5 py-1 text-cream/50">{children}</td>,
          hr: () => <hr className="my-2 border-white/[0.06]" />,
        }}
      >
        {stripped}
      </ReactMarkdown>
    </div>
  );
}
