"use client";

export default function CoachPanel() {
  return (
    <div className="flex w-[220px] flex-shrink-0 flex-col border-l border-white/[0.06] bg-smoke-1">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-3.5 py-3">
        <div className="text-[11px] font-semibold text-cream">Coach</div>
        <div className="text-[10px] text-cream/30">Contextual guidance</div>
      </div>

      {/* Body */}
      <div className="flex flex-1 items-center justify-center px-4">
        <p className="max-w-[160px] text-center text-[11px] leading-relaxed text-cream/40">
          Select a node on your arc to start building stories.
        </p>
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] px-3.5 py-2.5">
        <div className="flex items-center rounded-lg border border-white/[0.08] bg-smoke px-3 py-2">
          <input
            type="text"
            placeholder="Ask the coach..."
            className="flex-1 bg-transparent text-[11px] text-cream/30 placeholder:text-cream/30 outline-none"
            disabled
          />
          <span className="text-[11px] text-cream/15">↵</span>
        </div>
      </div>
    </div>
  );
}
