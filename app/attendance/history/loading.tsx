export default function Loading() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
        <div className="h-28 animate-pulse rounded-3xl bg-white/5" />
        <div className="h-64 animate-pulse rounded-3xl bg-white/5" />
      </div>
    </main>
  );
}
