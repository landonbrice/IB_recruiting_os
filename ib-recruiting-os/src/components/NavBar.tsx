"use client";

export type TabId = "resume" | "arc" | "stories" | "cover" | "targets";

interface Tab {
  id: TabId;
  label: string;
  disabled?: boolean;
}

const TABS: Tab[] = [
  { id: "resume", label: "Resume" },
  { id: "arc", label: "Decision Arc" },
  { id: "stories", label: "Stories" },
  { id: "cover", label: "Cover Letter", disabled: true },
  { id: "targets", label: "Targets", disabled: true },
];

interface NavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export default function NavBar({ activeTab, onTabChange }: NavBarProps) {
  return (
    <div className="flex h-12 items-center border-b border-white/[0.06] bg-smoke px-4">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mr-6">
        <div className="flex h-[26px] w-[26px] items-center justify-center rounded-md bg-gradient-to-br from-terracotta to-[#c07048]">
          <span className="text-[9px] font-black text-white leading-none">IB</span>
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-cream">
          Recruiting OS
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-0.5">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isDisabled = tab.disabled;

          if (isDisabled) {
            return (
              <button
                key={tab.id}
                disabled
                className="relative cursor-not-allowed rounded-md px-3.5 py-1.5 text-[12px] font-medium text-cream/20"
              >
                {tab.label}
                <span className="ml-1 text-[9px] text-cream/10">soon</span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`rounded-md px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/[0.06] text-cream"
                  : "text-cream/40 hover:text-cream/60"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* User indicator */}
      <div className="ml-auto">
        <span className="text-[10px] text-cream/30">Beta</span>
      </div>
    </div>
  );
}
