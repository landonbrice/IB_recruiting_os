"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ArcNode as ArcNodeData } from "@/lib/storyState";
import type { Thread } from "@/lib/storyState";
import ImpactBadge from "./ImpactBadge";

export type ArcNodeFlowData = {
  arcNode: ArcNodeData;
  threads: Thread[];
};

export default function ArcNode({ data, selected }: NodeProps) {
  const { arcNode, threads } = data as unknown as ArcNodeFlowData;
  const isNonResume = arcNode.type === "non-resume";
  const isUpcoming = arcNode.type === "upcoming";
  const isGoal = arcNode.type === "goal";

  const nodeThreads = threads.filter((t) => t.nodeIds.includes(arcNode.id));

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-cream-1 !border-cream-1 !w-2 !h-2" />
      <div
        className={`w-[200px] rounded-[10px] bg-white p-3 transition-all duration-150 ${
          isNonResume ? "border-[1.5px] border-dashed border-cream-1" : "border-[1.5px] border-cream-1"
        } ${selected ? "!border-terracotta ring-2 ring-terracotta/30" : "hover:border-[#d4cfca]"} ${
          isUpcoming ? "opacity-70" : ""
        }`}
      >
        {/* Type chips */}
        {isNonResume && (
          <div className="mb-1.5 flex justify-end">
            <span className="rounded bg-cream px-1.5 py-0.5 text-[9px] font-semibold text-terracotta">
              OFF RESUME
            </span>
          </div>
        )}
        {isGoal && (
          <div className="mb-1.5 flex justify-end">
            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-semibold text-amber-600">
              TARGET
            </span>
          </div>
        )}

        {/* Title */}
        <div className="text-[12px] font-semibold leading-tight text-smoke">
          {arcNode.label}
        </div>
        <div className="mt-0.5 text-[10px] text-[#78716c]">
          {arcNode.sub} · {arcNode.timeframe}
        </div>

        {/* Qualities preview */}
        {(arcNode.positives.length > 0 || arcNode.negatives.length > 0) && (
          <div className="mt-2 space-y-0.5">
            {arcNode.positives.slice(0, 2).map((p, i) => (
              <div key={i} className="flex gap-1 text-[10px] leading-tight">
                <span className="flex-shrink-0 text-green-500">+</span>
                <span className="text-[#78716c] line-clamp-1">{p}</span>
              </div>
            ))}
            {arcNode.negatives.slice(0, 1).map((n, i) => (
              <div key={i} className="flex gap-1 text-[10px] leading-tight">
                <span className="flex-shrink-0 text-red-500">−</span>
                <span className="text-[#78716c] line-clamp-1">{n}</span>
              </div>
            ))}
          </div>
        )}

        {/* Story badges */}
        {arcNode.impactStories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {arcNode.impactStories.map((story) => (
              <ImpactBadge key={story.id} type={story.type} size="sm" />
            ))}
          </div>
        )}

        {/* Thread indicators */}
        {nodeThreads.length > 0 && (
          <div className="mt-2 flex gap-1">
            {nodeThreads.map((t) => (
              <div
                key={t.id}
                className="h-[3px] w-4 rounded-full"
                style={{ backgroundColor: t.color }}
                title={t.label}
              />
            ))}
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!bg-cream-1 !border-cream-1 !w-2 !h-2" />
    </>
  );
}
