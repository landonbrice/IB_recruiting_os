"use client";

import { spinePoint, spinePath, VB_W, VB_H } from "./spine";
import { DEMO_NODES, DEMO_THREADS, type ArcNodeDisplay } from "./demoData";
import type { Thread } from "@/lib/storyState";

interface SpineSVGProps {
  overlayOpen: boolean;
  highlightedThreadId: string | null;
}

function getNodePosition(node: ArcNodeDisplay): { x: number; y: number } {
  const base = spinePoint(node.t);
  if (node.offset) {
    return { x: base.x + node.offset.dx, y: base.y + node.offset.dy };
  }
  return base;
}

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const mid = text.lastIndexOf(" ", maxLen);
  if (mid === -1) return [text];
  return [text.slice(0, mid), text.slice(mid + 1)];
}

function ThreadCurves({ thread }: { thread: Thread }) {
  const nodeMap = new Map(DEMO_NODES.map((n) => [n.id, n]));
  const paths: React.ReactNode[] = [];

  for (let i = 0; i < thread.nodeIds.length - 1; i++) {
    const a = nodeMap.get(thread.nodeIds[i]);
    const b = nodeMap.get(thread.nodeIds[i + 1]);
    if (!a || !b) continue;

    const pa = getNodePosition(a);
    const pb = getNodePosition(b);

    const cx1 = pa.x + (pb.x - pa.x) * 0.4;
    const cy1 = pa.y - 30;
    const cx2 = pa.x + (pb.x - pa.x) * 0.6;
    const cy2 = pb.y - 30;

    paths.push(
      <path
        key={`${thread.id}-${i}`}
        d={`M${pa.x} ${pa.y} C${cx1} ${cy1}, ${cx2} ${cy2}, ${pb.x} ${pb.y}`}
        stroke={thread.color}
        strokeWidth={2.5}
        fill="none"
        opacity={0.45}
        style={{ transition: "opacity 0.35s" }}
      />
    );
  }

  return <>{paths}</>;
}

export default function SpineSVG({ overlayOpen, highlightedThreadId }: SpineSVGProps) {
  const mainNodes = DEMO_NODES.filter((n) => !n.branchFrom);
  const sideNodes = DEMO_NODES.filter((n) => !!n.branchFrom);

  const highlightedThread = highlightedThreadId
    ? DEMO_THREADS.find((t) => t.id === highlightedThreadId) ?? null
    : null;

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      style={{ zIndex: 1 }}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
    >
      {/* Spine — smoke stroke */}
      <path
        d={spinePath()}
        stroke="#2a2826"
        strokeWidth={3}
        fill="none"
        opacity={overlayOpen ? 0.04 : 0.10}
        style={{ transition: "opacity 0.5s" }}
      />
      {/* Spine — terracotta warmth */}
      <path
        d={spinePath()}
        stroke="#d4845a"
        strokeWidth={1.2}
        fill="none"
        opacity={overlayOpen ? 0.02 : 0.05}
        style={{ transition: "opacity 0.5s" }}
      />

      {/* Waypoint dots for main nodes */}
      {mainNodes.map((node) => {
        const pt = spinePoint(node.t);
        const isInflection = node.weight === "heavy";
        const isGoal = node.type === "goal";
        return (
          <circle
            key={node.id}
            cx={pt.x}
            cy={pt.y}
            r={isInflection || isGoal ? 5 : 3.5}
            fill={isGoal ? "#d97706" : isInflection ? "#d4845a" : "#2a2826"}
            opacity={isGoal ? 0.30 : isInflection ? 0.20 : 0.10}
            style={{ transition: "opacity 0.5s" }}
          />
        );
      })}

      {/* Branch lines for side nodes */}
      {sideNodes.map((node) => {
        const parent = DEMO_NODES.find((n) => n.id === node.branchFrom);
        if (!parent) return null;
        const parentPt = spinePoint(parent.t);
        const nodePt = getNodePosition(node);
        const cpx = parentPt.x + (nodePt.x - parentPt.x) * 0.3;
        const cpy = parentPt.y + (nodePt.y - parentPt.y) * 0.7;
        return (
          <path
            key={`branch-${node.id}`}
            d={`M${parentPt.x} ${parentPt.y} Q${cpx} ${cpy} ${nodePt.x} ${nodePt.y}`}
            stroke="#2a2826"
            strokeWidth={1.2}
            strokeDasharray="5 4"
            fill="none"
            opacity={overlayOpen ? 0.03 : 0.07}
            style={{ transition: "opacity 0.5s" }}
          />
        );
      })}

      {/* Transition annotations between main nodes */}
      {mainNodes.map((node, i) => {
        if (!node.transition || i === 0) return null;
        const prevMainNodes = mainNodes.filter((n) => n.t < node.t && !n.branchFrom);
        const prev = prevMainNodes[prevMainNodes.length - 1];
        if (!prev) return null;

        const mid = spinePoint((prev.t + node.t) / 2);
        const lines = splitText(node.transition, 24);
        const yBase = mid.y - 35;

        return (
          <g key={`trans-${node.id}`}>
            {lines.map((line, li) => (
              <text
                key={li}
                x={mid.x}
                y={yBase + li * 13}
                textAnchor="middle"
                fill="#d4845a"
                fontSize={10}
                fontStyle="italic"
                opacity={overlayOpen ? 0.15 : 0.55}
                style={{ transition: "opacity 0.5s" }}
              >
                {line}
              </text>
            ))}
          </g>
        );
      })}

      {/* Thread curves — only on hover */}
      {highlightedThread && <ThreadCurves thread={highlightedThread} />}
    </svg>
  );
}
