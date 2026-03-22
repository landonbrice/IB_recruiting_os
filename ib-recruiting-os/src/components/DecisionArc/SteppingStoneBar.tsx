"use client";

import type { ImpactStory } from "@/lib/storyState";

const STAGE_OPACITIES = {
  answerFirst: 1.0,
  actions: 0.6,
  tension: 0.4,
  resolution: 0.25,
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
              ? `rgba(42, 40, 38, ${STAGE_OPACITIES[stage.key]})`
              : "#e8e4dc66",
          }}
        />
      ))}
    </div>
  );
}
