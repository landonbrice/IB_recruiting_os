/**
 * uiConfig.ts
 *
 * Controls which UI variant is active.
 * Switch by setting NEXT_PUBLIC_UI_VERSION in .env.local:
 *   NEXT_PUBLIC_UI_VERSION=a   → "The Operator"  (dark, chat-first, amber)
 *   NEXT_PUBLIC_UI_VERSION=b   → "The Platform"  (light, 3-col dashboard)
 *   NEXT_PUBLIC_UI_VERSION=c   → "The Terminal"  (monospace, green, sharp)
 *
 * Defaults to "b" if not set.
 * Can also be overridden at runtime via ?ui=b URL param (dev only).
 */

export type UIVersion = "a" | "b" | "c";

export const UI_VERSION_LABELS: Record<UIVersion, string> = {
  a: "The Operator — dark, chat-first",
  b: "The Platform — light, dashboard",
  c: "The Terminal — monospace, sharp",
};

export function getUIVersion(): UIVersion {
  // URL param override (client-side only, dev use)
  if (typeof window !== "undefined") {
    const param = new URLSearchParams(window.location.search).get("ui");
    if (param === "a" || param === "b" || param === "c") return param;
  }
  const env = process.env.NEXT_PUBLIC_UI_VERSION;
  if (env === "a" || env === "b" || env === "c") return env;
  return "b";
}
