"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import ArcNodeComponent from "./ArcNode";
import ThreadEdge from "./ThreadEdge";
import ThreadLegend from "./ThreadLegend";
import NodeDetailOverlay from "./NodeDetailOverlay";
import { DEMO_NODES, DEMO_THREADS } from "./demoData";

// ── Layout — ascending arc, bottom-left to upper-right ──────────────────────

const NODE_POSITIONS: Record<string, { x: number; y: number }> = {
  idp:      { x: 0,    y: 500 },
  amd:      { x: 280,  y: 380 },
  baseball: { x: 500,  y: 420 },
  krg:      { x: 720,  y: 260 },
  macro:    { x: 850,  y: 350 },
  cimarron: { x: 1050, y: 140 },
  future:   { x: 1250, y: 50  },
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

function buildEdges(hoveredThreadId: string | null): Edge[] {
  const edges: Edge[] = [];
  for (const thread of DEMO_THREADS) {
    for (let i = 0; i < thread.nodeIds.length - 1; i++) {
      const highlighted = hoveredThreadId === thread.id;
      const dimmed = hoveredThreadId !== null && hoveredThreadId !== thread.id;
      edges.push({
        id: `${thread.id}-${thread.nodeIds[i]}-${thread.nodeIds[i + 1]}`,
        source: thread.nodeIds[i],
        target: thread.nodeIds[i + 1],
        type: "threadEdge",
        data: { color: thread.color, highlighted, dimmed },
        animated: false,
      });
    }
  }
  return edges;
}

// ── Component ───────────────────────────────────────────────────────────────

export default function DecisionArc() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredThreadId, setHoveredThreadId] = useState<string | null>(null);

  const nodes = useMemo(buildNodes, []);
  const edges = useMemo(() => buildEdges(hoveredThreadId), [hoveredThreadId]);

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
          minZoom={0.4}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e8e4dc" gap={24} size={1} />
        </ReactFlow>
      </div>

      {/* Thread legend — floating panel */}
      <ThreadLegend
        threads={DEMO_THREADS}
        hoveredThreadId={hoveredThreadId}
        onHoverThread={setHoveredThreadId}
      />

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
