export interface IBBulletExemplar {
  roleTrack: string;
  context: string;
  weak: string;
  strong: string;
}

const EXEMPLARS: IBBulletExemplar[] = [
  {
    roleTrack: "IB Internship",
    context: "M&A sell-side",
    weak: "Helped with valuation analysis for client project.",
    strong: "Built DCF and comps model for $420M industrial sell-side mandate, synthesizing management KPI trends into valuation range used in buyer diligence calls.",
  },
  {
    roleTrack: "IB Internship",
    context: "Debt financing",
    weak: "Assisted team with debt deal materials.",
    strong: "Supported execution of $150M senior secured refinancing by drafting lender memo exhibits and reconciling covenant sensitivity outputs across 3 leverage cases.",
  },
  {
    roleTrack: "Student investment club",
    context: "Equity research",
    weak: "Researched public companies and presented findings.",
    strong: "Initiated coverage on mid-cap SaaS name with full operating model and scenario analysis, presenting recommendation that improved simulated portfolio return by 180 bps.",
  },
  {
    roleTrack: "Private equity internship",
    context: "Diligence",
    weak: "Worked on diligence for potential investments.",
    strong: "Diligenced $85M healthcare add-on target by sizing referral-channel unit economics and highlighting churn risk that reduced proposed entry multiple by 0.7x.",
  },
  {
    roleTrack: "Corporate finance",
    context: "FP&A",
    weak: "Helped with budgeting and forecasting.",
    strong: "Owned monthly forecast model for $60M business unit, identifying $1.2M gross margin variance drivers and presenting corrective actions to CFO staff.",
  },
  {
    roleTrack: "Consulting internship",
    context: "Strategic analysis",
    weak: "Analyzed data for client recommendations.",
    strong: "Synthesized customer cohort and pricing data for Fortune 500 strategy project, quantifying $9M EBITDA upside from tiered price-pack architecture.",
  },
  {
    roleTrack: "Search fund",
    context: "Deal sourcing",
    weak: "Sourced and reviewed acquisition opportunities.",
    strong: "Screened 140 founder-owned targets and advanced 11 to IOI stage by building margin-quality scorecard and outreach funnel tracking.",
  },
  {
    roleTrack: "IB Internship",
    context: "Pitching",
    weak: "Worked on pitch materials for bankers.",
    strong: "Developed trading, precedent and strategic buyer slides for 6 live pitches across business services and industrials, contributing to 2 retained mandates.",
  },
];

export function getExemplarContext(roleTitle: string, section: string, max = 3): string {
  const needle = `${roleTitle} ${section}`.toLowerCase();
  const ranked = EXEMPLARS
    .map((e) => ({
      e,
      score:
        (needle.includes("bank") && e.roleTrack.toLowerCase().includes("ib") ? 2 : 0) +
        (needle.includes("invest") && e.roleTrack.toLowerCase().includes("investment") ? 1 : 0) +
        (needle.includes("finance") && e.roleTrack.toLowerCase().includes("finance") ? 1 : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ e }) => `Weak: ${e.weak}\nStrong: ${e.strong}`);

  return ranked.join("\n\n");
}
