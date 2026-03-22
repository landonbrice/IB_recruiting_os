"use client";

import { useState } from "react";
import type { ArcNode, ImpactStory } from "@/lib/storyState";
import { DEMO_NODES } from "@/components/DecisionArc/demoData";
import CoverageTracker from "./CoverageTracker";
import StoryCard, { AddStoryCard } from "./StoryCard";
import StoryDetail from "./StoryDetail";
import TMAYBuilder from "./TMAYBuilder";
import QuickReference from "./QuickReference";

interface StoryWithNode extends ImpactStory {
  node: ArcNode;
}

const allStories: StoryWithNode[] = DEMO_NODES.flatMap((node) =>
  node.impactStories.map((story) => ({ ...story, node })),
);

const DEMO_TMAY = `I'm Landon, a sophomore at UChicago studying Economics and CS. My path to banking started through consulting \u2014 leading teams on real client problems where I discovered I need work tied to execution and outcomes, not just recommendations. That drive led me to co-found a detailing business where I learned to sell, negotiate, and build something from zero. At King's Ransom Group, I got direct M\u0026A exposure \u2014 sourcing 30+ mandates and working on valuation models alongside the CEO. What I learned there is that trust matters more than logic in deal origination, and that I thrive when I have to earn responsibility rather than wait for it. I'm drawn to IB because it sits at the intersection of analytical rigor and client-facing execution \u2014 and the healthcare vertical I'm building depth in gives me a thesis I can defend.`;

export default function StoryBank() {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [showQuickRef, setShowQuickRef] = useState(false);

  const selectedStory = allStories.find((s) => s.id === selectedStoryId) ?? null;
  const hasDetail = selectedStory !== null;

  return (
    <div className="flex h-full">
      {/* Main scrollable area */}
      <div className={`flex-1 overflow-auto p-5 ${hasDetail ? "max-w-[calc(100%-360px)]" : ""}`}>
        {/* Header */}
        <h1 className="text-[17px] font-bold tracking-[-0.5px] text-smoke">
          Story Bank
        </h1>
        <p className="mt-0.5 text-[11px] text-smoke/40">
          Your behavioral interview arsenal.
        </p>

        {/* Coverage Tracker */}
        <div className="mt-5">
          <CoverageTracker stories={allStories} />
        </div>

        {/* Story Grid */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          {allStories.map((story) => (
            <StoryCard
              key={story.id}
              story={story}
              selected={story.id === selectedStoryId}
              onClick={() =>
                setSelectedStoryId(
                  story.id === selectedStoryId ? null : story.id,
                )
              }
            />
          ))}
          <AddStoryCard />
        </div>

        {/* TMAY */}
        <div className="mt-5">
          <TMAYBuilder narrative={DEMO_TMAY} />
        </div>

        {/* Quick Reference */}
        <div className="mt-5 pb-4">
          <QuickReference expanded={showQuickRef} onToggle={() => setShowQuickRef(!showQuickRef)} />
        </div>
      </div>

      {/* Detail Panel (right side) */}
      {hasDetail && (
        <div className="w-[360px] shrink-0 border-l border-cream-1 p-3">
          <StoryDetail
            story={selectedStory}
            onClose={() => setSelectedStoryId(null)}
          />
        </div>
      )}
    </div>
  );
}
