export default function Loading() {
  return (
    <main id="main" className="mx-auto flex w-full max-w-md flex-1 items-center justify-center p-6" aria-busy="true">
      <p className="text-ink-soft" role="status">Loading campus…</p>
    </main>
  );
}
