"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import NavBar, { type TabId } from "@/components/NavBar";
import CoachPanel from "@/components/CoachPanel";
import BottomBar from "@/components/BottomBar";
import DecisionArc from "@/components/DecisionArc";
import StoryBank from "@/components/StoryBank";
import ResumeTab from "@/components/ResumeTab";
import { useCoachSession } from "@/hooks/useCoachSession";

const TAB_LABELS: Record<TabId, string> = {
  resume: "Resume",
  arc: "Decision Arc",
  stories: "Story Bank",
  cover: "Cover Letter",
  targets: "Targets",
};

const TAB_DESCRIPTIONS: Partial<Record<TabId, string>> = {
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
  const [hideCoach, setHideCoach] = useState(false);

  // Lift session to AppShell so it restores from sessionStorage on mount
  // regardless of which tab is active. Pass down to ResumeTab.
  const session = useCoachSession();

  // Auto-switch to Resume tab when resume data first becomes available
  const hasAutoSwitched = useRef(false);
  const resumeAvailable = session.currentResumeText || session.resumeText;
  useEffect(() => {
    if (resumeAvailable && !hasAutoSwitched.current) {
      hasAutoSwitched.current = true;
      setActiveTab("resume");
    }
  }, [resumeAvailable]);

  const handleHideCoach = useCallback((hide: boolean) => {
    setHideCoach(hide);
  }, []);

  const showCoach = !(hideCoach && activeTab === "resume");

  // Route bottom bar actions to session methods
  const handleBottomBarAction = useCallback((action: string) => {
    switch (action) {
      case "Score resume":
        session.handleRequestScore();
        break;
      case "Check verbs":
        session.handleAction("Scan my resume for weak verbs and suggest replacements");
        break;
      case "Export":
        // TODO: wire export modal
        break;
      case "Template check":
        session.handleAction("Check my resume against IB template compliance standards");
        break;
      default:
        // For unhandled actions, send as coach message
        session.handleAction(action);
        break;
    }
  }, [session]);

  return (
    <div className="flex h-full w-full flex-col">
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="flex flex-1 overflow-hidden">
        {/* Cream Canvas */}
        <div className="flex-1 p-[10px]">
          <div className="relative flex h-full flex-col overflow-auto rounded-[10px] bg-cream">
            {activeTab === "resume" && (
              <ResumeTab session={session} onHideCoach={handleHideCoach} />
            )}
            {activeTab === "arc" && <DecisionArc />}
            {activeTab === "stories" && <StoryBank />}
            {activeTab !== "resume" && activeTab !== "arc" && activeTab !== "stories" && (
              <TabPlaceholder tab={activeTab} />
            )}
          </div>
        </div>

        {/* Coach Panel with fade transition */}
        <div
          style={{
            width: showCoach ? 220 : 0,
            opacity: showCoach ? 1 : 0,
            overflow: "hidden",
            transition: "width 250ms ease, opacity 200ms ease",
            flexShrink: 0,
          }}
        >
          <CoachPanel />
        </div>
      </div>

      <BottomBar activeTab={activeTab} onAction={handleBottomBarAction} />
    </div>
  );
}
