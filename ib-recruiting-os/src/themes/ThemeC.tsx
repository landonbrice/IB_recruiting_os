/**
 * Theme C — "The Terminal"
 *
 * Near-black background (#0a0a0a). Monospace font throughout.
 * Sharp corners, no rounded UI. Green (#00ff9d) accent.
 * Score displayed as a raw metrics table — no gauges, no decorations.
 * Chat messages styled like terminal output (prompt characters, typed feel).
 * Resume shown as plain preformatted text.
 *
 * Appeals to: quant-leaning candidates, CS crossovers into IB, anyone who
 * finds the polished SaaS aesthetic performative. "No bullshit" visual language.
 *
 * What works from the competition: directness. Most resume tools over-polish.
 * The terminal aesthetic signals that this tool is going to be honest with you.
 */

"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import IntakeForm from "@/components/IntakeForm";
import ExportModal from "@/components/ExportModal";
import BulletModal from "@/components/BulletModal";
import { useCoachSession } from "@/hooks/useCoachSession";
import type { ResumeScore, Message, CandidateProfile } from "@/lib/types";
import { enrichResumeLines } from "@/lib/resumeStructure";

const GREEN = "#00ff9d";
const DIM = "#4a4a4a";
const TERM_BG = "#0c0c0c";
const TERM_BORDER = "#1e1e1e";

// ── Score table (raw, no gauge) ───────────────────────────────────────────────

