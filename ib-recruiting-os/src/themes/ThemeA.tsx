/**
 * Theme A — "The Operator"
 *
 * Dark stone/amber. Chat-first. Resume panel slides in when editing activates.
 * Sidebar holds score, guided outcomes, and tool shortcuts.
 * This is the baseline/refined version of the original design.
 */

"use client";

import { useState } from "react";
import FileUpload from "@/components/UploadOverlay";
import ResumePanel from "@/components/ResumePanel";
import ChatPanel from "@/components/ChatPanel";
import IntakeForm from "@/components/IntakeForm";
import ActionSidebar from "@/components/ActionSidebar";
import ExportModal from "@/components/ExportModal";
import { useCoachSession } from "@/hooks/useCoachSession";

export default function ThemeA() {
  const session = useCoachSession();
  const [showExport, setShowExport] = useState(false);

  return (
    <main className="flex h-full w-full overflow-hidden bg-stone-950">
      {!session.resumeText && <FileUpload onUpload={session.handleUpload} />}

      {session.resumeText && (
        <ActionSidebar
          resumeScore={session.resumeScore}
          resumeText={session.resumeText}
          currentResumeText={session.currentResumeText}
          isStreaming={session.isStreaming}
          mode={session.mode}
          messages={session.messages}
          onAction={session.handleAction}
          onNewSession={session.handleNewSession}
          onExport={() => setShowExport(true)}
        />
      )}

      <div className="flex h-full min-w-0 flex-1">
        {/* Resume panel — slides in when edits exist */}
        <div className={`hidden flex-col overflow-hidden transition-all duration-300 ease-in-out md:flex ${
          session.showResumePanel ? "w-2/5 border-r border-stone-800" : "w-0"
        }`}>
          <ResumePanel
            resumeText={session.currentResumeText}
            fileName={session.fileName}
            resumeFile={session.resumeFile}
            resumeHtml={session.resumeHtml}
            updateCount={session.updateCount}
            resumeScore={session.resumeScore}
            candidateProfile={session.candidateProfile}
            onApplyBullet={session.handleApplyBullet}
            onRequestScore={session.handleRequestScore}
          />
        </div>

        {/* Intake or chat */}
        <div className="flex min-w-0 flex-1 flex-col">
          {session.showIntakeForm ? (
            <IntakeForm onSubmit={session.handleIntakeSubmit} />
          ) : (
            <ChatPanel
              messages={session.messages}
              isStreaming={session.isStreaming}
              onSend={session.handleSend}
              mode={session.mode}
              candidateProfile={session.candidateProfile}
            />
          )}
        </div>
      </div>

      {showExport && (
        <ExportModal
          currentResumeText={session.currentResumeText}
          messages={session.messages}
          resumeScore={session.resumeScore}
          onClose={() => setShowExport(false)}
        />
      )}
    </main>
  );
}
