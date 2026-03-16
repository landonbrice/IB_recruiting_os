export default function AppLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-stone-950 px-6">
      <div className="w-full max-w-md rounded-2xl border border-stone-800 bg-stone-900/70 p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-amber-700/50 bg-amber-900/20">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-stone-600 border-t-amber-400" />
        </div>

        <p className="text-sm font-semibold text-stone-200">Loading IB Resume Coach…</p>
        <p className="mt-1 text-xs text-stone-500">
          First load can take a few seconds while local modules warm up.
        </p>

        <div className="mt-4 space-y-2 text-left text-xs text-stone-400">
          <div className="rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2">• Initializing workspace</div>
          <div className="rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2">• Preparing scoring and rewrite tools</div>
          <div className="rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2">• Starting chat + resume pipeline</div>
        </div>
      </div>
    </div>
  );
}
