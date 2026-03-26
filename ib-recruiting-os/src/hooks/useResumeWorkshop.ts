/**
 * useResumeWorkshop.ts
 *
 * Workshop state management for the Resume tab.
 * Companion to useCoachSession — does NOT replace it.
 *
 * Manages: bullet array, workshop mode, live preview, instant rewrites,
 * bullet-scoped coach threads, and bidirectional stateUpdate application.
 */

"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { enrichResumeLines } from "@/lib/resumeStructure";
import {
  buildBulletsFromEnrichedLines,
  scoreBulletRules,
  parseBulletVariants,
  type ResumeBullet,
  type BulletRewrite,
  type BulletCoachMessage,
} from "@/lib/resumeTypes";
import { parseCoachResponse, applyStateUpdates } from "@/lib/stateUpdateParser";
import type { StoryState } from "@/lib/storyState";
import { consumeSSE } from "@/lib/sse";
import type { CandidateProfile } from "@/lib/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface UseResumeWorkshopParams {
  currentResumeText: string | null;
  candidateProfile: CandidateProfile;
  onApplyBullet: (
    bulletIndex: number,
    company: string,
    newText: string,
    meta?: { confidence?: "High" | "Medium" | "Low"; risk?: "Low" | "Medium" | "High" }
  ) => void;
  storyState?: StoryState;
  onStoryStateUpdate?: (updated: StoryState) => void;
}

