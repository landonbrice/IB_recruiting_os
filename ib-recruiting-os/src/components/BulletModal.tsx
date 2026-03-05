"use client";

import { useState, useEffect, useRef } from "react";
import type { CandidateProfile } from "@/lib/types";

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
  onApply: (bulletIndex: number, company: string, newText: string) => void;
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

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split("\n")) {
      if (!line.startsWith("data: ")) continue;
      const data = line.slice(6);
      if (data === "[DONE]") return;
      try {
        const parsed = JSON.parse(data);
        const text = parsed.delta?.text ?? "";
        if (text) onChunk(text);
      } catch {
        // skip malformed chunks
      }
    }
  }
}

function parseBullets(raw: string): string[] {
  return raw
    .split("\n")
    .filter((l) => l.trim().startsWith("BULLET: "))
    .map((l) => l.replace(/^BULLET:\s*/, "").trim());
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
  const [variants, setVariants] = useState<string[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Auto-stream clarifying question on mount
  useEffect(() => {
    let cancelled = false;
    setIsStreaming(true);
    setQuestion("");

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
    ).finally(() => {
      if (!cancelled) setIsStreaming(false);
    });

    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate(skip = false) {
    setPhase("generating");
    setStreamText("");
    setVariants([]);
    setIsStreaming(true);

    let accumulated = "";
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
    setIsStreaming(false);
  }

  function handleApply(variantText: string) {
    onApply(bullet.bulletIndex, bullet.company, variantText);
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
                {variants.map((v, idx) => (
                  <div
                    key={idx}
                    className="bg-stone-800 rounded-lg px-4 py-3 flex items-start justify-between gap-3"
                  >
                    <p className="text-sm text-stone-200 leading-snug flex-1">{v}</p>
                    <button
                      onClick={() => handleApply(v)}
                      className="flex-shrink-0 text-xs text-amber-400 hover:text-amber-300 font-medium transition whitespace-nowrap"
                    >
                      Use
                    </button>
                  </div>
                ))}
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
