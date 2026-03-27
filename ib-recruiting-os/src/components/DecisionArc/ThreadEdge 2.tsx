"use client";

import { SmoothStepEdge, type EdgeProps } from "@xyflow/react";
import { useState } from "react";

export default function ThreadEdge(props: EdgeProps) {
  const [hovered, setHovered] = useState(false);
  const color = (props.data as { color?: string })?.color ?? "#d4845a";

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <SmoothStepEdge
        {...props}
        style={{
          stroke: color,
          strokeWidth: 2,
          opacity: hovered ? 0.8 : 0.4,
          transition: "opacity 150ms",
        }}
      />
    </g>
  );
}
