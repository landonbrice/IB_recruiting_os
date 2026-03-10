/**
 * /app — IB Resume Coach application shell.
 *
 * Renders one of three UI themes based on NEXT_PUBLIC_UI_VERSION env var
 * or the ?ui= URL param (for dev switching without rebuilding).
 *
 * Switch themes:
 *   ?ui=a  →  "The Operator"  — dark, chat-first, amber (default)
 *   ?ui=b  →  "The Platform"  — light, three-column dashboard
 *   ?ui=c  →  "The Terminal"  — monospace, near-black, green
 *
 * Or set NEXT_PUBLIC_UI_VERSION=b in .env.local for a permanent default.
 */

"use client";

import { useEffect, useState } from "react";
import { getUIVersion, UI_VERSION_LABELS, type UIVersion } from "@/lib/uiConfig";
import ThemeA from "@/themes/ThemeA";
import ThemeB from "@/themes/ThemeB";
import ThemeC from "@/themes/ThemeC";

const THEMES: Record<UIVersion, React.ComponentType> = {
  a: ThemeA,
  b: ThemeB,
  c: ThemeC,
};

export default function AppPage() {
  const [version, setVersion] = useState<UIVersion>("a");

  useEffect(() => {
    setVersion(getUIVersion());
  }, []);

  const Theme = THEMES[version];

  return (
    <>
      <Theme />
      {/* Dev UI switcher — only visible in development */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-4 left-1/2 z-[999] -translate-x-1/2">
          <div className="flex items-center gap-1 rounded-full border border-stone-700 bg-stone-900/90 px-3 py-1.5 backdrop-blur-sm shadow-xl">
            {(["a", "b", "c"] as UIVersion[]).map(v => (
              <a
                key={v}
                href={`/app?ui=${v}`}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  version === v
                    ? "bg-amber-600 text-white"
                    : "text-stone-400 hover:text-stone-200"
                }`}
                title={UI_VERSION_LABELS[v]}
              >
                {v.toUpperCase()}
              </a>
            ))}
            <span className="ml-1 text-[10px] text-stone-600">UI</span>
          </div>
        </div>
      )}
    </>
  );
}
