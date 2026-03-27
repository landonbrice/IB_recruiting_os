// Canonical types for the IB Recruiting OS
// Keep in sync with src/types/index.ts

export type ChatMode = "diagnostic" | "editing" | "story" | "targeting" | "feasibility";

export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface CandidateProfile {
  schoolTier?: "target" | "semi-target" | "non-target";
  stage?: "freshman" | "sophomore" | "junior" | "senior" | "mba" | "career-switcher";
  background?: string;
  experienceLevel?: string;
  targetBankTier?: "bulge-bracket" | "elite-boutique" | "middle-market" | "regional";
  targetGroup?: string;
  networkingPosture?: "cold" | "some-contact" | "internal-champion";
  targetBank?: string;
}

export interface ResumeState {
  raw: string;
  current: string;
  qualityScore?: number;
}

export interface ResumeUpdate {
  section: string;
  company?: string;
  bulletIndex?: number;
  newText: string;
  field?: string; // for non-bullet updates (e.g. "title", "date")
}

export interface ResumeScore {
  total: number;
  categories: {
    name: string;
    weight: number;
    score: number;
    weighted: number;
  }[];
  working: string[];
  hurting: string[];
  nextStep: string;
}

export interface FeasibilityScore {
  score: number;
  assessment: string;
  biggestLeverage: string;
  controllables: string[];
  uncontrollables: string[];
}
