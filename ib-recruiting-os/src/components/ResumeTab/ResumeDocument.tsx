/**
 * ResumeDocument.tsx
 *
 * White-card resume renderer mimicking a real IB resume PDF.
 * Times New Roman body, bold companies, italic roles, right-aligned dates/locations.
 * Clickable bullets with status dots, hover states, and LIVE PREVIEW.
 */

"use client";

import { useEffect, useRef, useMemo } from "react";
import {
  enrichResumeLines,
  splitDateFromLine,
  splitLocationFromLine,
  type EnrichedLine,
} from "@/lib/resumeStructure";
import type { ResumeBullet } from "@/lib/resumeTypes";

interface ResumeDocumentProps {
  resumeText: string;
  bullets: ResumeBullet[];
  compressed: boolean;
  workshopBulletId: string | null;
  previewText: string | null;
  onBulletClick: (bulletId: string) => void;
}

export default function ResumeDocument({
  resumeText,
  bullets,
  compressed,
  workshopBulletId,
  previewText,
  onBulletClick,
}: ResumeDocumentProps) {
  const activeBulletRef = useRef<HTMLParagraphElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const enrichedLines = useMemo(
    () => enrichResumeLines(resumeText),
    [resumeText]
  );

  // Auto-scroll to active bullet when workshop opens
  useEffect(() => {
    if (workshopBulletId && activeBulletRef.current && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const el = activeBulletRef.current;
      const containerRect = container.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const offset = elRect.top - containerRect.top - containerRect.height / 2 + elRect.height / 2;
      container.scrollBy({ top: offset, behavior: "smooth" });
    }
  }, [workshopBulletId]);

  function findBullet(el: EnrichedLine): ResumeBullet | undefined {
    if (el.type !== "bullet") return undefined;
    return bullets.find(
      (b) => b.company === el.company && b.bulletIndex === el.bulletIndex
    );
  }

  return (
    <div
      ref={scrollContainerRef}
      className="scrollable h-full overflow-auto px-4 py-6"
    >
      {/* White card — paper on desk */}
      <div
        className="resume-page mx-auto bg-white rounded-[10px]"
        style={{
          maxWidth: compressed ? "100%" : 680,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          padding: compressed ? "24px 20px" : "32px 40px",
          fontFamily: "'Times New Roman', 'Georgia', serif",
          fontSize: compressed ? "9pt" : "10pt",
          lineHeight: 1.3,
          color: "#1a1a1a",
          transition: "max-width 250ms ease, padding 250ms ease, font-size 250ms ease",
        }}
      >
        {enrichedLines.map((el) => {
          const key = el.rawIndex;
          const trimmed = el.text.trim();

          // ── Blank line ──
          if (el.type === "blank") {
            return <div key={key} className="h-1" />;
          }

          // ── Name (centered, bold, larger) ──
          if (el.type === "name") {
            return (
              <p
                key={key}
                className="text-center font-bold tracking-wide"
                style={{ fontSize: compressed ? "12pt" : "14pt", marginBottom: 2 }}
              >
                {trimmed}
              </p>
            );
          }

          // ── Contact info (centered, smaller, pipe-separated) ──
          if (el.type === "contact") {
            return (
              <p
                key={key}
                className="text-center"
                style={{ fontSize: compressed ? "8pt" : "9pt", color: "#444", marginBottom: 1 }}
              >
                {trimmed}
              </p>
            );
          }

          // ── Section header (bold, uppercase, with underline) ──
          if (el.type === "section-header") {
            return (
              <h2
                key={key}
                className="font-bold uppercase"
                style={{
                  fontSize: compressed ? "9pt" : "10pt",
                  marginTop: 10,
                  marginBottom: 3,
                  paddingBottom: 2,
                  borderBottom: "1px solid #999",
                  letterSpacing: "0.5px",
                }}
              >
                {trimmed}
              </h2>
            );
          }

          // ── Company line (bold, with location right-aligned if detected) ──
          if (el.type === "company-line") {
            return <EntryLine key={key} text={trimmed} bold />;
          }

          // ── Role line (italic, with dates right-aligned if detected) ──
          if (el.type === "role-line") {
            return <EntryLine key={key} text={trimmed} italic />;
          }

          // ── Sub-header (indented, not bold — "Selected Companies:", sub-entry names) ──
          if (el.type === "sub-header") {
            return (
              <p
                key={key}
                style={{
                  fontWeight: /:\s*$/.test(trimmed) ? 600 : 400,
                  fontStyle: /:\s*$/.test(trimmed) ? undefined : "italic",
                  marginTop: /:\s*$/.test(trimmed) ? 4 : 0,
                  marginBottom: 1,
                  paddingLeft: 4,
                }}
              >
                {trimmed}
              </p>
            );
          }

          // ── Bullet — the interactive element ──
          if (el.type === "bullet") {
            const bullet = findBullet(el);
            const bulletText = trimmed.replace(/^[▪•\-·]\s*/, "");

            if (!bullet) {
              return (
                <BulletLine key={key} text={bulletText} />
              );
            }

            const isActive = bullet.id === workshopBulletId;
            const isPreview = isActive && previewText !== null;
            const displayText = isPreview ? previewText! : bulletText;

            const dotColor =
              bullet.status === "rewritten"
                ? "#22c55e"
                : bullet.status === "reviewed"
                ? "#d97706"
                : undefined;

            return (
              <p
                key={key}
                ref={isActive ? activeBulletRef : undefined}
                onClick={() => onBulletClick(bullet.id)}
                className="relative cursor-pointer transition-all duration-150"
                style={{
                  paddingLeft: 14,
                  marginBottom: 2,
                  borderLeft: isActive ? "3px solid #d4845a" : "3px solid transparent",
                  backgroundColor: isPreview
                    ? "rgba(212, 132, 90, 0.05)"
                    : isActive
                    ? "rgba(212, 132, 90, 0.03)"
                    : undefined,
                  borderRadius: 2,
                  padding: "1px 4px 1px 14px",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.borderLeftColor = "#e8e4dc";
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.borderLeftColor = "transparent";
                }}
              >
                {/* Status dot */}
                {dotColor && (
                  <span
                    className="absolute top-[7px] left-[2px] rounded-full"
                    style={{ width: 4, height: 4, backgroundColor: dotColor }}
                  />
                )}
                {/* Bullet character */}
                <span style={{ position: "absolute", left: 6 }}>&#8226;</span>
                <span style={{ fontStyle: isPreview ? "italic" : undefined }}>
                  {displayText}
                </span>
              </p>
            );
          }

          // ── Other / fallback ──
          return (
            <p key={key} style={{ marginBottom: 1 }}>
              {trimmed}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

/**
 * Renders a company or role line with right-aligned date/location detection.
 * Bold for company, italic for role.
 */
function EntryLine({ text, bold, italic }: { text: string; bold?: boolean; italic?: boolean }) {
  // Try to split date or location from the line
  const dateSplit = splitDateFromLine(text);
  const locSplit = splitLocationFromLine(text);

  // Use whichever split works (date takes priority for role lines, location for company lines)
  const split = bold ? (locSplit || dateSplit) : (dateSplit || locSplit);

  if (split) {
    const [left, right] = split;
    return (
      <p
        className="flex justify-between items-baseline gap-2"
        style={{
          fontWeight: bold ? 700 : undefined,
          fontStyle: italic ? "italic" : undefined,
          marginBottom: 1,
        }}
      >
        <span className="flex-1 min-w-0">{left}</span>
        <span className="flex-shrink-0 text-right" style={{ fontStyle: italic ? "italic" : "normal" }}>
          {right}
        </span>
      </p>
    );
  }

  // No split found — render as-is
  return (
    <p
      style={{
        fontWeight: bold ? 700 : undefined,
        fontStyle: italic ? "italic" : undefined,
        marginBottom: 1,
      }}
    >
      {text}
    </p>
  );
}

/** Non-interactive bullet (education bullets, skills, etc.) */
function BulletLine({ text }: { text: string }) {
  return (
    <p style={{ paddingLeft: 14, marginBottom: 2, position: "relative" }}>
      <span style={{ position: "absolute", left: 6 }}>&#8226;</span>
      {text}
    </p>
  );
}
