export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 font-sans dark:bg-zinc-950">
      <main className="flex w-full max-w-2xl flex-col gap-8 rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            LotSync
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Real-time inventory sync for dealership lots
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            LotSync keeps electronic vehicle display tags synchronized with
            your primary consumer-facing inventory channel—so the price on the
            lot matches what shoppers see online.
          </p>
        </div>

        <div className="flex flex-col gap-4 rounded-xl bg-zinc-50 p-6 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Platform status
          </h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-zinc-500">Frontend</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                Running on localhost:3000
              </dd>
            </div>
            <div>
              <dt className="text-zinc-500">API</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                http://localhost:8000/health
              </dd>
            </div>
          </dl>
        </div>

        <p className="text-sm text-zinc-500">
          Milestone 1 scaffold — dashboard, pairing app, and sync engine
          coming next.
        </p>
      </main>
    </div>
  );
}
