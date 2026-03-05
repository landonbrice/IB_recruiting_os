"use client";

import { useState, useCallback, useRef } from "react";
import FileUpload from "@/components/UploadOverlay";
import ResumePanel from "@/components/ResumePanel";
import ChatPanel from "@/components/ChatPanel";
import IntakeForm from "@/components/IntakeForm";
import ActionSidebar from "@/components/ActionSidebar";
import type { Message, ChatMode, CandidateProfile, ResumeUpdate, ResumeScore } from "@/lib/types";

// ─── Resume-update helpers ──────────────────────────────────────────────────

function parseResumeScore(content: string): ResumeScore | null {
  const match = /```resume-score\n([\s\S]*?)```/.exec(content);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim()) as ResumeScore;
  } catch {
    return null;
  }
}

function parseProfileUpdate(content: string): Partial<CandidateProfile> | null {
  const match = /```profile-update\n([\s\S]*?)```/.exec(content);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as Partial<CandidateProfile>;
  } catch {
    return null;
  }
}

function parseResumeUpdates(content: string): ResumeUpdate[] {
  const updates: ResumeUpdate[] = [];
  const regex = /```resume-update\n([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    try {
      updates.push(JSON.parse(match[1]));
    } catch {
      // skip malformed blocks
    }
  }
  return updates;
}

function applyUpdate(text: string, update: ResumeUpdate): string {
  if (!update.company || update.bulletIndex === undefined) return text;

  const lines = text.split("\n");
  let companyIdx = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(update.company)) {
      companyIdx = i;
      break;
    }
  }
  if (companyIdx === -1) return text;

  let bulletCount = 0;
  let inBulletSection = false;
  for (let i = companyIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue; // skip blank lines
    const isBullet = /^[▪•\-·]/.test(trimmed);
    // Only break on actual section headers, not continuation lines
    const isNewSection =
      (trimmed === trimmed.toUpperCase() && trimmed.length < 40) ||
      /^(Education|Experience|Skills|Activities|Leadership|Projects|Summary|Objective|Work Experience|Extracurriculars)/i.test(trimmed);
    if (isNewSection && inBulletSection) break;
    if (isBullet) {
      inBulletSection = true;
      if (bulletCount === update.bulletIndex) {
        const prefix = lines[i].match(/^(\s*[▪•\-·]\s*)/)?.[1] ?? "▪ ";
        lines[i] = prefix + update.newText;
        break;
      }
      bulletCount++;
    }
    // Non-bullet, non-section lines = continuation text — skip, don't break
  }

  return lines.join("\n");
}

// ─── Mode detection ─────────────────────────────────────────────────────────

function detectMode(content: string): ChatMode | null {
  const lower = content.toLowerCase();
  if (lower.includes("```feasibility-score")) return "feasibility";
  if (lower.includes("```resume-update")) return "editing";
  if (lower.includes("why ib") || lower.includes("your story") || lower.includes("narrative")) return "story";
  if (lower.includes("targeting") && lower.includes("bank")) return "targeting";
  return null;
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function Home() {
  const [resumeText, setResumeText] = useState<string | null>(null);       // raw text for Claude
  const [currentResumeText, setCurrentResumeText] = useState<string | null>(null); // live-edited text
  const [resumeFile, setResumeFile] = useState<File | null>(null);         // original file for PDF iframe
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);       // mammoth HTML for DOCX
  const [fileName, setFileName] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<ChatMode>("diagnostic");
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>({});
  const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null);
  const [showIntakeForm, setShowIntakeForm] = useState(false);
  const autoScoreQueued = useRef(false);

  // ── Upload ────────────────────────────────────────────────────────────────

  const handleUpload = useCallback(
    async (text: string, name: string, file: File, html?: string) => {
      setResumeText(text);
      setCurrentResumeText(text);
      setFileName(name);
      setResumeFile(file);
      if (html) setResumeHtml(html);
      setShowIntakeForm(true);
    },
    []
  );

  // ── Streaming chat ────────────────────────────────────────────────────────

  const streamChat = useCallback(
    async (
      msgs: Message[],
      currentText: string | null = resumeText,
      isFirstMessage = false,
      profileOverride?: Partial<CandidateProfile>
    ) => {
      setIsStreaming(true);
      let assistantContent = "";
      let scoreUpdate: ResumeScore | null = null;
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: msgs,
            resumeText: currentText,
            mode,
            candidateProfile: profileOverride ?? candidateProfile,
            isFirstMessage,
          }),
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6);
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data);
              assistantContent += parsed.delta?.text ?? "";
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                return updated;
              });
            } catch {
              // skip malformed chunks
            }
          }
        }

        // Detect mode shift
        const newMode = detectMode(assistantContent);
        if (newMode) setMode(newMode);

        // Parse and merge profile updates
        const profileUpdate = parseProfileUpdate(assistantContent);
        if (profileUpdate) {
          setCandidateProfile((prev) => ({ ...prev, ...profileUpdate }));
        }

        // Parse resume score
        scoreUpdate = parseResumeScore(assistantContent);
        if (scoreUpdate) {
          setResumeScore(scoreUpdate);
        }

        // Parse and apply resume updates
        const updates = parseResumeUpdates(assistantContent);
        if (updates.length > 0) {
          setCurrentResumeText((prev) => {
            let text = prev ?? "";
            for (const u of updates) text = applyUpdate(text, u);
            return text;
          });
          setUpdateCount((n) => n + updates.length);
        }
      } catch (err) {
        console.error("Stream error:", err);
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "Something went wrong. Please try again.",
          };
          return updated;
        });
      } finally {
        setIsStreaming(false);

        // Auto-score after first intake response if no score was produced
        if (autoScoreQueued.current && !scoreUpdate) {
          autoScoreQueued.current = false;
          // Defer to next tick so state settles
          setTimeout(() => {
            const scoreMsg: Message = { role: "user", content: "Score my resume" };
            setMessages((prev) => {
              const next = [...prev, scoreMsg];
              streamChat(next);
              return next;
            });
          }, 500);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resumeText, mode, candidateProfile]
  );

  // ── Apply bullet from modal ───────────────────────────────────────────────

  const handleApplyBullet = useCallback(
    (bulletIndex: number, company: string, newText: string) => {
      setCurrentResumeText((prev) => {
        const text = applyUpdate(prev ?? "", { section: "", company, bulletIndex, newText });
        return text;
      });
      setUpdateCount((n) => n + 1);
    },
    []
  );

  // ── Intake form submit ────────────────────────────────────────────────────

  const handleIntakeSubmit = useCallback(
    (profile: Partial<CandidateProfile>) => {
      setCandidateProfile(profile as CandidateProfile);
      setShowIntakeForm(false);
      autoScoreQueued.current = true;
      const seed: Message[] = [{ role: "user", content: "__resume_uploaded__" }];
      setMessages(seed);
      streamChat(seed, resumeText, true, profile);
    },
    [resumeText, streamChat]
  );

  // ── Action sidebar handlers ─────────────────────────────────────────────

  const handleAction = useCallback(
    (action: string) => {
      const userMessage: Message = { role: "user", content: action };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      streamChat(updatedMessages);
    },
    [messages, streamChat]
  );

  const handleRequestScore = useCallback(() => {
    handleAction("Re-score my resume with the latest changes");
  }, [handleAction]);

  // ── Send ──────────────────────────────────────────────────────────────────

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage: Message = { role: "user", content };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      await streamChat(updatedMessages);
    },
    [messages, streamChat]
  );

  // ── Render ────────────────────────────────────────────────────────────────

  // Filter synthetic seed message from chat display
  const visibleMessages = messages.filter((m) => m.content !== "__resume_uploaded__");

  // Resume panel slides in when session shifts to editing mode
  const showResumePanel = mode === "editing" || updateCount > 0;

  return (
    <main className="flex h-full w-full overflow-hidden">
      {!resumeText && <FileUpload onUpload={handleUpload} />}

      {/* Action Sidebar — visible after upload */}
      {resumeText && (
        <ActionSidebar
          resumeScore={resumeScore}
          resumeText={resumeText}
          currentResumeText={currentResumeText}
          isStreaming={isStreaming}
          onAction={handleAction}
        />
      )}

      <div className="flex h-full min-w-0 flex-1">
        {/* Resume panel — slides in when editing mode activates */}
        <div
          className={`hidden flex-col overflow-hidden transition-all duration-300 ease-in-out md:flex ${
            showResumePanel ? "w-2/5 border-r border-stone-800" : "w-0"
          }`}
        >
          <ResumePanel
            resumeText={currentResumeText}
            fileName={fileName}
            resumeFile={resumeFile}
            resumeHtml={resumeHtml}
            updateCount={updateCount}
            resumeScore={resumeScore}
            candidateProfile={candidateProfile}
            onApplyBullet={handleApplyBullet}
            onRequestScore={handleRequestScore}
          />
        </div>

        {/* Intake form or chat panel — expands to fill available space */}
        <div className="flex min-w-0 flex-1 flex-col">
          {showIntakeForm ? (
            <IntakeForm onSubmit={handleIntakeSubmit} />
          ) : (
            <ChatPanel
              messages={visibleMessages}
              isStreaming={isStreaming}
              onSend={handleSend}
              mode={mode}
              candidateProfile={candidateProfile}
            />
          )}
        </div>
      </div>
    </main>
  );
}
