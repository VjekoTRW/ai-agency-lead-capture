import { createClient } from '@supabase/supabase-js'
import type { FormEvent, MouseEvent, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import * as googleAnalytics from './lib/googleAnalytics'
import * as metaPixel from './lib/metaPixel'

const bookingUrl = 'https://calendly.com/vjeko-ai/free-automation-audit'
const N8N_WEBHOOK_URL =
  'https://n8n-xmxo3s5m4sn69amy166p54bn.34.130.94.98.sslip.io/webhook/new-ai-agency-lead'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

const leadSourceParams: Record<string, string> = {
  'Mostly phone calls': 'phone',
  'Mostly website forms': 'forms',
  'Both calls and forms': 'both',
}

const responseSpeedParams: Record<string, string> = {
  Frequently: 'frequently',
  Sometimes: 'sometimes',
  'Rarely / Never': 'rarely',
}

type AuthState = 'checking' | 'authenticated' | 'unauthenticated'

type Lead = {
  id?: string | number
  name?: string | null
  email?: string | null
  phone?: string | null
  business_name?: string | null
  service_type?: string | null
  lead_source?: string | null
  response_speed?: string | null
  submission_count?: number | null
  created_at?: string | null
  updated_at?: string | null
  lead_temperature?: string | null
  status?: string | null
  notes?: string | null
  calendly_url?: string | null
  submission_history?: unknown
  submissions?: unknown
  full_submission_data?: unknown
  [key: string]: unknown
}

const statusOptions = [
  'New',
  'Contacted',
  'Qualified',
  'Booked',
  'Closed',
  'Lost',
] as const

const temperatureOptions = ['HOT', 'WARM', 'COLD'] as const

const timeRangeOptions = [
  'Today',
  'Last 7 days',
  'Last 30 days',
  'All Time',
] as const

type TimeRange = (typeof timeRangeOptions)[number]

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [authState, setAuthState] = useState<AuthState>('checking')

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return
      }

      setAuthState(data.session ? 'authenticated' : 'unauthenticated')
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState(session ? 'authenticated' : 'unauthenticated')
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  const navigate = (nextPath: string) => {
    window.history.pushState({}, '', nextPath)
    setPath(nextPath)
  }

  if (path === '/dashboard') {
    return <ProtectedDashboard authState={authState} navigate={navigate} />
  }

  if (path === '/login') {
    return <LoginPage authState={authState} navigate={navigate} />
  }

  return <LandingPage />
}

