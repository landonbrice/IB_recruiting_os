"use client";

import { useCallback, useState } from "react";

interface Props {
  onUpload: (text: string, fileName: string, file: File, html?: string) => void;
}

export default function UploadOverlay({ onUpload }: Props) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to parse file");
        onUpload(data.text, file.name, file, data.html);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setLoading(false);
      }
    },
    [onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950">
      <div className="w-full max-w-lg px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-100">
            IB Recruiting OS
          </h1>
          <p className="mt-2 text-sm text-stone-400">
            Your honest guide to breaking into investment banking.
          </p>
        </div>

        {/* Drop Zone */}
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed px-8 py-14 cursor-pointer transition-all duration-200 ${
            dragging
              ? "border-amber-500 bg-amber-500/5"
              : "border-stone-700 bg-stone-900 hover:border-stone-500 hover:bg-stone-800/50"
          }`}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="hidden"
            onChange={handleChange}
            disabled={loading}
          />

          {loading ? (
            <>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-600 border-t-amber-500" />
              <p className="text-sm text-stone-400">Reading your resume...</p>
            </>
          ) : (
            <>
              <svg
                className="h-10 w-10 text-stone-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                />
              </svg>
              <div className="text-center">
                <p className="text-sm font-medium text-stone-200">
                  Drop your resume here
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  PDF or Word — click to browse
                </p>
              </div>
            </>
          )}
        </label>

        {error && (
          <p className="mt-4 text-center text-sm text-red-400">{error}</p>
        )}

        <p className="mt-8 text-center text-xs text-stone-600">
          Your resume stays in this session only. Nothing is stored.
        </p>
      </div>
    </div>
  );
}
