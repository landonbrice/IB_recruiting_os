"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const FEATURES = [
  {
    title: "IB-Specific Resume Score",
    desc: "Scored across 5 dimensions — language, bullet plausibility, job alignment, uniqueness, and GPA signal. Not generic, not fluffy. Built around what IB interviewers actually look for.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    ),
  },
  {
    title: "Live Bullet Editing",
    desc: "Click any bullet on your resume and get 3 AI-rewritten variants, tailored to your specific role and the IB bullet formula: strong verb + scope + quantified outcome.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
      />
    ),
  },
  {
    title: "Story + Feasibility Coaching",
    desc: "Develop your Why-IB narrative, get bank-specific targeting advice, and unlock a Feasibility Score that tells you honestly where you stand — including whether networking matters more than another bullet rewrite.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
      />
    ),
  },
];

const DIFFERENTIATORS = [
  "Brutally honest about your actual chances — not just \u201ckeep it up\u201d",
  "Networking-first philosophy: tells you when cold emails matter more than bullet rewrites",
  "IB-specific scoring built around real recruiting signal, not generic resume advice",
  "Candidate segmentation: non-target, career switcher, and target get completely different coaching",
  "No fabrication — ever. Every suggestion must be something you can defend in an interview",
  "Your story, your thread — the cover letter writes itself from what you've said",
];

const COOKIE_NAME = "ib_coach_beta";

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function LandingPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Beta gate state
  const [showGate, setShowGate] = useState(false);
  const [gateInput, setGateInput] = useState("");
  const [gateError, setGateError] = useState(false);

  useEffect(() => {
    if (searchParams.get("gate") === "1") setShowGate(true);
  }, [searchParams]);

  function handleGateSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Send password attempt to a lightweight verify endpoint
    fetch("/api/beta-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: gateInput }),
    })
      .then((r) => r.json())
      .then((data: { ok?: boolean }) => {
        if (data.ok) {
          setCookie(COOKIE_NAME, gateInput, 30);
          setShowGate(false);
          router.replace("/");
        } else {
          setGateError(true);
          setTimeout(() => setGateError(false), 2000);
        }
      })
      .catch(() => setGateError(true));
  }

  const processFile = useCallback(
    async (file: File) => {
      const allowed = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
      ];
      const nameOk =
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".docx") ||
        file.name.endsWith(".doc");
      if (!allowed.includes(file.type) && !nameOk) {
        setError("Please upload a PDF or Word document (.pdf, .docx, .doc)");
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            (body as { error?: string }).error ?? "Failed to parse file"
          );
        }

        const data = (await res.json()) as { text: string; html?: string };

        // Store in sessionStorage so /app can pick it up
        sessionStorage.setItem("resume_text", data.text);
        sessionStorage.setItem("resume_filename", file.name);
        if (data.html) sessionStorage.setItem("resume_html", data.html);
        // Store file for PDF preview
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            sessionStorage.setItem(
              "resume_file_data",
              e.target.result as string
            );
            sessionStorage.setItem("resume_file_name", file.name);
            sessionStorage.setItem("resume_file_type", file.type);
          }
          router.push("/app");
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Try again."
        );
        setIsUploading(false);
      }
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="min-h-full bg-stone-950 text-stone-100">
      {/* Nav */}
      <nav className="border-b border-stone-900 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold tracking-tight">
              IB Resume Coach
            </span>
          </div>
          <button
            onClick={() => router.push("/app")}
            className="text-xs text-stone-500 hover:text-stone-300 transition"
          >
            Already in a session? →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-800/50 bg-amber-950/30 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          <span className="text-xs font-medium text-amber-400">
            Built for IB recruiting, not generic job hunting
          </span>
        </div>

        <h1 className="mb-4 text-4xl font-bold leading-tight tracking-tight text-stone-50 sm:text-5xl">
          The IB resume coach that&apos;s{" "}
          <span className="text-amber-400">brutally honest</span>
        </h1>

        <p className="mb-10 text-lg leading-relaxed text-stone-400">
          Drop your resume. Get scored on 5 IB-specific dimensions, have your
          bullets rewritten live, develop your story, and find out where you
          actually stand — including whether networking matters more than
          another bullet rewrite.
        </p>

        {/* Upload zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`mx-auto mb-3 flex max-w-xl cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-8 py-12 transition-all ${
            isDragging
              ? "border-amber-500 bg-amber-950/20"
              : "border-stone-700 hover:border-stone-500 hover:bg-stone-900/50"
          } ${isUploading ? "cursor-wait opacity-70" : ""}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />

          {isUploading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-700 border-t-amber-500" />
              <p className="text-sm text-stone-400">Parsing your resume…</p>
            </>
          ) : (
            <>
              <svg
                className="h-8 w-8 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-stone-300">
                  Drop your resume here
                </p>
                <p className="mt-0.5 text-xs text-stone-600">
                  PDF or Word (.pdf, .docx) · Free · No account needed
                </p>
              </div>
            </>
          )}
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-400">{error}</p>
        )}

        <p className="text-xs text-stone-700">
          Your resume is never stored. Session is local to your browser.
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-stone-900 px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-10 text-center text-2xl font-bold text-stone-100">
            Not a resume checker. A recruiting co-pilot.
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-stone-800 bg-stone-900/40 p-6"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-900/30">
                  <svg
                    className="h-5 w-5 text-amber-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mb-2 text-sm font-semibold text-stone-100">
                  {f.title}
                </h3>
                <p className="text-xs leading-relaxed text-stone-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="border-t border-stone-900 px-6 py-16">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-2xl font-bold text-stone-100">
            What makes this different
          </h2>
          <ul className="space-y-3">
            {DIFFERENTIATORS.map((d) => (
              <li key={d} className="flex items-start gap-3">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                <span className="text-sm text-stone-400">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-stone-900 px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-bold text-stone-100">
          Ready to find out where you actually stand?
        </h2>
        <p className="mb-8 text-stone-500">
          Upload your resume. No account, no email, no fluff.
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-amber-500"
        >
          Upload Resume
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
            />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          className="hidden"
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-900 px-6 py-6 text-center">
        <p className="text-xs text-stone-700">
          IB Resume Coach — Built for candidates serious about banking.
        </p>
      </footer>

      {/* Beta gate modal */}
      {showGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-stone-800 bg-stone-950 p-8 shadow-2xl">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-sm font-semibold text-stone-100">IB Resume Coach</span>
            </div>
            <p className="mb-6 text-xs text-stone-500">Beta access — enter your invite code to continue.</p>
            <form onSubmit={handleGateSubmit} className="space-y-3">
              <input
                type="password"
                value={gateInput}
                onChange={(e) => setGateInput(e.target.value)}
                placeholder="Invite code"
                autoFocus
                className={`w-full rounded-xl border px-4 py-3 text-sm text-stone-100 bg-stone-900 placeholder:text-stone-600 focus:outline-none focus:ring-1 transition ${
                  gateError
                    ? "border-red-600 ring-red-600"
                    : "border-stone-700 focus:ring-amber-600"
                }`}
              />
              {gateError && (
                <p className="text-xs text-red-400">Incorrect code — try again.</p>
              )}
              <button
                type="submit"
                disabled={!gateInput.trim()}
                className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-40"
              >
                Enter
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  return (
    <Suspense>
      <LandingPageInner />
    </Suspense>
  );
}
