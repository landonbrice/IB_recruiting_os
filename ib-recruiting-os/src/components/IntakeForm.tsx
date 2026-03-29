"use client";

import { useState } from "react";
import type { CandidateProfile } from "@/lib/types";

interface IntakeFormProps {
  onSubmit: (profile: Partial<CandidateProfile>) => void;
}

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] uppercase tracking-widest" style={{ color: "#78716c" }}>
      {children}
    </p>
  );
}

function Chip({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
        selected
          ? "border-terracotta bg-terracotta/10 text-terracotta font-medium"
          : "border-cream-1 bg-cream text-[#78716c] hover:border-[#a8a29e] hover:text-[#44403c]"
      }`}
    >
      {label}
    </button>
  );
}

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
    <div
      className="w-full max-w-[420px] rounded-[12px] bg-white px-8 py-7 space-y-6"
      style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
    >
      {/* Header */}
      <div>
        <p className="text-[16px] font-semibold" style={{ color: "#2a2826" }}>
          Let&apos;s get you set up.
        </p>
        <p className="mt-0.5 text-[12px]" style={{ color: "#a8a29e" }}>
          3 quick questions so the coach can calibrate.
        </p>
      </div>

      {/* Q1 */}
      <div className="space-y-2.5">
        <SectionLabel>Where are you in your journey?</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {STAGE_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={stage === opt.value} onClick={() => setStage(opt.value)} />
          ))}
        </div>
      </div>

      {/* Q2 */}
      <div className="space-y-2.5">
        <SectionLabel>Where are you aiming?</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {TIER_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={tier === opt.value} onClick={() => setTier(opt.value)} />
          ))}
        </div>
      </div>

      {/* Q3 */}
      <div className="space-y-2.5">
        <SectionLabel>What group?</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {GROUP_OPTIONS.map((opt) => (
            <Chip key={opt.value} label={opt.label} selected={group === opt.value} onClick={() => setGroup(opt.value)} />
          ))}
        </div>
      </div>

      {/* CTA */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!stage}
        className="rounded-[8px] bg-terracotta px-5 py-2.5 text-[13px] font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Let&apos;s go &rarr;
      </button>
    </div>
  );
}
