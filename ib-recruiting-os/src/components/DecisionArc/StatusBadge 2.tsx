"use client";

interface StatusBadgeProps {
  status: "draft" | "ready";
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const isDraft = status === "draft";
  return (
    <span className="inline-flex items-center gap-1 text-[10px]">
      <span
        className={`h-1.5 w-1.5 rounded-full ${isDraft ? "bg-amber-500" : "bg-green-500"}`}
      />
      <span className={isDraft ? "text-amber-600" : "text-green-600"}>
        {isDraft ? "Draft" : "Ready"}
      </span>
    </span>
  );
}
