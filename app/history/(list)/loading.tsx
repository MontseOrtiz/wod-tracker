// Same shape as the list it stands in for, so the page doesn't jump when data arrives.
// Lives in the (list) group so it doesn't also wrap /history/[id], where it would swallow
// the 404 status of notFound().
export default function HistoryLoading() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-6" aria-busy="true">
      <div className="flex flex-col gap-2">
        <div className="animate-pulse-bar h-9 w-48 rounded-full bg-yellow" />
        <div className="animate-pulse-bar h-5 w-40 rounded-full bg-yellow" />
      </div>
      <div className="animate-pulse-bar h-32 rounded-3xl border-2 border-ink bg-cream" />
      <ul className="flex flex-col gap-3" aria-label="Cargando rounds">
        {[0, 1, 2, 3].map(i => (
          <li key={i} className="animate-pulse-bar flex items-center gap-4 rounded-3xl border-2 border-blue bg-cream p-3">
            <span className="size-16 shrink-0 rounded-2xl bg-blue" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-4 w-32 rounded-full bg-yellow" />
              <span className="h-3 w-20 rounded-full bg-yellow" />
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
