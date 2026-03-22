import type { ArcNode, Thread } from "@/lib/storyState";

export interface ArcNodeDisplay extends ArcNode {
  t: number;
  offset?: { dx: number; dy: number };
  branchFrom?: string;
  transition?: string;
  weight?: "heavy" | "normal";
}

export const DEMO_NODES: ArcNodeDisplay[] = [
  {
    id: "idp",
    label: "Innovation Diploma Program",
    sub: "Lead Consulting Analyst",
    timeframe: "2022–2024",
    type: "experience",
    t: 0.0,
    weight: "normal",
    positives: [
      "Learned to lead through purpose, not authority",
      "Discovered I need work to reach execution, not just recommendation",
      "Built confidence directing client-facing strategy",
    ],
    negatives: [
      "Work subject to client's whims on implementation — no control over outcomes",
      "Wanted tangible results, not just ideas",
    ],
    impactStories: [
      {
        id: "bp-1",
        type: "M",
        status: "ready",
        nickname: "The $96M Leasing Problem",
        steppingStone: {
          answerFirst:
            "Directed a team of 7 to solve a tenant leasing problem for a $96M mixed-use property, pitching a solution that was implemented",
          actions: [
            "Created QFT methodology to channel disagreement into structured ideation",
            "Ran standup meetings",
            "Administered 1-on-1s with BP's President",
          ],
          tension: "Disagreement on exterior design ideas — team was stuck",
          resolution:
            "QFT exercise broke the deadlock. Outdoor turf and pool installations pitched and implemented.",
        },
        ibConnection:
          "Leading a team through ambiguity to a client-facing deliverable — the analyst-to-associate arc",
        valueAdd: {
          category: "people",
          past: "Led team of 7 through ambiguity",
          future: "Drive deal teams under pressure",
        },
      },
      {
        id: "geo-1",
        type: "A",
        status: "draft",
        nickname: "The Geodis Chatbot",
        steppingStone: {
          answerFirst:
            "Built an enterprise chatbot prototype modeling 40% reduction in onboarding ticket redundancies for 17,000 employees",
          actions: [
            "Ran cross-divisional breakout sessions",
            "Surveyed persistence issues",
            "Designed chatbot UI",
          ],
          tension: "",
          resolution: "",
        },
        ibConnection: "",
        valueAdd: {
          category: "process",
          past: "Translated cross-divisional feedback into design",
          future: "",
        },
      },
    ],
    setMetGoals: [],
  },
  {
    id: "amd",
    label: "Atlanta Mobile Detailing",
    sub: "Co-Founder",
    timeframe: "Summer 2024–Present",
    type: "experience",
    t: 0.22,
    weight: "normal",
    transition: "wanted execution, not just ideas",
    positives: [
      "Builder by mind — needed autonomy and tangible outcomes",
      "Learned to read clients, negotiate, adapt on the fly",
      "Individual contribution directly tied to results",
    ],
    negatives: [
      "Not dynamic enough — no scale, too redundant",
      "Wanted bigger, more complex problems",
    ],
    impactStories: [
      {
        id: "amd-1",
        type: "I",
        status: "ready",
        nickname: "Zero to 100 Clients",
        steppingStone: {
          answerFirst:
            "Launched a mobile detailing business from scratch, acquiring 100+ clients with $0 customer acquisition cost",
          actions: [
            "Leveraged Nextdoor with referral incentives",
            "Learned to read client personalities for WTP",
            "Built customized pricing per client",
          ],
          tension:
            "Two details back-to-back — older client only used voicemails, created miscommunication with next client",
          resolution:
            "Learned to pivot in real time. Built recurring base of 12+ repeat clients.",
        },
        ibConnection:
          "Built something from zero, dealt with real clients, negotiated pricing. Entrepreneurial initiative is an IB differentiator.",
        valueAdd: {
          category: "time_money",
          past: "Grew revenue with $0 CAC",
          future: "Resourceful under constraints",
        },
      },
    ],
    setMetGoals: [
      { set: "100 clients by end of summer", met: "100+ clients", metric: "$0 CAC" },
    ],
  },
  {
    id: "baseball",
    label: "UChicago Varsity Baseball",
    sub: "Pitcher",
    timeframe: "Fall 2024–Present",
    type: "experience",
    t: 0.22,
    offset: { dx: 30, dy: 100 },
    branchFrom: "amd",
    positives: [
      "Competitive intensity — won't lose; if outperformed, gets focused on process",
      "Discipline: 5:30 AM lifts, 30-40 hr/week forces ruthless prioritization",
      "Outspoken leadership — drives teammates toward immediate focus",
    ],
    negatives: ["Time constraint on everything else — forces efficiency"],
    impactStories: [
      {
        id: "bb-1",
        type: "T",
        status: "draft",
        nickname: "The NCAA Tournament Run",
        steppingStone: {
          answerFirst:
            "Ranked 2nd in school history with 20 pitching appearances as a freshman, contributing to first NCAA Tournament team in program history",
          actions: [
            "30-40 hour weekly commitment in spring",
            "4x 5:30 AM weekly workouts in fall",
            "Showed up consistently",
          ],
          tension:
            "Managing rigorous UChicago courseload while traveling 4 days a week",
          resolution: "",
        },
        ibConnection:
          "The 100-hour week culture of IB isn't new — I've already lived the discipline",
        valueAdd: {
          category: "people",
          past: "Showed up every day in a team environment",
          future: "Reliable under sustained pressure",
        },
      },
    ],
    setMetGoals: [],
  },
  {
    id: "krg",
    label: "King's Ransom Group",
    sub: "M&A Healthcare Intern",
    timeframe: "Summer 2025",
    type: "experience",
    t: 0.52,
    weight: "heavy",
    transition: "needed scale + complex problems",
    positives: [
      "Discovered trust matters more than logic in deal origination",
      "Earned responsibility through incessant drive — asked for more when there was nothing",
      "Fascinated by qualitative→quantitative→qualitative translation in valuation",
    ],
    negatives: [
      "Niche boutique — wanted broader transaction exposure",
      "Was pitching ideas I didn't fully understand yet",
    ],
    impactStories: [
      {
        id: "krg-1",
        type: "I",
        status: "ready",
        nickname: "Earning the Valuation Model",
        steppingStone: {
          answerFirst:
            "Earned access to live M&A valuation work by proactively asking for it when I had no clients to source",
          actions: [
            "Emailed manager: 'I don't have leads but I want to understand this business'",
            "Given reading assignments and past transaction cases",
            "Worked with SDE valuation models",
          ],
          tension:
            "Was in a sales role pitching ideas I didn't understand. Felt the gap between confidence and competence.",
          resolution:
            "Earned responsibility of working with a potential client through drive. Learned: I always want more.",
        },
        ibConnection:
          "Direct M&A: sourcing, valuation, client development. Qualitative-to-quantitative translation is exactly what analysts do.",
        valueAdd: {
          category: "process",
          past: "Self-directed learning on live deal models",
          future: "Will seek responsibility before it's given",
        },
      },
      {
        id: "krg-2",
        type: "P",
        status: "draft",
        nickname: "Cold Outreach to 2 EOI Clients",
        steppingStone: {
          answerFirst:
            "Brought 2 Expression-of-Interest clients through cold outreach and in-person persuasion",
          actions: [
            "Built market map in Atlanta",
            "Cold emailed via dental broker networks",
            "Visited local dentist in person",
          ],
          tension:
            "Most outreach got no response — logic alone doesn't convince people to sell their life's work",
          resolution:
            "Learned trust and rapport matter more than data in deal origination",
        },
        ibConnection:
          "Persuasion with data backing — numbers support the story, not the other way around.",
        valueAdd: {
          category: "people",
          past: "Brought clients to the table through persistence",
          future: "Comfortable in client-facing situations",
        },
      },
    ],
    setMetGoals: [
      { set: "Source viable mandates", met: "30+ qualified, 2 EOI", metric: "2 expressions of interest" },
    ],
  },
  {
    id: "macro",
    label: "Macro PIH Project",
    sub: "Academic — not on resume",
    timeframe: "2025",
    type: "non-resume",
    t: 0.52,
    offset: { dx: 40, dy: 105 },
    branchFrom: "krg",
    positives: [
      "Learned that presenting answers you don't have is wrong",
      "Developed discipline to sit confused longer before diving in",
    ],
    negatives: [
      "Failed publicly — presented wrong interpretation of regression data",
    ],
    impactStories: [
      {
        id: "pih-1",
        type: "C",
        status: "draft",
        nickname: "The Wrong Coefficient",
        steppingStone: {
          answerFirst:
            "Presented the wrong interpretation of a regression model to my macroeconomics team — publicly failed on accuracy",
          actions: [
            "Tasked with presenting data I didn't fully understand",
            "Interpreted coefficient <1 as smoothing when opposite was true",
          ],
          tension:
            "I thought I understood. I didn't. The mantra 'fail up' failed.",
          resolution:
            "Went to office hours, took accountability. Told myself: sit confused longer until you truly understand.",
        },
        ibConnection:
          "Accuracy is paramount in IB. I learned this the hard way — won't present something I don't understand again.",
        valueAdd: {
          category: "process",
          past: "Learned from failure publicly",
          future: "Checks work rigorously before presenting",
        },
      },
    ],
    setMetGoals: [],
  },
  {
    id: "cimarron",
    label: "Cimarron Healthcare Capital",
    sub: "PE Summer Analyst",
    timeframe: "Summer 2026",
    type: "upcoming",
    t: 0.78,
    weight: "normal",
    transition: "deepening the thesis",
    positives: [
      "Private equity — deepening healthcare vertical",
      "Buy-side perspective after sell-side M&A",
    ],
    negatives: [],
    impactStories: [],
    setMetGoals: [],
  },
  {
    id: "future",
    label: "IB Analyst",
    sub: "Target",
    timeframe: "Goal",
    type: "goal",
    t: 1.0,
    transition: "convergence",
    positives: [],
    negatives: [],
    impactStories: [],
    setMetGoals: [],
  },
];

export const DEMO_THREADS: Thread[] = [
  {
    id: "t1",
    label: "Ownership & Execution",
    color: "#d4845a",
    nodeIds: ["amd", "idp", "krg"],
    desc: "Needs autonomy. Wants work tied to outcomes, not recommendations.",
  },
  {
    id: "t2",
    label: "Analytical Translation",
    color: "#6366f1",
    nodeIds: ["krg", "idp", "macro"],
    desc: "Fascinated by how qualitative becomes quantitative and back.",
  },
  {
    id: "t3",
    label: "Competitive Intensity",
    color: "#dc2626",
    nodeIds: ["baseball", "amd", "krg"],
    desc: "Won't lose. If outperformed, gets focused on the process.",
  },
  {
    id: "t4",
    label: "Healthcare Vertical",
    color: "#059669",
    nodeIds: ["krg", "cimarron"],
    desc: "Deep and getting deeper — sell-side M&A → buy-side PE.",
  },
];
