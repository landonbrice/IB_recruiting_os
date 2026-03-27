/**
 * ResumeTab/index.tsx
 *
 * Orchestrator for the Resume tab. Two layout modes:
 * - Default: full-width resume document + coach panel visible
 * - Workshop: compressed resume (40%) + BulletWorkshop (60%), coach panel hidden
 *
 * Wires useCoachSession (resume data) with useResumeWorkshop (workshop state).
 */

"use client";

import { useEffect, useRef } from "react";
import type { CoachSession } from "@/hooks/useCoachSession";
import { useResumeWorkshop } from "@/hooks/useResumeWorkshop";
import ResumeDocument from "./ResumeDocument";
import BulletWorkshop from "./BulletWorkshop";

interface ResumeTabProps {
  session: CoachSession;
  onHideCoach: (hide: boolean) => void;
}

export default function ResumeTab({ session, onHideCoach }: ResumeTabProps) {
  const {
    currentResumeText,
    candidateProfile,
    handleApplyBullet,
  } = session;

  const workshop = useResumeWorkshop({
    currentResumeText,
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
  if (!currentResumeText) {
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
    <div className="flex h-full overflow-hidden">
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
          resumeText={currentResumeText}
          bullets={bullets}
          compressed={isWorkshopOpen}
          workshopBulletId={workshopBulletId}
          previewText={previewText}
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
    </div>
  );
}
