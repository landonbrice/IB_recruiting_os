"use client";

import type { ImpactStory } from "@/lib/storyState";

const IMPACT_COLORS: Record<ImpactStory["type"], string> = {
  I: "#8B5CF6",
  M: "#d4845a",
  P: "#EC4899",
  A: "#6366f1",
  C: "#dc2626",
  T: "#059669",
};

const IMPACT_LABELS: Record<ImpactStory["type"], string> = {
  I: "Individual",
  M: "Manage",
  P: "Persuasion",
  A: "Analytics",
  C: "Challenge",
  T: "Teamwork",
};

interface ImpactBadgeProps {
  type: ImpactStory["type"];
  size?: "sm" | "lg";
}

export default function ImpactBadge({ type, size = "sm" }: ImpactBadgeProps) {
  const color = IMPACT_COLORS[type];

  if (size === "sm") {
    return (
      <span
        className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] text-[9px] font-bold"
        style={{
          backgroundColor: `${color}1a`,
          color,
          border: `1px solid ${color}33`,
        }}
      >
        {type}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1 rounded-[6px] px-2 py-0.5 text-[10px] font-semibold"
      style={{
        backgroundColor: `${color}1a`,
        color,
        border: `1px solid ${color}33`,
      }}
    >
      {type}
      <span className="font-medium">{IMPACT_LABELS[type]}</span>
    </span>
  );
}
