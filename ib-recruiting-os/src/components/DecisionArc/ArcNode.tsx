"use client";

import { spinePoint, VB_W, VB_H } from "./spine";
import type { ArcNodeDisplay } from "./demoData";
import { DEMO_THREADS } from "./demoData";

interface ArcNodeProps {
  node: ArcNodeDisplay;
  selected: boolean;
  highlightedThreadId: string | null;
  onClick: () => void;
}

// Convert spine coordinates to container percentages

export default function ArcNode({
  node,
  selected,
  highlightedThreadId,
  onClick,
}: ArcNodeProps) {
  const isSide = !!node.branchFrom;
  const isGoal = node.type === "goal";
  const isNonResume = node.type === "non-resume";
  const isUpcoming = node.type === "upcoming";
  const isInflection = node.weight === "heavy";
  const storyCount = node.impactStories.length;

  const nodeThreads = DEMO_THREADS.filter((t) => t.nodeIds.includes(node.id));

  const inHighlightedThread = highlightedThreadId
    ? DEMO_THREADS.find((t) => t.id === highlightedThreadId)?.nodeIds.includes(node.id) ?? false
    : false;
  const dimmed = highlightedThreadId !== null && !inHighlightedThread;

  // Position as percentage of container
  const base = spinePoint(node.t);
  const pos = node.offset
    ? { x: base.x + node.offset.dx, y: base.y + node.offset.dy }
    : base;
  const leftPct = (pos.x / VB_W) * 100;
  const topPct = (pos.y / VB_H) * 100;

  // Card sizing
  const width = isGoal ? 110 : isSide ? 145 : 165;

  // Side label
  let sideLabel: string | null = null;
  let sideLabelColor = "";
  if (isSide && isNonResume) {
    sideLabel = "off resume";
    sideLabelColor = "#d4845a";
  } else if (isSide) {
    sideLabel = "parallel force";
    sideLabelColor = "#dc2626";
  } else if (isGoal) {
    sideLabel = "target";
    sideLabelColor = "#d97706";
  }

  // Border
  let borderStyle = "1px solid #e8e4dc";
  if (selected) borderStyle = "2px solid #d4845a";
  else if (isInflection) borderStyle = "1.5px solid #d4845a";
  else if (isGoal) borderStyle = "1.5px solid #d97706";
  else if (isSide) borderStyle = "1px dashed #e8e4dc";

  return (
    <div
      data-arc-node
      onClick={onClick}
      className="absolute cursor-pointer"
      style={{
        left: `${leftPct}%`,
        top: `${topPct}%`,
        transform: `translate(-50%, -50%) ${selected ? "scale(1.06) translateY(-6px)" : inHighlightedThread && highlightedThreadId ? "scale(1.03)" : ""}`,
        zIndex: selected ? 15 : dimmed ? 2 : 10,
        width,
        transition: "all 0.4s cubic-bezier(0.33, 1, 0.68, 1)",
        opacity: dimmed ? 0.12 : isUpcoming ? 0.6 : 1,
        filter: dimmed ? "saturate(0)" : undefined,
      }}
    >
      <div
        className="rounded-[10px] bg-white"
        style={{
          border: borderStyle,
          boxShadow: selected
            ? "0 0 0 4px rgba(212,132,90,0.10), 0 4px 12px rgba(0,0,0,0.04)"
            : inHighlightedThread && highlightedThreadId
              ? "0 2px 8px rgba(0,0,0,0.03)"
              : "0 1px 3px rgba(0,0,0,0.015)",
          padding: isSide ? 10 : 12,
        }}
      >
        {sideLabel && (
          <div
            className="mb-1 text-[7px] font-semibold uppercase tracking-wider"
            style={{ color: sideLabelColor }}
          >
            {sideLabel}
          </div>
        )}

        <div
          className="font-semibold leading-tight text-smoke line-clamp-2"
          style={{ fontSize: isGoal ? 14 : isSide ? 11 : 12 }}
        >
          {node.label}
        </div>

        <div
          className="mt-0.5 leading-tight text-[#78716c]"
          style={{ fontSize: isSide ? 9 : 10 }}
        >
          {node.sub} · {node.timeframe}
        </div>

        {(nodeThreads.length > 0 || storyCount > 0) && (
          <>
            <div className="my-1.5 border-t border-cream-1" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {nodeThreads.map((t) => {
                  const isActive = highlightedThreadId === t.id;
                  return (
                    <div
                      key={t.id}
                      className="rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        backgroundColor: t.color,
                        transform: isActive ? "scale(1.5)" : "scale(1)",
                        boxShadow: isActive ? `0 0 6px ${t.color}60` : "none",
                        transition: "transform 0.25s, box-shadow 0.25s",
                      }}
                      title={t.label}
                    />
                  );
                })}
              </div>
              {storyCount > 0 && (
                <span className="text-[9px] text-[#a8a29e]">{storyCount}</span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
