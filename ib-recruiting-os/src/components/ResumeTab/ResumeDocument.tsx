/**
 * ResumeDocument.tsx
 *
 * White-card resume renderer on cream canvas.
 * Clickable bullets, status dots, hover states, and LIVE PREVIEW
 * when a rewrite option is radio-selected in the workshop.
 */

"use client";

import { useEffect, useRef, useMemo } from "react";
import { enrichResumeLines, type EnrichedLine } from "@/lib/resumeStructure";
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

  // Map enriched lines to bullet data for status/preview
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
      style={{
        transition: "all 250ms ease",
      }}
    >
      {/* White card — paper on desk */}
      <div
        className="mx-auto bg-white rounded-[10px] px-10 py-8"
        style={{
          maxWidth: compressed ? "100%" : 680,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          fontSize: compressed ? "90%" : "100%",
          transition: "max-width 250ms ease, font-size 250ms ease",
        }}
      >
        {enrichedLines.map((el) => {
          const key = el.rawIndex;
          const trimmed = el.text.trim();

          // Blank
          if (el.type === "blank") {
            return <div key={key} className="h-2" />;
          }

          // Section header
          if (el.type === "section-header") {
            return (
              <h2
                key={key}
                className="mt-4 mb-1.5 border-b border-cream-1 pb-0.5 text-[10pt] font-bold uppercase tracking-wide"
                style={{ color: "#2a2826" }}
              >
                {trimmed}
              </h2>
            );
          }

          // Bullet — the interactive element
          if (el.type === "bullet") {
            const bullet = findBullet(el);
            if (!bullet) {
              return (
                <p key={key} className="mb-0.5 pl-4 text-[10pt] leading-snug" style={{ color: "#44403c" }}>
                  {trimmed}
                </p>
              );
            }

            const isActive = bullet.id === workshopBulletId;
            const isPreview = isActive && previewText !== null;
            const displayText = isPreview ? previewText : trimmed;

            // Status dot color
            const dotColor =
              bullet.status === "rewritten"
                ? "#22c55e"
                : bullet.status === "reviewed"
                ? "#d97706"
                : undefined;

            // Hover border color based on status
            const hoverBorderColor =
              bullet.status === "rewritten"
                ? "hover:border-l-green-500"
                : bullet.status === "reviewed"
                ? "hover:border-l-amber-500"
                : "hover:border-l-cream-1";

            return (
              <p
                key={key}
                ref={isActive ? activeBulletRef : undefined}
                onClick={() => onBulletClick(bullet.id)}
                className={`
                  group relative mb-0.5 cursor-pointer pl-4 text-[10pt] leading-snug
                  border-l-[3px] border-l-transparent
                  transition-all duration-150
                  ${hoverBorderColor}
                  ${isActive ? "!border-l-terracotta" : ""}
                `}
                style={{
                  color: "#44403c",
                  backgroundColor: isPreview
                    ? "rgba(212, 132, 90, 0.03)"
                    : isActive
                    ? "rgba(212, 132, 90, 0.04)"
                    : undefined,
                  borderRadius: 4,
                  padding: "2px 4px 2px 12px",
                }}
              >
                {/* Status dot */}
                {dotColor && (
                  <span
                    className="absolute left-0.5 top-1/2 -translate-y-1/2 rounded-full"
                    style={{
                      width: 4,
                      height: 4,
                      backgroundColor: dotColor,
                    }}
                  />
                )}
                {isPreview ? (
                  <span style={{ fontStyle: "italic" }}>{displayText}</span>
                ) : (
                  displayText
                )}
              </p>
            );
          }

          // Other lines — contact info, company/role, etc.
          if (el.rawIndex === 0 || (el.rawIndex <= 2 && trimmed.length < 40)) {
            return (
              <p
                key={key}
                className={`text-center font-bold ${el.rawIndex === 0 ? "text-[14pt]" : "text-[10pt]"}`}
                style={{ color: "#2a2826" }}
              >
                {trimmed}
              </p>
            );
          }

          return (
            <p key={key} className="mb-0.5 text-[10pt] leading-snug" style={{ color: "#44403c" }}>
              {trimmed}
            </p>
          );
        })}
      </div>
    </div>
  );
}
