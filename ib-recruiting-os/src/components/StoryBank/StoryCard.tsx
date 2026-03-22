"use client";

import type { ArcNode, ImpactStory } from "@/lib/storyState";
import ImpactBadge from "@/components/DecisionArc/ImpactBadge";
import StatusBadge from "@/components/DecisionArc/StatusBadge";
import SteppingStoneBar from "@/components/DecisionArc/SteppingStoneBar";

interface StoryWithNode extends ImpactStory {
  node: ArcNode;
}

interface StoryCardProps {
  story: StoryWithNode;
  selected: boolean;
  onClick: () => void;
}

export default function StoryCard({ story, selected, onClick }: StoryCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-[10px] border bg-white p-[14px] text-left transition-all duration-200 hover:scale-[1.01]"
      style={{
        borderColor: selected ? "#d4845a" : "#e8e4dc",
        borderWidth: "0.5px",
        boxShadow: selected ? "0 0 0 2px #d4845a33" : "none",
      }}
    >
      {/* Row 1: badge + nickname + status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ImpactBadge type={story.type} size="sm" />
          <span className="truncate text-[12px] font-semibold text-smoke">
            {story.nickname}
          </span>
        </div>
        <StatusBadge status={story.status} />
      </div>

      {/* Row 2: source context */}
      <p className="mt-1.5 text-[10px] text-smoke/40">
        {story.node.label} &middot; {story.node.timeframe}
      </p>

      {/* Row 3: stepping stone bar */}
      <div className="mt-2">
        <SteppingStoneBar steppingStone={story.steppingStone} />
      </div>
    </button>
  );
}

export function AddStoryCard() {
  return (
    <button className="flex w-full flex-col items-center justify-center rounded-[10px] p-[14px] transition-all duration-200 hover:border-smoke/30 hover:text-smoke/40"
      style={{
        border: "1.5px dashed #e8e4dc",
        minHeight: "88px",
      }}
    >
      <span className="text-[20px] text-smoke/20">+</span>
      <span className="mt-1 text-[10px] text-smoke/30">Add a story</span>
    </button>
  );
}