function ScoreTableC({ score }: { score: ResumeScore }) {
  return (
    <div className="font-mono text-xs">
      <div className="mb-2 flex items-baseline gap-2">
        <span style={{ color: GREEN }} className="text-2xl font-bold">{score.total}</span>
        <span style={{ color: DIM }}>/100</span>
        <span style={{ color: GREEN }} className="text-xs">
          {score.total >= 80 ? "■■■■■" : score.total >= 60 ? "■■■■□" : score.total >= 40 ? "■■■□□" : "■■□□□"}
        </span>
      </div>
      <table className="w-full border-collapse">
        <tbody>
          {score.categories.map(cat => (
            <tr key={cat.name} className="border-t" style={{ borderColor: TERM_BORDER }}>
              <td className="py-1 pr-3 text-[11px]" style={{ color: DIM }}>{cat.name.slice(0, 18)}</td>
              <td className="py-1 pr-2 text-right font-bold" style={{ color: cat.score >= 75 ? GREEN : cat.score >= 55 ? "#f59e0b" : "#ef4444" }}>
                {cat.score}
              </td>
              <td className="py-1 text-[10px]" style={{ color: DIM }}>{cat.weight}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Terminal chat message ─────────────────────────────────────────────────────

function stripProtocol(text: string) {
  return text.replace(/```[\w-]+\n[\s\S]*?```/g, "").trim();
}

function TermMessage({ msg, idx }: { msg: Message; idx: number }) {
  if (msg.role === "user") {
    return (
      <div className="flex gap-2 font-mono text-sm">
        <span style={{ color: GREEN }}>{">"}</span>
        <span className="text-stone-200">{msg.content}</span>
      </div>
    );
  }
  return (
    <div className="font-mono text-sm">
      <span style={{ color: DIM }} className="text-xs">coach [{idx}] </span>
      <div className="mt-1 pl-2" style={{ borderLeft: `1px solid ${TERM_BORDER}` }}>
        <ReactMarkdown
          components={{
            p: ({ children }) => <p className="mb-1 text-stone-300 last:mb-0">{children}</p>,
            strong: ({ children }) => <strong style={{ color: GREEN }} className="font-bold">{children}</strong>,
            em: ({ children }) => <em className="text-stone-500 italic">{children}</em>,
            ul: ({ children }) => <ul className="mb-1 pl-3 list-none">{children}</ul>,
            li: ({ children }) => (
              <li className="text-stone-400 before:content-['-'] before:mr-1.5 before:text-stone-600">{children}</li>
            ),
            code: ({ children }) => (
              <code style={{ color: GREEN }} className="text-xs bg-transparent">{children}</code>
            ),
            blockquote: ({ children }) => (
              <blockquote className="pl-2 text-stone-500 italic" style={{ borderLeft: `2px solid ${DIM}` }}>{children}</blockquote>
            ),
          }}
        >
          {stripProtocol(msg.content)}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ── Resume as preformatted text ───────────────────────────────────────────────

interface TermResumeProps {
  resumeText: string;
  candidateProfile: CandidateProfile;
  onApplyBullet: (idx: number, company: string, text: string) => void;
}

function TermResume({ resumeText, candidateProfile, onApplyBullet }: TermResumeProps) {
  type SelectedBulletData = { text: string; section: string; company: string; roleTitle: string; bulletIndex: number };
  const [selected, setSelected] = useState<SelectedBulletData | null>(null);

  const parsed = enrichResumeLines(resumeText);

  return (
    <div className="h-full overflow-y-auto p-4">
      <pre className="font-mono text-[10px] leading-snug text-stone-400 whitespace-pre-wrap">
        {parsed.map((pl, i) => pl.type === "bullet" && pl.company ? (
          <span
            key={i}
            onClick={() => setSelected({ text: pl.text.trim(), section: pl.section, company: pl.company, roleTitle: pl.roleTitle, bulletIndex: pl.bulletIndex })}
            className="cursor-pointer block transition-colors"
            style={{ color: "#6b7280" }}
            onMouseEnter={e => (e.currentTarget.style.color = GREEN)}
            onMouseLeave={e => (e.currentTarget.style.color = "#6b7280")}
          >
            {pl.text + "\n"}
          </span>
        ) : (
          <span key={i}>{pl.text + "\n"}</span>
        ))}
      </pre>
      {selected && (
        <BulletModal
          bullet={selected}
          candidateProfile={candidateProfile}
          resumeText={resumeText}
          onApply={(idx, company, text) => { onApplyBullet(idx, company, text); setSelected(null); }}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ── Theme C Shell ─────────────────────────────────────────────────────────────

export default function ThemeC() {
  const session = useCoachSession();
  const [input, setInput] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [showResume, setShowResume] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [session.messages, session.isStreaming]);

  if (!session.resumeText) {
    return (
      <div className="flex h-full w-full items-center justify-center" style={{ background: TERM_BG }}>
        <div className="w-full max-w-md px-8 font-mono">
          <div className="mb-6">
            <p style={{ color: GREEN }} className="text-sm">$ ib-resume-coach --init</p>
            <p className="text-stone-500 text-xs mt-1">Brutally honest IB resume analysis.</p>
          </div>
          <label
            className="block cursor-pointer rounded border px-6 py-8 text-center transition"
            style={{ borderColor: TERM_BORDER, borderStyle: "dashed" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = GREEN)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = TERM_BORDER)}
          >
            <p className="text-sm text-stone-400">{"[ drop resume.pdf / resume.docx ]"}</p>
            <p className="mt-1 text-xs" style={{ color: DIM }}>click to browse</p>
            <input type="file" accept=".pdf,.doc,.docx" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (!file) return;
                const fd = new FormData();
                fd.append("file", file);
                fetch("/api/parse-resume", { method: "POST", body: fd })
                  .then(r => r.json())
                  .then((d: { text: string; html?: string }) => session.handleUpload(d.text, file.name, file, d.html));
              }}
            />
          </label>
        </div>
      </div>
    );
  }

  if (session.showIntakeForm) {
    return (
      <div className="flex h-full w-full" style={{ background: TERM_BG }}>
        <div className="m-auto w-full max-w-sm">
          <IntakeForm onSubmit={session.handleIntakeSubmit} />
        </div>
      </div>
    );
  }

  const MODE_COLOR: Record<string, string> = {
    diagnostic: DIM, editing: GREEN, story: "#60a5fa", targeting: "#f59e0b", feasibility: "#ef4444",
  };

  return (
    <main className="flex h-full w-full overflow-hidden font-mono" style={{ background: TERM_BG }}>

      {/* Left: score + resume toggle */}
      <div className="flex w-52 shrink-0 flex-col border-r" style={{ borderColor: TERM_BORDER }}>
        {/* Status bar */}
        <div className="border-b px-3 py-2 text-xs" style={{ borderColor: TERM_BORDER }}>
          <span style={{ color: MODE_COLOR[session.mode] ?? DIM }}>
            [{session.mode.toUpperCase()}]
          </span>
        </div>

        {/* Score */}
        <div className="border-b px-3 py-3" style={{ borderColor: TERM_BORDER }}>
          {session.resumeScore ? (
            <ScoreTableC score={session.resumeScore} />
          ) : (
            <p className="text-xs" style={{ color: DIM }}>score: pending...</p>
          )}
        </div>

        {/* Issues */}
        {session.resumeScore && session.resumeScore.hurting.length > 0 && (
          <div className="border-b px-3 py-3" style={{ borderColor: TERM_BORDER }}>
            <p className="mb-2 text-[10px]" style={{ color: DIM }}>{"// top issues"}</p>
            {session.resumeScore.hurting.slice(0, 3).map((item, i) => (
              <button
                key={i}
                onClick={() => session.handleAction(`Let's work on improving: ${item}`)}
                disabled={session.isStreaming}
                className="block w-full text-left text-[10px] py-0.5 truncate transition"
                style={{ color: "#ef4444" }}
                onMouseEnter={e => (e.currentTarget.style.color = GREEN)}
                onMouseLeave={e => (e.currentTarget.style.color = "#ef4444")}
              >
                {`! ${item}`}
              </button>
            ))}
          </div>
        )}

        {/* Commands */}
        <div className="flex-1 px-3 py-3 space-y-1.5">
          <p className="mb-2 text-[10px]" style={{ color: DIM }}>{"// commands"}</p>
          {[
            [":score", "Score my resume"],
            [":verbs", "Scan my resume for weak verbs and suggest replacements"],
            [":story", "Let's develop my Why-IB story — ask me one question at a time"],
            [":cover", "Generate a cover letter based on everything we've discussed"],
            [":network", "Give me a concrete networking action plan for this week"],
          ].map(([cmd, action]) => (
            <button
              key={cmd}
              onClick={() => session.handleAction(action)}
              disabled={session.isStreaming}
              className="block w-full text-left text-[11px] transition disabled:opacity-30"
              style={{ color: DIM }}
              onMouseEnter={e => (e.currentTarget.style.color = GREEN)}
              onMouseLeave={e => (e.currentTarget.style.color = DIM)}
            >
              {cmd}
            </button>
          ))}
        </div>

        {/* Bottom controls */}
        <div className="border-t px-3 py-2 space-y-1" style={{ borderColor: TERM_BORDER }}>
          <button
            onClick={() => setShowResume(v => !v)}
            className="block w-full text-left text-[10px] transition"
            style={{ color: DIM }}
            onMouseEnter={e => (e.currentTarget.style.color = GREEN)}
            onMouseLeave={e => (e.currentTarget.style.color = DIM)}
          >
            {showResume ? ":hide-resume" : ":show-resume"}
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="block w-full text-left text-[10px] transition"
            style={{ color: DIM }}
            onMouseEnter={e => (e.currentTarget.style.color = GREEN)}
            onMouseLeave={e => (e.currentTarget.style.color = DIM)}
          >
            :export
          </button>
          <button
            onClick={session.handleNewSession}
            className="block w-full text-left text-[10px] transition"
            style={{ color: DIM }}
            onMouseEnter={e => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.color = DIM)}
          >
            :new-session
          </button>
        </div>
      </div>

      {/* Center: resume (toggled) */}
      {showResume && (
        <div className="w-[36%] shrink-0 border-r overflow-hidden" style={{ borderColor: TERM_BORDER }}>
          <div className="border-b px-3 py-2 text-xs" style={{ borderColor: TERM_BORDER, color: DIM }}>
            {session.fileName ?? "resume.txt"}
            {session.updateCount > 0 && <span style={{ color: GREEN }} className="ml-2">[{session.updateCount} edits]</span>}
          </div>
          <TermResume
            resumeText={session.currentResumeText ?? ""}
            candidateProfile={session.candidateProfile}
            onApplyBullet={session.handleApplyBullet}
          />
        </div>
      )}

      {/* Right: chat */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="border-b px-4 py-2 text-xs" style={{ borderColor: TERM_BORDER, color: DIM }}>
          ib-coach session — {session.messages.length} messages
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {session.messages.length === 0 && (
            <p className="text-xs" style={{ color: DIM }}>waiting for input...</p>
          )}
          {session.messages.map((msg, i) => (
            <TermMessage key={i} msg={msg} idx={i} />
          ))}
          {session.isStreaming && (
            <div className="font-mono text-sm" style={{ color: DIM }}>
              coach [...] <span className="animate-pulse">█</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t px-4 py-3" style={{ borderColor: TERM_BORDER }}>
          <div className="flex items-center gap-2">
            <span style={{ color: GREEN }} className="text-sm">{">"}</span>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && input.trim() && !session.isStreaming) {
                  session.handleSend(input.trim());
                  setInput("");
                }
              }}
              placeholder="type here..."
              disabled={session.isStreaming}
              className="flex-1 bg-transparent text-sm text-stone-200 placeholder:text-stone-700 focus:outline-none font-mono"
            />
          </div>
        </div>
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
