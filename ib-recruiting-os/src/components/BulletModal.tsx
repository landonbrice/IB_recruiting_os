"use client";

import { useState, useEffect, useRef } from "react";
import type { CandidateProfile } from "@/lib/types";
import { consumeSSE } from "@/lib/sse";
import { checkPlausibility } from "@/lib/plausibilityCheck";

export interface SelectedBullet {
  text: string;
  section: string;
  company: string;
  roleTitle: string;
  bulletIndex: number;
}

interface BulletModalProps {
  bullet: SelectedBullet;
  candidateProfile: CandidateProfile;
  resumeText: string;
  onApply: (
    bulletIndex: number,
    company: string,
    newText: string,
    meta?: { confidence?: "High" | "Medium" | "Low"; risk?: "Low" | "Medium" | "High" }
  ) => void;
  onClose: () => void;
}

async function streamSuggest(
  body: object,
  onChunk: (text: string) => void
): Promise<void> {
  const res = await fetch("/api/suggest", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) throw new Error("Suggest stream failed");

  await consumeSSE(res.body, onChunk);
}

interface Variant {
  text: string;
  confidence?: "High" | "Medium" | "Low";
  risk?: "Low" | "Medium" | "High";
}

function explainVariant(original: string, rewritten: string): string {
  const hasNumber = /\b\d+[\d,]*(?:\.\d+)?(?:%|x|m|bn|k)?\b/i.test(rewritten);
  const strongVerb = /^(modeled|structured|executed|diligenced|synthesized|underwrote|pitched|built|led|analyzed)\b/i.test(rewritten.trim());
  const mentionsOutcome = /(improv|increas|reduc|drove|result|used in|supported|contribut)/i.test(rewritten);

  const notes: string[] = [];
  if (strongVerb) notes.push("opens with a stronger IB-style action verb");
  if (hasNumber) notes.push("adds concrete quantification");
  if (mentionsOutcome) notes.push("clarifies business impact/outcome");

  if (notes.length === 0) return "Tighter phrasing and clearer ownership than the original bullet.";
  return `Better because it ${notes.join(", ")}.`;
}

function parseBullets(raw: string): Variant[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const out: Variant[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].startsWith("BULLET: ")) continue;
    const text = lines[i].replace(/^BULLET:\s*/, "").trim();
    let confidence: Variant["confidence"];
    let risk: Variant["risk"];

    const cLine = lines[i + 1] ?? "";
    const rLine = lines[i + 2] ?? "";

    if (/^CONFIDENCE:/i.test(cLine)) {
      const v = cLine.replace(/^CONFIDENCE:\s*/i, "").trim().toLowerCase();
      confidence = v === "high" ? "High" : v === "medium" ? "Medium" : v === "low" ? "Low" : undefined;
    }
    if (/^RISK:/i.test(rLine)) {
      const v = rLine.replace(/^RISK:\s*/i, "").trim().toLowerCase();
      risk = v === "high" ? "High" : v === "medium" ? "Medium" : v === "low" ? "Low" : undefined;
    }

    out.push({ text, confidence, risk });
  }

  if (out.length > 0) return out;

  // Backward compatibility fallback
  return lines
    .filter((l) => l.startsWith("BULLET: "))
    .map((l) => ({ text: l.replace(/^BULLET:\s*/, "").trim() }));
}

