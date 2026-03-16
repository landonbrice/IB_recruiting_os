/**
 * Theme B — "The Platform"
 *
 * Light slate background. Three-column layout: resume | chat | score panel.
 * Score and metrics are always visible — no sidebar toggle needed.
 * Resume is always present on the left. Chat is the center channel.
 * Feels like a professional SaaS tool (Notion/Linear energy, not a chatbot).
 */

"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BulletModal from "@/components/BulletModal";
import IntakeForm from "@/components/IntakeForm";
import ExportModal from "@/components/ExportModal";
import { useCoachSession } from "@/hooks/useCoachSession";
import type { ResumeScore, Message, CandidateProfile } from "@/lib/types";
import { enrichResumeLines, type EnrichedLine } from "@/lib/resumeStructure";
import { CORE_COACH_ACTIONS, CHAT_QUICK_PROMPTS } from "@/lib/coachActions";

// ── Score Panel ───────────────────────────────────────────────────────────────

const RADIUS = 44;
const CIRC = 2 * Math.PI * RADIUS;

function scoreColor(n: number) {
  if (n >= 80) return "#10b981";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

function ScoreIcon({ path }: { path: string }) {
  return (
    <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
    </svg>
  );
}

function ScorePanelB({ score, scoreHistory, onAction, isStreaming, onExport, currentResumeText, onNewSession }: {
  score: ResumeScore | null;
  scoreHistory: { total: number; createdAt: number }[];
  onAction: (a: string) => void;
  isStreaming: boolean;
  onExport: () => void;
  currentResumeText: string | null;
  onNewSession: () => void;
}) {
  const actions = CORE_COACH_ACTIONS.map((a) => ({
    label: a.label,
    action: a.prompt,
    icon: a.iconPath ?? "",
  }));

  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Resume Score</p>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center px-4 py-5 border-b border-slate-100">
        {score ? (
          <>
            <div className="relative">
              <svg width="104" height="104" viewBox="0 0 110 110" className="-rotate-90">
                <circle cx="55" cy="55" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="9" />
                <circle
                  cx="55" cy="55" r={RADIUS}
                  fill="none"
                  stroke={scoreColor(score.total)}
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={CIRC}
                  strokeDashoffset={CIRC * (1 - score.total / 100)}
                  style={{ transition: "stroke-dashoffset 0.7s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{score.total}</span>
                <span className="text-[10px] text-slate-400">/ 100</span>
              </div>
            </div>

            {/* Category bars */}
            <div className="mt-4 w-full space-y-2">
              {score.categories.map(cat => (
                <div key={cat.name}>
                  <div className="mb-0.5 flex justify-between text-[11px]">
                    <span className="text-slate-500">{cat.name}</span>
                    <span className="font-semibold text-slate-700">{cat.score}</span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1 rounded-full transition-all duration-500"
                      style={{ width: `${cat.score}%`, backgroundColor: scoreColor(cat.score) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-4 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-slate-200">
              <span className="text-lg text-slate-300">?</span>
            </div>
            <p className="text-[11px] text-slate-400">Score appears after intake</p>
          </div>
        )}
      </div>

      {/* Score trend */}
      {scoreHistory.length > 1 && (
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Trend</p>
          <div className="flex items-end gap-0.5 h-8">
            {scoreHistory.slice(-10).map((p, i, arr) => {
              const h = Math.max(4, Math.round((p.total / 100) * 28));
              const up = i > 0 && p.total >= arr[i - 1].total;
              return (
                <div key={`${p.createdAt}-${i}`} className="flex-1">
                  <div
                    title={`${p.total}`}
                    className={`w-full rounded-sm ${up ? "bg-emerald-400" : "bg-slate-200"}`}
                    style={{ height: `${h}px` }}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-1.5 text-[10px] text-slate-400">
            {scoreHistory[0]?.total} → {scoreHistory[scoreHistory.length - 1]?.total}
          </p>
        </div>
      )}

      {/* Fix these */}
      {score && score.hurting.length > 0 && (
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Fix These</p>
          <ul className="space-y-1.5">
            {score.hurting.slice(0, 3).map(item => (
              <li key={item}>
                <button
                  onClick={() => onAction(`Let's work on improving: ${item}`)}
                  disabled={isStreaming}
                  className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-[11px] text-slate-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What's working */}
      {score && score.working.length > 0 && (
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Strengths</p>
          <ul className="space-y-1.5">
            {score.working.slice(0, 3).map(item => (
              <li key={item} className="flex items-start gap-2 px-2 text-[11px] text-slate-500">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next step */}
      {score?.nextStep && (
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-amber-600">Next Step</p>
          <p className="text-[11px] leading-relaxed text-slate-600">{score.nextStep}</p>
        </div>
      )}

      <div className="flex-1" />

      {/* Quick actions */}
      <div className="border-t border-slate-100 px-3 py-3 space-y-0.5">
        {actions.map(({ label, action, icon }) => (
          <button
            key={label}
            onClick={() => onAction(action)}
            disabled={isStreaming}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40"
          >
            <ScoreIcon path={icon} />
            {label}
          </button>
        ))}
        <button
          onClick={onExport}
          disabled={!currentResumeText}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-800 disabled:opacity-40"
        >
          <ScoreIcon path="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          Export Pack
        </button>
        <button
          onClick={onNewSession}
          className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[12px] font-medium text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
        >
          <ScoreIcon path="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          New Session
        </button>
      </div>
    </div>
  );
}

// ── Resume Panel ──────────────────────────────────────────────────────────────


function ResumePanelB({
  resumeText, updateCount, candidateProfile, rewriteHistory, onApplyBullet, onAction,
}: {
  resumeText: string | null;
  updateCount: number;
  candidateProfile: CandidateProfile;
  rewriteHistory: { id: string; company: string; beforeText: string; afterText: string; confidence?: "High" | "Medium" | "Low"; risk?: "Low" | "Medium" | "High" }[];
  onApplyBullet: (idx: number, company: string, text: string, meta?: { confidence?: "High" | "Medium" | "Low"; risk?: "Low" | "Medium" | "High" }) => void;
  onAction: (action: string) => void;
}) {
  const [selected, setSelected] = useState<EnrichedLine | null>(null);
  const [activeRewriteId, setActiveRewriteId] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string>("");

  if (!resumeText) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Your resume will appear here</p>
      </div>
    );
  }

  const lines = enrichResumeLines(resumeText);
  const experienceCompanies = Array.from(new Set(
    lines.filter(l => l.type === "bullet" && l.company).map(l => l.company)
  )).slice(0, 12);
  const activeExperience = selectedExperience || experienceCompanies[0] || "";
  const activeRewrite = rewriteHistory.find(r => r.id === activeRewriteId) ?? rewriteHistory[0] ?? null;

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between bg-white">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Resume</p>
        {updateCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700">
            {updateCount} edit{updateCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-slate-50 px-5 py-5">
        <div className="mx-auto max-w-[580px] space-y-3">

          {/* Rewrite history bubbles */}
          {rewriteHistory.length > 0 && (
            <>
              <div className="flex flex-wrap gap-1.5">
                {rewriteHistory.slice(0, 4).map(r => (
                  <button
                    key={r.id}
                    onClick={() => setActiveRewriteId(r.id)}
                    className={`rounded-full border px-2.5 py-1 text-[11px] transition ${
                      activeRewriteId === r.id
                        ? "border-amber-300 bg-amber-50 text-amber-800"
                        : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-slate-700"
                    }`}
                  >
                    <span className="font-medium">{r.company}</span>
                    {r.confidence && <span className="ml-1 text-emerald-600">· {r.confidence}</span>}
                  </button>
                ))}
              </div>

              {activeRewrite && (
                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Last rewrite</p>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="rounded-lg bg-red-50 p-2 text-red-700">
                      <span className="mr-1.5 font-semibold">Before</span>
                      {activeRewrite.beforeText || "(No previous text captured)"}
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-2 text-emerald-800">
                      <span className="mr-1.5 font-semibold">After</span>
                      {activeRewrite.afterText}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Experience actions */}
          {experienceCompanies.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Experience actions</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <select
                  value={activeExperience}
                  onChange={e => setSelectedExperience(e.target.value)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700 focus:border-amber-400 focus:outline-none"
                >
                  {experienceCompanies.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <button
                  onClick={() => onAction(`Rewrite all bullets in my ${activeExperience} experience for IB impact and quantification. Keep claims factual.`)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                >
                  Rewrite all
                </button>
                <button
                  onClick={() => onAction(`Strengthen weak verbs and ownership language in my ${activeExperience} experience bullets.`)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                >
                  Verbs
                </button>
                <button
                  onClick={() => onAction(`Add quantification suggestions for my ${activeExperience} experience bullets without fabricating data.`)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                >
                  Quantify
                </button>
              </div>
            </div>
          )}

          {/* Resume document */}
          <div className="rounded-xl border border-slate-200 bg-white px-7 py-7 shadow-sm">
            {lines.map((el, idx) => {
              const t = el.text.trim();
              if (el.type === "blank") return <div key={el.rawIndex} className="h-2" />;
              if (el.type === "section-header") return (
                <h2 key={el.rawIndex} className="mt-4 mb-1 border-b border-slate-300 pb-0.5 text-[10pt] font-bold uppercase tracking-wide text-slate-800">
                  {t}
                </h2>
              );
              if (el.type === "bullet") {
                const clickable = !!el.company;
                return (
                  <p
                    key={el.rawIndex}
                    onClick={clickable ? () => setSelected(el) : undefined}
                    title={clickable ? "Click to rewrite this bullet" : undefined}
                    className={`mb-0.5 pl-4 text-[10pt] leading-snug text-slate-700 ${
                      clickable ? "cursor-pointer rounded transition-colors hover:bg-amber-50 hover:text-slate-900" : ""
                    }`}
                  >
                    {t}
                  </p>
                );
              }
              return (
                <p key={el.rawIndex} className={`mb-0.5 text-[10pt] leading-snug text-slate-700 ${idx === 0 ? "text-center text-[14pt] font-bold text-slate-900" : ""}`}>
                  {t}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {selected && (
        <BulletModal
          bullet={{ text: selected.text.trim(), section: selected.section, company: selected.company, roleTitle: selected.roleTitle, bulletIndex: selected.bulletIndex }}
          candidateProfile={candidateProfile}
          resumeText={resumeText}
          onApply={(idx, company, text, meta) => { onApplyBullet(idx, company, text, meta); setSelected(null); }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

const ERROR_MSG = "Something went wrong. Please try again.";

function stripProtocol(text: string) {
  return text.replace(/```[\w-]+\n[\s\S]*?```/g, "").trim();
}

function isErrorMsg(content: string) {
  return content === ERROR_MSG;
}

// Collapse consecutive error messages into the last one
function deduplicateMessages(messages: Message[]): (Message & { _isError?: boolean })[] {
  const out: (Message & { _isError?: boolean })[] = [];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const err = msg.role === "assistant" && isErrorMsg(msg.content);
    if (err) {
      // If last item is already an error, skip this one
      const last = out[out.length - 1];
      if (last && last._isError) continue;
      out.push({ ...msg, _isError: true });
    } else {
      out.push({ ...msg });
    }
  }
  return out;
}

function ChatPanelB({ messages, isStreaming, onSend, mode, candidateProfile, resumeScore }: {
  messages: Message[];
  isStreaming: boolean;
  onSend: (s: string) => void;
  mode: string;
  candidateProfile: CandidateProfile;
  resumeScore: ResumeScore | null;
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const MODE_LABELS: Record<string, string> = {
    diagnostic: "Diagnostic",
    editing: "Editing",
    story: "Story",
    targeting: "Targeting",
    feasibility: "Feasibility",
  };

  const quickPrompts = CHAT_QUICK_PROMPTS;

  // Derive session progress from messages + score
  const hasScore = resumeScore !== null;
  const hasEdits = messages.some(m => m.role === "user" && m.content.toLowerCase().includes("rewrite"));
  const hasStory = messages.some(m => m.role === "assistant" && (m.content.toLowerCase().includes("why ib") || m.content.includes("story-output")));

  const visibleMessages = messages.filter(m => m.content !== "__resume_uploaded__");
  const dedupedMessages = deduplicateMessages(visibleMessages);

  function handleSend() {
    if (!input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-sm font-semibold text-slate-800">IB Resume Coach</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Session progress pills */}
          <div className="hidden sm:flex items-center gap-1">
            {[
              { label: "Scored", done: hasScore },
              { label: "Edited", done: hasEdits },
              { label: "Story", done: hasStory },
            ].map(({ label, done }) => (
              <span
                key={label}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  done
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {done ? "✓ " : ""}{label}
              </span>
            ))}
          </div>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
            {MODE_LABELS[mode] ?? "Diagnostic"}
          </span>
        </div>
      </div>

      {/* Profile context chips */}
      {Object.keys(candidateProfile).length > 0 && (
        <div className="border-b border-slate-100 px-5 py-2 flex flex-wrap gap-1.5">
          {candidateProfile.schoolTier && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500 capitalize">
              {candidateProfile.schoolTier}
            </span>
          )}
          {candidateProfile.stage && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-500 capitalize">
              {candidateProfile.stage}
            </span>
          )}
          {candidateProfile.targetBank && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] text-amber-700">
              {candidateProfile.targetBank}
            </span>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
        {dedupedMessages.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">Coach is ready.</p>
            <p className="mt-1 text-sm text-slate-500">
              Upload your resume and complete intake to get your IB score, targeted bullet rewrites, and a networking action plan.
            </p>
          </div>
        )}

        {dedupedMessages.map((msg, i) => {
          if (msg.role === "user") {
            return (
              <div key={i} className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-slate-800 px-4 py-3 text-sm text-white shadow-sm">
                  {msg.content}
                </div>
              </div>
            );
          }

          // Error state — show as inline alert, not a bubble
          if (msg._isError) {
            return (
              <div key={i} className="flex justify-start">
                <div className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Something went wrong — please try again.</span>
                </div>
              </div>
            );
          }

          // Normal coach message
          return (
            <div key={i} className="flex justify-start">
              <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3.5 text-sm leading-relaxed text-slate-700 shadow-sm">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                    ul: ({ children }) => <ul className="mb-2 pl-4 space-y-0.5 list-disc">{children}</ul>,
                    ol: ({ children }) => <ol className="mb-2 pl-4 space-y-0.5 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-600">{children}</li>,
                    h3: ({ children }) => <h3 className="mt-3 mb-1 font-semibold text-slate-800">{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-2 border-amber-400 pl-3 italic text-slate-500 my-2">{children}</blockquote>
                    ),
                    code: ({ children }) => (
                      <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono text-amber-700">{children}</code>
                    ),
                  }}
                >
                  {stripProtocol(msg.content)}
                </ReactMarkdown>
              </div>
            </div>
          );
        })}

        {isStreaming && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-slate-100 bg-white px-4 py-3 shadow-sm">
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-slate-200 bg-white px-4 py-3 space-y-2.5">
        {/* Quick chips */}
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
          {quickPrompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => !isStreaming && onSend(prompt)}
              disabled={isStreaming}
              className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-2.5">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Message your coach..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-400 disabled:opacity-60"
          />
          <button
            disabled={!input.trim() || isStreaming}
            onClick={handleSend}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white transition hover:bg-slate-700 disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
        <p className="text-center text-[10px] text-slate-400">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

// ── Theme B Shell ─────────────────────────────────────────────────────────────

export default function ThemeB() {
  const session = useCoachSession();
  const [showExport, setShowExport] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // ── Upload screen ──────────────────────────────────────────────────────────
  if (!session.resumeText) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="w-full max-w-xl px-6">
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <h1 className="text-2xl font-bold text-slate-800">IB Resume Coach</h1>
            </div>
            <p className="text-sm text-slate-500">
              Professional coaching for IB recruiting — real edits, not generic AI noise.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.3fr_0.7fr]">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-12 shadow-sm transition hover:border-amber-400 hover:shadow-md">
              {isUploading ? (
                <>
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Parsing your resume...</p>
                    <p className="mt-1 text-xs text-slate-400">Usually takes a few seconds</p>
                  </div>
                </>
              ) : (
                <>
                  <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Drop your resume here</p>
                    <p className="mt-1 text-xs text-slate-400">PDF or Word · click to browse</p>
                  </div>
                </>
              )}
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                className="hidden"
                disabled={isUploading}
                onChange={async e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploadError(null);
                  setIsUploading(true);
                  try {
                    const fd = new FormData();
                    fd.append("file", file);
                    const r = await fetch("/api/parse-resume", { method: "POST", body: fd });
                    if (!r.ok) throw new Error("Could not parse resume");
                    const d = await r.json() as { text: string; html?: string };
                    session.handleUpload(d.text, file.name, file, d.html);
                  } catch {
                    setUploadError("Upload failed. Try PDF first, then DOCX.");
                    setIsUploading(false);
                  }
                }}
              />
            </label>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">What happens next</p>
              <ol className="mt-3 space-y-3 text-sm text-slate-600">
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">1</span>
                  <span>Score across 5 IB-specific metrics</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">2</span>
                  <span>Click any bullet to get better variants</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-[11px] font-bold text-amber-700">3</span>
                  <span>Export resume + story + networking plan</span>
                </li>
              </ol>
              <p className="mt-4 text-[11px] text-slate-400">Session stays local to your browser.</p>
            </div>
          </div>

          {uploadError && (
            <p className="mt-3 text-center text-sm text-red-500">{uploadError}</p>
          )}
        </div>
      </div>
    );
  }

  // ── Intake form ────────────────────────────────────────────────────────────
  if (session.showIntakeForm) {
    return (
      <div className="flex h-full w-full bg-slate-50">
        <div className="flex-1">
          <IntakeForm onSubmit={session.handleIntakeSubmit} />
        </div>
      </div>
    );
  }

  // ── Main 3-column layout ───────────────────────────────────────────────────
  return (
    <main className="flex h-full w-full overflow-hidden bg-slate-100">

      {/* Left: Resume (always visible on md+) */}
      <div className="hidden w-[36%] shrink-0 flex-col overflow-hidden border-r border-slate-200 md:flex">
        <ResumePanelB
          resumeText={session.currentResumeText}
          updateCount={session.updateCount}
          candidateProfile={session.candidateProfile}
          rewriteHistory={session.rewriteHistory}
          onApplyBullet={session.handleApplyBullet}
          onAction={session.handleAction}
        />
      </div>

      {/* Center: Chat */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <ChatPanelB
          messages={session.messages}
          isStreaming={session.isStreaming}
          onSend={session.handleSend}
          mode={session.mode}
          candidateProfile={session.candidateProfile}
          resumeScore={session.resumeScore}
        />
      </div>

      {/* Right: Score panel (always visible on md+) */}
      <div className="hidden md:flex">
        <ScorePanelB
          score={session.resumeScore}
          scoreHistory={session.scoreHistory}
          onAction={session.handleAction}
          isStreaming={session.isStreaming}
          onExport={() => setShowExport(true)}
          currentResumeText={session.currentResumeText}
          onNewSession={session.handleNewSession}
        />
      </div>

      {showExport && (
        <ExportModal
          currentResumeText={session.currentResumeText}
          messages={session.messages}
          resumeScore={session.resumeScore}
          onClose={() => setShowExport(false)}
        />
      )}
    </main>
  );
}
