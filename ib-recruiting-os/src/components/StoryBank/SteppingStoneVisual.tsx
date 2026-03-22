"use client";

import type { ImpactStory } from "@/lib/storyState";

const STAGES = [
  { key: "answerFirst" as const, label: "ANSWER FIRST", num: "\u2460", color: "#d4845a" },
  { key: "actions" as const, label: "ACTIONS", num: "\u2461", color: "#6366f1" },
  { key: "tension" as const, label: "TENSION", num: "\u2462", color: "#dc2626" },
  { key: "resolution" as const, label: "RESOLUTION", num: "\u2463", color: "#059669" },
];

interface SteppingStoneVisualProps {
  steppingStone: ImpactStory["steppingStone"];
}

function getContent(
  steppingStone: ImpactStory["steppingStone"],
  key: (typeof STAGES)[number]["key"],
): string {
  if (key === "answerFirst") return steppingStone.answerFirst;
  if (key === "actions") return steppingStone.actions.join(" \u2192 ");
  if (key === "tension") return steppingStone.tension;
  return steppingStone.resolution;
}

function isFilled(
  steppingStone: ImpactStory["steppingStone"],
  key: (typeof STAGES)[number]["key"],
): boolean {
  if (key === "answerFirst") return !!steppingStone.answerFirst;
  if (key === "actions") return steppingStone.actions.length > 0;
  if (key === "tension") return !!steppingStone.tension;
  return !!steppingStone.resolution;
}

export default function SteppingStoneVisual({ steppingStone }: SteppingStoneVisualProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {STAGES.map((stage, i) => {
        const filled = isFilled(steppingStone, stage.key);
        const content = getContent(steppingStone, stage.key);

        return (
          <div key={stage.key}>
            {/* Arrow between stages */}
            {i > 0 && (
              <div className="flex justify-center py-0.5">
                <svg width="12" height="10" viewBox="0 0 12 10" className="text-cream-1">
                  <path d="M6 0L6 7M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" fill="none" />
                </svg>
              </div>
            )}

            {/* Stage card */}
            <div
              className="min-h-[48px] rounded-lg p-3"
              style={
                filled
                  ? {
                      backgroundColor: "white",
                      borderLeft: `3px solid ${stage.color}`,
                      borderTop: "0.5px solid #e8e4dc",
                      borderRight: "0.5px solid #e8e4dc",
                      borderBottom: "0.5px solid #e8e4dc",
                    }
                  : {
                      backgroundColor: "#f0ece4",
                      border: "1.5px dashed #e8e4dc",
                    }
              }
            >
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-[11px]" style={{ color: stage.color }}>
                  {stage.num}
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-wide"
                  style={{ color: stage.color }}
                >
                  {stage.label}
                </span>
              </div>
              {filled ? (
                <p className="text-[12px] leading-[1.6] text-smoke">{content}</p>
              ) : (
                <p className="text-[11px] italic text-smoke/30">
                  Ask the coach to develop this&hellip;
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
