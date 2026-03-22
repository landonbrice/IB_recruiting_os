"use client";

import { useState } from "react";
import type { ArcNode, Thread } from "@/lib/storyState";
import ImpactBadge from "./ImpactBadge";
import StatusBadge from "./StatusBadge";
import ThreadBadge from "./ThreadBadge";
import SteppingStoneBar from "./SteppingStoneBar";
import SteppingStoneExpanded from "./SteppingStoneExpanded";

interface NodeDetailOverlayProps {
  node: ArcNode;
  threads: Thread[];
  onClose: () => void;
}

export default function NodeDetailOverlay({
  node,
  threads,
  onClose,
}: NodeDetailOverlayProps) {
  const [expandedStoryId, setExpandedStoryId] = useState<string | null>(null);
  const nodeThreads = threads.filter((t) => t.nodeIds.includes(node.id));

  return (
    <div className="absolute inset-0 z-20 flex rounded-[10px]">
      {/* Blurred background click target */}
      <div
        className="absolute inset-0 rounded-[10px] bg-cream/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Overlay content */}
      <div className="relative z-10 m-4 flex-1 overflow-auto rounded-[10px] bg-white p-6">
        {/* Back button */}
        <button
          onClick={onClose}
          className="mb-4 text-[12px] text-smoke/60 transition-all duration-150 hover:text-smoke"
        >
          ← Back to Arc
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h2 className="text-[16px] font-bold text-smoke">{node.label}</h2>
              <p className="mt-0.5 text-[12px] text-[#78716c]">
                {node.sub} · {node.timeframe}
              </p>
            </div>
            {node.type === "non-resume" && (
              <span className="rounded bg-cream px-2 py-0.5 text-[9px] font-semibold text-terracotta">
                OFF RESUME
              </span>
            )}
            {node.type === "goal" && (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-[9px] font-semibold text-amber-600">
                TARGET
              </span>
            )}
          </div>
        </div>

        {/* Qualities */}
        {(node.positives.length > 0 || node.negatives.length > 0) && (
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-green-600">
                Qualities Gained
              </h3>
              <div className="space-y-1.5">
                {node.positives.map((p, i) => (
                  <div key={i} className="flex gap-1.5 text-[12px] leading-relaxed">
                    <span className="flex-shrink-0 text-green-500">+</span>
                    <span className="text-smoke">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-red-500">
                What Pushed Me On
              </h3>
              <div className="space-y-1.5">
                {node.negatives.map((n, i) => (
                  <div key={i} className="flex gap-1.5 text-[12px] leading-relaxed">
                    <span className="flex-shrink-0 text-red-500">−</span>
                    <span className="text-smoke">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Threads */}
        {nodeThreads.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-[9px] font-semibold uppercase tracking-wider text-smoke/40">
              Threads
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {nodeThreads.map((t) => (
                <ThreadBadge key={t.id} label={t.label} color={t.color} />
              ))}
            </div>
          </div>
        )}

        {/* Stories */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[9px] font-semibold uppercase tracking-wider text-smoke/40">
              IMPACT Stories
            </h3>
            <button className="text-[10px] font-medium text-terracotta transition-all duration-150 hover:text-terracotta/80">
              + Add
            </button>
          </div>

          {node.impactStories.length === 0 ? (
            <div className="rounded-[10px] border border-dashed border-cream-1 px-6 py-8 text-center">
              <p className="text-[12px] text-[#a8a29e]">
                No stories yet. Ask the coach to develop one from this experience.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {node.impactStories.map((story) => {
                const isExpanded = expandedStoryId === story.id;
                return (
                  <div
                    key={story.id}
                    className="rounded-[10px] border border-cream-1 bg-white transition-all duration-150"
                  >
                    <button
                      onClick={() =>
                        setExpandedStoryId(isExpanded ? null : story.id)
                      }
                      className="w-full px-4 py-3 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <ImpactBadge type={story.type} size="sm" />
                        <span className="flex-1 text-[12px] font-medium text-smoke">
                          {story.nickname}
                        </span>
                        <StatusBadge status={story.status} />
                      </div>
                      <div className="mt-2">
                        <SteppingStoneBar steppingStone={story.steppingStone} />
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-cream-1 px-4 py-4">
                        <SteppingStoneExpanded
                          steppingStone={story.steppingStone}
                          ibConnection={story.ibConnection}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