export default function BulletModal({
  bullet,
  candidateProfile,
  resumeText,
  onApply,
  onClose,
}: BulletModalProps) {
  const [phase, setPhase] = useState<"question" | "generating" | "results">("question");
  const [question, setQuestion] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [streamText, setStreamText] = useState("");
  const [variants, setVariants] = useState<Variant[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-stream clarifying question on mount
  useEffect(() => {
    let cancelled = false;
    setIsStreaming(true);
    setQuestion("");
    setErrorText(null);

    streamSuggest(
      {
        bullet: bullet.text,
        roleTitle: bullet.roleTitle,
        company: bullet.company,
        section: bullet.section,
        candidateProfile,
        resumeText,
        phase: "question",
      },
      (text) => {
        if (!cancelled) setQuestion((prev) => prev + text);
      }
    )
      .catch((err) => {
        if (!cancelled) {
          setErrorText("Couldn’t generate a clarifying question. You can still skip and generate rewrites.");
          console.error("bullet question stream failed", err);
        }
      })
      .finally(() => {
        if (!cancelled) setIsStreaming(false);
      });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate(skip = false) {
    setPhase("generating");
    setStreamText("");
    setVariants([]);
    setErrorText(null);
    setIsStreaming(true);

    let accumulated = "";
    try {
      await streamSuggest(
        {
          bullet: bullet.text,
          roleTitle: bullet.roleTitle,
          company: bullet.company,
          section: bullet.section,
          candidateProfile,
          resumeText,
          phase: "generate",
          question: skip ? undefined : question,
          answer: skip ? undefined : userAnswer,
        },
        (text) => {
          accumulated += text;
          setStreamText(accumulated);
        }
      );

      setVariants(parseBullets(accumulated));
      setPhase("results");
    } catch (err) {
      setErrorText("Rewrite generation failed. Please try again.");
      setPhase("question");
      console.error("bullet generate stream failed", err);
    } finally {
      setIsStreaming(false);
    }
  }

  function handleApply(v: Variant) {
    onApply(bullet.bulletIndex, bullet.company, v.text, {
      confidence: v.confidence,
      risk: v.risk,
    });
    onClose();
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-stone-900 border border-stone-800 rounded-2xl w-[560px] max-h-[80vh] overflow-y-auto p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-sm font-semibold text-stone-200">Let&apos;s punch this up...</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 text-lg leading-none ml-4"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Current bullet context */}
        <div className="bg-stone-800 rounded-lg px-4 py-3 mb-5">
          <div className="text-xs text-stone-500 mb-1">
            {bullet.roleTitle} &middot; {bullet.company}
          </div>
          <p className="text-sm text-stone-300 leading-snug">{bullet.text}</p>
        </div>

        {/* Phase 1 — Question */}
        {(phase === "question" || phase === "generating") && (
          <div className="border border-amber-800/40 bg-amber-950/20 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2 mb-3">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] flex items-center justify-center font-bold">
                1
              </span>
              <p className="text-sm text-stone-300 leading-snug">
                {question || (
                  <span className="text-stone-500 italic">
                    {isStreaming && phase === "question" ? "Thinking..." : ""}
                  </span>
                )}
              </p>
            </div>

            {phase === "question" && (
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your answer (or click Skip)..."
                rows={2}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-200 placeholder:text-stone-600 px-3 py-2 resize-none focus:outline-none focus:border-amber-700/60"
              />
            )}
          </div>
        )}

        {errorText && (
          <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-200">
            {errorText}
          </div>
        )}

        {/* Phase 1 — Action buttons */}
        {phase === "question" && (
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => handleGenerate(false)}
              disabled={isStreaming}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              Generate bullets
            </button>
            <button
              onClick={() => handleGenerate(true)}
              disabled={isStreaming}
              className="text-stone-500 hover:text-stone-300 text-sm underline underline-offset-2 transition disabled:opacity-50"
            >
              Skip
            </button>
          </div>
        )}

        {/* Phase 2 — Streaming / Results */}
        {(phase === "generating" || phase === "results") && (
          <div className="mt-2">
            {phase === "generating" && variants.length === 0 && (
              <p className="text-xs text-stone-500 italic mb-3">Generating rewrites...</p>
            )}

            {variants.length > 0 ? (
              <div className="space-y-2">
                {variants.map((v, idx) => {
                  const plausibility = checkPlausibility(bullet.text, v.text, bullet.roleTitle, candidateProfile);
                  return (
                    <div
                      key={idx}
                      className="bg-stone-800 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <p className="text-sm text-stone-200 leading-snug">{v.text}</p>
                        <p className="mt-1 text-[11px] text-stone-400">{explainVariant(bullet.text, v.text)}</p>
                        <div className="mt-2 flex items-center gap-2 text-[10px]">
                          {v.confidence && (
                            <span className={`rounded-full px-2 py-0.5 ${
                              v.confidence === "High" ? "bg-emerald-900/40 text-emerald-300" :
                              v.confidence === "Medium" ? "bg-amber-900/40 text-amber-300" : "bg-red-900/40 text-red-300"
                            }`}>
                              Confidence: {v.confidence}
                            </span>
                          )}
                          {v.risk && (
                            <span className={`rounded-full px-2 py-0.5 ${
                              v.risk === "Low" ? "bg-emerald-900/30 text-emerald-200" :
                              v.risk === "Medium" ? "bg-amber-900/30 text-amber-200" : "bg-red-900/30 text-red-200"
                            }`}>
                              Risk: {v.risk}
                            </span>
                          )}
                          {plausibility.riskLevel === "safe" && (
                            <span className="rounded-full px-2 py-0.5 bg-emerald-900/30 text-emerald-300">
                              ✓ Plausible
                            </span>
                          )}
                          {plausibility.riskLevel === "caution" && (
                            <span className="rounded-full px-2 py-0.5 bg-amber-900/30 text-amber-200">
                              ⚠ Caution
                            </span>
                          )}
                          {plausibility.riskLevel === "flag" && (
                            <span className="rounded-full px-2 py-0.5 bg-red-900/30 text-red-200">
                              ⚑ Flagged
                            </span>
                          )}
                        </div>
                        {plausibility.warnings.length > 0 && (
                          <div className="mt-1.5 space-y-0.5">
                            {plausibility.warnings.map((w, wi) => (
                              <p key={wi} className={`text-[10px] ${plausibility.riskLevel === "flag" ? "text-red-300" : "text-amber-300/80"}`}>
                                {w}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleApply(v)}
                        className={`flex-shrink-0 text-xs font-medium transition whitespace-nowrap ${
                          plausibility.riskLevel === "flag"
                            ? "text-amber-500 hover:text-amber-400"
                            : "text-amber-400 hover:text-amber-300"
                        }`}
                      >
                        {plausibility.riskLevel === "flag" ? "Apply Anyway" : "Use"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : phase === "generating" && streamText ? (
              // Live partial stream before bullets parse
              <div className="bg-stone-800 rounded-lg px-4 py-3">
                <p className="text-sm text-stone-400 leading-snug whitespace-pre-wrap">
                  {streamText}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
