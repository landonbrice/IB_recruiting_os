"use client";

import { useState } from "react";
import type { CandidateProfile } from "@/lib/types";

interface IntakeFormProps {
  onSubmit: (profile: Partial<CandidateProfile>) => void;
}

// ── Data ────────────────────────────────────────────────────────────────────

const STAGE_OPTIONS = [
  { label: "Sophomore",       value: "sophomore" },
  { label: "Junior",          value: "junior" },
  { label: "Senior",          value: "senior" },
  { label: "MBA",             value: "mba" },
  { label: "Career switcher", value: "career-switcher" },
];

const TIER_OPTIONS = [
  { label: "Bulge Bracket",  value: "bulge-bracket" },
  { label: "Elite Boutique", value: "elite-boutique" },
  { label: "Middle Market",  value: "middle-market" },
  { label: "Not sure",       value: "not-sure" },
];

const GROUP_OPTIONS = [
  { label: "M&A",      value: "M&A" },
  { label: "LevFin",   value: "LevFin" },
  { label: "Coverage", value: "Coverage" },
  { label: "ECM/DCM",  value: "ECM/DCM" },
  { label: "Not sure", value: "not-sure" },
];

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest text-stone-500">{children}</p>
  );
}

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        selected
          ? "rounded-full border border-amber-600/60 bg-amber-600/15 px-3 py-1.5 text-xs text-amber-300"
          : "rounded-full border border-stone-700 bg-stone-800 px-3 py-1.5 text-xs text-stone-400 transition hover:border-stone-500 hover:text-stone-200"
      }
    >
      {label}
    </button>
  );
}

// ── Component ────────────────────────────────────────────────────────────────

export default function IntakeForm({ onSubmit }: IntakeFormProps) {
  const [stage, setStage] = useState<string | null>(null);
  const [tier, setTier]   = useState<string | null>(null);
  const [group, setGroup] = useState<string | null>(null);

  function handleSubmit() {
    if (!stage) return;
    const profile: Partial<CandidateProfile> = {
      stage: stage as CandidateProfile["stage"],
    };
    if (tier && tier !== "not-sure") {
      profile.targetBankTier = tier as CandidateProfile["targetBankTier"];
    }
    if (group && group !== "not-sure") {
      profile.targetGroup = group;
    }
    onSubmit(profile);
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-stone-950 px-10">
      <div className="w-full max-w-[400px] space-y-7">

        {/* Header */}
        <div>
          <p className="text-lg font-semibold text-stone-200">Let&apos;s get you set up.</p>
          <p className="mt-1 text-sm text-stone-500">3 quick questions.</p>
        </div>

        {/* Q1: Stage */}
        <div className="space-y-3">
          <SectionLabel>Where are you in your journey?</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {STAGE_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={stage === opt.value}
                onClick={() => setStage(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* Q2: Target bank tier */}
        <div className="space-y-3">
          <SectionLabel>Where are you aiming?</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {TIER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={tier === opt.value}
                onClick={() => setTier(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* Q3: Target group */}
        <div className="space-y-3">
          <SectionLabel>What group?</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {GROUP_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                label={opt.label}
                selected={group === opt.value}
                onClick={() => setGroup(opt.value)}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!stage}
          className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Let&apos;s go →
        </button>

      </div>
    </div>
  );
}
