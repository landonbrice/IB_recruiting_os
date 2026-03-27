"use client";

interface ThreadBadgeProps {
  label: string;
  color: string;
}

export default function ThreadBadge({ label, color }: ThreadBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-[6px] px-2 py-0.5 text-[10px] font-medium"
      style={{
        backgroundColor: `${color}14`,
        color,
        border: `1px solid ${color}26`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  );
}
