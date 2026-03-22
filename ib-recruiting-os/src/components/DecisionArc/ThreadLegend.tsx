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
    <div className="absolute bottom-14 left-3 z-10 rounded-lg border border-cream-1 bg-white p-3">
      <div className="space-y-2">
        {threads.map((t) => (
          <div
            key={t.id}
            className="flex cursor-default items-center gap-2 transition-opacity duration-150"
            style={{
              opacity: hoveredThreadId && hoveredThreadId !== t.id ? 0.3 : 1,
            }}
            onMouseEnter={() => onHoverThread(t.id)}
            onMouseLeave={() => onHoverThread(null)}
          >
            <div
              className="h-2 w-2 flex-shrink-0 rounded-full"
              style={{ backgroundColor: t.color }}
            />
            <span
              className="text-[11px] font-medium"
              style={{ color: t.color }}
            >
              {t.label}
            </span>
            <span className="text-[10px] text-[#a8a29e]">{t.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
