"use client";

import { useCallback, useRef, useState } from "react";
import { VB_W, VB_H } from "./spine";
import SpineSVG from "./SpineSVG";
import ArcNode from "./ArcNode";
import ThreadLegend from "./ThreadLegend";
import NodeDetailOverlay from "./NodeDetailOverlay";
import { DEMO_NODES, DEMO_THREADS } from "./demoData";

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

export default function DecisionArc() {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedThreadId, setHighlightedThreadId] = useState<string | null>(null);

  // Zoom / pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const dragDist = useRef(0);

  const selectedNode = selectedNodeId
    ? DEMO_NODES.find((n) => n.id === selectedNodeId) ?? null
    : null;

  const onNodeClick = useCallback(
    (nodeId: string) => {
      // Suppress click if user was dragging
      if (dragDist.current > 5) return;
      setSelectedNodeId(nodeId);
    },
    []
  );

  // Wheel → zoom
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => clamp(z + e.deltaY * -0.002, 0.5, 2.5));
  }, []);

  // Mouse → pan
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Don't pan if clicking a node or overlay
      if ((e.target as HTMLElement).closest("[data-arc-node]") || selectedNodeId) return;
      setIsPanning(true);
      dragDist.current = 0;
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    },
    [pan, selectedNodeId]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isPanning) return;
      const dx = e.clientX - panStart.current.x;
      const dy = e.clientY - panStart.current.y;
      dragDist.current = Math.sqrt(dx * dx + dy * dy);
      setPan({
        x: panStart.current.panX + dx,
        y: panStart.current.panY + dy,
      });
    },
    [isPanning]
  );

  const onMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden"
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
      onWheel={onWheel}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Zoom/pan wrapper */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isPanning ? "none" : "transform 0.2s ease-out",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Aspect-ratio-locked canvas */}
        <div
          className="relative"
          style={{
            aspectRatio: `${VB_W} / ${VB_H}`,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          {/* SVG spine layer */}
          <SpineSVG
            overlayOpen={selectedNodeId !== null}
            highlightedThreadId={highlightedThreadId}
          />

          {/* Node cards */}
          {DEMO_NODES.map((node) => (
            <ArcNode
              key={node.id}
              node={node}
              selected={selectedNodeId === node.id}
              highlightedThreadId={highlightedThreadId}
              onClick={() => onNodeClick(node.id)}
            />
          ))}
        </div>
      </div>

      {/* Reset view button — outside zoom wrapper */}
      {(zoom !== 1 || pan.x !== 0 || pan.y !== 0) && (
        <button
          onClick={resetView}
          className="absolute right-3 top-3 z-20 rounded-md border border-cream-1 bg-white/90 px-2.5 py-1 text-[10px] text-smoke/50 backdrop-blur-sm transition-all duration-150 hover:text-smoke/80"
        >
          Reset view
        </button>
      )}

      {/* Thread legend — outside zoom wrapper */}
      <ThreadLegend
        threads={DEMO_THREADS}
        hoveredThreadId={highlightedThreadId}
        onHoverThread={setHighlightedThreadId}
      />

      {/* Node detail overlay — outside zoom wrapper */}
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
