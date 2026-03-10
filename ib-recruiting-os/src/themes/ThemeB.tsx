/**
 * Theme B — "The Platform"
 *
 * Light slate background. Three-column layout: resume | chat | score panel.
 * Score and metrics are always visible — no sidebar toggle needed.
 * Resume is always present on the left. Chat is the center channel.
 * Feels like a professional SaaS tool (Notion/Linear energy, not a chatbot).
 *
 * What works from the competition:
 * - ResumeWorded shows score immediately, front-and-center — users respond to seeing the number fast
 * - Three-column keeps resume + chat + score in view simultaneously (no tab-switching)
 * - Light background makes the resume feel like a real document, not a textarea
 */

"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import BulletModal from "@/components/BulletModal";
import IntakeForm from "@/components/IntakeForm";
import ExportModal from "@/components/ExportModal";
import { useCoachSession } from "@/hooks/useCoachSession";
import type { ResumeScore, Message, CandidateProfile } from "@/lib/types";

// ── Score Panel (always visible, right column) ────────────────────────────────

const RADIUS = 44;
const CIRC = 2 * Math.PI * RADIUS;

function scoreColor(n: number) {
  if (n >= 80) return "#10b981";
  if (n >= 60) return "#f59e0b";
  return "#ef4444";
}

function ScorePanelB({ score, scoreHistory, onAction, isStreaming }: {
  score: ResumeScore | null;
  scoreHistory: { total: number; createdAt: number }[];
  onAction: (a: string) => void;
  isStreaming: boolean;
}) {
  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Resume Score
        </p>
      </div>

      {/* Gauge */}
      <div className="flex flex-col items-center px-5 py-6 border-b border-slate-100">
        {score ? (
          <>
            <div className="relative">
              <svg width="110" height="110" viewBox="0 0 110 110" className="-rotate-90">
                <circle cx="55" cy="55" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="10" />
                <circle
                  cx="55" cy="55" r={RADIUS}
                  fill="none"
                  stroke={scoreColor(score.total)}
                  strokeWidth="10"
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
            <div className="mt-4 w-full space-y-2">
              {score.categories.map(cat => (
                <div key={cat.name}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-500">{cat.name}</span>
                    <span className="font-semibold text-slate-700">{cat.score}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${cat.score}%`, backgroundColor: scoreColor(cat.score) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="py-6 text-center">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-slate-200">
              <span className="text-xl text-slate-300">?</span>
            </div>
            <p className="text-xs text-slate-400">Score appears after intake</p>
          </div>
        )}
      </div>

      {/* Score trend */}
      {scoreHistory.length > 1 && (
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">Score Trend</p>
          <div className="flex items-end gap-1 h-12">
            {scoreHistory.slice(-8).map((p, i, arr) => {
              const h = Math.max(10, Math.round((p.total / 100) * 44));
              const up = i > 0 && p.total > arr[i - 1].total;
              return (
                <div key={`${p.createdAt}-${i}`} className="flex-1">
                  <div
                    title={`Score: ${p.total}`}
                    className={`w-full rounded-t ${up ? "bg-emerald-400" : "bg-slate-300"}`}
                    style={{ height: `${h}px` }}
                  />
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            Started {scoreHistory[0]?.total} → Now {scoreHistory[scoreHistory.length - 1]?.total}
          </p>
        </div>
      )}

      {/* Issues */}
      {score && score.hurting.length > 0 && (
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Fix These</p>
          <ul className="space-y-2">
            {score.hurting.slice(0, 3).map(item => (
              <li key={item}>
                <button
                  onClick={() => onAction(`Let's work on improving: ${item}`)}
                  disabled={isStreaming}
                  className="flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What's working */}
      {score && score.working.length > 0 && (
        <div className="border-b border-slate-100 px-5 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Strengths</p>
          <ul className="space-y-1.5">
            {score.working.map(item => (
              <li key={item} className="flex items-start gap-2 text-xs text-slate-500">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next step */}
      {score?.nextStep && (
        <div className="px-5 py-4">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-widest text-amber-600">Next Step</p>
          <p className="text-xs leading-relaxed text-slate-600">{score.nextStep}</p>
        </div>
      )}

      <div className="flex-1" />

      {/* Quick actions */}
      <div className="border-t border-slate-100 px-4 py-3 space-y-1">
        {[
          ["Score Resume", "Score my resume"],
          ["Weak Verb Scan", "Scan my resume for weak verbs and suggest replacements"],
          ["Cover Letter", "Generate a cover letter based on everything we've discussed"],
          ["Networking Plan", "Give me a concrete networking action plan for this week"],
        ].map(([label, action]) => (
          <button
            key={label}
            onClick={() => onAction(action)}
            disabled={isStreaming}
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Light Resume Panel ────────────────────────────────────────────────────────

interface EnrichedLine {
  text: string;
  rawIndex: number;
  type: "blank" | "section-header" | "bullet" | "other";
  company: string;
  roleTitle: string;
  section: string;
  bulletIndex: number;
}

function enrichLines(text: string): EnrichedLine[] {
  const raw = text.split("\n");
  const result: EnrichedLine[] = [];
  let currentSection = "", currentCompany = "", currentRoleTitle = "";
  let bulletIdx = 0, lastWasBullet = false;

  for (let i = 0; i < raw.length; i++) {
    const line = raw[i];
    const trimmed = line.trim();
    if (!trimmed) {
      result.push({ text: line, rawIndex: i, type: "blank", section: currentSection, company: currentCompany, roleTitle: currentRoleTitle, bulletIndex: -1 });
      lastWasBullet = false;
      continue;
    }
    const isHeader = trimmed.length < 60 &&
      (trimmed === trimmed.toUpperCase() ||
       /^(Education|Experience|Skills|Activities|Leadership|Projects|Summary|Objective|Work Experience)/i.test(trimmed));
    if (isHeader) {
      currentSection = trimmed; currentCompany = ""; currentRoleTitle = ""; bulletIdx = 0; lastWasBullet = false;
      result.push({ text: line, rawIndex: i, type: "section-header", section: currentSection, company: currentCompany, roleTitle: currentRoleTitle, bulletIndex: -1 });
      continue;
    }
    if (/^[▪•\-·]/.test(trimmed)) {
      if (!lastWasBullet) bulletIdx = 0;
      result.push({ text: line, rawIndex: i, type: "bullet", section: currentSection, company: currentCompany, roleTitle: currentRoleTitle, bulletIndex: bulletIdx });
      bulletIdx++; lastWasBullet = true;
      continue;
    }
    if (!lastWasBullet) {
      if (!currentCompany) { currentCompany = trimmed; bulletIdx = 0; }
      else if (!currentRoleTitle) { currentRoleTitle = trimmed; }
      else { currentCompany = trimmed; currentRoleTitle = ""; bulletIdx = 0; }
    }
    result.push({ text: line, rawIndex: i, type: "other", section: currentSection, company: currentCompany, roleTitle: currentRoleTitle, bulletIndex: -1 });
    lastWasBullet = false;
  }
  return result;
}

function ResumePanelB({
  resumeText, updateCount, candidateProfile, rewriteHistory, onApplyBullet,
}: {
  resumeText: string | null;
  updateCount: number;
  candidateProfile: CandidateProfile;
  rewriteHistory: { id: string; company: string; beforeText: string; afterText: string; confidence?: "High" | "Medium" | "Low"; risk?: "Low" | "Medium" | "High" }[];
  onApplyBullet: (idx: number, company: string, text: string, meta?: { confidence?: "High" | "Medium" | "Low"; risk?: "Low" | "Medium" | "High" }) => void;
}) {
  const [selected, setSelected] = useState<EnrichedLine | null>(null);

  if (!resumeText) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-400">Your resume will appear here</p>
      </div>
    );
  }
  const lines = enrichLines(resumeText);

  return (
    <div className="flex h-full flex-col bg-slate-50">
      <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">Resume</p>
        {updateCount > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
            {updateCount} edit{updateCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mx-auto max-w-[600px] space-y-3">
          {rewriteHistory.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {rewriteHistory.slice(0, 3).map((r) => (
                <div key={r.id} className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] text-slate-600 shadow-sm">
                  <span className="font-medium text-slate-700">{r.company}</span>
                  {r.confidence && <span className="ml-1 text-emerald-600">• {r.confidence}</span>}
                  {r.risk && <span className="ml-1 text-amber-600">risk {r.risk.toLowerCase()}</span>}
                </div>
              ))}
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white px-8 py-8 shadow-sm">
            {lines.map(el => {
              const key = el.rawIndex;
              const t = el.text.trim();
              if (el.type === "blank") return <div key={key} className="h-2" />;
              if (el.type === "section-header") return (
                <h2 key={key} className="mt-4 mb-1 border-b border-slate-800 pb-0.5 text-[10pt] font-bold uppercase tracking-wide text-slate-900">{t}</h2>
              );
              if (el.type === "bullet") {
                const clickable = !!el.company;
                return (
                  <p key={key}
                    onClick={clickable ? () => setSelected(el) : undefined}
                    title={clickable ? "Click to rewrite" : undefined}
                    className={`mb-0.5 pl-4 text-[10pt] leading-snug text-slate-800 ${clickable ? "cursor-pointer rounded hover:bg-amber-50 transition-colors" : ""}`}>
                    {t}
                  </p>
                );
              }
              return <p key={key} className={`mb-0.5 text-[10pt] leading-snug text-slate-800 ${key === 0 ? "text-center text-[14pt] font-bold" : ""}`}>{t}</p>;
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

// ── Chat Panel B (light) ──────────────────────────────────────────────────────

function stripProtocol(text: string) {
  return text.replace(/```[\w-]+\n[\s\S]*?```/g, "").trim();
}

function ChatPanelB({ messages, isStreaming, onSend, mode, candidateProfile }: {
  messages: Message[];
  isStreaming: boolean;
  onSend: (s: string) => void;
  mode: string;
  candidateProfile: CandidateProfile;
}) {
  const [input, setInput] = useState("");

  const MODE_LABELS: Record<string, string> = {
    diagnostic: "Diagnostic", editing: "Editing", story: "Story",
    targeting: "Targeting", feasibility: "Feasibility",
  };

  const quickPrompts = [
    "Score my resume in plain English",
    "Rewrite my weakest bullet",
    "Give me 3 concrete networking actions",
  ];

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-slate-200 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-sm font-semibold text-slate-700">IB Resume Coach</span>
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
          {MODE_LABELS[mode] ?? "Diagnostic"}
        </span>
      </div>

      {Object.keys(candidateProfile).length > 0 && (
        <div className="border-b border-slate-100 px-5 py-2 flex flex-wrap gap-1.5">
          {candidateProfile.schoolTier && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 capitalize">{candidateProfile.schoolTier}</span>
          )}
          {candidateProfile.stage && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 capitalize">{candidateProfile.stage}</span>
          )}
          {candidateProfile.targetBank && (
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs text-amber-700">{candidateProfile.targetBank}</span>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-5 px-5 py-5">
        {messages.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">Coach is ready.</p>
            <p className="mt-1 text-sm text-slate-500">Ask for bullet rewrites, story coaching, or a straight feasibility read.</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}>
            {msg.role === "user" ? (
              <div className="max-w-[80%] rounded-2xl rounded-br-md border border-slate-800 bg-slate-800 px-4 py-3 text-sm text-white shadow-sm">
                {msg.content}
              </div>
            ) : (
              <div className="max-w-[92%] rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-700 shadow-sm">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Coach</p>
                <ReactMarkdown remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="font-semibold text-slate-900">{children}</strong>,
                    ul: ({ children }) => <ul className="mb-2 pl-4 space-y-0.5 list-disc">{children}</ul>,
                    li: ({ children }) => <li className="text-slate-600">{children}</li>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-amber-400 pl-3 italic text-slate-500 my-2">{children}</blockquote>,
                    code: ({ children }) => <code className="rounded bg-slate-100 px-1 py-0.5 text-xs font-mono text-amber-700">{children}</code>,
                  }}
                >
                  {stripProtocol(msg.content)}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ))}
        {isStreaming && (
          <div className="flex items-center gap-2 px-1 py-2 text-xs text-slate-400">
            <span className="font-medium">Coach is typing</span>
            {[0,1,2].map(i => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-300 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        <div ref={el => { if (el) el.scrollIntoView({ behavior: "smooth" }); }} />
      </div>

      <div className="border-t border-slate-200 px-4 py-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => !isStreaming && onSend(prompt)}
              disabled={isStreaming}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-40"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex items-end gap-3">
          <textarea
            value={input}
            onChange={e => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px"; }}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (input.trim() && !isStreaming) { onSend(input.trim()); setInput(""); } } }}
            placeholder="Message your coach..."
            rows={1}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
          />
          <button
            disabled={!input.trim() || isStreaming}
            onClick={() => { if (input.trim() && !isStreaming) { onSend(input.trim()); setInput(""); } }}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white transition hover:bg-slate-700 disabled:opacity-30"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18" />
            </svg>
          </button>
        </div>
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

  if (!session.resumeText) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="w-full max-w-2xl px-8">
          <div className="mb-8 text-center">
            <div className="mb-2 flex items-center justify-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <h1 className="text-2xl font-bold text-slate-800">IB Resume Coach</h1>
            </div>
            <p className="text-sm text-slate-500">Professional coaching for IB recruiting — with real edits, not generic AI noise.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white px-8 py-12 shadow-sm transition hover:border-amber-400 hover:shadow-md">
              {isUploading ? (
                <>
                  <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
                  <div className="text-center">
                    <p className="text-sm font-semibold text-slate-700">Parsing your resume...</p>
                    <p className="mt-1 text-xs text-slate-400">This usually takes a few seconds</p>
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
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" disabled={isUploading}
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
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">What happens next</p>
              <ol className="mt-3 space-y-2 text-sm text-slate-600">
                <li><span className="font-semibold text-slate-800">1.</span> We score your resume across 5 IB metrics.</li>
                <li><span className="font-semibold text-slate-800">2.</span> Click any bullet to generate better variants.</li>
                <li><span className="font-semibold text-slate-800">3.</span> Apply edits instantly and export your pack.</li>
              </ol>
              <p className="mt-4 text-xs text-slate-400">Your resume stays local to this browser session.</p>
            </div>
          </div>
          {uploadError && <p className="mt-3 text-center text-sm text-red-500">{uploadError}</p>}
        </div>
      </div>
    );
  }

  if (session.showIntakeForm) {
    return (
      <div className="flex h-full w-full bg-slate-50">
        <div className="flex-1">
          <IntakeForm onSubmit={session.handleIntakeSubmit} />
        </div>
      </div>
    );
  }

  return (
    <main className="flex h-full w-full overflow-hidden bg-slate-50">
      {/* Left: Resume (always visible) */}
      <div className="hidden w-[38%] shrink-0 flex-col overflow-hidden border-r border-slate-200 md:flex">
        <ResumePanelB
          resumeText={session.currentResumeText}
          updateCount={session.updateCount}
          candidateProfile={session.candidateProfile}
          rewriteHistory={session.rewriteHistory}
          onApplyBullet={session.handleApplyBullet}
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
        />
      </div>

      {/* Right: Score panel (always visible) */}
      <div className="hidden md:flex">
        <ScorePanelB
          score={session.resumeScore}
          scoreHistory={session.scoreHistory}
          onAction={session.handleAction}
          isStreaming={session.isStreaming}
        />
      </div>

      {/* Export button — top-right corner of score panel */}
      <div className="absolute bottom-4 right-4">
        <button
          onClick={() => setShowExport(true)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 shadow-sm transition hover:bg-slate-50"
        >
          Export Pack ↓
        </button>
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
