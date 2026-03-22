"use client";

import { BezierEdge, type EdgeProps } from "@xyflow/react";
import { useState } from "react";

interface ThreadEdgeData {
  color?: string;
  highlighted?: boolean;
  dimmed?: boolean;
}

export default function ThreadEdge(props: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const edgeData = props.data as ThreadEdgeData | undefined;
  const color = edgeData?.color ?? "#d4845a";
  const highlighted = edgeData?.highlighted ?? false;
  const dimmed = edgeData?.dimmed ?? false;

  let opacity = 0.25;
  if (highlighted) opacity = 0.8;
  else if (dimmed) opacity = 0.1;
  else if (hovered) opacity = 0.6;

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <BezierEdge
        {...props}
        style={{
          stroke: color,
          strokeWidth: 2,
          opacity,
          transition: "opacity 150ms",
        }}
      />
    </g>
  );
}
