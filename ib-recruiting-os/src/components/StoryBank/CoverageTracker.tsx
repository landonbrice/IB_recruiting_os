"use client";

import type { ImpactStory } from "@/lib/storyState";
import ImpactBadge from "@/components/DecisionArc/ImpactBadge";

const IMPACT_LABELS: Record<ImpactStory["type"], string> = {
  I: "Individual",
  M: "Manage",
  P: "Persuasion",
  A: "Analytics",
  C: "Challenge",
  T: "Teamwork",
};

const IMPACT_COLORS: Record<ImpactStory["type"], string> = {
  I: "#d4845a",
  M: "#d4845a",
  P: "#d4845a",
  A: "#d4845a",
  C: "#d4845a",
  T: "#d4845a",
};

const CATEGORIES: ImpactStory["type"][] = ["I", "M", "P", "A", "C", "T"];

interface CoverageTrackerProps {
  stories: { type: ImpactStory["type"] }[];
}

export default function CoverageTracker({ stories }: CoverageTrackerProps) {
  const counts = CATEGORIES.reduce(
    (acc, cat) => {
      acc[cat] = stories.filter((s) => s.type === cat).length;
      return acc;
    },
    {} as Record<ImpactStory["type"], number>,
  );

  const totalStories = stories.length;
  const gaps = CATEGORIES.filter((c) => counts[c] === 0);

  return (
    <div className="rounded-[10px] border border-cream-1 bg-white p-4">
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
        {CATEGORIES.map((cat) => {
          const count = counts[cat];
          const pct = Math.min(count * 33, 100);
          return (
            <div key={cat} className="flex items-center gap-2">
              <ImpactBadge type={cat} size="sm" />
              <span className="w-[52px] text-[11px] font-medium text-smoke">
                {IMPACT_LABELS[cat]}
              </span>
              <div className="flex-1">
                <div className="h-1 rounded-full bg-cream-1">
                  <div
                    className="h-1 rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: IMPACT_COLORS[cat],
                    }}
                  />
                </div>
              </div>
              {count > 0 ? (
                <span className="w-8 text-right text-[10px] text-smoke/60">
                  {count}
                </span>
              ) : (
                <span className="w-8 text-right text-[10px] font-semibold text-red-500">
                  GAP
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 border-t border-cream-1 pt-3 text-[10px] text-smoke/50">
        <span className="font-bold text-terracotta">{totalStories}</span>{" "}
        stories developed{" · "}
        <span className={`font-bold ${gaps.length > 0 ? "text-red-500" : "text-green-500"}`}>
          {gaps.length}
        </span>{" "}
        gaps remaining
        {gaps.length > 0 && (
          <>
            {" · Missing: "}
            <span className="text-smoke/40">
              {gaps.map((g) => IMPACT_LABELS[g]).join(", ")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