function LandingPage() {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>(
    {},
  )
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
  })
  const formStartedTracked = useRef(false)
  const formCompletedTracked = useRef(false)

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

  const auditBenefits = [
    {
      title: 'See exactly where leads are slipping through the cracks',
      text: 'Missed calls, slow replies, and lost form inquiries',
    },
    {
      title: 'Break down your current follow-up system',
      text: "So you can see what's working - and what's costing you jobs",
    },
    {
      title: 'Identify the fastest wins to recover revenue',
      text: 'Without hiring or changing your entire process',
    },
  ]

  const isAssessmentComplete =
    Object.keys(selectedAnswers).length === assessmentQuestions.length
  const isContactComplete = Object.values(contactForm).every(
    (value) => value.trim().length > 0,
  )
  const canBookAudit = isAssessmentComplete && isContactComplete

  useEffect(() => {
    googleAnalytics.initializeGoogleAnalytics()
    metaPixel.initializeMetaPixel()
  }, [])

  useEffect(() => {
    if (canBookAudit && !formCompletedTracked.current) {
      googleAnalytics.trackFormCompleted()
      metaPixel.trackFormCompleted()
      formCompletedTracked.current = true
    }
  }, [canBookAudit])

  const handleAssessmentAnswerSelect = (index: number, option: string) => {
    if (!formStartedTracked.current) {
      googleAnalytics.trackFormStarted()
      metaPixel.trackFormStarted()
      formStartedTracked.current = true
    }

    setSelectedAnswers((currentAnswers) => ({
      ...currentAnswers,
      [index]: option,
    }))
  }

  const trackCalendlyOpen = () => {
    googleAnalytics.trackCalendlyClick()
    metaPixel.trackCalendlyClick()
  }

  const handleAssessmentBooking = async (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    if (!canBookAudit) {
      return
    }

    const calendlyUrl = new URL(bookingUrl)
    calendlyUrl.searchParams.set('service', selectedAnswers[0])
    calendlyUrl.searchParams.set(
      'source',
      leadSourceParams[selectedAnswers[1]] ?? selectedAnswers[1],
    )
    calendlyUrl.searchParams.set(
      'speed',
      responseSpeedParams[selectedAnswers[2]] ?? selectedAnswers[2],
    )
    calendlyUrl.searchParams.set('name', contactForm.name.trim())
    calendlyUrl.searchParams.set('email', contactForm.email.trim())
    calendlyUrl.searchParams.set('phone', contactForm.phone.trim())
    calendlyUrl.searchParams.set(
      'business_name',
      contactForm.businessName.trim(),
    )

    const leadData = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim(),
      business_name: contactForm.businessName.trim(),
      service_type: selectedAnswers[0],
      lead_source: selectedAnswers[1],
      response_speed: selectedAnswers[2],
      updated_at: new Date().toISOString(),
    }

    const { data: existingLead, error: lookupError } = await supabase
      .from('leads')
      .select('submission_count')
      .eq('email', leadData.email)
      .maybeSingle()

    const submissionCount = existingLead
      ? (existingLead.submission_count ?? 0) + 1
      : 1

    const { error } = existingLead
      ? await supabase
          .from('leads')
          .update({
            ...leadData,
            submission_count: submissionCount,
          })
          .eq('email', leadData.email)
      : await supabase.from('leads').insert({
          ...leadData,
          submission_count: submissionCount,
        })

    if (lookupError || error) {
      console.error('Failed to save assessment answers:', lookupError || error)
    } else {
      googleAnalytics.trackLead()
      metaPixel.trackLead()

      if (submissionCount > 1) {
        googleAnalytics.trackRepeatLead()
        metaPixel.trackRepeatLead()
      }

      if (leadData.response_speed === 'Frequently') {
        googleAnalytics.trackHotLead()
        metaPixel.trackHotLead()
      }

      try {
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: contactForm.name.trim(),
            email: contactForm.email.trim(),
            phone: contactForm.phone.trim(),
            business_name: contactForm.businessName.trim(),
            service_type: selectedAnswers[0],
            lead_source: selectedAnswers[1],
            response_speed: selectedAnswers[2],
            submission_count: submissionCount,
            submitted_at: new Date().toISOString(),
            calendly_url: calendlyUrl.toString(),
          }),
        })

        if (!n8nResponse.ok) {
          throw new Error(`n8n webhook failed with ${n8nResponse.status}`)
        }
      } catch (webhookError) {
        console.error('Failed to send lead to n8n:', webhookError)
      }
    }

    console.log('Calendly booking URL:', calendlyUrl.toString())
    trackCalendlyOpen()
    window.open(calendlyUrl.toString(), '_blank', 'noopener,noreferrer')
  }

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
                      onClick={() => handleAssessmentAnswerSelect(index, option)}
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

          <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/10">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">
                Your contact details
              </p>
              <h3 className="mt-2 text-xl font-bold text-white">
                Get your custom automation plan in the next 2 minutes
              </h3>
              <p className="mt-2 leading-7 text-slate-300">
                This shows exactly where you&apos;re losing jobs - and how to
                fix it fast.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Name
                </span>
                <input
                  type="text"
                  value={contactForm.name}
                  onChange={(event) =>
                    setContactForm((currentForm) => ({
                      ...currentForm,
                      name: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-5 py-4 text-base font-semibold text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/30"
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Email
                </span>
                <input
                  type="email"
                  value={contactForm.email}
                  onChange={(event) =>
                    setContactForm((currentForm) => ({
                      ...currentForm,
                      email: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-5 py-4 text-base font-semibold text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/30"
                  placeholder="you@company.com"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Phone
                </span>
                <input
                  type="tel"
                  value={contactForm.phone}
                  onChange={(event) =>
                    setContactForm((currentForm) => ({
                      ...currentForm,
                      phone: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-5 py-4 text-base font-semibold text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/30"
                  placeholder="(555) 123-4567"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-300">
                  Business name
                </span>
                <input
                  type="text"
                  value={contactForm.businessName}
                  onChange={(event) =>
                    setContactForm((currentForm) => ({
                      ...currentForm,
                      businessName: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-5 py-4 text-base font-semibold text-white outline-none transition-all duration-200 placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-300/30"
                  placeholder="Company name"
                />
              </label>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-400">
              We only use your info to prepare your plan. No spam. Ever.
            </p>
          </div>

          <div className="mt-5 text-center">
            <h3 className="mx-auto max-w-3xl text-2xl font-bold leading-tight text-white sm:text-3xl">
              You&apos;re likely losing jobs every week - see exactly where
              before your competitors take them
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-base leading-7 text-slate-300">
              This takes 2 minutes and shows where you&apos;re leaking revenue
              right now.
            </p>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleAssessmentBooking}
            >
              <button
                type="button"
                disabled={!canBookAudit}
                className={`mt-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 px-12 py-5 text-xl font-semibold text-slate-950 shadow-2xl shadow-cyan-400/30 transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950 ${
                  canBookAudit
                    ? 'animate-pulse hover:-translate-y-0.5 hover:scale-105 hover:brightness-110 hover:shadow-cyan-400/70'
                    : 'cursor-not-allowed opacity-50'
                }`}
              >
                Show Me Exactly Where I&apos;m Losing Jobs -&gt;
              </button>
            </a>
          </div>
          <p className="mt-4 text-center text-sm font-medium text-slate-300">
            Most service businesses who see this fix it within 7 days.
          </p>
          <p className="mt-4 text-center text-sm font-medium text-slate-400">
            No spam &bull; Takes 2 minutes &bull; No commitment
          </p>
        </div>
      </section>

      <section className="relative border-t border-white/10 bg-slate-900 px-6 py-20 sm:py-24">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#0f172a_50%,#111827_100%)] opacity-80" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        <div className="relative mx-auto max-w-6xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
              Free automation audit
            </p>
            <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Here&apos;s exactly how we help you recover lost jobs
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              A clear breakdown of where you&apos;re losing leads, how much
              it&apos;s costing you, and what to fix first.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {auditBenefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-400/10 text-sm font-bold text-cyan-200">
                  {index + 1}
                </span>
                <h3 className="mt-5 text-xl font-bold leading-7 text-white">
                  {benefit.title}
                </h3>
                <p className="mt-3 leading-7 text-slate-300">
                  {benefit.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl text-center">
            <p className="text-lg leading-8 text-slate-300">
              No pressure, no commitment - just a clear look at whether
              automation makes sense for your business.
            </p>
            <p className="mt-6 text-sm font-medium text-slate-400">
              Most service teams don&apos;t realize how many jobs they&apos;re
              losing until they see this.
            </p>
            <div className="mt-6 mb-6 text-center">
              <p className="text-lg font-semibold text-slate-200">
                Most teams like yours are losing{' '}
                <span className="text-cyan-300">5&ndash;15+ jobs per month</span>{' '}
                from slow follow-up alone.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                And they don&apos;t realize it until they see the numbers.
              </p>
            </div>
            <a
              href={bookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={trackCalendlyOpen}
              className="mt-8 inline-flex rounded-full bg-cyan-400 px-8 py-4 text-base font-semibold text-slate-950 shadow-lg shadow-cyan-400/20 transition-all duration-200 hover:scale-105 hover:bg-cyan-300 hover:brightness-110 hover:shadow-xl hover:shadow-cyan-400/35 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              See What You&apos;re Losing -&gt;
            </a>
            <p className="mt-4 text-sm font-medium text-slate-400">
              Takes 2 minutes &bull; No commitment
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function ProtectedDashboard({
  authState,
  navigate,
}: {
  authState: AuthState
  navigate: (path: string) => void
}) {
  useEffect(() => {
    if (authState === 'unauthenticated') {
      navigate('/login')
    }
  }, [authState, navigate])

  if (authState !== 'authenticated') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-6 py-5 text-sm font-medium text-slate-300">
          Checking your session...
        </div>
      </main>
    )
  }

  return <DashboardPage navigate={navigate} />
}

function LoginPage({
  authState,
  navigate,
}: {
  authState: AuthState
  navigate: (path: string) => void
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (authState === 'authenticated') {
      navigate('/dashboard')
    }
  }, [authState, navigate])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
      setIsSubmitting(false)
      return
    }

    navigate('/dashboard')
    setIsSubmitting(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-lg border border-slate-800 bg-slate-900 p-6 shadow-2xl shadow-black/20"
      >
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">
            CRM access
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">
            Sign in to your dashboard
          </h1>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Email
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            placeholder="you@company.com"
          />
        </label>

        <label className="mt-4 block">
          <span className="mb-2 block text-sm font-medium text-slate-300">
            Password
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20"
            placeholder="Password"
          />
        </label>

        {error ? (
          <div className="mt-4 rounded-md border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-200">
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-md bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-3 w-full rounded-md border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          Back to landing page
        </button>
      </form>
    </main>
  )
}

function DashboardPage({ navigate }: { navigate: (path: string) => void }) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [timeRange, setTimeRange] = useState<TimeRange>('Last 30 days')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [temperatureFilter, setTemperatureFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingLeadKey, setUpdatingLeadKey] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [savingNoteLeadKey, setSavingNoteLeadKey] = useState<string | null>(null)
  const [noteMessage, setNoteMessage] = useState('')

  const fetchLeads = async () => {
    setLoading(true)
    setError('')

    const { data, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (leadsError) {
      setError(leadsError.message)
      setLeads([])
    } else {
      setLeads((data ?? []) as Lead[])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  const timeFilteredLeads = useMemo(
    () => leads.filter((lead) => isLeadInTimeRange(lead, timeRange)),
    [leads, timeRange],
  )

  const dashboardAnalytics = useMemo(
    () => buildDashboardAnalytics(timeFilteredLeads, timeRange),
    [timeFilteredLeads, timeRange],
  )

  const filteredLeads = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return timeFilteredLeads.filter((lead) => {
      const searchFields = [
        lead.name,
        lead.email,
        lead.business_name,
      ]
        .join(' ')
        .toLowerCase()
      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchFields.includes(normalizedSearch)
      const matchesStatus =
        statusFilter === 'All' || getLeadStatus(lead) === statusFilter
      const matchesTemperature =
        temperatureFilter === 'All' ||
        getLeadTemperature(lead) === temperatureFilter

      return matchesSearch && matchesStatus && matchesTemperature
    })
  }, [timeFilteredLeads, searchTerm, statusFilter, temperatureFilter])

  const handleStatusChange = async (lead: Lead, nextStatus: string) => {
    const leadKey = getLeadKey(lead)
    setUpdatingLeadKey(leadKey)
    setError('')

    const query = supabase.from('leads').update({ status: nextStatus })
    const { error: updateError } =
      lead.id !== undefined && lead.id !== null
        ? await query.eq('id', lead.id)
        : await query.eq('email', lead.email)

    if (updateError) {
      setError(updateError.message)
    } else {
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          getLeadKey(currentLead) === leadKey
            ? { ...currentLead, status: nextStatus }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, status: nextStatus }
          : currentLead,
      )
    }

    setUpdatingLeadKey(null)
  }

  const handleSaveNote = async (lead: Lead, notes: string) => {
    const leadKey = getLeadKey(lead)
    setSavingNoteLeadKey(leadKey)
    setNoteMessage('')

    const query = supabase.from('leads').update({ notes })
    const { error: noteError } =
      lead.id !== undefined && lead.id !== null
        ? await query.eq('id', lead.id)
        : await query.eq('email', lead.email)

    if (noteError) {
      setNoteMessage(`Error: ${noteError.message}`)
    } else {
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          getLeadKey(currentLead) === leadKey
            ? { ...currentLead, notes }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, notes }
          : currentLead,
      )
      setNoteMessage('Note saved.')
    }

    setSavingNoteLeadKey(null)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-slate-950 px-5 py-4 text-white lg:w-64 lg:border-b-0 lg:border-r lg:border-slate-800">
          <div className="flex items-center justify-between lg:block">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">
                AI agency
              </p>
              <h1 className="mt-2 text-xl font-bold">Lead CRM</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800 lg:mt-8 lg:w-full"
            >
              Landing
            </button>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            <a
              href="/dashboard"
              onClick={(event) => {
                event.preventDefault()
                navigate('/dashboard')
              }}
              className="whitespace-nowrap rounded-md bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950"
            >
              Leads
            </a>
          </nav>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="border-b border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Dashboard
                </p>
                <h2 className="text-2xl font-bold text-slate-950">
                  Lead pipeline
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={fetchLeads}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Refresh
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Sign out
                </button>
              </div>
            </div>
          </header>

          <div className="px-5 py-5">
            <div className="mb-5 flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Performance window
                </p>
                <h3 className="text-lg font-bold text-slate-950">
                  CRM analytics
                </h3>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setTimeRange(option)}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                      timeRange === option
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              {dashboardAnalytics.kpiCards.map((card) => (
                <KpiCard
                  key={card.label}
                  label={card.label}
                  value={card.value}
                  loading={loading}
                />
              ))}
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <ConversionCard
                label="Qualification Rate"
                value={dashboardAnalytics.qualificationRate}
                helper="qualified / total"
                loading={loading}
              />
              <ConversionCard
                label="Booking Rate"
                value={dashboardAnalytics.bookingRate}
                helper="booked / total"
                loading={loading}
              />
              <ConversionCard
                label="Close Rate"
                value={dashboardAnalytics.closeRate}
                helper="closed / qualified"
                loading={loading}
              />
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    Lead temperature
                  </p>
                  <h3 className="text-lg font-bold text-slate-950">
                    Intent mix
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {temperatureOptions.map((temperature) => (
                    <TemperatureCountBadge
                      key={temperature}
                      temperature={temperature}
                      count={dashboardAnalytics.temperatureCounts[temperature]}
                      loading={loading}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-5 xl:grid-cols-3">
              <ChartCard title="Leads over time" loading={loading}>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={dashboardAnalytics.leadsOverTime}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="leads"
                      stroke="#0891b2"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Leads by status" loading={loading}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dashboardAnalytics.statusChartData}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="status"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                      {dashboardAnalytics.statusChartData.map((item) => (
                        <Cell
                          key={item.status}
                          fill={getStatusChartColor(item.status)}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Leads by service type" loading={loading}>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={dashboardAnalytics.serviceTypeChartData}>
                    <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="serviceType"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="leads"
                      fill="#334155"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_180px]">
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  Search
                </span>
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Name, email, or business"
                />
              </label>

              <FilterSelect
                label="Status"
                value={statusFilter}
                onChange={setStatusFilter}
                options={['All', ...statusOptions]}
              />

              <FilterSelect
                label="Temperature"
                value={temperatureFilter}
                onChange={setTemperatureFilter}
                options={['All', ...temperatureOptions]}
              />
            </div>

            {error ? (
              <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white">
              {loading ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500">
                  Loading leads...
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="p-8 text-center text-sm font-medium text-slate-500">
                  No leads match the current filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[1180px] w-full text-left text-sm">
                    <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Business Name</th>
                        <th className="px-4 py-3">Service Type</th>
                        <th className="px-4 py-3">Lead Source</th>
                        <th className="px-4 py-3">Response Speed</th>
                        <th className="px-4 py-3">submission_count</th>
                        <th className="px-4 py-3">created_at</th>
                        <th className="px-4 py-3">lead_temperature</th>
                        <th className="px-4 py-3">status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredLeads.map((lead) => (
                        <tr
                          key={getLeadKey(lead)}
                          onClick={() => {
                            setSelectedLead(lead)
                            setNoteMessage('')
                          }}
                          className="cursor-pointer align-top transition hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            <span className="font-semibold text-cyan-700">
                              {displayValue(lead.name)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {displayValue(lead.email)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {displayValue(lead.phone)}
                          </td>
                          <td className="px-4 py-3 font-medium">
                            {displayValue(lead.business_name)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {displayValue(lead.service_type)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {displayValue(lead.lead_source)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {displayValue(lead.response_speed)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{lead.submission_count ?? 0}</span>
                              {(lead.submission_count ?? 0) > 1 ? (
                                <Badge tone="blue">Repeat lead</Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(lead.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <TemperatureBadge
                              temperature={getLeadTemperature(lead)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={getLeadStatus(lead)}
                              disabled={updatingLeadKey === getLeadKey(lead)}
                              onClick={(event) => event.stopPropagation()}
                              onChange={(event) =>
                                handleStatusChange(lead, event.target.value)
                              }
                              className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm font-medium text-slate-700 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 disabled:opacity-60"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {selectedLead ? (
        <LeadDetailModal
          lead={selectedLead}
          isSavingNote={savingNoteLeadKey === getLeadKey(selectedLead)}
          noteMessage={noteMessage}
          onSaveNote={handleSaveNote}
          onClose={() => setSelectedLead(null)}
        />
      ) : null}
    </main>
  )
}

type DashboardAnalytics = {
  kpiCards: Array<{ label: string; value: number }>
  qualificationRate: number
  bookingRate: number
  closeRate: number
  temperatureCounts: Record<(typeof temperatureOptions)[number], number>
  leadsOverTime: Array<{ label: string; leads: number }>
  statusChartData: Array<{ status: string; leads: number }>
  serviceTypeChartData: Array<{ serviceType: string; leads: number }>
}

function KpiCard({
  label,
  value,
  loading,
}: {
  label: string
  value: number
  loading: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
      ) : (
        <p className="mt-2 text-3xl font-bold text-slate-950">{value}</p>
      )}
    </div>
  )
}

function ConversionCard({
  label,
  value,
  helper,
  loading,
}: {
  label: string
  value: number
  helper: string
  loading: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-slate-200" />
      ) : (
        <p className="mt-2 text-3xl font-bold text-slate-950">{value}%</p>
      )}
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-slate-400">
        {helper}
      </p>
    </div>
  )
}

function ChartCard({
  title,
  loading,
  children,
}: {
  title: string
  loading: boolean
  children: ReactNode
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </h3>
      <div className="mt-4 h-60">
        {loading ? (
          <div className="h-full w-full animate-pulse rounded bg-slate-100" />
        ) : (
          children
        )}
      </div>
    </section>
  )
}

function TemperatureCountBadge({
  temperature,
  count,
  loading,
}: {
  temperature: (typeof temperatureOptions)[number]
  count: number
  loading: boolean
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-700">
      <TemperatureBadge temperature={temperature} />
      {loading ? (
        <span className="h-4 w-6 animate-pulse rounded bg-slate-200" />
      ) : (
        <span>{count}</span>
      )}
    </span>
  )
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly string[]
  onChange: (value: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function LeadDetailModal({
  lead,
  isSavingNote,
  noteMessage,
  onSaveNote,
  onClose,
}: {
  lead: Lead
  isSavingNote: boolean
  noteMessage: string
  onSaveNote: (lead: Lead, notes: string) => Promise<void>
  onClose: () => void
}) {
  const [notes, setNotes] = useState(lead.notes ?? '')
  const calendlyLink =
    typeof lead.calendly_url === 'string' && lead.calendly_url.length > 0
      ? lead.calendly_url
      : ''

  useEffect(() => {
    setNotes(lead.notes ?? '')
  }, [lead])

  const detailRows = [
    ['Name', lead.name],
    ['Email', lead.email],
    ['Phone', lead.phone],
    ['Business name', lead.business_name],
    ['Service type', lead.service_type],
    ['Lead source', lead.lead_source],
    ['Response speed', lead.response_speed],
    ['Submission count', lead.submission_count ?? 0],
    ['Status', getLeadStatus(lead)],
    ['Created at', formatDate(lead.created_at)],
    ['Updated at', formatDate(lead.updated_at)],
    ['Lead temperature', getLeadTemperature(lead)],
  ] as const

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-end bg-slate-950/70 lg:pl-24"
      onClick={onClose}
    >
      <div
        className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Lead detail</p>
            <h2 className="text-xl font-bold text-slate-950">
              {displayValue(lead.name)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="grid flex-1 gap-5 overflow-y-auto p-5 lg:grid-cols-[1fr_1fr]">
          <section>
            <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
              Lead information
            </h3>
            <dl className="mt-3 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
              {detailRows.map(([label, value]) => (
                <div key={label}>
                  <dt className="font-semibold text-slate-500">{label}</dt>
                  <dd className="mt-1 break-words text-slate-900">
                    {renderUnknownValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
                Calendly URL
              </h3>
              {calendlyLink ? (
                <a
                  href={calendlyLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex max-w-full break-all rounded-md bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                >
                  {calendlyLink}
                </a>
              ) : (
                <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  -
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
                Notes
              </h3>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add internal notes for this lead"
                className="mt-3 min-h-40 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isSavingNote}
                  onClick={() => onSaveNote(lead, notes)}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingNote ? 'Saving...' : 'Save note'}
                </button>
                {noteMessage ? (
                  <p
                    className={`text-sm font-medium ${
                      noteMessage.startsWith('Error:')
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {noteMessage}
                  </p>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

function TemperatureBadge({ temperature }: { temperature: string }) {
  if (temperature === 'HOT') {
    return <Badge tone="red">HOT</Badge>
  }

  if (temperature === 'WARM') {
    return <Badge tone="yellow">WARM</Badge>
  }

  return <Badge tone="gray">{temperature || 'COLD'}</Badge>
}

function Badge({
  tone,
  children,
}: {
  tone: 'red' | 'yellow' | 'gray' | 'blue'
  children: string
}) {
  const classes = {
    red: 'border-red-200 bg-red-50 text-red-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    gray: 'border-slate-200 bg-slate-100 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
  }

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold ${classes[tone]}`}
    >
      {children}
    </span>
  )
}

function buildDashboardAnalytics(
  leads: Lead[],
  timeRange: TimeRange,
): DashboardAnalytics {
  const statusCounts = statusOptions.reduce(
    (counts, status) => ({
      ...counts,
      [status]: 0,
    }),
    {} as Record<(typeof statusOptions)[number], number>,
  )
  const temperatureCounts = temperatureOptions.reduce(
    (counts, temperature) => ({
      ...counts,
      [temperature]: 0,
    }),
    {} as Record<(typeof temperatureOptions)[number], number>,
  )
  const serviceTypeCounts = new Map<string, number>()
  const leadsByDate = new Map<string, number>()

  leads.forEach((lead) => {
    const status = getLeadStatus(lead) as (typeof statusOptions)[number]
    statusCounts[status] += 1

    const temperature =
      getLeadTemperature(lead) as (typeof temperatureOptions)[number]
    temperatureCounts[temperature] += 1

    const serviceType =
      typeof lead.service_type === 'string' && lead.service_type.trim()
        ? lead.service_type.trim()
        : 'Unknown'
    serviceTypeCounts.set(
      serviceType,
      (serviceTypeCounts.get(serviceType) ?? 0) + 1,
    )

    const dateKey = getDateKey(lead.created_at)
    if (dateKey) {
      leadsByDate.set(dateKey, (leadsByDate.get(dateKey) ?? 0) + 1)
    }
  })

  const total = leads.length
  const qualified = statusCounts.Qualified
  const booked = statusCounts.Booked
  const closed = statusCounts.Closed

  return {
    kpiCards: [
      { label: 'Total Leads', value: total },
      { label: 'New Leads', value: statusCounts.New },
      { label: 'Qualified Leads', value: qualified },
      { label: 'Booked Leads', value: booked },
      { label: 'Closed Leads', value: closed },
      { label: 'Lost Leads', value: statusCounts.Lost },
    ],
    qualificationRate: calculatePercentage(qualified, total),
    bookingRate: calculatePercentage(booked, total),
    closeRate: calculatePercentage(closed, qualified),
    temperatureCounts,
    leadsOverTime: buildLeadsOverTimeData(leadsByDate, timeRange),
    statusChartData: statusOptions.map((status) => ({
      status,
      leads: statusCounts[status],
    })),
    serviceTypeChartData: Array.from(serviceTypeCounts.entries())
      .map(([serviceType, count]) => ({ serviceType, leads: count }))
      .sort((first, second) => second.leads - first.leads),
  }
}

function isLeadInTimeRange(lead: Lead, timeRange: TimeRange) {
  if (timeRange === 'All Time') {
    return true
  }

  const createdAt =
    typeof lead.created_at === 'string' ? new Date(lead.created_at) : null

  if (!createdAt || Number.isNaN(createdAt.getTime())) {
    return false
  }

  const now = new Date()
  const rangeStart = new Date(now)
  rangeStart.setHours(0, 0, 0, 0)

  if (timeRange === 'Last 7 days') {
    rangeStart.setDate(rangeStart.getDate() - 6)
  }

  if (timeRange === 'Last 30 days') {
    rangeStart.setDate(rangeStart.getDate() - 29)
  }

  return createdAt >= rangeStart && createdAt <= now
}

function buildLeadsOverTimeData(
  leadsByDate: Map<string, number>,
  timeRange: TimeRange,
) {
  if (timeRange === 'All Time') {
    return Array.from(leadsByDate.entries())
      .sort(([firstDate], [secondDate]) => firstDate.localeCompare(secondDate))
      .map(([dateKey, leads]) => ({
        label: formatChartDateLabel(dateKey),
        leads,
      }))
  }

  const dayCount =
    timeRange === 'Today' ? 1 : timeRange === 'Last 7 days' ? 7 : 30
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (dayCount - 1))

  return Array.from({ length: dayCount }, (_item, index) => {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + index)
    const dateKey = getDateKey(currentDate.toISOString()) ?? ''

    return {
      label: formatChartDateLabel(dateKey),
      leads: leadsByDate.get(dateKey) ?? 0,
    }
  })
}

function calculatePercentage(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0
  }

  return Math.round((numerator / denominator) * 100)
}

function getDateKey(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatChartDateLabel(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`)

  if (Number.isNaN(date.getTime())) {
    return dateKey
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
  }).format(date)
}

function getStatusChartColor(status: string) {
  const colors: Record<string, string> = {
    New: '#64748b',
    Contacted: '#0891b2',
    Qualified: '#ca8a04',
    Booked: '#2563eb',
    Closed: '#16a34a',
    Lost: '#dc2626',
  }

  return colors[status] ?? '#334155'
}

function getLeadKey(lead: Lead) {
  return String(lead.id ?? lead.email ?? `${lead.name}-${lead.created_at}`)
}

function getLeadStatus(lead: Lead) {
  const status = typeof lead.status === 'string' ? lead.status : ''
  return statusOptions.includes(status as (typeof statusOptions)[number])
    ? status
    : 'New'
}

function getLeadTemperature(lead: Lead) {
  const explicitTemperature =
    typeof lead.lead_temperature === 'string'
      ? lead.lead_temperature.toUpperCase()
      : ''

  if (temperatureOptions.includes(explicitTemperature as 'HOT' | 'WARM' | 'COLD')) {
    return explicitTemperature
  }

  if (lead.response_speed === 'Frequently') {
    return 'HOT'
  }

  if (lead.response_speed === 'Sometimes') {
    return 'WARM'
  }

  return 'COLD'
}

function displayValue(value: unknown) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  if (typeof value === 'number') {
    return String(value)
  }

  return '-'
}

function formatDate(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function renderUnknownValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return (
    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words text-xs leading-5 text-slate-700">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export default App
