"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ArcNode as ArcNodeData } from "@/lib/storyState";
import type { Thread } from "@/lib/storyState";

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
  const storyCount = arcNode.impactStories.length;

  return (
    <>
      <Handle type="target" position={Position.Left} className="!bg-cream-1 !border-cream-1 !w-2 !h-2" />
      <div
        className={`w-[220px] rounded-[10px] bg-white p-[14px] transition-all duration-150 hover:scale-[1.02] ${
          isNonResume
            ? "border-[1.5px] border-dashed border-cream-1"
            : isGoal
              ? "border-[1.5px] border-amber-300/60"
              : "border-[1.5px] border-cream-1"
        } ${
          selected
            ? "!border-terracotta ring-2 ring-terracotta/20"
            : "hover:border-[#d6d3d1]"
        } ${isUpcoming ? "opacity-60" : ""}`}
      >
        {/* Type chips */}
        {isNonResume && (
          <div className="mb-1.5 flex justify-end">
            <span className="rounded bg-cream px-1 py-px text-[8px] font-semibold text-terracotta">
              OFF RESUME
            </span>
          </div>
        )}
        {isGoal && (
          <div className="mb-1.5 flex justify-end">
            <span className="rounded bg-amber-50 px-1 py-px text-[8px] font-semibold text-amber-600">
              TARGET
            </span>
          </div>
        )}

        {/* Label */}
        <div className="text-[13px] font-semibold leading-tight text-smoke line-clamp-2">
          {arcNode.label}
        </div>

        {/* Subtitle */}
        <div className="mt-0.5 truncate text-[10px] text-[#78716c]">
          {arcNode.sub} · {arcNode.timeframe}
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-cream-1" />

        {/* Thread dots + story count */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {nodeThreads.map((t) => (
              <div
                key={t.id}
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: t.color }}
                title={t.label}
              />
            ))}
          </div>
          {storyCount > 0 && (
            <span className="text-[10px] text-[#a8a29e]">
              {storyCount} {storyCount === 1 ? "story" : "stories"}
            </span>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-cream-1 !border-cream-1 !w-2 !h-2" />
    </>
  );
}
