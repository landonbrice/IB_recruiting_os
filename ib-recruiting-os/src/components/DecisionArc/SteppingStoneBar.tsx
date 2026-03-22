"use client";

import type { ImpactStory } from "@/lib/storyState";

const STAGE_COLORS = {
  answerFirst: "#d4845a",
  actions: "#6366f1",
  tension: "#dc2626",
  resolution: "#059669",
};

interface SteppingStoneBarProps {
  steppingStone: ImpactStory["steppingStone"];
}

export default function SteppingStoneBar({ steppingStone }: SteppingStoneBarProps) {
  const stages = [
    { key: "answerFirst", filled: !!steppingStone.answerFirst },
    { key: "actions", filled: steppingStone.actions.length > 0 },
    { key: "tension", filled: !!steppingStone.tension },
    { key: "resolution", filled: !!steppingStone.resolution },
  ] as const;

  return (
    <div className="flex gap-[3px]">
      {stages.map((stage) => (
        <div
          key={stage.key}
          className="h-1 flex-1 rounded-[4px]"
          style={{
            backgroundColor: stage.filled
              ? STAGE_COLORS[stage.key]
              : "#e8e4dc66",
          }}
        />
      ))}
    </div>
  );
}
