/**
 * useCoachSession.ts
 *
 * All coaching session state and logic, extracted from the app page.
 * Each UI theme consumes this hook — zero logic duplication across variants.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  parseResumeScore,
  parseProfileUpdate,
  parseResumeUpdates,
  detectMode,
} from "@/lib/protocolParser";
import { logEvent } from "@/lib/sessionLog";
import type {
  Message,
  ChatMode,
  CandidateProfile,
  ResumeUpdate,
  ResumeScore,
} from "@/lib/types";

// ── Persistence ──────────────────────────────────────────────────────────────

const LS_KEY = "ib_coach_session_v1";

interface PersistedSession {
  messages: Message[];
  candidateProfile: CandidateProfile;
  resumeText: string | null;
  currentResumeText: string | null;
  resumeScore: ResumeScore | null;
  mode: ChatMode;
  updateCount: number;
  fileName: string | null;
  resumeHtml: string | null;
}

function loadSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch { return null; }
}

function saveSession(s: PersistedSession) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch {/* quota */}
}

// ── Resume update applier ─────────────────────────────────────────────────────

function applyUpdate(text: string, update: ResumeUpdate): string {
  if (!update.company || update.bulletIndex === undefined) return text;
  const lines = text.split("\n");
  let companyIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(update.company)) { companyIdx = i; break; }
  }
  if (companyIdx === -1) return text;

  let bulletCount = 0;
  let inBulletSection = false;
  for (let i = companyIdx + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;
    const isBullet = /^[▪•\-·]/.test(trimmed);
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
  }
  return lines.join("\n");
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCoachSession() {
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [currentResumeText, setCurrentResumeText] = useState<string | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeHtml, setResumeHtml] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [mode, setMode] = useState<ChatMode>("diagnostic");
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile>({});
  const [resumeScore, setResumeScore] = useState<ResumeScore | null>(null);
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  const autoScoreQueued = useRef(false);
  const isRestoredRef = useRef(false);

  // ── Restore on mount ────────────────────────────────────────────────────
  useEffect(() => {
    const ssResumeText = sessionStorage.getItem("resume_text");
    if (ssResumeText) {
      const ssFileName = sessionStorage.getItem("resume_filename") ?? "resume";
      const ssHtml = sessionStorage.getItem("resume_html") ?? null;
      const ssFileData = sessionStorage.getItem("resume_file_data");
      const ssFileType = sessionStorage.getItem("resume_file_type") ?? "application/pdf";
      const ssFileFinalName = sessionStorage.getItem("resume_file_name") ?? ssFileName;

      setResumeText(ssResumeText);
      setCurrentResumeText(ssResumeText);
      setFileName(ssFileName);
      if (ssHtml) setResumeHtml(ssHtml);
      if (ssFileData) {
        fetch(ssFileData).then(r => r.blob()).then(blob => {
          setResumeFile(new File([blob], ssFileFinalName, { type: ssFileType }));
        }).catch(() => {});
      }
      setShowIntakeForm(true);
      logEvent("session_start", { source: "landing" });
      ["resume_text","resume_filename","resume_html","resume_file_data","resume_file_name","resume_file_type"]
        .forEach(k => sessionStorage.removeItem(k));
      isRestoredRef.current = true;
      return;
    }

    const saved = loadSession();
    if (saved?.resumeText) {
      setResumeText(saved.resumeText);
      setCurrentResumeText(saved.currentResumeText);
      setFileName(saved.fileName);
      setResumeHtml(saved.resumeHtml);
      setMessages(saved.messages);
      setCandidateProfile(saved.candidateProfile);
      setResumeScore(saved.resumeScore);
      setMode(saved.mode);
      setUpdateCount(saved.updateCount);
      logEvent("session_restored", { messageCount: saved.messages.length });
    }
    isRestoredRef.current = true;
  }, []);

  // ── Debounced save ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRestoredRef.current || !resumeText) return;
    const t = setTimeout(() => saveSession({
      messages, candidateProfile, resumeText, currentResumeText,
      resumeScore, mode, updateCount, fileName, resumeHtml,
    }), 500);
    return () => clearTimeout(t);
  }, [messages, candidateProfile, resumeText, currentResumeText,
      resumeScore, mode, updateCount, fileName, resumeHtml]);

  // ── Upload ──────────────────────────────────────────────────────────────
  const handleUpload = useCallback((text: string, name: string, file: File, html?: string) => {
    setResumeText(text);
    setCurrentResumeText(text);
    setFileName(name);
    setResumeFile(file);
    if (html) setResumeHtml(html);
    setShowIntakeForm(true);
    logEvent("resume_uploaded", { fileName: name });
  }, []);

  // ── New Session ─────────────────────────────────────────────────────────
  const handleNewSession = useCallback(() => {
    try { localStorage.removeItem(LS_KEY); } catch {/* */}
    setResumeText(null); setCurrentResumeText(null); setFileName(null);
    setResumeFile(null); setResumeHtml(null); setMessages([]);
    setCandidateProfile({}); setResumeScore(null);
    setMode("diagnostic"); setUpdateCount(0); setShowIntakeForm(false);
    logEvent("session_reset", {});
  }, []);

  // ── Stream chat ─────────────────────────────────────────────────────────
  const streamChat = useCallback(async (
    msgs: Message[],
    currentText: string | null = resumeText,
    isFirstMessage = false,
    profileOverride?: Partial<CandidateProfile>,
  ) => {
    setIsStreaming(true);
    let assistantContent = "";
    let scoreUpdate: ResumeScore | null = null;
    setMessages(prev => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: msgs, resumeText: currentText, mode,
          candidateProfile: profileOverride ?? candidateProfile, isFirstMessage,
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
          const raw = line.slice(6);
          if (raw === "[DONE]") break;
          try {
            const parsed = JSON.parse(raw) as { delta?: { text?: string } };
            assistantContent += parsed.delta?.text ?? "";
            setMessages(prev => {
              const u = [...prev];
              u[u.length - 1] = { role: "assistant", content: assistantContent };
              return u;
            });
          } catch {/* skip */}
        }
      }

      const newMode = detectMode(assistantContent);
      if (newMode && newMode !== mode) {
        logEvent("mode_shift", { from: mode, to: newMode });
        setMode(newMode);
      }

      const profileUpdate = parseProfileUpdate(assistantContent);
      if (profileUpdate) {
        setCandidateProfile(prev => ({ ...prev, ...profileUpdate }));
        logEvent("profile_updated", profileUpdate as Record<string, unknown>);
      }

      scoreUpdate = parseResumeScore(assistantContent);
      if (scoreUpdate) {
        setResumeScore(s => {
          logEvent("score_updated", { total: scoreUpdate!.total, prev: s?.total ?? null });
          return scoreUpdate;
        });
      }

      const updates = parseResumeUpdates(assistantContent);
      if (updates.length > 0) {
        setCurrentResumeText(prev => {
          let t = prev ?? "";
          for (const u of updates) t = applyUpdate(t, u);
          return t;
        });
        setUpdateCount(n => { logEvent("bullets_applied", { count: updates.length }); return n + updates.length; });
      }
    } catch (err) {
      logEvent("stream_error", { error: String(err) });
      setMessages(prev => {
        const u = [...prev];
        u[u.length - 1] = { role: "assistant", content: "Something went wrong. Please try again." };
        return u;
      });
    } finally {
      setIsStreaming(false);
      if (autoScoreQueued.current && !scoreUpdate) {
        autoScoreQueued.current = false;
        setTimeout(() => {
          const m: Message = { role: "user", content: "Score my resume" };
          setMessages(prev => { const next = [...prev, m]; streamChat(next); return next; });
        }, 500);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeText, mode, candidateProfile]);

  // ── Apply bullet ────────────────────────────────────────────────────────
  const handleApplyBullet = useCallback((bulletIndex: number, company: string, newText: string) => {
    setCurrentResumeText(prev => applyUpdate(prev ?? "", { section: "", company, bulletIndex, newText }));
    setUpdateCount(n => { logEvent("bullet_applied_manual", { company, bulletIndex }); return n + 1; });
  }, []);

  // ── Intake submit ───────────────────────────────────────────────────────
  const handleIntakeSubmit = useCallback((profile: Partial<CandidateProfile>) => {
    setCandidateProfile(profile as CandidateProfile);
    setShowIntakeForm(false);
    autoScoreQueued.current = true;
    const seed: Message[] = [{ role: "user", content: "__resume_uploaded__" }];
    setMessages(seed);
    logEvent("intake_submitted", profile as Record<string, unknown>);
    streamChat(seed, resumeText, true, profile);
  }, [resumeText, streamChat]);

  // ── Action shortcuts ────────────────────────────────────────────────────
  const handleAction = useCallback((action: string) => {
    const msg: Message = { role: "user", content: action };
    const updated = [...messages, msg];
    setMessages(updated);
    streamChat(updated);
  }, [messages, streamChat]);

  const handleSend = useCallback(async (content: string) => {
    const msg: Message = { role: "user", content };
    const updated = [...messages, msg];
    setMessages(updated);
    await streamChat(updated);
  }, [messages, streamChat]);

  const handleRequestScore = useCallback(
    () => handleAction("Re-score my resume with the latest changes"),
    [handleAction]
  );

  // ── Derived state ───────────────────────────────────────────────────────
  const visibleMessages = messages.filter(m => m.content !== "__resume_uploaded__");
  const showResumePanel = mode === "editing" || updateCount > 0;

  return {
    // State
    resumeText, currentResumeText, resumeFile, resumeHtml, fileName,
    updateCount, messages: visibleMessages, isStreaming, mode,
    candidateProfile, resumeScore, showIntakeForm, showResumePanel,
    // Actions
    handleUpload, handleNewSession, handleIntakeSubmit,
    handleAction, handleSend, handleApplyBullet, handleRequestScore,
  };
}
