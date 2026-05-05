function App() {
  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <section className="relative flex min-h-screen items-center justify-center px-6 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1e40af_0%,transparent_34%),linear-gradient(135deg,#020617_0%,#0f172a_48%,#111827_100%)] opacity-90" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent" />

        <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="mb-5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-200">
            AI automation for HVAC, plumbing, and electrical teams
          </p>

          <h1 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Stop losing booked jobs to missed calls and slow follow-up.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
            We build AI follow-up systems for local service businesses that
            capture every lead, respond instantly, and turn more inquiries into
            revenue.
          </p>

          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <a
              href="#contact"
              className="rounded-full bg-cyan-400 px-8 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Get Your Free Automation Audit
            </a>
            <a
              href="#services"
              className="rounded-full border border-white/15 px-8 py-4 text-base font-semibold text-white transition hover:border-cyan-300/60 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              See How It Works
            </a>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 text-sm font-medium text-slate-400 sm:flex-row sm:gap-4">
            <span>24/7 lead capture</span>
            <span className="hidden h-1 w-1 rounded-full bg-cyan-300/70 sm:block" />
            <span>Instant SMS follow-up</span>
            <span className="hidden h-1 w-1 rounded-full bg-cyan-300/70 sm:block" />
            <span>No missed revenue</span>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
