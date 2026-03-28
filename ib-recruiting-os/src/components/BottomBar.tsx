"use client";

import type { TabId } from "@/components/NavBar";

const TAB_ACTIONS: Record<TabId, string[]> = {
  resume: ["Score resume", "Check verbs", "Export", "Template check"],
  arc: ["+ Add Node", "Connect Thread", "Readiness"],
  stories: ["+ Add Story", "Practice Mode", "Export"],
  cover: ["Switch target", "Regenerate", "Export"],
  targets: ["+ Add Target", "Compare"],
};

interface BottomBarProps {
  activeTab: TabId;
  onAction?: (action: string) => void;
}

export default function BottomBar({ activeTab, onAction }: BottomBarProps) {
  const actions = TAB_ACTIONS[activeTab];

  return (
    <div className="flex h-10 items-center border-t border-white/[0.06] bg-smoke px-4">
      <div className="flex items-center gap-2">
        {actions.map((label) => (
          <button
            key={label}
            onClick={() => onAction?.(label)}
            className="rounded-[5px] border border-white/[0.12] bg-transparent px-2.5 py-1 text-[10px] text-cream/50 transition-all duration-150 hover:border-white/[0.18] hover:text-cream/70"
          >
            {label}
          </button>
        ))}
      </div>
      <span className="ml-auto text-[9px] text-cream/15">v0.1</span>
    </div>
  );
}
