"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ArcNodeComponent from "./ArcNode";
import ThreadEdge from "./ThreadEdge";
import NodeDetailOverlay from "./NodeDetailOverlay";
import { DEMO_NODES, DEMO_THREADS } from "./demoData";

// ── Layout ──────────────────────────────────────────────────────────────────

// Chronological order left→right, gentle upward arc
const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  idp: { x: 0, y: 200 },
  amd: { x: 280, y: 160 },
  baseball: { x: 560, y: 260 },
  krg: { x: 840, y: 120 },
  macro: { x: 1120, y: 220 },
  cimarron: { x: 1400, y: 80 },
  future: { x: 1680, y: 40 },
};

// ── Node & Edge types ───────────────────────────────────────────────────────

const nodeTypes = { arcNode: ArcNodeComponent };
const edgeTypes = { threadEdge: ThreadEdge };

// ── Build React Flow data ───────────────────────────────────────────────────

function buildNodes(): Node[] {
  return DEMO_NODES.map((n) => ({
    id: n.id,
    type: "arcNode",
    position: NODE_POSITIONS[n.id] ?? { x: 0, y: 0 },
    data: { arcNode: n, threads: DEMO_THREADS },
    draggable: true,
  }));
}

function buildEdges(): Edge[] {
  const edges: Edge[] = [];
  for (const thread of DEMO_THREADS) {
    for (let i = 0; i < thread.nodeIds.length - 1; i++) {
      edges.push({
        id: `${thread.id}-${thread.nodeIds[i]}-${thread.nodeIds[i + 1]}`,
        source: thread.nodeIds[i],
        target: thread.nodeIds[i + 1],
        type: "threadEdge",
        data: { color: thread.color },
      });
    }
  }
  return edges;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DecisionArc() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const nodes = useMemo(buildNodes, []);
  const edges = useMemo(buildEdges, []);

  const selectedNode = selectedNodeId
    ? DEMO_NODES.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  return (
    <div className="relative flex h-full flex-col">
      {/* React Flow canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.3}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e8e4dc" gap={20} size={1} />
          <Controls
            position="bottom-left"
            className="!rounded-lg !border-cream-1 !bg-smoke !shadow-none [&>button]:!border-white/[0.06] [&>button]:!bg-smoke [&>button]:!fill-cream/60 hover:[&>button]:!bg-smoke-1"
          />
        </ReactFlow>
      </div>

      {/* Thread legend */}
      <div className="flex items-center gap-4 border-t border-cream-1 bg-white/60 px-4 py-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-smoke/30">
          Threads
        </span>
        {DEMO_THREADS.map((t) => (
          <div key={t.id} className="flex items-center gap-1.5">
            <div
              className="h-[3px] w-5 rounded-full"
              style={{ backgroundColor: t.color }}
            />
            <span className="text-[10px] text-smoke/60">{t.label}</span>
            <span className="text-[10px] text-smoke/30">— {t.desc}</span>
          </div>
        ))}
      </div>

      {/* Node detail overlay */}
      {selectedNode && (
        <NodeDetailOverlay
          node={selectedNode}
          threads={DEMO_THREADS}
          onClose={() => setSelectedNodeId(null)}
        />
      )}
    </div>
  );
}
