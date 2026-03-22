"use client";

import type { Thread } from "@/lib/storyState";

interface ThreadLegendProps {
  threads: Thread[];
  hoveredThreadId: string | null;
  onHoverThread: (threadId: string | null) => void;
}

export default function ThreadLegend({
  threads,
  hoveredThreadId,
  onHoverThread,
}: ThreadLegendProps) {
  return (
    <div
      className="absolute bottom-4 left-3 z-20 rounded-[10px] border-[0.5px] border-cream-1 p-3"
      style={{
        background: "rgba(255,255,255,0.94)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="mb-2 text-[8px] font-semibold uppercase tracking-wider text-smoke/25">
        Threads
      </div>
      <div className="space-y-2">
        {threads.map((t) => {
          const isActive = hoveredThreadId === t.id;
          const isDimmed = hoveredThreadId !== null && !isActive;
          return (
            <div
              key={t.id}
              className="flex cursor-default items-center gap-2"
              style={{
                opacity: isDimmed ? 0.2 : 1,
                transition: "opacity 0.25s",
              }}
              onMouseEnter={() => onHoverThread(t.id)}
              onMouseLeave={() => onHoverThread(null)}
            >
              <div
                className="flex-shrink-0 rounded-full"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: t.color,
                  transform: isActive ? "scale(1.3)" : "scale(1)",
                  boxShadow: isActive ? `0 0 8px ${t.color}50` : "none",
                  transition: "transform 0.25s, box-shadow 0.25s",
                }}
              />
              <span
                className="text-[11px] font-medium"
                style={{ color: isActive ? t.color : "#2a2826" }}
              >
                {t.label}
              </span>
              <span className="text-[9px] text-[#a8a29e]">{t.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