export interface UseResumeWorkshopReturn {
  // State
  bullets: ResumeBullet[];
  workshopBulletId: string | null;
  activeBullet: ResumeBullet | null;
  selectedRewriteId: string | null;
  previewText: string | null;
  isGeneratingRewrites: boolean;
  isWorkshopStreaming: boolean;
  // Actions
  openWorkshop: (bulletId: string) => void;
  closeWorkshop: () => void;
  navigateBullet: (direction: "prev" | "next") => void;
  selectRewrite: (rewriteId: string | null) => void;
  applySelectedRewrite: () => void;
  sendBulletChat: (content: string) => Promise<void>;
  regenerateRewrites: () => Promise<void>;
  addCoachRewriteToOptions: (text: string) => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useResumeWorkshop({
  currentResumeText,
  candidateProfile,
  onApplyBullet,
  storyState,
  onStoryStateUpdate,
}: UseResumeWorkshopParams): UseResumeWorkshopReturn {
  const [bullets, setBullets] = useState<ResumeBullet[]>([]);
  const [workshopBulletId, setWorkshopBulletId] = useState<string | null>(null);
  const [selectedRewriteId, setSelectedRewriteId] = useState<string | null>(null);
  const [isGeneratingRewrites, setIsGeneratingRewrites] = useState(false);
  const [isWorkshopStreaming, setIsWorkshopStreaming] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // ── Build bullets when resume text changes ──────────────────────────────
  useEffect(() => {
    if (!currentResumeText) {
      setBullets([]);
      return;
    }
    const lines = enrichResumeLines(currentResumeText);
    const newBullets = buildBulletsFromEnrichedLines(lines);

    // Preserve existing bullet data (rewrites, threads, status) if bullets match by position
    setBullets((prev) => {
      if (prev.length === 0) return newBullets;
      return newBullets.map((nb) => {
        const existing = prev.find(
          (pb) => pb.company === nb.company && pb.bulletIndex === nb.bulletIndex
        );
        if (existing) {
          return {
            ...nb,
            id: existing.id, // preserve stable ID
            rewrites: existing.rewrites,
            coachThread: existing.coachThread,
            linkedStoryId: existing.linkedStoryId,
            status: nb.text !== existing.originalText ? "rewritten" : existing.status,
            // Re-score with current text
            score: scoreBulletRules(nb.text),
          };
        }
        return nb;
      });
    });
  }, [currentResumeText]);

  // ── Derived state ───────────────────────────────────────────────────────
  const activeBullet = useMemo(
    () => bullets.find((b) => b.id === workshopBulletId) ?? null,
    [bullets, workshopBulletId]
  );

  const previewText = useMemo(() => {
    if (!selectedRewriteId || !activeBullet) return null;
    const rewrite = activeBullet.rewrites.find((r) => r.id === selectedRewriteId);
    return rewrite?.text ?? null;
  }, [selectedRewriteId, activeBullet]);

  // ── Generate instant rewrites ───────────────────────────────────────────
  const generateInstantRewrites = useCallback(
    async (bullet: ResumeBullet) => {
      setIsGeneratingRewrites(true);
      let accumulated = "";

      try {
        const res = await fetch("/api/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bullet: bullet.text,
            roleTitle: bullet.roleTitle,
            company: bullet.company,
            section: bullet.section,
            candidateProfile,
            resumeText: currentResumeText,
            phase: "generate",
          }),
        });
        if (!res.ok || !res.body) throw new Error("Suggest stream failed");

        await consumeSSE(res.body, (text) => {
          accumulated += text;
        });

        const variants = parseBulletVariants(accumulated);
        const newRewrites: BulletRewrite[] = variants.map((v) => ({
          id: crypto.randomUUID(),
          text: v.text,
          confidence: v.confidence,
          risk: v.risk,
          source: "instant" as const,
          createdAt: Date.now(),
        }));

        setBullets((prev) =>
          prev.map((b) =>
            b.id === bullet.id
              ? { ...b, rewrites: [...newRewrites, ...b.rewrites.filter((r) => r.source === "coach")] }
              : b
          )
        );
      } catch (err) {
        console.error("Failed to generate instant rewrites:", err);
      } finally {
        setIsGeneratingRewrites(false);
      }
    },
    [candidateProfile, currentResumeText]
  );

  // ── Actions ─────────────────────────────────────────────────────────────

  const openWorkshop = useCallback(
    (bulletId: string) => {
      setWorkshopBulletId(bulletId);
      setSelectedRewriteId(null);
      const bullet = bullets.find((b) => b.id === bulletId);
      if (bullet && bullet.rewrites.filter((r) => r.source === "instant").length === 0) {
        generateInstantRewrites(bullet);
      }
    },
    [bullets, generateInstantRewrites]
  );

  const closeWorkshop = useCallback(() => {
    setWorkshopBulletId(null);
    setSelectedRewriteId(null);
    abortRef.current?.abort();
  }, []);

  const navigateBullet = useCallback(
    (direction: "prev" | "next") => {
      if (!workshopBulletId) return;
      const idx = bullets.findIndex((b) => b.id === workshopBulletId);
      if (idx === -1) return;
      const newIdx = direction === "next"
        ? Math.min(idx + 1, bullets.length - 1)
        : Math.max(idx - 1, 0);
      if (newIdx !== idx) {
        setSelectedRewriteId(null);
        setWorkshopBulletId(bullets[newIdx].id);
        const newBullet = bullets[newIdx];
        if (newBullet.rewrites.filter((r) => r.source === "instant").length === 0) {
          generateInstantRewrites(newBullet);
        }
      }
    },
    [workshopBulletId, bullets, generateInstantRewrites]
  );

  const selectRewrite = useCallback((rewriteId: string | null) => {
    setSelectedRewriteId(rewriteId);
  }, []);

  const applySelectedRewrite = useCallback(() => {
    if (!activeBullet || !selectedRewriteId) return;
    const rewrite = activeBullet.rewrites.find((r) => r.id === selectedRewriteId);
    if (!rewrite) return;

    // Update bullet state
    setBullets((prev) =>
      prev.map((b) =>
        b.id === activeBullet.id
          ? {
              ...b,
              text: rewrite.text,
              status: "rewritten" as const,
              score: scoreBulletRules(rewrite.text),
              rewrites: b.rewrites.map((r) =>
                r.id === rewrite.id ? { ...r, appliedAt: Date.now() } : r
              ),
            }
          : b
      )
    );

    // Propagate to useCoachSession's resume text
    onApplyBullet(
      activeBullet.bulletIndex,
      activeBullet.company,
      rewrite.text,
      { confidence: rewrite.confidence, risk: rewrite.risk }
    );

    setSelectedRewriteId(null);
  }, [activeBullet, selectedRewriteId, onApplyBullet]);

  const addCoachRewriteToOptions = useCallback(
    (text: string) => {
      if (!workshopBulletId) return;
      const newRewrite: BulletRewrite = {
        id: crypto.randomUUID(),
        text,
        source: "coach",
        createdAt: Date.now(),
      };
      setBullets((prev) =>
        prev.map((b) =>
          b.id === workshopBulletId
            ? { ...b, rewrites: [...b.rewrites, newRewrite] }
            : b
        )
      );
    },
    [workshopBulletId]
  );

  // ── Bullet-scoped coach chat ────────────────────────────────────────────
  const sendBulletChat = useCallback(
    async (content: string) => {
      if (!activeBullet || !currentResumeText) return;

      // Add user message to thread
      const userMsg: BulletCoachMessage = {
        role: "user",
        content,
        timestamp: Date.now(),
      };
      setBullets((prev) =>
        prev.map((b) =>
          b.id === activeBullet.id
            ? { ...b, coachThread: [...b.coachThread, userMsg], status: b.status === "untouched" ? "reviewed" : b.status }
            : b
        )
      );

      setIsWorkshopStreaming(true);
      abortRef.current = new AbortController();
      let accumulated = "";

      // Add placeholder assistant message
      const placeholderId = Date.now();
      setBullets((prev) =>
        prev.map((b) =>
          b.id === activeBullet.id
            ? {
                ...b,
                coachThread: [
                  ...b.coachThread,
                  { role: "assistant" as const, content: "", timestamp: placeholderId },
                ],
              }
            : b
        )
      );

      try {
        const thread = [...activeBullet.coachThread, userMsg];
        const res = await fetch("/api/chat/bullet", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bullet: {
              text: activeBullet.text,
              originalText: activeBullet.originalText,
              company: activeBullet.company,
              roleTitle: activeBullet.roleTitle,
              section: activeBullet.section,
            },
            thread: thread.map((m) => ({ role: m.role, content: m.content })),
            resumeText: currentResumeText,
            candidateProfile,
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) throw new Error("Bullet chat stream failed");

        await consumeSSE(res.body, (text) => {
          accumulated += text;
          // Update the placeholder message with streaming content
          setBullets((prev) =>
            prev.map((b) =>
              b.id === activeBullet.id
                ? {
                    ...b,
                    coachThread: b.coachThread.map((m) =>
                      m.timestamp === placeholderId ? { ...m, content: accumulated } : m
                    ),
                  }
                : b
            )
          );
        });

        // Parse the completed response
        const parsed = parseCoachResponse(accumulated);

        // Update the final message with parsed content
        const finalMsg: BulletCoachMessage = {
          role: "assistant",
          content: parsed.message,
          rewriteSuggestion: parsed.rewriteSuggestion,
          stateUpdates: parsed.stateUpdates.length > 0 ? parsed.stateUpdates : undefined,
          timestamp: placeholderId,
        };

        setBullets((prev) =>
          prev.map((b) => {
            if (b.id !== activeBullet.id) return b;
            const updated = {
              ...b,
              coachThread: b.coachThread.map((m) =>
                m.timestamp === placeholderId ? finalMsg : m
              ),
            };
            // If coach suggested a rewrite, add it as an option
            if (parsed.rewriteSuggestion) {
              updated.rewrites = [
                ...updated.rewrites,
                {
                  id: crypto.randomUUID(),
                  text: parsed.rewriteSuggestion,
                  source: "coach" as const,
                  createdAt: Date.now(),
                },
              ];
            }
            return updated;
          })
        );

        // Apply stateUpdates to storyState (bidirectional flow)
        if (parsed.stateUpdates.length > 0 && storyState && onStoryStateUpdate) {
          const updated = applyStateUpdates(storyState, parsed.stateUpdates);
          onStoryStateUpdate(updated);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Bullet chat failed:", err);
          // Update placeholder with error
          setBullets((prev) =>
            prev.map((b) =>
              b.id === activeBullet.id
                ? {
                    ...b,
                    coachThread: b.coachThread.map((m) =>
                      m.timestamp === placeholderId
                        ? { ...m, content: "Something went wrong. Please try again." }
                        : m
                    ),
                  }
                : b
            )
          );
        }
      } finally {
        setIsWorkshopStreaming(false);
      }
    },
    [activeBullet, currentResumeText, candidateProfile, storyState, onStoryStateUpdate]
  );

  const regenerateRewrites = useCallback(async () => {
    if (!activeBullet) return;
    // Clear existing instant rewrites
    setBullets((prev) =>
      prev.map((b) =>
        b.id === activeBullet.id
          ? { ...b, rewrites: b.rewrites.filter((r) => r.source === "coach") }
          : b
      )
    );
    setSelectedRewriteId(null);
    await generateInstantRewrites(activeBullet);
  }, [activeBullet, generateInstantRewrites]);

  return {
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
  };
}
