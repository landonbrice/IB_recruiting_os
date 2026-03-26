/**
 * BulletWorkshop.tsx
 *
 * The workshop panel that opens when a bullet is clicked.
 * Five sections: Header, CurrentBullet+Diagnostics, InstantRewrites,
 * CoachThread, LinkedStory.
 *
 * Critical interactions:
 * - Radio-select a rewrite → drives live preview on compressed resume
 * - Apply commits the rewrite, updates score, propagates to useCoachSession
 * - Coach thread is scoped per-bullet with bidirectional stateUpdates
 */

"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ResumeBullet, BulletRewrite, BulletCoachMessage } from "@/lib/resumeTypes";
import { checkPlausibility } from "@/lib/plausibilityCheck";
import type { CandidateProfile } from "@/lib/types";
import ImpactBadge from "@/components/DecisionArc/ImpactBadge";
import SteppingStoneBar from "@/components/DecisionArc/SteppingStoneBar";

// ── Props ────────────────────────────────────────────────────────────────────

interface BulletWorkshopProps {
  bullet: ResumeBullet;
  bulletPosition: { current: number; total: number };
  candidateProfile: CandidateProfile;
  selectedRewriteId: string | null;
  isGeneratingRewrites: boolean;
  isWorkshopStreaming: boolean;
  onClose: () => void;
  onNavigate: (direction: "prev" | "next") => void;
  onSelectRewrite: (id: string | null) => void;
  onApplyRewrite: () => void;
  onRegenerateRewrites: () => void;
  onSendChat: (content: string) => void;
  onAddCoachRewrite: (text: string) => void;
  // Linked story data (optional)
  linkedStory?: {
    type: "I" | "M" | "P" | "A" | "C" | "T";
    nickname: string;
    steppingStone: { answerFirst: string; actions: string[]; tension: string; resolution: string };
  };
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BulletWorkshop({
  bullet,
  bulletPosition,
  candidateProfile,
  selectedRewriteId,
  isGeneratingRewrites,
  isWorkshopStreaming,
  onClose,
  onNavigate,
  onSelectRewrite,
  onApplyRewrite,
  onRegenerateRewrites,
  onSendChat,
  onAddCoachRewrite,
  linkedStory,
}: BulletWorkshopProps) {
  const [chatInput, setChatInput] = useState("");
  const threadEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll coach thread
  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [bullet.coachThread.length, isWorkshopStreaming]);

