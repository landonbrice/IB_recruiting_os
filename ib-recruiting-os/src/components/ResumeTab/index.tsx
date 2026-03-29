/**
 * ResumeTab/index.tsx
 *
 * Orchestrator for the Resume tab. Two layout modes:
 * - Default: full-width resume document + coach panel visible
 * - Workshop: compressed resume (40%) + BulletWorkshop (60%), coach panel hidden
 *
 * Wires useCoachSession (resume data) with useResumeWorkshop (workshop state).
 * Includes floating score badge when resume score is available.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { CoachSession } from "@/hooks/useCoachSession";
import { useResumeWorkshop } from "@/hooks/useResumeWorkshop";
import ResumeDocument from "./ResumeDocument";
import BulletWorkshop from "./BulletWorkshop";
import ScoreCard from "@/components/ScoreCard";
import IntakeForm from "@/components/IntakeForm";

interface ResumeTabProps {
  session: CoachSession;
  onHideCoach: (hide: boolean) => void;
  verbHighlightMode?: boolean;
}

export default function ResumeTab({ session, onHideCoach, verbHighlightMode = false }: ResumeTabProps) {
  const {
    currentResumeText,
    resumeText,
    candidateProfile,
    resumeScore,
    showIntakeForm,
    handleIntakeSubmit,
    handleApplyBullet,
  } = session;

  const [showScoreCard, setShowScoreCard] = useState(false);

  // Use currentResumeText (with edits) if available, fall back to original resumeText
  const displayText = currentResumeText ?? resumeText;

  const workshop = useResumeWorkshop({
    currentResumeText: displayText,
    candidateProfile,
    onApplyBullet: handleApplyBullet,
  });

  const {
    bullets,
    workshopBulletId,
    activeBullet,
    selectedRewriteId,
    previewText,
    isGeneratingRewrites,
    isWorkshopStreaming,
    openWorkshop,
    closeWorkshop,
    navigateBullet,
    selectRewrite,
    applySelectedRewrite,
    sendBulletChat,
    regenerateRewrites,
    addCoachRewriteToOptions,
  } = workshop;

  const isWorkshopOpen = workshopBulletId !== null;

  // Signal to AppShell to hide/show coach panel
  const prevHideRef = useRef(false);
  useEffect(() => {
    if (isWorkshopOpen !== prevHideRef.current) {
      prevHideRef.current = isWorkshopOpen;
      onHideCoach(isWorkshopOpen);
    }
  }, [isWorkshopOpen, onHideCoach]);

  // Compute bullet position for workshop header
  const bulletPosition = activeBullet
    ? {
        current: bullets.findIndex((b) => b.id === activeBullet.id) + 1,
        total: bullets.length,
      }
    : { current: 0, total: 0 };

  // No resume uploaded yet
  if (!displayText) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] font-semibold" style={{ color: "#44403c" }}>
            No resume loaded
          </p>
          <p className="mt-1 text-[12px]" style={{ color: "#a8a29e" }}>
            Upload a resume from the landing page to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full overflow-hidden">
      {/* Resume Document */}
      <div
        style={{
          flexBasis: isWorkshopOpen ? "40%" : "100%",
          flexShrink: 0,
          transition: "flex-basis 250ms ease",
          minWidth: 0,
        }}
      >
        <ResumeDocument
          resumeText={displayText}
          bullets={bullets}
          compressed={isWorkshopOpen}
          workshopBulletId={workshopBulletId}
          previewText={previewText}
          verbHighlightMode={verbHighlightMode}
          onBulletClick={openWorkshop}
        />
      </div>

      {/* Bullet Workshop */}
      <div
        style={{
          flexBasis: isWorkshopOpen ? "60%" : "0%",
          transition: "flex-basis 250ms ease",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        {activeBullet && (
          <BulletWorkshop
            bullet={activeBullet}
            bulletPosition={bulletPosition}
            candidateProfile={candidateProfile}
            selectedRewriteId={selectedRewriteId}
            isGeneratingRewrites={isGeneratingRewrites}
            isWorkshopStreaming={isWorkshopStreaming}
            onClose={closeWorkshop}
            onNavigate={navigateBullet}
            onSelectRewrite={selectRewrite}
            onApplyRewrite={applySelectedRewrite}
            onRegenerateRewrites={regenerateRewrites}
            onSendChat={sendBulletChat}
            onAddCoachRewrite={addCoachRewriteToOptions}
          />
        )}
      </div>

      {/* Intake Form Modal */}
      {showIntakeForm && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-smoke/60 backdrop-blur-sm">
          <IntakeForm onSubmit={handleIntakeSubmit} />
        </div>
      )}

      {/* Verb Highlight Legend */}
      {verbHighlightMode && !isWorkshopOpen && (
        <div
          className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2 flex items-center gap-4 rounded-[8px] bg-white px-4 py-2"
          style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "1px solid #e8e4dc" }}
        >
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#22c55e" }} />
            Strong
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#d97706" }} />
            Moderate
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#ef4444" }} />
            Weak
          </span>
        </div>
      )}

      {/* Floating Score Badge */}
      {resumeScore && !isWorkshopOpen && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setShowScoreCard((v) => !v)}
            className="flex items-center gap-2 rounded-[10px] bg-white px-3 py-2 transition-all hover:shadow-md"
            style={{
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              border: "1px solid #e8e4dc",
            }}
          >
            <ScoreRing score={resumeScore.total} size={32} />
            <div className="text-left">
              <p className="text-[10px] font-semibold" style={{ color: "#44403c" }}>
                {resumeScore.total}/100
              </p>
              <p className="text-[8px]" style={{ color: "#a8a29e" }}>
                {showScoreCard ? "Hide details" : "View details"}
              </p>
            </div>
          </button>

          {/* Expanded ScoreCard dropdown (dark bg to match ScoreCard's stone theme) */}
          {showScoreCard && (
            <div
              className="mt-2 rounded-[10px] overflow-auto"
              style={{
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                backgroundColor: "#1c1917",
                maxHeight: 400,
                width: 320,
              }}
            >
              <ScoreCard score={resumeScore} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Mini circular score ring for the floating badge */
function ScoreRing({ score, size }: { score: number; size: number }) {
  const radius = (size - 4) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#d97706" : "#ef4444";

  return (
    <svg width={size} height={size} className="flex-shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e8e4dc"
        strokeWidth={2.5}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}
