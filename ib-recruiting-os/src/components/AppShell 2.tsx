"use client";

import { useState } from "react";
import NavBar, { type TabId } from "@/components/NavBar";
import CoachPanel from "@/components/CoachPanel";
import BottomBar from "@/components/BottomBar";
import DecisionArc from "@/components/DecisionArc";

const TAB_LABELS: Record<TabId, string> = {
  resume: "Resume",
  arc: "Decision Arc",
  stories: "Story Bank",
  cover: "Cover Letter",
  targets: "Targets",
};

const TAB_DESCRIPTIONS: Partial<Record<TabId, string>> = {
  resume: "Coming soon",
  stories: "Your behavioral story arsenal. Develop stories through the Decision Arc first.",
  cover: "Coming soon",
  targets: "Coming soon",
};

function TabPlaceholder({ tab }: { tab: TabId }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-smoke">{TAB_LABELS[tab]}</h2>
        <p className="mt-1 text-sm text-smoke/40">{TAB_DESCRIPTIONS[tab]}</p>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [activeTab, setActiveTab] = useState<TabId>("arc");

  return (
    <div className="flex h-full w-full flex-col">
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        {/* Cream Canvas */}
        <div className="flex-1 p-[10px]">
          <div className="relative flex h-full flex-col overflow-auto rounded-[10px] bg-cream">
            {activeTab === "arc" ? <DecisionArc /> : <TabPlaceholder tab={activeTab} />}
          </div>
        </div>

        <CoachPanel />
      </div>

      <BottomBar activeTab={activeTab} />
    </div>
  );
}
