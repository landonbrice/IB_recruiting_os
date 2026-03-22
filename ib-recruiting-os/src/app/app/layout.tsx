export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-smoke text-cream">
      {children}
    </div>
  );
}
