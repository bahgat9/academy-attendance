export default function Loading() {
  return (
    <main className="min-h-screen bg-neutral-950 px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-white/10" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
          <div className="h-24 animate-pulse rounded-3xl bg-white/5" />
        </div>
      </div>
    </main>
  );
}
