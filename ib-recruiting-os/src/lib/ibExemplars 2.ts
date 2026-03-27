export interface IBBulletExemplar {
  text: string;
  category: string;
  level: "intern" | "analyst" | "associate";
  dealType: string;
  /** Legacy fields for backward compatibility */
  roleTrack?: string;
  context?: string;
  weak?: string;
  strong?: string;
}

const EXEMPLARS: IBBulletExemplar[] = [
  // ── M&A Advisory (Analyst) ──────────────────────────────────────────────
  {
    text: "Executed DCF and LBO models for $420M industrial sell-side mandate, synthesizing management KPI trends into valuation range used in buyer diligence calls.",
    category: "M&A advisory",
    level: "analyst",
    dealType: "sell-side",
  },
  {
    text: "Prepared CIM and management presentation for $680M healthcare carve-out, coordinating data requests across 4 business units and 2 external advisors.",
    category: "M&A advisory",
    level: "analyst",
    dealType: "sell-side",
  },
  {
    text: "Modeled merger synergy scenarios for $1.2B cross-border acquisition, identifying $45M in run-rate cost savings that informed final bid structure.",
    category: "M&A advisory",
    level: "analyst",
    dealType: "buy-side",
  },
  {
    text: "Analyzed precedent transactions and trading comps across 40+ business services deals, building valuation framework used in 3 live client pitches.",
    category: "M&A advisory",
    level: "analyst",
    dealType: "pitching",
  },
  {
    text: "Structured buyer outreach for competitive sell-side process, managing 28-party contact list and tracking diligence status across 6 active counterparties.",
    category: "M&A advisory",
    level: "analyst",
    dealType: "sell-side",
  },

  // ── M&A Advisory (Intern/Associate) ─────────────────────────────────────
  {
    text: "Supported execution of $340M healthcare acquisition by analyzing 5-year revenue projections across 3 business units and preparing buyer diligence exhibits.",
    category: "M&A advisory",
    level: "intern",
    dealType: "buy-side",
  },
  {
    text: "Assisted on $180M sell-side mandate in consumer products, building teaser and CIM exhibits and coordinating virtual data room setup with 12 prospective buyers.",
    category: "M&A advisory",
    level: "intern",
    dealType: "sell-side",
  },
  {
    text: "Built operating model and accretion/dilution analysis for $900M strategic acquisition, presenting key sensitivities to senior deal team for client discussion.",
    category: "M&A advisory",
    level: "associate",
    dealType: "buy-side",
  },
  {
    text: "Managed due diligence workstream on $550M industrials platform acquisition, synthesizing findings from 8 vendor reports into executive summary for Investment Committee.",
    category: "M&A advisory",
    level: "associate",
    dealType: "buy-side",
  },
  {
    text: "Coordinated buyer feedback and valuation updates during $250M consumer technology auction, supporting team through 3 rounds of bids to signed LOI.",
    category: "M&A advisory",
    level: "intern",
    dealType: "sell-side",
  },

  // ── Capital Markets / DCM / ECM ─────────────────────────────────────────
  {
    text: "Supported execution of $150M senior secured refinancing by drafting lender memo exhibits and reconciling covenant sensitivity outputs across 3 leverage cases.",
    category: "Capital markets",
    level: "analyst",
    dealType: "debt financing",
  },
  {
    text: "Analyzed comparable bond offerings and credit spreads for $400M high-yield issuance, preparing investor presentation that contributed to 2.5x oversubscription.",
    category: "Capital markets",
    level: "analyst",
    dealType: "debt financing",
  },
  {
    text: "Prepared roadshow materials and valuation analysis for $220M IPO in enterprise software, coordinating feedback from 14 institutional investor meetings.",
    category: "Capital markets",
    level: "analyst",
    dealType: "equity",
  },
  {
    text: "Built pricing model for $300M follow-on equity offering, benchmarking discount and greenshoe assumptions against 20 recent software secondaries.",
    category: "Capital markets",
    level: "analyst",
    dealType: "equity",
  },
  {
    text: "Drafted credit committee memo and term sheet for $175M Term Loan B facility, modeling interest coverage and leverage covenant compliance under stress scenarios.",
    category: "Capital markets",
    level: "analyst",
    dealType: "debt financing",
  },

  // ── Leveraged Finance / LBO ─────────────────────────────────────────────
  {
    text: "Built fully integrated LBO model for $380M sponsor-backed acquisition, sizing $240M of debt capacity across senior and mezzanine tranches with 18% IRR at base case.",
    category: "Leveraged finance",
    level: "analyst",
    dealType: "LBO",
  },
  {
    text: "Modeled 5-year cash flow waterfall for $500M dividend recapitalization, determining optimal leverage ratio that maximized sponsor returns while maintaining 2.0x coverage.",
    category: "Leveraged finance",
    level: "analyst",
    dealType: "dividend recap",
  },
  {
    text: "Analyzed credit statistics and covenant structures across 15 comparable leveraged financings, advising sponsor on optimal capital structure for $290M platform acquisition.",
    category: "Leveraged finance",
    level: "analyst",
    dealType: "LBO",
  },
  {
    text: "Prepared lender presentation for $200M unitranche facility, modeling downside scenarios and demonstrating 1.5x minimum DSCR through cycle trough assumptions.",
    category: "Leveraged finance",
    level: "intern",
    dealType: "debt financing",
  },
  {
    text: "Supported syndication of $450M first lien term loan, tracking investor commitments and preparing allocation recommendations for pricing committee.",
    category: "Leveraged finance",
    level: "intern",
    dealType: "syndication",
  },

  // ── Restructuring ──────────────────────────────────────────────────────
  {
    text: "Modeled 13-week cash flow forecast for distressed retailer with $120M in liabilities, identifying $8M in liquidity shortfall that accelerated DIP financing negotiations.",
    category: "Restructuring",
    level: "analyst",
    dealType: "Chapter 11",
  },
  {
    text: "Analyzed plan of reorganization alternatives for $350M creditor advisory engagement, quantifying recovery rates across 4 scenarios for unsecured creditor committee.",
    category: "Restructuring",
    level: "analyst",
    dealType: "creditor advisory",
  },
  {
    text: "Prepared liability management analysis for energy company facing $500M maturity wall, evaluating exchange offer and amend-and-extend structures to avoid default.",
    category: "Restructuring",
    level: "analyst",
    dealType: "liability management",
  },
  {
    text: "Built liquidation analysis and going-concern valuation for $180M Chapter 11 debtor, supporting negotiation of $45M DIP facility with 4 participating lenders.",
    category: "Restructuring",
    level: "analyst",
    dealType: "Chapter 11",
  },
  {
    text: "Supported creditor negotiation on $275M out-of-court restructuring, modeling waterfall recoveries under 3 capital structure alternatives for ad hoc lender group.",
    category: "Restructuring",
    level: "intern",
    dealType: "out-of-court",
  },

  // ── Valuation / Financial Modeling ──────────────────────────────────────
  {
    text: "Built three-statement operating model with integrated balance sheet and cash flow projections for $600M industrial conglomerate across 4 reporting segments.",
    category: "Valuation",
    level: "analyst",
    dealType: "modeling",
  },
  {
    text: "Performed sum-of-the-parts valuation for $1.1B diversified holding company, applying segment-specific multiples from 35 precedent transactions.",
    category: "Valuation",
    level: "analyst",
    dealType: "valuation",
  },
  {
    text: "Developed sensitivity analysis on key revenue and margin drivers for $450M SaaS company, presenting 12-scenario matrix to senior bankers for client pitch.",
    category: "Valuation",
    level: "analyst",
    dealType: "pitching",
  },
  {
    text: "Constructed LBO model with detailed debt schedule and returns analysis, achieving management case IRR of 22% and 2.8x MOIC over 5-year hold period.",
    category: "Valuation",
    level: "intern",
    dealType: "LBO",
  },
  {
    text: "Compiled and maintained comparable company universe of 50+ public firms across 3 sub-sectors, updating weekly for 6 active coverage mandates.",
    category: "Valuation",
    level: "intern",
    dealType: "comps",
  },

  // ── Industry Coverage (TMT, Healthcare, FIG, Industrials) ───────────────
  {
    text: "Analyzed ARR growth trends and SaaS unit economics for 8 mid-market software targets, building proprietary screen that sourced 2 mandated sell-side engagements.",
    category: "Industry coverage",
    level: "analyst",
    dealType: "TMT",
  },
  {
    text: "Modeled FDA approval probability-adjusted revenue for $320M biotech acquisition, incorporating Phase III trial data into risk-adjusted DCF framework.",
    category: "Industry coverage",
    level: "analyst",
    dealType: "Healthcare",
  },
  {
    text: "Evaluated regulatory capital impact of $800M bank acquisition under Basel III requirements, modeling Tier 1 capital ratios across 3 integration scenarios.",
    category: "Industry coverage",
    level: "analyst",
    dealType: "FIG",
  },
  {
    text: "Prepared industry primer on EV charging infrastructure covering 15 public and private companies, identifying 3 consolidation themes for MD-level pitch development.",
    category: "Industry coverage",
    level: "analyst",
    dealType: "Industrials",
  },
  {
    text: "Tracked platform acquisition pipeline for PE-backed healthcare services consolidator, screening 40+ physician practice groups and advancing 5 to management meetings.",
    category: "Industry coverage",
    level: "intern",
    dealType: "Healthcare",
  },

  // ── General Corporate Finance / FP&A ────────────────────────────────────
  {
    text: "Owned monthly forecast model for $60M business unit, identifying $1.2M gross margin variance drivers and presenting corrective actions to CFO staff.",
    category: "Corporate finance",
    level: "analyst",
    dealType: "FP&A",
  },
  {
    text: "Built annual budget model consolidating inputs from 6 department heads, implementing driver-based revenue forecasting that reduced variance by 15% vs. prior approach.",
    category: "Corporate finance",
    level: "analyst",
    dealType: "FP&A",
  },
  {
    text: "Analyzed capital allocation alternatives including share repurchase, dividend increase, and bolt-on M&A, presenting NPV comparison to executive leadership team.",
    category: "Corporate finance",
    level: "analyst",
    dealType: "corporate strategy",
  },
  {
    text: "Synthesized customer cohort and pricing data for Fortune 500 strategy project, quantifying $9M EBITDA upside from tiered price-pack architecture.",
    category: "Corporate finance",
    level: "intern",
    dealType: "consulting crossover",
  },
  {
    text: "Prepared board materials including quarterly financial review and KPI dashboard tracking 20+ metrics across 3 business segments for $200M revenue company.",
    category: "Corporate finance",
    level: "intern",
    dealType: "FP&A",
  },

  // ── Additional strong bullets ───────────────────────────────────────────
  {
    text: "Initiated coverage on mid-cap SaaS name with full operating model and scenario analysis, presenting recommendation that improved simulated portfolio return by 180 bps.",
    category: "Industry coverage",
    level: "intern",
    dealType: "equity research",
  },
  {
    text: "Diligenced $85M healthcare add-on target by sizing referral-channel unit economics and highlighting churn risk that reduced proposed entry multiple by 0.7x.",
    category: "M&A advisory",
    level: "intern",
    dealType: "PE diligence",
  },
  {
    text: "Screened 140 founder-owned targets and advanced 11 to IOI stage by building margin-quality scorecard and outreach funnel tracking.",
    category: "M&A advisory",
    level: "analyst",
    dealType: "deal sourcing",
  },
  {
    text: "Developed trading, precedent and strategic buyer slides for 6 live pitches across business services and industrials, contributing to 2 retained mandates.",
    category: "M&A advisory",
    level: "intern",
    dealType: "pitching",
  },
];

