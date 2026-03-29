"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import NavBar, { type TabId } from "@/components/NavBar";
import CoachPanel from "@/components/CoachPanel";
import BottomBar from "@/components/BottomBar";
import DecisionArc from "@/components/DecisionArc";
import StoryBank from "@/components/StoryBank";
import ResumeTab from "@/components/ResumeTab";
import ExportModal from "@/components/ExportModal";
import { useCoachSession } from "@/hooks/useCoachSession";

const TAB_DESCRIPTIONS: Partial<Record<TabId, string>> = {
  cover: "Coming soon",
  targets: "Coming soon",
};

const TAB_LABELS: Record<TabId, string> = {
  resume: "Resume",
  arc: "Decision Arc",
  stories: "Story Bank",
  cover: "Cover Letter",
  targets: "Targets",
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
  const [verbHighlightMode, setVerbHighlightMode] = useState(false);
  const [showExport, setShowExport] = useState(false);

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

  // Turn off verb highlight when leaving resume tab
  useEffect(() => {
    if (activeTab !== "resume") setVerbHighlightMode(false);
  }, [activeTab]);

  // Route bottom bar actions
  const handleBottomBarAction = useCallback((action: string) => {
    switch (action) {
      case "Score resume":
        session.handleRequestScore();
        break;
      case "Check verbs":
        setVerbHighlightMode((v) => !v);
        break;
      case "Export":
        setShowExport(true);
        break;
      case "Template check":
        session.handleAction("Check my resume against IB template compliance standards");
        break;
      default:
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
              <ResumeTab
                session={session}
                onHideCoach={handleHideCoach}
                verbHighlightMode={verbHighlightMode}
              />
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
          <CoachPanel session={session} />
        </div>
      </div>

      <BottomBar activeTab={activeTab} onAction={handleBottomBarAction} />

      {/* Export Modal */}
      {showExport && (
        <ExportModal
          currentResumeText={session.currentResumeText}
          messages={session.messages}
          resumeScore={session.resumeScore}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
