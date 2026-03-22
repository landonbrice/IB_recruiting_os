"use client";

import type { ArcNode, ImpactStory } from "@/lib/storyState";
import ImpactBadge from "@/components/DecisionArc/ImpactBadge";
import StatusBadge from "@/components/DecisionArc/StatusBadge";
import SteppingStoneVisual from "./SteppingStoneVisual";

interface StoryWithNode extends ImpactStory {
  node: ArcNode;
}

interface StoryDetailProps {
  story: StoryWithNode;
  onClose: () => void;
}

export default function StoryDetail({ story, onClose }: StoryDetailProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-[10px] border bg-white"
      style={{ borderColor: "#e8e4dc", borderWidth: "0.5px" }}
    >
      {/* Header */}
      <div className="border-b border-cream-1 p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <ImpactBadge type={story.type} size="lg" />
            <StatusBadge status={story.status} />
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded-md text-smoke/40 transition-colors hover:bg-cream hover:text-smoke"
          >
            &times;
          </button>
        </div>
        <h3 className="mt-2 text-[16px] font-bold tracking-[-0.3px] text-smoke">
          {story.nickname}
        </h3>
        <p className="mt-0.5 text-[11px] text-smoke/40">
          {story.node.label} &middot; {story.node.timeframe}
        </p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-auto p-4">
        {/* Stepping Stone Visual */}
        <div className="mb-4">
          <h4 className="mb-2 text-[8px] font-bold uppercase tracking-[1px] text-smoke/50">
            Stepping Stone
          </h4>
          <SteppingStoneVisual steppingStone={story.steppingStone} />
        </div>

        {/* IB Connection */}
        <div className="mb-4">
          <h4 className="mb-2 text-[8px] font-bold uppercase tracking-[1px] text-smoke/50">
            IB Connection
          </h4>
          {story.ibConnection ? (
            <div
              className="rounded-lg p-3 text-[12px] leading-[1.6] text-smoke"
              style={{
                backgroundColor: "#d4845a0a",
                border: "0.5px solid #d4845a26",
              }}
            >
              {story.ibConnection}
            </div>
          ) : (
            <div
              className="rounded-lg p-3 text-[11px] italic text-smoke/30"
              style={{ border: "1.5px dashed #e8e4dc" }}
            >
              Not developed &mdash; ask the coach
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="border-t border-cream-1 p-4 space-y-2">
        <button className="w-full rounded-md bg-terracotta px-4 py-2 text-[11px] font-semibold text-white transition-colors hover:opacity-90">
          Develop with coach &rarr;
        </button>
        <button className="w-full rounded-md border border-cream-1 bg-white px-4 py-2 text-[11px] font-semibold text-smoke transition-colors hover:bg-cream">
          Practice this story
        </button>
      </div>
    </div>
  );
}