// ── Exemplar selection ────────────────────────────────────────────────────────

/**
 * Select relevant exemplars for rewrite generation.
 * Filters by candidate level and category relevance when possible.
 */
export function getExemplarContext(
  roleTitle: string,
  section: string,
  max = 3,
  candidateLevel?: "intern" | "analyst" | "associate"
): string {
  const needle = `${roleTitle} ${section}`.toLowerCase();

  const scored = EXEMPLARS.map((e) => {
    let score = 0;

    // Category relevance
    const cat = e.category.toLowerCase();
    if (needle.includes("m&a") && cat.includes("m&a")) score += 3;
    if (needle.includes("restructur") && cat.includes("restructur")) score += 3;
    if (needle.includes("leverag") && cat.includes("leverag")) score += 3;
    if (needle.includes("capital market") && cat.includes("capital")) score += 3;
    if ((needle.includes("bank") || needle.includes("ib")) && cat.includes("m&a")) score += 2;
    if (needle.includes("invest") && (cat.includes("m&a") || cat.includes("valuation"))) score += 1;
    if (needle.includes("finance") && cat.includes("corporate")) score += 2;
    if (needle.includes("consult") && cat.includes("corporate")) score += 1;
    if (needle.includes("model") && cat.includes("valuation")) score += 2;

    // Deal type relevance
    const dt = e.dealType.toLowerCase();
    if (needle.includes("tmt") && dt.includes("tmt")) score += 2;
    if (needle.includes("health") && dt.includes("health")) score += 2;
    if (needle.includes("fig") && dt.includes("fig")) score += 2;
    if (needle.includes("lbo") && dt.includes("lbo")) score += 2;

    // Level match bonus
    if (candidateLevel && e.level === candidateLevel) score += 1;

    return { e, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, max)
    .map(({ e }) => `Example: ${e.text}`)
    .join("\n\n");
}
