import { createServerClient } from "@/lib/supabase/server";
import type { ResumeBullet } from "./resumeTypes";

// ── Core Types ──────────────────────────────────────────────────────────────

export interface ArcNode {
  id: string;
  label: string;
  sub: string;
  timeframe: string;
  type: "experience" | "education" | "non-resume" | "upcoming" | "goal";
  positives: string[];
  negatives: string[];
  impactStories: ImpactStory[];
  setMetGoals: { set: string; met: string; metric: string }[];
}

export interface ImpactStory {
  id: string;
  type: "I" | "M" | "P" | "A" | "C" | "T";
  status: "draft" | "ready";
  nickname: string;
  steppingStone: {
    answerFirst: string;
    actions: string[];
    tension: string;
    resolution: string;
  };
  ibConnection: string;
  valueAdd: { category: string; past: string; future: string };
}

export interface Thread {
  id: string;
  label: string;
  nodeIds: string[];
  color: string;
  desc: string;
}

export interface CandidateProfile {
  schoolTier: "target" | "semi-target" | "non-target";
  stage: "freshman" | "sophomore" | "junior" | "senior" | "mba" | "career-switcher";
  background: string;
  experienceLevel: string;
  targetBankTier: "bulge-bracket" | "elite-boutique" | "middle-market" | "regional";
  targetGroup: string;
}

export interface Target {
  bank: string;
  group: string;
  whyThisBank: string;
  relevantThreads: string[];
  relevantNodes: string[];
  coverLetterAngle: string;
  notes: string;
}

export interface PreparedAnswers {
  whyBanking: { claim: string; reason: string; evidence: string; impact: string };
  weakness: { acknowledge: string; bridge: string; cover: string; dangle: string };
  recentDeals: {
    name: string;
    dates: string;
    value: string;
    consideration: string;
    rationale: string;
    risks: string;
  }[];
  industryTrends: {
    headline: string;
    hook: string;
    drivers: string;
    tailwinds: string;
    headwinds: string;
    deals: string;
  }[];
}

export interface StoryRef {
  storyId: string;
  nodeId: string;
}

export interface ResumeState {
  rawText: string;
  sections: unknown[];
  bullets: ResumeBullet[];
}

export interface CoverLetterState {
  opening: string;
  middle: string;
  close: string;
  targetBank: string;
}

export interface StoryState {
  decisionArc: {
    nodes: ArcNode[];
    threads: Thread[];
    crystallizingMoment: string;
    whyIB: string;
    futureVision: string;
  };
  storyBank: {
    stories: StoryRef[];
    tellMeAboutYourself: { narrative: string; userRefinements: string; lastUpdated: string };
  };
  candidateProfile: CandidateProfile;
  targets: Target[];
  resumeState: ResumeState;
  coverLetterState: CoverLetterState;
  preparedAnswers: PreparedAnswers;
}

// ── Utilities ───────────────────────────────────────────────────────────────

export function emptyStoryState(): StoryState {
  return {
    decisionArc: {
      nodes: [],
      threads: [],
      crystallizingMoment: "",
      whyIB: "",
      futureVision: "",
    },
    storyBank: {
      stories: [],
      tellMeAboutYourself: { narrative: "", userRefinements: "", lastUpdated: "" },
    },
    candidateProfile: {
      schoolTier: "non-target",
      stage: "junior",
      background: "",
      experienceLevel: "",
      targetBankTier: "bulge-bracket",
      targetGroup: "",
    },
    targets: [],
    resumeState: {
      rawText: "",
      sections: [],
      bullets: [],
    },
    coverLetterState: {
      opening: "",
      middle: "",
      close: "",
      targetBank: "",
    },
    preparedAnswers: {
      whyBanking: { claim: "", reason: "", evidence: "", impact: "" },
      weakness: { acknowledge: "", bridge: "", cover: "", dangle: "" },
      recentDeals: [],
      industryTrends: [],
    },
  };
}

export async function loadStoryState(userId: string): Promise<StoryState> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("story_states")
    .select("state")
    .eq("user_id", userId)
    .single();

  if (error || !data) return emptyStoryState();
  return { ...emptyStoryState(), ...(data.state as Partial<StoryState>) };
}

export async function saveStoryState(userId: string, state: StoryState): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("story_states")
    .upsert(
      { user_id: userId, state, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );

  if (error) throw new Error(`Failed to save story state: ${error.message}`);
}

export function patchStoryState(current: StoryState, patch: Partial<StoryState>): StoryState {
  return { ...current, ...patch };
}
