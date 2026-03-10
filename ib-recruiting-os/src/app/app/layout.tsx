/**
 * App shell layout — fixed viewport, no scroll.
 * The root layout is scrollable-friendly (for the landing page).
 * This layout locks the coaching app to a full-screen, overflow-hidden shell.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-stone-950">
      {children}
    </div>
  );
}
