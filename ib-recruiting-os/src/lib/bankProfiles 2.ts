/**
 * bankProfiles.ts — Bank culture scaffold
 *
 * Tier and knownFor are populated factually. Culture, interview style,
 * and other qualitative fields are TODO placeholders for Landon to fill
 * with firsthand knowledge.
 *
 * See scripts/fill-bank-profiles.md for instructions.
 */

export interface BankProfile {
  name: string;
  tier: "bulge-bracket" | "elite-boutique" | "middle-market";
  culture: string;
  whatTheyLookFor: string;
  interviewStyle: string;
  knownFor: string[];
  resumeEmphasis: string;
  networkingTips: string;
}

export const BANK_PROFILES: BankProfile[] = [
  {
    name: "Goldman Sachs",
    tier: "bulge-bracket",
    culture: "[LANDON TODO: GS culture — meritocracy vs. pedigree, intensity, what the vibe is really like on the desk/in the group]",
    whatTheyLookFor: "[LANDON TODO: What makes a GS candidate stand out? What signals do they screen for beyond GPA?]",
    interviewStyle: "[LANDON TODO: Technical depth, behavioral style, superday structure, common curveballs]",
    knownFor: ["M&A", "Capital Markets", "TMT", "FIG", "Natural Resources"],
    resumeEmphasis: "[LANDON TODO: What to emphasize on a resume targeting GS specifically]",
    networkingTips: "[LANDON TODO: How networking actually works at GS — alumni culture, coffee chat expectations, who to reach out to]",
  },
  {
    name: "Morgan Stanley",
    tier: "bulge-bracket",
    culture: "[LANDON TODO: MS culture — how it compares to GS, group dynamics, work-life balance reality]",
    whatTheyLookFor: "[LANDON TODO: MS candidate profile preferences]",
    interviewStyle: "[LANDON TODO: MS interview format and common patterns]",
    knownFor: ["M&A", "ECM", "Healthcare", "TMT", "Restructuring"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for MS]",
    networkingTips: "[LANDON TODO: MS networking approach]",
  },
  {
    name: "JP Morgan",
    tier: "bulge-bracket",
    culture: "[LANDON TODO: JPM culture — size, bureaucracy vs. deal flow, training program reputation]",
    whatTheyLookFor: "[LANDON TODO: JPM candidate preferences]",
    interviewStyle: "[LANDON TODO: JPM interview specifics]",
    knownFor: ["M&A", "DCM", "Leveraged Finance", "Healthcare", "Industrials"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for JPM]",
    networkingTips: "[LANDON TODO: JPM networking approach]",
  },
  {
    name: "Bank of America",
    tier: "bulge-bracket",
    culture: "[LANDON TODO: BofA culture — reputation shifts, Merrill Lynch legacy, group quality variance]",
    whatTheyLookFor: "[LANDON TODO: BofA candidate preferences]",
    interviewStyle: "[LANDON TODO: BofA interview specifics]",
    knownFor: ["Leveraged Finance", "DCM", "M&A", "Industrials", "Healthcare"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for BofA]",
    networkingTips: "[LANDON TODO: BofA networking approach]",
  },
  {
    name: "Citi",
    tier: "bulge-bracket",
    culture: "[LANDON TODO: Citi culture — global footprint, group quality, how it differs from other BBs]",
    whatTheyLookFor: "[LANDON TODO: Citi candidate preferences]",
    interviewStyle: "[LANDON TODO: Citi interview specifics]",
    knownFor: ["DCM", "Capital Markets", "FIG", "M&A", "Industrials"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for Citi]",
    networkingTips: "[LANDON TODO: Citi networking approach]",
  },
  {
    name: "Evercore",
    tier: "elite-boutique",
    culture: "[LANDON TODO: Evercore culture — prestige, intellectual intensity, comp, work hours, vibe]",
    whatTheyLookFor: "[LANDON TODO: Evercore candidate profile — what separates Evercore hires from BB hires]",
    interviewStyle: "[LANDON TODO: Evercore interview format — technical rigor, case studies, deal discussions]",
    knownFor: ["M&A", "Restructuring", "Shareholder Advisory"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for Evercore]",
    networkingTips: "[LANDON TODO: Evercore networking — smaller firm, how to get noticed]",
  },
  {
    name: "Lazard",
    tier: "elite-boutique",
    culture: "[LANDON TODO: Lazard culture — European roots, intellectual bent, restructuring DNA]",
    whatTheyLookFor: "[LANDON TODO: Lazard candidate preferences]",
    interviewStyle: "[LANDON TODO: Lazard interview specifics]",
    knownFor: ["M&A", "Restructuring", "Sovereign Advisory", "Shareholder Activism Defense"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for Lazard]",
    networkingTips: "[LANDON TODO: Lazard networking approach]",
  },
  {
    name: "Centerview Partners",
    tier: "elite-boutique",
    culture: "[LANDON TODO: Centerview culture — small, elite, deal selectivity, comp, lifestyle]",
    whatTheyLookFor: "[LANDON TODO: Centerview candidate profile — what makes someone Centerview material]",
    interviewStyle: "[LANDON TODO: Centerview interview style — how it differs from other EBs]",
    knownFor: ["M&A", "Capital Allocation Advisory", "CEO Advisory"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for Centerview]",
    networkingTips: "[LANDON TODO: Centerview networking — very small class, how to even get a conversation]",
  },
  {
    name: "Moelis",
    tier: "elite-boutique",
    culture: "[LANDON TODO: Moelis culture — founder-driven, deal volume, comp structure]",
    whatTheyLookFor: "[LANDON TODO: Moelis candidate preferences]",
    interviewStyle: "[LANDON TODO: Moelis interview specifics]",
    knownFor: ["M&A", "Restructuring", "Capital Markets Advisory"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for Moelis]",
    networkingTips: "[LANDON TODO: Moelis networking approach]",
  },
  {
    name: "PJT Partners",
    tier: "elite-boutique",
    culture: "[LANDON TODO: PJT culture — Blackstone spinoff heritage, restructuring reputation, analyst experience]",
    whatTheyLookFor: "[LANDON TODO: PJT candidate preferences]",
    interviewStyle: "[LANDON TODO: PJT interview specifics]",
    knownFor: ["Restructuring", "M&A", "Park Hill (PE Placement)"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for PJT]",
    networkingTips: "[LANDON TODO: PJT networking approach]",
  },
  {
    name: "Guggenheim",
    tier: "middle-market",
    culture: "[LANDON TODO: Guggenheim culture — hybrid advisory/asset management, how IB fits in]",
    whatTheyLookFor: "[LANDON TODO: Guggenheim candidate preferences]",
    interviewStyle: "[LANDON TODO: Guggenheim interview specifics]",
    knownFor: ["M&A", "Restructuring", "Capital Markets"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for Guggenheim]",
    networkingTips: "[LANDON TODO: Guggenheim networking approach]",
  },
  {
    name: "Jefferies",
    tier: "middle-market",
    culture: "[LANDON TODO: Jefferies culture — scrappy, growing, deal flow quality, comp]",
    whatTheyLookFor: "[LANDON TODO: Jefferies candidate preferences]",
    interviewStyle: "[LANDON TODO: Jefferies interview specifics]",
    knownFor: ["Leveraged Finance", "M&A", "Healthcare", "TMT", "Industrials"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for Jefferies]",
    networkingTips: "[LANDON TODO: Jefferies networking approach]",
  },
  {
    name: "William Blair",
    tier: "middle-market",
    culture: "[LANDON TODO: William Blair culture — Midwest roots, lifestyle, team size]",
    whatTheyLookFor: "[LANDON TODO: William Blair candidate preferences]",
    interviewStyle: "[LANDON TODO: William Blair interview specifics]",
    knownFor: ["M&A", "Growth Equity", "TMT", "Healthcare", "Consumer"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for William Blair]",
    networkingTips: "[LANDON TODO: William Blair networking approach]",
  },
  {
    name: "Houlihan Lokey",
    tier: "middle-market",
    culture: "[LANDON TODO: HL culture — restructuring powerhouse, middle market M&A quality, LA vs NY]",
    whatTheyLookFor: "[LANDON TODO: HL candidate preferences]",
    interviewStyle: "[LANDON TODO: HL interview specifics]",
    knownFor: ["Restructuring", "M&A (Middle Market)", "Valuation Advisory", "FIG"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for HL]",
    networkingTips: "[LANDON TODO: HL networking approach]",
  },
  {
    name: "Harris Williams",
    tier: "middle-market",
    culture: "[LANDON TODO: Harris Williams culture — PNC subsidiary, Richmond HQ, deal types, lifestyle]",
    whatTheyLookFor: "[LANDON TODO: Harris Williams candidate preferences]",
    interviewStyle: "[LANDON TODO: Harris Williams interview specifics]",
    knownFor: ["M&A (Middle Market)", "Consumer", "Healthcare", "Industrials"],
    resumeEmphasis: "[LANDON TODO: Resume emphasis for Harris Williams]",
    networkingTips: "[LANDON TODO: Harris Williams networking approach]",
  },
];

/** Look up a bank profile by name (case-insensitive partial match). */
export function findBankProfile(bankName: string): BankProfile | null {
  const needle = bankName.toLowerCase().trim();
  return BANK_PROFILES.find((b) => b.name.toLowerCase().includes(needle)) ?? null;
}

/** Check if a profile field is still a TODO placeholder. */
export function isPlaceholder(value: string): boolean {
  return value.startsWith("[LANDON TODO:");
}
