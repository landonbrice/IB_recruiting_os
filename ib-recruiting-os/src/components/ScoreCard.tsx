"use client";

import type { ResumeScore } from "@/lib/types";

interface ScoreCardProps {
  score: ResumeScore;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function barColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

function gaugeColor(total: number): string {
  if (total >= 80) return "#10b981"; // emerald-500
  if (total >= 60) return "#f59e0b"; // amber-500
  return "#ef4444"; // red-500
}

export default function ScoreCard({ score }: ScoreCardProps) {
  const offset = CIRCUMFERENCE * (1 - score.total / 100);
  const color = gaugeColor(score.total);

  return (
    <div className="scrollable h-full px-6 py-6 space-y-6">
      {/* Circular gauge */}
      <div className="flex flex-col items-center gap-1">
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
          {/* Track */}
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke="#292524"
            strokeWidth="12"
          />
          {/* Progress */}
          <circle
            cx="70"
            cy="70"
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        {/* Score in center — overlay on SVG */}
        <div className="-mt-[88px] flex flex-col items-center">
          <span className="text-3xl font-bold text-stone-100">{score.total}</span>
          <span className="text-xs text-stone-500">/ 100</span>
        </div>
        <div className="mt-10 text-xs text-stone-500 tracking-wide uppercase">Resume Score</div>
      </div>

      {/* Category breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">Breakdown</h3>
        {score.categories.map((cat) => (
          <div key={cat.name} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-stone-300">{cat.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-stone-500">{cat.weight}%</span>
                <span className="w-6 text-right font-semibold text-stone-200">{cat.score}</span>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-stone-800">
              <div
                className={`h-1.5 rounded-full ${barColor(cat.score)} transition-all duration-500`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* What's working */}
      {score.working.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">What&apos;s Working</h3>
          <ul className="space-y-1.5">
            {score.working.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-stone-300">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What's hurting */}
      {score.hurting.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">What&apos;s Hurting</h3>
          <ul className="space-y-1.5">
            {score.hurting.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-stone-300">
                <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Next step */}
      {score.nextStep && (
        <div className="rounded-lg border border-amber-800/40 bg-amber-950/30 px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-500">Next Step</p>
          <p className="text-xs leading-relaxed text-stone-300">{score.nextStep}</p>
        </div>
      )}
    </div>
  );
}
