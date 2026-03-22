"use client";

import type { FeasibilityScore } from "@/lib/types";

interface FeasibilityCardProps {
  feasibilityScore: FeasibilityScore | null;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function gaugeColor(score: number): string {
  if (score >= 80) return "#d4845a"; // terracotta
  if (score >= 60) return "#d4845a"; // terracotta
  return "#d97706"; // amber — needs attention
}

function label(score: number): string {
  if (score >= 80) return "Strong Position";
  if (score >= 65) return "Competitive";
  if (score >= 45) return "Uphill Battle";
  return "Long Shot";
}

export default function FeasibilityCard({ feasibilityScore }: FeasibilityCardProps) {
  if (!feasibilityScore) {
    return (
      <div className="px-6 py-8 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-stone-700">
          <span className="text-xl text-stone-600">?</span>
        </div>
        <p className="text-sm font-medium text-stone-400">Not yet available</p>
        <p className="mt-1 text-xs text-stone-600">
          Complete your story and scoring to unlock this
        </p>
      </div>
    );
  }

  const { score, assessment, biggestLeverage, controllables, uncontrollables } = feasibilityScore;
  const offset = CIRCUMFERENCE * (1 - score / 100);
  const color = gaugeColor(score);

  return (
    <div className="scrollable h-full px-6 py-6 space-y-5">
      {/* Gauge */}
      <div className="flex flex-col items-center gap-1">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          <circle cx="70" cy="70" r={RADIUS} fill="none" stroke="#292524" strokeWidth="12" />
          <circle
            cx="70" cy="70" r={RADIUS}
            fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="-mt-[88px] flex flex-col items-center">
          <span className="text-3xl font-bold text-stone-100">{score}</span>
          <span className="text-xs text-stone-500">/ 100</span>
        </div>
        <div className="mt-10 text-xs text-stone-500 tracking-wide uppercase">
          Feasibility — {label(score)}
        </div>
      </div>

      {/* Assessment */}
      <div className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Your Honest Odds</h3>
        <p className="text-sm leading-relaxed text-stone-300">{assessment}</p>
      </div>

      {/* Biggest Leverage — callout */}
      <div className="rounded-lg border border-violet-800/40 bg-violet-950/30 px-4 py-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-400">Biggest Leverage Point</p>
        <p className="text-sm leading-relaxed text-stone-200">{biggestLeverage}</p>
      </div>

      {/* Controllables */}
      {controllables.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">What You Can Change</h3>
          <ul className="space-y-1.5">
            {controllables.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-stone-300">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Uncontrollables */}
      {uncontrollables.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Fixed Constraints</h3>
          <ul className="space-y-1.5">
            {uncontrollables.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs italic text-stone-500">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-stone-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