  // Keyboard: Escape closes workshop
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleChatSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || isWorkshopStreaming) return;
    setChatInput("");
    onSendChat(trimmed);
  };

  const handleChatKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleChatSubmit();
    }
  };

  const instantRewrites = bullet.rewrites.filter((r) => r.source === "instant");
  const coachRewrites = bullet.rewrites.filter((r) => r.source === "coach");
  const allRewrites = [...instantRewrites, ...coachRewrites];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-cream">
      {/* ── Section 1: Header ────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-cream-1 bg-white px-5 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[11px] text-[#78716c] hover:text-[#44403c] transition"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Resume
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate("prev")}
              disabled={bulletPosition.current === 1}
              className="rounded-[5px] border border-cream-1 px-1.5 py-0.5 text-[10px] text-[#78716c] hover:border-[#a8a29e] disabled:opacity-30 transition"
            >
              &#9664;
            </button>
            <button
              onClick={() => onNavigate("next")}
              disabled={bulletPosition.current === bulletPosition.total}
              className="rounded-[5px] border border-cream-1 px-1.5 py-0.5 text-[10px] text-[#78716c] hover:border-[#a8a29e] disabled:opacity-30 transition"
            >
              &#9654;
            </button>
          </div>
        </div>
        <div className="mt-2">
          <p className="text-[13px] font-semibold" style={{ color: "#2a2826" }}>
            {bullet.company}
          </p>
          <p className="text-[11px]" style={{ color: "#78716c" }}>
            {bullet.roleTitle} &middot; {bullet.section}
          </p>
          <p className="mt-0.5 text-[10px]" style={{ color: "#a8a29e" }}>
            Bullet {bulletPosition.current} of {bulletPosition.total}
          </p>
        </div>
      </div>

      {/* ── Scrollable content ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollable px-5 py-4 space-y-5">

        {/* ── Section 2: Current Bullet + Diagnostics ─────────── */}
        <div className="rounded-[10px] border border-cream-1 bg-white p-4">
          <p className="text-[12px] leading-relaxed" style={{ color: "#44403c" }}>
            &ldquo;{bullet.originalText}&rdquo;
          </p>
          {bullet.score && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {bullet.score.verb === "weak" && (
                <IssueFlag label={`Weak verb: "${bullet.originalText.split(/\s+/)[0]}"`} />
              )}
              {!bullet.score.quantification && (
                <IssueFlag label="No quantification" />
              )}
              {bullet.score.length === "too-long" && (
                <IssueFlag label="Too long — consider tightening" />
              )}
              {bullet.score.length === "too-short" && (
                <IssueFlag label="Very short — add specifics" />
              )}
              {bullet.score.specificity === "low" && (
                <IssueFlag label="Low specificity — add details" />
              )}
              {bullet.score.overall === "strong" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                  &#10003; Strong bullet
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Section 3: Instant Rewrites ─────────────────────── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#78716c" }}>
            {isGeneratingRewrites ? "Generating rewrites..." : "Instant Rewrites"}
          </p>

          {isGeneratingRewrites && allRewrites.length === 0 && (
            <div className="rounded-[10px] border border-cream-1 bg-white p-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
                <span className="text-[11px]" style={{ color: "#a8a29e" }}>Generating rewrites...</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {allRewrites.map((rewrite) => (
              <RewriteOption
                key={rewrite.id}
                rewrite={rewrite}
                isSelected={selectedRewriteId === rewrite.id}
                originalText={bullet.originalText}
                candidateProfile={candidateProfile}
                roleTitle={bullet.roleTitle}
                onSelect={() =>
                  onSelectRewrite(selectedRewriteId === rewrite.id ? null : rewrite.id)
                }
              />
            ))}
          </div>

          {allRewrites.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={onApplyRewrite}
                disabled={!selectedRewriteId}
                className="rounded-[6px] bg-terracotta px-3 py-1.5 text-[11px] font-medium text-white transition hover:opacity-90 disabled:opacity-30"
              >
                Apply Selected
              </button>
              <button
                onClick={onRegenerateRewrites}
                disabled={isGeneratingRewrites}
                className="rounded-[6px] border border-cream-1 px-3 py-1.5 text-[11px] font-medium transition hover:border-[#a8a29e] disabled:opacity-30"
                style={{ color: "#78716c" }}
              >
                Regenerate
              </button>
            </div>
          )}
        </div>

        {/* ── Section 4: Coach Thread ─────────────────────────── */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#78716c" }}>
            Develop with Coach
          </p>
          <div className="rounded-[10px] border border-cream-1 bg-white">
            {/* Messages */}
            <div className="max-h-[320px] overflow-y-auto scrollable px-4 py-3 space-y-3">
              {bullet.coachThread.length === 0 && !isWorkshopStreaming && (
                <p className="text-[11px] italic" style={{ color: "#a8a29e" }}>
                  Ask the coach to develop this bullet further. They&apos;ll ask targeted questions and suggest stronger rewrites based on the real story.
                </p>
              )}

              {bullet.coachThread.map((msg, i) => (
                <CoachThreadMessage
                  key={i}
                  msg={msg}
                  onAddRewrite={onAddCoachRewrite}
                />
              ))}

              {isWorkshopStreaming && (
                <div className="flex items-center gap-2 py-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" style={{ animationDelay: "0.2s" }} />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-terracotta" style={{ animationDelay: "0.4s" }} />
                </div>
              )}
              <div ref={threadEndRef} />
            </div>

            {/* Chat input */}
            <form onSubmit={handleChatSubmit} className="border-t border-cream-1 px-3 py-2">
              <div className="flex items-end gap-2">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={handleChatKeyDown}
                  placeholder="Tell the coach what happened..."
                  rows={1}
                  disabled={isWorkshopStreaming}
                  className="flex-1 resize-none rounded-lg border border-cream-1 bg-cream px-3 py-2 text-[12px] placeholder:text-[#a8a29e] focus:border-terracotta/40 focus:outline-none disabled:opacity-50"
                  style={{ color: "#44403c", maxHeight: 100 }}
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim() || isWorkshopStreaming}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta text-white transition hover:opacity-90 disabled:opacity-30"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── Section 5: Linked Story ─────────────────────────── */}
        {linkedStory && (
          <div className="rounded-[10px] border border-cream-1 bg-white p-4">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide" style={{ color: "#78716c" }}>
              Linked Story
            </p>
            <div className="flex items-center gap-2">
              <ImpactBadge type={linkedStory.type} size="sm" />
              <span className="text-[12px] font-medium" style={{ color: "#44403c" }}>
                {linkedStory.nickname}
              </span>
            </div>
            <div className="mt-2">
              <SteppingStoneBar steppingStone={linkedStory.steppingStone} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function IssueFlag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
      <span>&#9888;</span> {label}
    </span>
  );
}

function RewriteOption({
  rewrite,
  isSelected,
  originalText,
  candidateProfile,
  roleTitle,
  onSelect,
}: {
  rewrite: BulletRewrite;
  isSelected: boolean;
  originalText: string;
  candidateProfile: CandidateProfile;
  roleTitle: string;
  onSelect: () => void;
}) {
  const plausibility = checkPlausibility(originalText, rewrite.text, roleTitle, candidateProfile);

  return (
    <label
      className={`
        block cursor-pointer rounded-[10px] border bg-white p-3 transition-all duration-150
        ${isSelected ? "border-terracotta shadow-sm" : "border-cream-1 hover:border-[#a8a29e]"}
      `}
      onClick={onSelect}
    >
      <div className="flex items-start gap-2.5">
        {/* Radio circle */}
        <span
          className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border-2 transition ${
            isSelected ? "border-terracotta" : "border-cream-1"
          }`}
        >
          {isSelected && <span className="h-2 w-2 rounded-full bg-terracotta" />}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] leading-relaxed" style={{ color: "#44403c" }}>
            &ldquo;{rewrite.text}&rdquo;
          </p>

          {/* Badges row */}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {rewrite.source === "coach" && (
              <span className="rounded-full bg-terracotta/10 px-1.5 py-0.5 text-[9px] font-medium text-terracotta">
                Coach
              </span>
            )}
            {rewrite.confidence && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                  rewrite.confidence === "High"
                    ? "bg-green-50 text-green-700"
                    : rewrite.confidence === "Medium"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {rewrite.confidence}
              </span>
            )}
            {rewrite.risk && rewrite.risk !== "Low" && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                  rewrite.risk === "Medium" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                }`}
              >
                Risk: {rewrite.risk}
              </span>
            )}
            {plausibility.riskLevel === "safe" && (
              <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-[9px] font-medium text-green-700">
                &#10003; Plausible
              </span>
            )}
            {plausibility.riskLevel === "caution" && (
              <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[9px] font-medium text-amber-700">
                &#9888; Caution
              </span>
            )}
            {plausibility.riskLevel === "flag" && (
              <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[9px] font-medium text-red-700">
                &#9873; Flagged
              </span>
            )}
          </div>

          {plausibility.warnings.length > 0 && (
            <div className="mt-1 space-y-0.5">
              {plausibility.warnings.map((w, i) => (
                <p
                  key={i}
                  className="text-[9px]"
                  style={{ color: plausibility.riskLevel === "flag" ? "#ef4444" : "#d97706" }}
                >
                  {w}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </label>
  );
}

function CoachThreadMessage({
  msg,
  onAddRewrite,
}: {
  msg: BulletCoachMessage;
  onAddRewrite: (text: string) => void;
}) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-xl rounded-br-sm bg-smoke px-3 py-2 text-[12px] text-white">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-[12px] leading-relaxed" style={{ color: "#44403c" }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong className="font-semibold" style={{ color: "#2a2826" }}>{children}</strong>,
            ul: ({ children }) => <ul className="mb-1.5 list-disc pl-4 space-y-0.5">{children}</ul>,
            li: ({ children }) => <li className="text-[12px]">{children}</li>,
          }}
        >
          {msg.content}
        </ReactMarkdown>
      </div>

      {/* Coach rewrite suggestion block */}
      {msg.rewriteSuggestion && (
        <div className="rounded-lg border border-terracotta/20 bg-terracotta/[0.03] p-3">
          <p className="text-[11px] leading-relaxed" style={{ color: "#44403c" }}>
            &ldquo;{msg.rewriteSuggestion}&rdquo;
          </p>
          <button
            onClick={() => onAddRewrite(msg.rewriteSuggestion!)}
            className="mt-2 rounded-[5px] border border-terracotta/30 px-2 py-1 text-[10px] font-medium text-terracotta transition hover:bg-terracotta/10"
          >
            Add to rewrite options
          </button>
        </div>
      )}
    </div>
  );
}
