"use client";

import type { ImpactStory } from "@/lib/storyState";

const STAGES = [
  { key: "answerFirst" as const, label: "Answer First", num: "①", color: "#d4845a" },
  { key: "actions" as const, label: "Actions", num: "②", color: "#6366f1" },
  { key: "tension" as const, label: "Tension", num: "③", color: "#dc2626" },
  { key: "resolution" as const, label: "Resolution", num: "④", color: "#059669" },
];

interface SteppingStoneExpandedProps {
  steppingStone: ImpactStory["steppingStone"];
  ibConnection: string;
}

export default function SteppingStoneExpanded({
  steppingStone,
  ibConnection,
}: SteppingStoneExpandedProps) {
  return (
    <div className="space-y-3">
      {STAGES.map((stage) => {
        const raw = steppingStone[stage.key];
        const content = Array.isArray(raw) ? raw.join(" → ") : raw;
        const filled = Array.isArray(raw) ? raw.length > 0 : !!raw;

        return (
          <div key={stage.key}>
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-[12px]" style={{ color: stage.color }}>
                {stage.num}
              </span>
              <span
                className="text-[10px] font-semibold uppercase tracking-wide"
                style={{ color: filled ? stage.color : "#a8a29e" }}
              >
                {stage.label}
              </span>
            </div>
            <div
              className={`rounded-lg px-3 py-2 ${
                filled
                  ? "border border-cream-1 bg-white"
                  : "border border-dashed border-cream-1 bg-cream/50"
              }`}
            >
              {filled ? (
                <p className="text-[12px] leading-relaxed text-smoke">{content}</p>
              ) : (
                <p className="text-[12px] italic text-[#a8a29e]">
                  Ask the coach to develop this…
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* IB Connection */}
      <div>
        <div className="mb-1 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-terracotta">
            IB Connection
          </span>
        </div>
        <div
          className={`rounded-lg px-3 py-2 ${
            ibConnection
              ? "border border-terracotta/20 bg-terracotta/[0.04]"
              : "border border-dashed border-cream-1 bg-cream/50"
          }`}
        >
          {ibConnection ? (
            <p className="text-[12px] leading-relaxed text-smoke">{ibConnection}</p>
          ) : (
            <p className="text-[12px] italic text-[#a8a29e]">Not developed yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
