import { useState } from 'react'

function App() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
    {},
  )

  const problems = [
    'After-hours calls go unanswered while competitors book the job',
    'Quote requests wait hours before anyone follows up',
    'High-intent leads disappear before your team can respond',
  ]

  const solutions = [
    'Every inquiry gets a fast reply, even nights and weekends',
    'New leads are captured, qualified, and routed without manual chasing',
    'More emergency calls and estimates turn into scheduled jobs',
  ]

  const trustPoints = [
    {
      title: 'Catch after-hours calls',
      text: 'Reply to urgent requests when your office is closed, before the lead calls someone else.',
    },
    {
      title: 'Book more without more admin',
      text: 'Capture names, needs, and contact details without adding another person to the desk.',
    },
    {
      title: 'Keep scheduling moving',
      text: 'Get the right details upfront so your team can quote, call back, or schedule faster.',
    },
  ]

  const assessmentQuestions = [
    {
      question: 'What type of service business do you run?',
      options: ['HVAC', 'Plumbing', 'Electrical'],
    },
    {
      question: 'Where do most of your new leads come in today?',
      options: ['Mostly phone calls', 'Mostly website forms', 'Both calls and forms'],
    },
    {
      question: 'How often do you miss calls or respond late to new leads?',
      options: ['Frequently', 'Sometimes', 'Rarely / Never'],
    },
  ]

  const isAssessmentComplete =
    Object.keys(selectedAnswers).length === assessmentQuestions.length

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

      <section
        id="services"
        className="relative border-t border-white/10 bg-slate-950 px-6 py-20 sm:py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,#0891b2_0%,transparent_30%)] opacity-20" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Built for local service teams
            </p>
            <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Missed calls and slow follow-up are quietly costing you booked
              jobs every week.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-400/20 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 sm:p-8">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-400/10 text-red-300">
                  <svg
                    aria-hidden="true"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-200">
                    The problem
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-white">
                    Revenue leaks between calls
                  </h3>
                </div>
              </div>

              <ul className="space-y-4">
                {problems.map((problem) => (
                  <li
                    key={problem}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-slate-900/60 p-4 text-lg font-semibold text-slate-200"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-400/10 text-red-300">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m6 18 12-12M6 6l12 12"
                        />
                      </svg>
                    </span>
                    {problem}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-400/[0.04] p-6 shadow-2xl shadow-cyan-950/20 sm:p-8">
              <div className="mb-8 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200">
                  <svg
                    aria-hidden="true"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                    The solution
                  </p>
                  <h3 className="mt-1 text-2xl font-bold text-white">
                    More demand reaches your calendar
                  </h3>
                </div>
              </div>

              <ul className="space-y-4">
                {solutions.map((solution) => (
                  <li
                    key={solution}
                    className="flex items-center gap-4 rounded-xl border border-cyan-300/15 bg-slate-900/60 p-4 text-lg font-semibold text-slate-100"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200">
                      <svg
                        aria-hidden="true"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                    </span>
                    {solution}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <a
              href="#contact"
              className="inline-flex items-center text-base font-semibold text-cyan-200 transition hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              See how this works for your business
              <span className="ml-2" aria-hidden="true">
                -&gt;
              </span>
            </a>
          </div>
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-slate-900 px-6 py-20 sm:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#0f172a_52%,#111827_100%)] opacity-70" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        <div className="relative mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Built for HVAC, plumbing, and electrical teams
              </p>
              <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
                Book more jobs from leads you already get.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-300">
                Automate the first reply, capture the job details, and save
                your team hours of chasing so more calls and form fills become
                scheduled work.
              </p>
              <a
                href="#contact"
                className="mt-8 inline-flex rounded-full bg-cyan-400 px-8 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition hover:bg-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                Get My Free Automation Audit
              </a>
            </div>

            <div className="grid gap-4">
              {trustPoints.map((point) => (
                <div
                  key={point.title}
                  className="flex gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-xl shadow-black/10"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-cyan-200">
                    <svg
                      aria-hidden="true"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="2.25"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {point.title}
                    </h3>
                    <p className="mt-1 leading-7 text-slate-300">
                      {point.text}
                    </p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                  Early client results
                </p>
                <p className="mt-3 text-xl font-semibold leading-8 text-white">
                  Early service teams are using this to cut response time on
                  new leads, recover requests that used to sit overnight, and
                  turn more estimate requests into booked appointments.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="relative border-t border-white/10 bg-slate-950 px-6 py-20 sm:py-24"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#0e7490_0%,transparent_28%)] opacity-20" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-sm font-semibold text-slate-400">
              Step 1 of 3 &bull; Takes ~30 seconds
            </p>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Quick lead capture assessment
            </p>
            <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              See how many jobs you might be losing each week
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              Answer a few quick questions so we can see where leads are being
              missed and what kind of automation would help you book more jobs.
            </p>
            <p className="mt-4 text-base font-medium text-cyan-100">
              Most service teams don&apos;t realize how many leads slip through
              until they see it.
            </p>
          </div>

          <div className="mt-10 space-y-4">
            {assessmentQuestions.map((item, index) => (
              <div
                key={item.question}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/10"
              >
                <div className="mb-5 flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-200">
                    {index + 1}
                  </span>
                  <h3 className="pt-1 text-xl font-bold text-white">
                    {item.question}
                  </h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {item.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={selectedAnswers[index] === option}
                      onClick={() =>
                        setSelectedAnswers((currentAnswers) => ({
                          ...currentAnswers,
                          [index]: option,
                        }))
                      }
                      className={`rounded-xl border px-5 py-4 text-left text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                        selectedAnswers[index] === option
                          ? 'scale-[1.02] border-cyan-400 bg-cyan-400/15 text-white shadow-lg shadow-cyan-400/10 brightness-110'
                          : 'border-white/10 bg-slate-900/70 text-slate-200 hover:border-cyan-300/50 hover:bg-cyan-400/10 hover:text-white'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <p
              className={`mb-5 text-sm font-medium transition-opacity duration-200 ${
                isAssessmentComplete
                  ? 'text-cyan-100 opacity-100'
                  : 'text-slate-500 opacity-70'
              }`}
            >
              {isAssessmentComplete
                ? "Based on your answers, you're likely missing qualified jobs each week."
                : 'Answer all 3 questions to unlock your free plan.'}
            </p>
            <p className="mb-5 text-sm font-medium text-slate-400">
              Most teams who see this wish they fixed it sooner.
            </p>
            <button
              type="button"
              disabled={!isAssessmentComplete}
              className={`rounded-full bg-cyan-400 px-8 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                isAssessmentComplete
                  ? 'hover:scale-105 hover:bg-cyan-300'
                  : 'cursor-not-allowed opacity-50'
              }`}
            >
              Get My Free Automation Plan
            </button>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-slate-400">
            You&apos;ll answer a few quick questions and see if this makes
            sense for your business.
          </p>
          <p className="mt-4 text-center text-sm font-medium text-slate-400">
            No pressure &bull; Just a quick call to see if it fits
          </p>
        </div>
      </section>
    </main>
  )
}

export default App
