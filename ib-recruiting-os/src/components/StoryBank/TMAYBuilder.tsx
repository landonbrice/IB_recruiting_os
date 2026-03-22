"use client";

interface TMAYBuilderProps {
  narrative: string;
}

export default function TMAYBuilder({ narrative }: TMAYBuilderProps) {
  return (
    <div
      className="rounded-[12px] p-5"
      style={{
        backgroundColor: "#d4845a0a",
        border: "0.5px solid #d4845a26",
      }}
    >
      <h3 className="text-[15px] font-bold tracking-[-0.3px] text-smoke">
        Tell me about yourself
      </h3>
      <p className="mt-0.5 text-[10px] text-terracotta">
        Assembled from your Decision Arc
      </p>

      <p className="mt-3 text-[12px] leading-[1.7] text-smoke">{narrative}</p>

      <div className="mt-4 flex gap-2">
        <button className="rounded-md border border-terracotta px-3 py-1.5 text-[10px] font-semibold text-terracotta transition-colors hover:bg-terracotta/5">
          Edit
        </button>
        <button className="rounded-md border border-cream-1 px-3 py-1.5 text-[10px] font-semibold text-smoke/50 transition-colors hover:bg-cream">
          Refine with coach
        </button>
      </div>
    </div>
  );
}
