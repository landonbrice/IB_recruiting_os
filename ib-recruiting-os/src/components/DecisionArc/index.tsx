"use client";

import { useCallback, useState } from "react";
import SpineSVG from "./SpineSVG";
import ArcNode from "./ArcNode";
import ThreadLegend from "./ThreadLegend";
import NodeDetailOverlay from "./NodeDetailOverlay";
import { DEMO_NODES, DEMO_THREADS } from "./demoData";

export default function DecisionArc() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(null);

  const selectedNode = selectedNodeId
    ? DEMO_NODES.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const onNodeClick = useCallback((nodeId: string) => {
    setSelectedNodeId(nodeId);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* SVG spine layer */}
      <SpineSVG
        overlayOpen={selectedNodeId !== null}
        highlightedThreadId={highlightedThreadId}
      />

      {/* Node cards — positioned via percentages matching SVG viewBox */}
      {DEMO_NODES.map((node) => (
        <ArcNode
          key={node.id}
          node={node}
          selected={selectedNodeId === node.id}
          highlightedThreadId={highlightedThreadId}
          onClick={() => onNodeClick(node.id)}
        />
      ))}

      {/* Thread legend */}
      <ThreadLegend
        threads={DEMO_THREADS}
        hoveredThreadId={highlightedThreadId}
        onHoverThread={setHighlightedThreadId}
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
