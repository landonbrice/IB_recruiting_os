"use client";

const FRAMEWORKS = [
  {
    question: "Tell me about yourself",
    name: "HERO",
    slots: "Setup \u2192 Challenge \u2192 Turning Point \u2192 Resolution \u2192 Future Path",
  },
  {
    question: "Why banking / firm / you?",
    name: "CREI",
    slots: "Claim \u2192 Reason \u2192 Evidence \u2192 Impact",
  },
  {
    question: "Tell me about a time\u2026",
    name: "STAR PUNCH",
    slots: "Situation \u2192 Task \u2192 Action \u2192 Result \u2192 Punchline",
  },
  {
    question: "Weaknesses / gaps",
    name: "ABCD",
    slots: "Acknowledge \u2192 Bridge \u2192 Cover \u2192 Dangle",
  },
  {
    question: "Walk me through X",
    name: "TECH4",
    slots: "Define \u2192 Components \u2192 Mechanics \u2192 Application",
  },
  {
    question: "Equity vs. Debt?",
    name: "COMP2",
    slots: "Concept A \u2192 Concept B \u2192 Trade-offs \u2192 Context",
  },
  {
    question: "Recent deal",
    name: "DEAL",
    slots: "Name \u2192 Dates \u2192 Value \u2192 Consideration \u2192 Rationale \u2192 Risks",
  },
];

interface QuickReferenceProps {
  expanded: boolean;
  onToggle: () => void;
}

export default function QuickReference({ expanded, onToggle }: QuickReferenceProps) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="rounded-md px-3 py-1.5 text-[10px] font-semibold transition-colors"
        style={{
          color: expanded ? "#d4845a" : "#2a282660",
          border: `0.5px solid ${expanded ? "#d4845a" : "#e8e4dc"}`,
        }}
      >
        {expanded ? "Hide quick reference" : "Show quick reference"}
      </button>

      {expanded && (
        <div className="mt-3 rounded-[10px] border bg-white p-4" style={{ borderColor: "#e8e4dc", borderWidth: "0.5px" }}>
          <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[1px] text-smoke">
            Answer frameworks
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {FRAMEWORKS.map((fw) => (
              <div
                key={fw.name}
                className="rounded-md border border-cream-1 p-2.5"
              >
                <p className="text-[10px] text-smoke/40">{fw.question}</p>
                <p className="mt-0.5 text-[11px] font-bold text-terracotta">
                  {fw.name}
                </p>
                <p className="mt-1 text-[10px] text-smoke/30">{fw.slots}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
