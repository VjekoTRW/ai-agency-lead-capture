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
const N8N_SEQUENCE_WEBHOOK_URL =
  import.meta.env.VITE_N8N_SEQUENCE_WEBHOOK_URL ?? ''
const N8N_SMS_WEBHOOK_URL = import.meta.env.VITE_N8N_SMS_WEBHOOK_URL ?? ''

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
  lead_score?: number | null
  lead_score_reason?: string | null
  ai_summary?: string | null
  ai_recommendation?: string | null
  ai_summary_updated_at?: string | null
  ai_objection_risk?: string | null
  ai_suggested_response?: string | null
  ai_close_probability?: number | null
  ai_next_best_action?: string | null
  ai_insights_updated_at?: string | null
  follow_up_sequence_status?: string | null
  last_follow_up_sent_at?: string | null
  next_sequence_step?: string | null
  follow_up_message_log?: string | null
  status?: string | null
  notes?: string | null
  booked_at?: string | null
  appointment_notes?: string | null
  appointment_status?: string | null
  follow_up_at?: string | null
  follow_up_type?: string | null
  follow_up_status?: string | null
  follow_up_notes?: string | null
  replied_at?: string | null
  reply_status?: string | null
  last_reply_snippet?: string | null
  sms_reply_status?: string | null
  last_sms_sent_at?: string | null
  last_sms_reply_at?: string | null
  last_sms_message?: string | null
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

const appointmentStatusOptions = [
  'Not booked',
  'Booked',
  'Completed',
  'Cancelled',
  'No-show',
] as const

const followUpStatusOptions = [
  'Not set',
  'Pending',
  'Completed',
  'Snoozed',
] as const

const followUpTypeOptions = ['Call', 'Email', 'Text', 'Other'] as const

const followUpSequenceStatusOptions = [
  'Not started',
  'Active',
  'Paused',
  'Completed',
  'Stopped',
] as const

const sequenceStepOptions = [
  'Initial follow-up',
  '24-hour reminder',
  '3-day reminder',
  'Final check-in',
] as const

const sequenceStepValues = [...sequenceStepOptions, 'Completed'] as const

const appointmentHourOptions = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
] as const

const appointmentMinuteOptions = ['00', '15', '30', '45'] as const

const appointmentPeriodOptions = ['AM', 'PM'] as const

const temperatureOptions = ['HOT', 'WARM', 'COLD'] as const

const scoreRangeOptions = ['All', '75+', '45-74', 'Under 45'] as const

const timeRangeOptions = [
  'Today',
  'Last 7 days',
  'Last 30 days',
  'All Time',
] as const

type TimeRange = (typeof timeRangeOptions)[number]
type DashboardView = 'leads' | 'analytics'

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

  if (path === '/dashboard' || path === '/dashboard/analytics') {
    return (
      <ProtectedDashboard
        authState={authState}
        navigate={navigate}
        currentPath={path}
      />
    )
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
    const finalizedCalendlyUrl = calendlyUrl.toString()

    const leadData = {
      name: contactForm.name.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim(),
      business_name: contactForm.businessName.trim(),
      service_type: selectedAnswers[0],
      lead_source: selectedAnswers[1],
      response_speed: selectedAnswers[2],
      calendly_url: finalizedCalendlyUrl,
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
            calendly_url: finalizedCalendlyUrl,
          }),
        })

        if (!n8nResponse.ok) {
          throw new Error(`n8n webhook failed with ${n8nResponse.status}`)
        }
      } catch (webhookError) {
        console.error('Failed to send lead to n8n:', webhookError)
      }
    }

    console.log('Calendly booking URL:', finalizedCalendlyUrl)
    trackCalendlyOpen()
    window.open(finalizedCalendlyUrl, '_blank', 'noopener,noreferrer')
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
  currentPath,
}: {
  authState: AuthState
  navigate: (path: string) => void
  currentPath: string
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

  return <DashboardPage navigate={navigate} currentPath={currentPath} />
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

function DashboardPage({
  navigate,
  currentPath,
}: {
  navigate: (path: string) => void
  currentPath: string
}) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [activeDashboardView, setActiveDashboardView] =
    useState<DashboardView>(
      currentPath === '/dashboard/analytics' ? 'analytics' : 'leads',
    )
  const [timeRange, setTimeRange] = useState<TimeRange>('Last 30 days')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [temperatureFilter, setTemperatureFilter] = useState('All')
  const [scoreRangeFilter, setScoreRangeFilter] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingLeadKey, setUpdatingLeadKey] = useState<string | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [savingNoteLeadKey, setSavingNoteLeadKey] = useState<string | null>(null)
  const [savingAppointmentLeadKey, setSavingAppointmentLeadKey] = useState<
    string | null
  >(null)
  const [savingFollowUpLeadKey, setSavingFollowUpLeadKey] = useState<
    string | null
  >(null)
  const [savingAiSummaryLeadKey, setSavingAiSummaryLeadKey] = useState<
    string | null
  >(null)
  const [savingAiInsightsLeadKey, setSavingAiInsightsLeadKey] = useState<
    string | null
  >(null)
  const [savingSequenceLeadKey, setSavingSequenceLeadKey] = useState<
    string | null
  >(null)
  const [savingSmsLeadKey, setSavingSmsLeadKey] = useState<string | null>(null)
  const [noteMessage, setNoteMessage] = useState('')
  const [appointmentMessage, setAppointmentMessage] = useState('')
  const [followUpMessage, setFollowUpMessage] = useState('')
  const [aiSummaryMessage, setAiSummaryMessage] = useState('')
  const [aiInsightsMessage, setAiInsightsMessage] = useState('')
  const [sequenceMessage, setSequenceMessage] = useState('')
  const [smsMessage, setSmsMessage] = useState('')

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
      const fetchedLeads = (data ?? []) as Lead[]
      const scoredLeads = fetchedLeads.map(applyLeadScore)
      setLeads(scoredLeads)
      syncLeadScores(fetchedLeads)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchLeads()
  }, [])

  useEffect(() => {
    setActiveDashboardView(
      currentPath === '/dashboard/analytics' ? 'analytics' : 'leads',
    )
  }, [currentPath])

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
      const matchesScoreRange =
        scoreRangeFilter === 'All' ||
        isLeadInScoreRange(lead, scoreRangeFilter)

      return (
        matchesSearch &&
        matchesStatus &&
        matchesTemperature &&
        matchesScoreRange
      )
    })
  }, [
    timeFilteredLeads,
    searchTerm,
    statusFilter,
    temperatureFilter,
    scoreRangeFilter,
  ])

  const handleStatusChange = async (lead: Lead, nextStatus: string) => {
    const leadKey = getLeadKey(lead)
    const updatedAt = new Date().toISOString()
    const nextLead = applyLeadScore({
      ...lead,
      status: nextStatus,
      updated_at: updatedAt,
    })
    const statusPayload = {
      status: nextStatus,
      updated_at: updatedAt,
      ...getLeadScorePayload(nextLead),
    }
    setUpdatingLeadKey(leadKey)
    setError('')

    const query = supabase.from('leads').update(statusPayload)
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
            ? { ...currentLead, ...statusPayload }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, ...statusPayload }
          : currentLead,
      )
    }

    setUpdatingLeadKey(null)
  }

  const handleSaveNote = async (lead: Lead, notes: string) => {
    const leadKey = getLeadKey(lead)
    const updatedAt = new Date().toISOString()
    const nextLead = applyLeadScore({ ...lead, notes, updated_at: updatedAt })
    const notePayload = {
      notes,
      updated_at: updatedAt,
      ...getLeadScorePayload(nextLead),
    }
    setSavingNoteLeadKey(leadKey)
    setNoteMessage('')

    const query = supabase.from('leads').update(notePayload)
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
            ? { ...currentLead, ...notePayload }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, ...notePayload }
          : currentLead,
      )
      setNoteMessage('Note saved.')
    }

    setSavingNoteLeadKey(null)
  }

  const handleSaveAppointment = async (
    lead: Lead,
    appointment: {
      appointmentStatus: string
      bookedAtDate: string
      bookedAtHour: string
      bookedAtMinute: string
      bookedAtPeriod: string
      appointmentNotes: string
    },
  ) => {
    const leadKey = getLeadKey(lead)
    const updatedAt = new Date().toISOString()
    const nextAppointmentStatus = getValidAppointmentStatus(
      appointment.appointmentStatus,
    )
    const nextBookedAt = parseAppointmentFieldsInput(appointment)
    const appointmentPayloadBase = {
      appointment_status: nextAppointmentStatus,
      booked_at: nextBookedAt,
      appointment_notes: appointment.appointmentNotes,
      updated_at: updatedAt,
      ...(nextAppointmentStatus === 'Booked' ? { status: 'Booked' } : {}),
    }
    const nextLead = applyLeadScore({ ...lead, ...appointmentPayloadBase })
    const appointmentPayload = {
      ...appointmentPayloadBase,
      ...getLeadScorePayload(nextLead),
    }

    setSavingAppointmentLeadKey(leadKey)
    setAppointmentMessage('')

    const query = supabase.from('leads').update(appointmentPayload)
    const { error: appointmentError } =
      lead.id !== undefined && lead.id !== null
        ? await query.eq('id', lead.id)
        : await query.eq('email', lead.email)

    if (appointmentError) {
      setAppointmentMessage(`Error: ${appointmentError.message}`)
    } else {
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          getLeadKey(currentLead) === leadKey
            ? { ...currentLead, ...appointmentPayload }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, ...appointmentPayload }
          : currentLead,
      )
      setAppointmentMessage('Appointment saved.')
    }

    setSavingAppointmentLeadKey(null)
  }

  const handleSaveFollowUp = async (
    lead: Lead,
    followUp: {
      followUpStatus: string
      followUpType: string
      followUpAtDate: string
      followUpAtHour: string
      followUpAtMinute: string
      followUpAtPeriod: string
      followUpNotes: string
    },
  ) => {
    const leadKey = getLeadKey(lead)
    const updatedAt = new Date().toISOString()
    const followUpPayloadBase = {
      follow_up_status: getValidFollowUpStatus(followUp.followUpStatus),
      follow_up_type: getValidFollowUpType(followUp.followUpType),
      follow_up_at: parseTorontoDateTimeFields({
        date: followUp.followUpAtDate,
        hour: followUp.followUpAtHour,
        minute: followUp.followUpAtMinute,
        period: followUp.followUpAtPeriod,
      }),
      follow_up_notes: followUp.followUpNotes,
      updated_at: updatedAt,
    }
    const nextLead = applyLeadScore({ ...lead, ...followUpPayloadBase })
    const followUpPayload = {
      ...followUpPayloadBase,
      ...getLeadScorePayload(nextLead),
    }

    setSavingFollowUpLeadKey(leadKey)
    setFollowUpMessage('')

    const query = supabase.from('leads').update(followUpPayload)
    const { error: followUpError } =
      lead.id !== undefined && lead.id !== null
        ? await query.eq('id', lead.id)
        : await query.eq('email', lead.email)

    if (followUpError) {
      setFollowUpMessage(`Error: ${followUpError.message}`)
    } else {
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          getLeadKey(currentLead) === leadKey
            ? { ...currentLead, ...followUpPayload }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, ...followUpPayload }
          : currentLead,
      )
      setFollowUpMessage('Follow-up saved.')
    }

    setSavingFollowUpLeadKey(null)
  }

  const handleGenerateAiSummary = async (lead: Lead) => {
    const leadKey = getLeadKey(lead)
    const updatedAt = new Date().toISOString()
    const aiQualification = generateAiQualificationPlaceholder(lead)
    const aiPayload = {
      ai_summary: aiQualification.summary,
      ai_recommendation: aiQualification.recommendation,
      ai_summary_updated_at: updatedAt,
      updated_at: updatedAt,
    }

    setSavingAiSummaryLeadKey(leadKey)
    setAiSummaryMessage('')

    const query = supabase.from('leads').update(aiPayload)
    const { error: aiSummaryError } =
      lead.id !== undefined && lead.id !== null
        ? await query.eq('id', lead.id)
        : await query.eq('email', lead.email)

    if (aiSummaryError) {
      setAiSummaryMessage(`Error: ${aiSummaryError.message}`)
    } else {
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          getLeadKey(currentLead) === leadKey
            ? { ...currentLead, ...aiPayload }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, ...aiPayload }
          : currentLead,
      )
      setAiSummaryMessage('AI qualification saved.')
    }

    setSavingAiSummaryLeadKey(null)
  }

  const handleGenerateAiInsights = async (lead: Lead) => {
    const leadKey = getLeadKey(lead)
    const updatedAt = new Date().toISOString()
    const aiInsights = generateAiLeadInsightsPlaceholder(lead)
    const aiInsightsPayload = {
      ai_objection_risk: aiInsights.objectionRisk,
      ai_suggested_response: aiInsights.suggestedResponse,
      ai_close_probability: aiInsights.closeProbability,
      ai_next_best_action: aiInsights.nextBestAction,
      ai_insights_updated_at: updatedAt,
      updated_at: updatedAt,
    }

    setSavingAiInsightsLeadKey(leadKey)
    setAiInsightsMessage('')

    const query = supabase.from('leads').update(aiInsightsPayload)
    const { error: aiInsightsError } =
      lead.id !== undefined && lead.id !== null
        ? await query.eq('id', lead.id)
        : await query.eq('email', lead.email)

    if (aiInsightsError) {
      setAiInsightsMessage(`Error: ${aiInsightsError.message}`)
    } else {
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          getLeadKey(currentLead) === leadKey
            ? { ...currentLead, ...aiInsightsPayload }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, ...aiInsightsPayload }
          : currentLead,
      )
      setAiInsightsMessage('AI insights saved.')
    }

    setSavingAiInsightsLeadKey(null)
  }

  const handleSaveSequence = async (
    lead: Lead,
    sequence: {
      sequenceStatus?: string
      nextSequenceStep?: string
      messageLog?: string
      markSent?: boolean
      sentVia?: 'manual' | 'n8n'
    },
  ) => {
    const leadKey = getLeadKey(lead)
    const updatedAt = new Date().toISOString()
    const payload = buildSequencePayload(lead, sequence, updatedAt)

    setSavingSequenceLeadKey(leadKey)
    setSequenceMessage('')

    const query = supabase.from('leads').update(payload)
    const { error: sequenceError } =
      lead.id !== undefined && lead.id !== null
        ? await query.eq('id', lead.id)
        : await query.eq('email', lead.email)

    if (sequenceError) {
      setSequenceMessage(`Error: ${sequenceError.message}`)
    } else {
      setLeads((currentLeads) =>
        currentLeads.map((currentLead) =>
          getLeadKey(currentLead) === leadKey
            ? { ...currentLead, ...payload }
            : currentLead,
        ),
      )
      setSelectedLead((currentLead) =>
        currentLead && getLeadKey(currentLead) === leadKey
          ? { ...currentLead, ...payload }
          : currentLead,
      )
      setSequenceMessage(
        sequence.markSent ? 'Follow-up marked sent.' : 'Sequence updated.',
      )
    }

    setSavingSequenceLeadKey(null)
  }

  const handleSendSequenceStep = async (lead: Lead) => {
    const leadKey = getLeadKey(lead)
    setSavingSequenceLeadKey(leadKey)
    setSequenceMessage('')

    if (!N8N_SEQUENCE_WEBHOOK_URL) {
      setSequenceMessage('Error: n8n sequence webhook URL is not configured.')
      setSavingSequenceLeadKey(null)
      return
    }

    if (!canSendCurrentSequenceStep(lead)) {
      setSequenceMessage(
        'Error: Sequence must be active with a valid step and email or phone.',
      )
      setSavingSequenceLeadKey(null)
      return
    }

    try {
      const response = await fetch(N8N_SEQUENCE_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSequenceWebhookPayload(lead)),
      })

      if (!response.ok) {
        throw new Error(`n8n webhook failed with status ${response.status}`)
      }

      if (lead.id === undefined || lead.id === null) {
        throw new Error('Lead id is required to refresh the sequence update.')
      }

      const { data: refreshedLead, error: sequenceError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.id)
        .single()

      if (sequenceError) {
        setSequenceMessage(`Error: ${sequenceError.message}`)
      } else {
        const updatedLead = applyLeadScore(refreshedLead as Lead)

        setLeads((currentLeads) =>
          currentLeads.map((currentLead) =>
            getLeadKey(currentLead) === leadKey
              ? updatedLead
              : currentLead,
          ),
        )
        setSelectedLead((currentLead) =>
          currentLead && getLeadKey(currentLead) === leadKey
            ? updatedLead
            : currentLead,
        )
        setSequenceMessage('Follow-up sent and sequence updated.')
      }
    } catch (error) {
      setSequenceMessage(
        `Error: ${error instanceof Error ? error.message : 'Could not send current step.'}`,
      )
    }

    setSavingSequenceLeadKey(null)
  }

  const handleSendSmsFollowUp = async (lead: Lead) => {
    const leadKey = getLeadKey(lead)
    setSavingSmsLeadKey(leadKey)
    setSmsMessage('')

    if (!N8N_SMS_WEBHOOK_URL) {
      setSmsMessage('Error: n8n SMS webhook URL is not configured.')
      setSavingSmsLeadKey(null)
      return
    }

    if (!hasLeadPhone(lead)) {
      setSmsMessage('Error: Lead phone is required to send SMS.')
      setSavingSmsLeadKey(null)
      return
    }

    try {
      const response = await fetch(N8N_SMS_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSmsWebhookPayload(lead)),
      })

      if (!response.ok) {
        throw new Error(`n8n SMS webhook failed with status ${response.status}`)
      }

      if (lead.id === undefined || lead.id === null) {
        throw new Error('Lead id is required to refresh the SMS update.')
      }

      const { data: refreshedLead, error: smsError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', lead.id)
        .single()

      if (smsError) {
        setSmsMessage(`Error: ${smsError.message}`)
      } else {
        const updatedLead = applyLeadScore(refreshedLead as Lead)

        setLeads((currentLeads) =>
          currentLeads.map((currentLead) =>
            getLeadKey(currentLead) === leadKey ? updatedLead : currentLead,
          ),
        )
        setSelectedLead((currentLead) =>
          currentLead && getLeadKey(currentLead) === leadKey
            ? updatedLead
            : currentLead,
        )
        setSmsMessage('SMS follow-up sent and lead refreshed.')
      }
    } catch (error) {
      setSmsMessage(
        `Error: ${error instanceof Error ? error.message : 'Could not send SMS follow-up.'}`,
      )
    }

    setSavingSmsLeadKey(null)
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
                setActiveDashboardView('leads')
                navigate('/dashboard')
              }}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold transition ${
                activeDashboardView === 'leads'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              Leads
            </a>
            <a
              href="/dashboard/analytics"
              onClick={(event) => {
                event.preventDefault()
                setActiveDashboardView('analytics')
                navigate('/dashboard/analytics')
              }}
              className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold transition ${
                activeDashboardView === 'analytics'
                  ? 'bg-cyan-400 text-slate-950'
                  : 'text-slate-200 hover:bg-slate-800'
              }`}
            >
              Analytics
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
                  {activeDashboardView === 'analytics'
                    ? 'Analytics dashboard'
                    : 'Lead pipeline'}
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
            {activeDashboardView === 'analytics' ? (
              <AnalyticsDashboard
                analytics={dashboardAnalytics}
                loading={loading}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
              />
            ) : (
              <>
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

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-8">
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
                helper="closed / total"
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

            <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_180px]">
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

              <FilterSelect
                label="Score range"
                value={scoreRangeFilter}
                onChange={setScoreRangeFilter}
                options={scoreRangeOptions}
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
                  <table className="min-w-[1980px] w-full text-left text-sm">
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
                        <th className="px-4 py-3">Lead Score</th>
                        <th className="px-4 py-3">lead_temperature</th>
                        <th className="px-4 py-3">appointment_status</th>
                        <th className="px-4 py-3">Follow-Up Status</th>
                        <th className="px-4 py-3">Reply Status</th>
                        <th className="px-4 py-3">SMS Status</th>
                        <th className="px-4 py-3">Next Follow-Up</th>
                        <th className="px-4 py-3">Sequence Status</th>
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
                            setAppointmentMessage('')
                            setFollowUpMessage('')
                            setAiSummaryMessage('')
                            setAiInsightsMessage('')
                            setSequenceMessage('')
                            setSmsMessage('')
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
                            {formatTorontoDate(lead.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            <LeadScoreBadge lead={lead} />
                          </td>
                          <td className="px-4 py-3">
                            <TemperatureBadge
                              temperature={getLeadTemperature(lead)}
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Badge tone="gray">
                              {getAppointmentStatus(lead)}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <FollowUpBadge lead={lead} />
                          </td>
                          <td className="px-4 py-3">
                            <ReplyStatusBadge lead={lead} />
                          </td>
                          <td className="px-4 py-3">
                            <SmsStatusBadge lead={lead} />
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatTorontoDate(lead.follow_up_at)}
                          </td>
                          <td className="px-4 py-3">
                            <SequenceStatusBadge lead={lead} />
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
              </>
            )}
          </div>
        </section>
      </div>

      {selectedLead ? (
        <LeadDetailModal
          lead={selectedLead}
          isSavingNote={savingNoteLeadKey === getLeadKey(selectedLead)}
          isSavingAppointment={
            savingAppointmentLeadKey === getLeadKey(selectedLead)
          }
          isSavingFollowUp={savingFollowUpLeadKey === getLeadKey(selectedLead)}
          isSavingAiSummary={
            savingAiSummaryLeadKey === getLeadKey(selectedLead)
          }
          isSavingAiInsights={
            savingAiInsightsLeadKey === getLeadKey(selectedLead)
          }
          isSavingSequence={savingSequenceLeadKey === getLeadKey(selectedLead)}
          isSavingSms={savingSmsLeadKey === getLeadKey(selectedLead)}
          noteMessage={noteMessage}
          appointmentMessage={appointmentMessage}
          followUpMessage={followUpMessage}
          aiSummaryMessage={aiSummaryMessage}
          aiInsightsMessage={aiInsightsMessage}
          sequenceMessage={sequenceMessage}
          smsMessage={smsMessage}
          onSaveNote={handleSaveNote}
          onSaveAppointment={handleSaveAppointment}
          onSaveFollowUp={handleSaveFollowUp}
          onGenerateAiSummary={handleGenerateAiSummary}
          onGenerateAiInsights={handleGenerateAiInsights}
          onSaveSequence={handleSaveSequence}
          onSendSequenceStep={handleSendSequenceStep}
          onSendSmsFollowUp={handleSendSmsFollowUp}
          onClose={() => setSelectedLead(null)}
        />
      ) : null}
    </main>
  )
}

type DashboardAnalytics = {
  kpiCards: Array<{ label: string; value: number | string }>
  qualificationRate: number
  bookingRate: number
  closeRate: number
  replyRate: number
  smsReplyRate: number
  funnelStages: Array<{
    label: string
    count: number
    conversionFromPrevious: number | null
  }>
  sequencePerformance: Array<{ label: string; value: number | string }>
  channelPerformance: Array<{ label: string; value: number | string }>
  topInsights: Array<{ label: string; value: string }>
  temperatureCounts: Record<(typeof temperatureOptions)[number], number>
  leadsOverTime: Array<{ label: string; leads: number }>
  bookedCallsOverTime: Array<{ label: string; bookedCalls: number }>
  repliesOverTime: Array<{
    label: string
    replies: number
    smsReplies: number
  }>
  temperatureChartData: Array<{ temperature: string; leads: number }>
  leadSourceChartData: Array<{ leadSource: string; leads: number }>
  serviceTypeChartData: Array<{ serviceType: string; leads: number }>
  scoreDistributionData: Array<{ scoreRange: string; leads: number }>
  sequenceStatusChartData: Array<{ status: string; leads: number }>
  statusChartData: Array<{ status: string; leads: number }>
}

function KpiCard({
  label,
  value,
  loading,
}: {
  label: string
  value: number | string
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

function MetricCard({
  label,
  value,
  loading,
}: {
  label: string
  value: number | string
  loading: boolean
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      {loading ? (
        <div className="mt-3 h-7 w-20 animate-pulse rounded bg-slate-200" />
      ) : (
        <p className="mt-2 break-words text-2xl font-bold text-slate-950">
          {value}
        </p>
      )}
    </div>
  )
}

function AnalyticsDashboard({
  analytics,
  loading,
  timeRange,
  onTimeRangeChange,
}: {
  analytics: DashboardAnalytics
  loading: boolean
  timeRange: TimeRange
  onTimeRangeChange: (timeRange: TimeRange) => void
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
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
              onClick={() => onTimeRangeChange(option)}
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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {analytics.kpiCards.map((card) => (
          <KpiCard
            key={card.label}
            label={card.label}
            value={card.value}
            loading={loading}
          />
        ))}
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
          Sales funnel
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {analytics.funnelStages.map((stage) => (
            <div
              key={stage.label}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-slate-500">{stage.label}</p>
              {loading ? (
                <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-200" />
              ) : (
                <>
                  <p className="mt-2 text-3xl font-bold text-slate-950">
                    {stage.count}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {stage.conversionFromPrevious === null
                      ? 'Starting stage'
                      : `${stage.conversionFromPrevious}% from previous`}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
            Sequence performance
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {analytics.sequencePerformance.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                loading={loading}
              />
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
            SMS vs email performance
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {analytics.channelPerformance.map((metric) => (
              <MetricCard
                key={metric.label}
                label={metric.label}
                value={metric.value}
                loading={loading}
              />
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
          Top insights
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {analytics.topInsights.map((insight) => (
            <div
              key={insight.label}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <p className="text-sm font-medium text-slate-500">
                {insight.label}
              </p>
              {loading ? (
                <div className="mt-3 h-7 w-24 animate-pulse rounded bg-slate-200" />
              ) : (
                <p className="mt-2 break-words text-2xl font-bold text-slate-950">
                  {insight.value}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Leads over time" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics.leadsOverTime}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="leads" stroke="#0891b2" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bookings over time" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics.bookedCallsOverTime}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="bookedCalls" stroke="#2563eb" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Replies over time" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={analytics.repliesOverTime}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <Tooltip />
              <Line type="monotone" dataKey="replies" name="Email replies" stroke="#059669" strokeWidth={3} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="smsReplies" name="SMS replies" stroke="#ca8a04" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads by temperature" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.temperatureChartData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="temperature" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <Tooltip />
              <Bar dataKey="leads" radius={[4, 4, 0, 0]}>
                {analytics.temperatureChartData.map((item) => (
                  <Cell
                    key={item.temperature}
                    fill={
                      item.temperature === 'HOT'
                        ? '#dc2626'
                        : item.temperature === 'WARM'
                          ? '#ca8a04'
                          : '#64748b'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads by source" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.leadSourceChartData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="leadSource" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <Tooltip />
              <Bar dataKey="leads" fill="#0f766e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Leads by service type" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.serviceTypeChartData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="serviceType" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <Tooltip />
              <Bar dataKey="leads" fill="#334155" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Lead score distribution" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.scoreDistributionData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="scoreRange" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <Tooltip />
              <Bar dataKey="leads" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Sequence status distribution" loading={loading}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={analytics.sequenceStatusChartData}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
              <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} />
              <Tooltip />
              <Bar dataKey="leads" fill="#475569" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
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
  isSavingAppointment,
  isSavingFollowUp,
  isSavingAiSummary,
  isSavingAiInsights,
  isSavingSequence,
  isSavingSms,
  noteMessage,
  appointmentMessage,
  followUpMessage,
  aiSummaryMessage,
  aiInsightsMessage,
  sequenceMessage,
  smsMessage,
  onSaveNote,
  onSaveAppointment,
  onSaveFollowUp,
  onGenerateAiSummary,
  onGenerateAiInsights,
  onSaveSequence,
  onSendSequenceStep,
  onSendSmsFollowUp,
  onClose,
}: {
  lead: Lead
  isSavingNote: boolean
  isSavingAppointment: boolean
  isSavingFollowUp: boolean
  isSavingAiSummary: boolean
  isSavingAiInsights: boolean
  isSavingSequence: boolean
  isSavingSms: boolean
  noteMessage: string
  appointmentMessage: string
  followUpMessage: string
  aiSummaryMessage: string
  aiInsightsMessage: string
  sequenceMessage: string
  smsMessage: string
  onSaveNote: (lead: Lead, notes: string) => Promise<void>
  onSaveAppointment: (
    lead: Lead,
    appointment: {
      appointmentStatus: string
      bookedAtDate: string
      bookedAtHour: string
      bookedAtMinute: string
      bookedAtPeriod: string
      appointmentNotes: string
    },
  ) => Promise<void>
  onSaveFollowUp: (
    lead: Lead,
    followUp: {
      followUpStatus: string
      followUpType: string
      followUpAtDate: string
      followUpAtHour: string
      followUpAtMinute: string
      followUpAtPeriod: string
      followUpNotes: string
    },
  ) => Promise<void>
  onGenerateAiSummary: (lead: Lead) => Promise<void>
  onGenerateAiInsights: (lead: Lead) => Promise<void>
  onSaveSequence: (
    lead: Lead,
    sequence: {
      sequenceStatus?: string
      nextSequenceStep?: string
      messageLog?: string
      markSent?: boolean
      sentVia?: 'manual' | 'n8n'
    },
  ) => Promise<void>
  onSendSequenceStep: (lead: Lead) => Promise<void>
  onSendSmsFollowUp: (lead: Lead) => Promise<void>
  onClose: () => void
}) {
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [appointmentStatus, setAppointmentStatus] = useState(
    getAppointmentStatus(lead),
  )
  const [bookedAtFields, setBookedAtFields] = useState(() =>
    formatAppointmentFields(lead.booked_at),
  )
  const [appointmentNotes, setAppointmentNotes] = useState(
    lead.appointment_notes ?? '',
  )
  const [followUpStatus, setFollowUpStatus] = useState(getFollowUpStatus(lead))
  const [followUpType, setFollowUpType] = useState(getFollowUpType(lead))
  const [followUpAtFields, setFollowUpAtFields] = useState(() =>
    formatAppointmentFields(lead.follow_up_at),
  )
  const [followUpNotes, setFollowUpNotes] = useState(lead.follow_up_notes ?? '')
  const [sequenceStatus, setSequenceStatus] = useState(
    getFollowUpSequenceStatus(lead),
  )
  const [nextSequenceStep, setNextSequenceStep] = useState(
    getNextSequenceStep(lead),
  )
  const [sequenceMessageLog, setSequenceMessageLog] = useState(
    lead.follow_up_message_log ?? '',
  )
  const [copyMessage, setCopyMessage] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const calendlyLink =
    typeof lead.calendly_url === 'string' && lead.calendly_url.trim().length > 0
      ? lead.calendly_url.trim()
      : ''
  const email = typeof lead.email === 'string' ? lead.email.trim() : ''
  const phone = typeof lead.phone === 'string' ? lead.phone.trim() : ''
  const isRepeatLead = (lead.submission_count ?? 0) > 1

  useEffect(() => {
    setNotes(lead.notes ?? '')
    setAppointmentStatus(getAppointmentStatus(lead))
    setBookedAtFields(formatAppointmentFields(lead.booked_at))
    setAppointmentNotes(lead.appointment_notes ?? '')
    setFollowUpStatus(getFollowUpStatus(lead))
    setFollowUpType(getFollowUpType(lead))
    setFollowUpAtFields(formatAppointmentFields(lead.follow_up_at))
    setFollowUpNotes(lead.follow_up_notes ?? '')
    setSequenceStatus(getFollowUpSequenceStatus(lead))
    setNextSequenceStep(getNextSequenceStep(lead))
    setSequenceMessageLog(lead.follow_up_message_log ?? '')
    setCopyMessage('')
  }, [lead])

  const activityItems = buildLeadActivityItems(lead)

  const handleCopy = async (label: string, value: string) => {
    if (!value) {
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(`${label} copied.`)
    } catch {
      setCopyMessage(`Could not copy ${label.toLowerCase()}.`)
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex bg-slate-950/70 ${
        isFullscreen
          ? 'items-stretch justify-stretch p-0'
          : 'items-stretch justify-end lg:pl-24'
      }`}
      onClick={onClose}
    >
      <div
        className={`flex w-full flex-col overflow-hidden bg-white shadow-2xl ${
          isFullscreen
            ? 'fixed inset-0 h-screen max-h-none w-screen max-w-none rounded-none'
            : 'h-full max-w-5xl'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Lead detail</p>
            <h2 className="text-xl font-bold text-slate-950">
              {displayValue(lead.name)}
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <TemperatureBadge temperature={getLeadTemperature(lead)} />
              {isRepeatLead ? <Badge tone="blue">Repeat lead</Badge> : null}
              {hasLeadReplied(lead) ? <Badge tone="green">Replied</Badge> : null}
              {hasLeadSmsReplied(lead) ? (
                <Badge tone="green">SMS replied</Badge>
              ) : isSmsPending(lead) ? (
                <Badge tone="yellow">SMS pending</Badge>
              ) : null}
              <Badge tone="gray">{getLeadStatus(lead)}</Badge>
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsFullscreen((currentValue) => !currentValue)}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap gap-2">
              <QuickActionLink
                href={email ? `mailto:${email}` : ''}
                disabled={!email}
              >
                Email lead
              </QuickActionLink>
              <QuickActionLink href={phone ? `tel:${phone}` : ''} disabled={!phone}>
                Call lead
              </QuickActionLink>
              <QuickActionLink href={calendlyLink} disabled={!calendlyLink} external>
                Open Booking Link
              </QuickActionLink>
              <QuickActionButton
                disabled={!email}
                onClick={() => handleCopy('Email', email)}
              >
                Copy email
              </QuickActionButton>
              <QuickActionButton
                disabled={!phone}
                onClick={() => handleCopy('Phone', phone)}
              >
                Copy phone
              </QuickActionButton>
            </div>
            {copyMessage ? (
              <p className="mt-3 text-sm font-medium text-slate-600">
                {copyMessage}
              </p>
            ) : null}
          </div>

          <div
            className={`grid min-w-0 gap-5 ${
              isFullscreen
                ? 'lg:grid-cols-2 2xl:grid-cols-3'
                : 'lg:grid-cols-2'
            }`}
          >
            <DetailSection title="Contact">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Name" value={lead.name} />
                <DetailField label="Email" value={lead.email} />
                <DetailField label="Phone" value={lead.phone} />
                <DetailLinkField label="Booking Link" href={calendlyLink} />
              </div>
            </DetailSection>

            <DetailSection title="Business details">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Business name" value={lead.business_name} />
                <DetailField label="Service type" value={lead.service_type} />
              </div>
            </DetailSection>

            <DetailSection title="Notes">
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Add internal notes for this lead"
                className="min-h-40 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
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
            </DetailSection>

            <DetailSection title="Appointment">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Appointment status
                  </span>
                  <select
                    value={appointmentStatus}
                    onChange={(event) =>
                      setAppointmentStatus(event.target.value)
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {appointmentStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Appointment date
                  </span>
                  <input
                    type="date"
                    value={bookedAtFields.date}
                    onChange={(event) =>
                      setBookedAtFields((currentFields) => ({
                        ...currentFields,
                        date: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Hour
                  </span>
                  <select
                    value={bookedAtFields.hour}
                    onChange={(event) =>
                      setBookedAtFields((currentFields) => ({
                        ...currentFields,
                        hour: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {appointmentHourOptions.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Minute
                  </span>
                  <select
                    value={bookedAtFields.minute}
                    onChange={(event) =>
                      setBookedAtFields((currentFields) => ({
                        ...currentFields,
                        minute: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {appointmentMinuteOptions.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    AM/PM
                  </span>
                  <select
                    value={bookedAtFields.period}
                    onChange={(event) =>
                      setBookedAtFields((currentFields) => ({
                        ...currentFields,
                        period: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {appointmentPeriodOptions.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Appointment notes
                </span>
                <textarea
                  value={appointmentNotes}
                  onChange={(event) => setAppointmentNotes(event.target.value)}
                  placeholder="Add appointment details or manual booking context"
                  className="min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isSavingAppointment}
                  onClick={() =>
                    onSaveAppointment(lead, {
                      appointmentStatus,
                      bookedAtDate: bookedAtFields.date,
                      bookedAtHour: bookedAtFields.hour,
                      bookedAtMinute: bookedAtFields.minute,
                      bookedAtPeriod: bookedAtFields.period,
                      appointmentNotes,
                    })
                  }
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAppointment ? 'Saving...' : 'Save appointment'}
                </button>
                {appointmentMessage ? (
                  <p
                    className={`text-sm font-medium ${
                      appointmentMessage.startsWith('Error:')
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {appointmentMessage}
                  </p>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection title="Follow-Up">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Follow-up status
                  </span>
                  <select
                    value={followUpStatus}
                    onChange={(event) => setFollowUpStatus(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {followUpStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Follow-up type
                  </span>
                  <select
                    value={followUpType}
                    onChange={(event) => setFollowUpType(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {followUpTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Follow-up date
                  </span>
                  <input
                    type="date"
                    value={followUpAtFields.date}
                    onChange={(event) =>
                      setFollowUpAtFields((currentFields) => ({
                        ...currentFields,
                        date: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  />
                </label>
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Hour
                  </span>
                  <select
                    value={followUpAtFields.hour}
                    onChange={(event) =>
                      setFollowUpAtFields((currentFields) => ({
                        ...currentFields,
                        hour: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {appointmentHourOptions.map((hour) => (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Minute
                  </span>
                  <select
                    value={followUpAtFields.minute}
                    onChange={(event) =>
                      setFollowUpAtFields((currentFields) => ({
                        ...currentFields,
                        minute: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {appointmentMinuteOptions.map((minute) => (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    AM/PM
                  </span>
                  <select
                    value={followUpAtFields.period}
                    onChange={(event) =>
                      setFollowUpAtFields((currentFields) => ({
                        ...currentFields,
                        period: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {appointmentPeriodOptions.map((period) => (
                      <option key={period} value={period}>
                        {period}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Follow-up notes
                </span>
                <textarea
                  value={followUpNotes}
                  onChange={(event) => setFollowUpNotes(event.target.value)}
                  placeholder="Add follow-up task context"
                  className="min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isSavingFollowUp}
                  onClick={() =>
                    onSaveFollowUp(lead, {
                      followUpStatus,
                      followUpType,
                      followUpAtDate: followUpAtFields.date,
                      followUpAtHour: followUpAtFields.hour,
                      followUpAtMinute: followUpAtFields.minute,
                      followUpAtPeriod: followUpAtFields.period,
                      followUpNotes,
                    })
                  }
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingFollowUp ? 'Saving...' : 'Save follow-up'}
                </button>
                {followUpMessage ? (
                  <p
                    className={`text-sm font-medium ${
                      followUpMessage.startsWith('Error:')
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {followUpMessage}
                  </p>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection title="Reply Tracking">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBadgeField label="Reply status">
                  <ReplyStatusBadge lead={lead} />
                </DetailBadgeField>
                <DetailField
                  label="Replied at"
                  value={formatTorontoDate(lead.replied_at)}
                />
              </div>
              <DetailField
                label="Last reply snippet"
                value={lead.last_reply_snippet}
              />
            </DetailSection>

            <DetailSection title="SMS Tracking">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailBadgeField label="SMS reply status">
                  <SmsStatusBadge lead={lead} />
                </DetailBadgeField>
                <DetailField
                  label="Last SMS sent"
                  value={formatTorontoDate(lead.last_sms_sent_at)}
                />
                <DetailField
                  label="Last SMS reply"
                  value={formatTorontoDate(lead.last_sms_reply_at)}
                />
              </div>
              <DetailField
                label="Last SMS message"
                value={lead.last_sms_message}
              />
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isSavingSms || !canSendSmsFollowUp(lead)}
                  onClick={() => onSendSmsFollowUp(lead)}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingSms ? 'Sending...' : 'Send SMS follow-up'}
                </button>
                {smsMessage ? (
                  <p
                    className={`text-sm font-medium ${
                      smsMessage.startsWith('Error:')
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {smsMessage}
                  </p>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection title="Follow-Up Sequence">
              {hasLeadReplied(lead) ? (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
                  Lead replied. Follow-up sequence is paused.
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Sequence status
                  </span>
                  <select
                    value={sequenceStatus}
                    onChange={(event) => setSequenceStatus(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {followUpSequenceStatusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                    Next sequence step
                  </span>
                  <select
                    value={nextSequenceStep}
                    onChange={(event) => setNextSequenceStep(event.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                  >
                    {sequenceStepOptions.map((step) => (
                      <option key={step} value={step}>
                        {step}
                      </option>
                    ))}
                    {nextSequenceStep === 'Completed' ? (
                      <option value="Completed">Completed</option>
                    ) : null}
                  </select>
                </label>
              </div>

              <DetailField
                label="Last follow-up sent"
                value={formatTorontoDate(lead.last_follow_up_sent_at)}
              />

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
                  Message log
                </span>
                <textarea
                  value={sequenceMessageLog}
                  onChange={(event) => setSequenceMessageLog(event.target.value)}
                  placeholder="Track manual follow-up sequence notes"
                  className="min-h-32 w-full resize-y rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                />
              </label>

              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <button
                  type="button"
                  disabled={isSavingSequence}
                  onClick={() =>
                    onSaveSequence(lead, {
                      sequenceStatus: 'Active',
                      nextSequenceStep: 'Initial follow-up',
                      messageLog: sequenceMessageLog,
                    })
                  }
                  className="rounded-md bg-slate-950 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Start sequence
                </button>
                <button
                  type="button"
                  disabled={isSavingSequence}
                  onClick={() =>
                    onSaveSequence(lead, {
                      sequenceStatus: 'Paused',
                      nextSequenceStep,
                      messageLog: sequenceMessageLog,
                    })
                  }
                  className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Pause sequence
                </button>
                <button
                  type="button"
                  disabled={isSavingSequence}
                  onClick={() =>
                    onSaveSequence(lead, {
                      sequenceStatus: 'Completed',
                      nextSequenceStep,
                      messageLog: sequenceMessageLog,
                    })
                  }
                  className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark completed
                </button>
                <button
                  type="button"
                  disabled={isSavingSequence}
                  onClick={() =>
                    onSaveSequence(lead, {
                      sequenceStatus: 'Stopped',
                      nextSequenceStep,
                      messageLog: sequenceMessageLog,
                    })
                  }
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Stop sequence
                </button>
              </div>

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isSavingSequence}
                  onClick={() =>
                    onSaveSequence(lead, {
                      sequenceStatus,
                      nextSequenceStep,
                      messageLog: sequenceMessageLog,
                      markSent: true,
                      sentVia: 'manual',
                    })
                  }
                  className="rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Mark follow-up sent
                </button>
                <button
                  type="button"
                  disabled={isSavingSequence || !canSendCurrentSequenceStep(lead)}
                  onClick={() => onSendSequenceStep(lead)}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingSequence ? 'Sending...' : 'Send current step'}
                </button>
                {sequenceMessage ? (
                  <p
                    className={`text-sm font-medium ${
                      sequenceMessage.startsWith('Error:')
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {sequenceMessage}
                  </p>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection title="AI Qualification">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Lead score" value={getLeadScore(lead)} />
                <DetailField
                  label="Lead temperature"
                  value={getLeadTemperature(lead)}
                />
              </div>

              <DetailField label="AI Summary" value={lead.ai_summary} />
              <DetailField
                label="AI Recommendation"
                value={lead.ai_recommendation}
              />
              <DetailField
                label="Last AI Updated"
                value={formatTorontoDate(lead.ai_summary_updated_at)}
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isSavingAiSummary}
                  onClick={() => onGenerateAiSummary(lead)}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAiSummary ? 'Generating...' : 'Generate AI Summary'}
                </button>
                {aiSummaryMessage ? (
                  <p
                    className={`text-sm font-medium ${
                      aiSummaryMessage.startsWith('Error:')
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {aiSummaryMessage}
                  </p>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection title="AI Lead Insights">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField
                  label="Close Probability"
                  value={
                    typeof lead.ai_close_probability === 'number'
                      ? `${lead.ai_close_probability}%`
                      : lead.ai_close_probability
                  }
                />
                <DetailField
                  label="Objection Risk"
                  value={lead.ai_objection_risk}
                />
                <DetailField
                  label="Next Best Action"
                  value={lead.ai_next_best_action}
                />
                <DetailField
                  label="Last Updated"
                  value={formatTorontoDate(lead.ai_insights_updated_at)}
                />
              </div>
              <DetailField
                label="Suggested Response"
                value={lead.ai_suggested_response}
              />

              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  disabled={isSavingAiInsights}
                  onClick={() => onGenerateAiInsights(lead)}
                  className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingAiInsights
                    ? 'Generating...'
                    : 'Generate AI Insights'}
                </button>
                {aiInsightsMessage ? (
                  <p
                    className={`text-sm font-medium ${
                      aiInsightsMessage.startsWith('Error:')
                        ? 'text-red-700'
                        : 'text-emerald-700'
                    }`}
                  >
                    {aiInsightsMessage}
                  </p>
                ) : null}
              </div>
            </DetailSection>

            <DetailSection title="Pipeline">
              <div className="grid gap-3 sm:grid-cols-2">
                <DetailField label="Status" value={getLeadStatus(lead)} />
                <DetailField
                  label="Appointment status"
                  value={getAppointmentStatus(lead)}
                />
                <DetailField
                  label="Lead score"
                  value={getLeadScore(lead)}
                />
                <DetailField
                  label="Lead temperature"
                  value={getLeadTemperature(lead)}
                />
                <DetailField
                  label="Score reason"
                  value={getLeadScoreReason(lead)}
                />
                <DetailField
                  label="Booked at"
                  value={formatTorontoDate(lead.booked_at)}
                />
                <DetailBadgeField label="Follow-up status">
                  <FollowUpBadge lead={lead} />
                </DetailBadgeField>
                <DetailField
                  label="Next follow-up"
                  value={formatTorontoDate(lead.follow_up_at)}
                />
                <DetailField
                  label="Sequence status"
                  value={
                    hasLeadReplied(lead)
                      ? `${getFollowUpSequenceStatus(lead)} (paused by reply)`
                      : getFollowUpSequenceStatus(lead)
                  }
                />
                <DetailField
                  label="Next sequence step"
                  value={getNextSequenceStep(lead)}
                />
                <DetailField
                  label="Created at"
                  value={formatTorontoDate(lead.created_at)}
                />
                <DetailField
                  label="Updated at"
                  value={formatTorontoDate(lead.updated_at)}
                />
              </div>
            </DetailSection>

            <DetailSection title="Qualification answers">
              <div className="grid gap-3 sm:grid-cols-3">
                <DetailField label="Lead source" value={lead.lead_source} />
                <DetailField label="Response speed" value={lead.response_speed} />
                <DetailField
                  label="Submission count"
                  value={lead.submission_count ?? 0}
                />
              </div>
            </DetailSection>

            <DetailSection title="Activity timeline">
              <div className="space-y-4">
                {activityItems.map((item) => (
                  <div key={item.label} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-500" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.label}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </DetailSection>
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.12em] text-slate-500">
        {title}
      </h3>
      <div className="mt-3 min-w-0 space-y-3">{children}</div>
    </section>
  )
}

function DetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <div className="mt-1 min-w-0 overflow-hidden break-words text-sm font-medium text-slate-900">
        {renderUnknownValue(value)}
      </div>
    </div>
  )
}

function DetailBadgeField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function DetailLinkField({ label, href }: { label: string; href: string }) {
  return (
    <div className="min-w-0 overflow-hidden">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex max-w-full rounded-md border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-sm font-semibold text-cyan-700 transition hover:bg-cyan-100 hover:text-cyan-900"
        >
          Open booking link
        </a>
      ) : (
        <p className="mt-1 text-sm font-medium text-slate-900">-</p>
      )}
    </div>
  )
}

function QuickActionLink({
  href,
  disabled,
  external = false,
  children,
}: {
  href: string
  disabled: boolean
  external?: boolean
  children: string
}) {
  if (disabled) {
    return (
      <span className="rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-400">
        {children}
      </span>
    )
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
    >
      {children}
    </a>
  )
}

function QuickActionButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean
  onClick: () => void
  children: string
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
    >
      {children}
    </button>
  )
}

function buildLeadActivityItems(lead: Lead) {
  const activityItems = [
    {
      label: 'Lead created',
      time: formatTorontoDate(lead.created_at),
    },
  ]

  activityItems.push({
    label: 'Last updated',
    time: formatTorontoDate(lead.updated_at),
  })

  activityItems.push({
    label: `Submitted assessment ${lead.submission_count ?? 0} time(s)`,
    time: formatTorontoDate(lead.created_at),
  })

  activityItems.push({
    label: `Current status: ${getLeadStatus(lead)}`,
    time: 'Now',
  })

  if (lead.booked_at) {
    activityItems.push({
      label: 'Appointment booked',
      time: formatTorontoDate(lead.booked_at),
    })
  }

  activityItems.push({
    label: `Appointment status: ${getAppointmentStatus(lead)}`,
    time: lead.booked_at ? formatTorontoDate(lead.booked_at) : 'Now',
  })

  if (lead.follow_up_at) {
    activityItems.push({
      label: `Follow-up scheduled: ${getFollowUpType(lead)}`,
      time: formatTorontoDate(lead.follow_up_at),
    })
  }

  activityItems.push({
    label: `Follow-up status: ${getFollowUpStatus(lead)}`,
    time: lead.follow_up_at ? formatTorontoDate(lead.follow_up_at) : 'Now',
  })

  if (getFollowUpStatus(lead) === 'Completed') {
    activityItems.push({
      label: 'Follow-up completed',
      time: formatTorontoDate(lead.updated_at ?? lead.follow_up_at),
    })
  }

  if (lead.ai_summary_updated_at) {
    activityItems.push({
      label: 'AI qualification generated',
      time: formatTorontoDate(lead.ai_summary_updated_at),
    })
  }

  if (lead.ai_insights_updated_at) {
    activityItems.push({
      label: 'AI insights generated',
      time: formatTorontoDate(lead.ai_insights_updated_at),
    })
  }

  activityItems.push({
    label: `Follow-up sequence status: ${getFollowUpSequenceStatus(lead)}`,
    time: formatTorontoDate(lead.updated_at ?? lead.created_at),
  })

  if (lead.last_follow_up_sent_at) {
    activityItems.push({
      label: 'Last follow-up sent',
      time: formatTorontoDate(lead.last_follow_up_sent_at),
    })
  }

  if (lead.last_sms_sent_at) {
    activityItems.push({
      label: 'SMS sent',
      time: formatTorontoDate(lead.last_sms_sent_at),
    })
  }

  if (hasLeadReplied(lead)) {
    activityItems.push({
      label: 'Lead replied',
      time: formatTorontoDate(lead.replied_at),
    })
  }

  if (hasLeadSmsReplied(lead)) {
    activityItems.push({
      label: 'SMS replied',
      time: formatTorontoDate(lead.last_sms_reply_at),
    })
  }

  activityItems.push({
    label: `Next sequence step: ${getNextSequenceStep(lead)}`,
    time: formatTorontoDate(lead.updated_at ?? lead.created_at),
  })

  if (typeof lead.notes === 'string' && lead.notes.trim().length > 0) {
    activityItems.push({
      label: 'Internal note added',
      time: formatTorontoDate(lead.updated_at ?? lead.created_at),
    })
  }

  return activityItems
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

function LeadScoreBadge({ lead }: { lead: Lead }) {
  const score = getLeadScore(lead)
  const temperature = getLeadTemperature(lead)

  if (temperature === 'HOT') {
    return <Badge tone="red">{String(score)}</Badge>
  }

  if (temperature === 'WARM') {
    return <Badge tone="yellow">{String(score)}</Badge>
  }

  return <Badge tone="gray">{String(score)}</Badge>
}

function FollowUpBadge({ lead }: { lead: Lead }) {
  const label = getFollowUpDisplayLabel(lead)

  if (label === '-') {
    return <span className="text-sm font-medium text-slate-400">-</span>
  }

  if (label === 'Completed') {
    return <Badge tone="green">Completed</Badge>
  }

  if (label === 'Overdue') {
    return <Badge tone="red">Overdue</Badge>
  }

  if (label === 'Due Today') {
    return <Badge tone="yellow">Due Today</Badge>
  }

  if (label === 'Upcoming') {
    return <Badge tone="blue">Upcoming</Badge>
  }

  return <Badge tone="gray">{label}</Badge>
}

function ReplyStatusBadge({ lead }: { lead: Lead }) {
  const replyStatus = getReplyStatus(lead)

  if (replyStatus === 'Replied') {
    return <Badge tone="green">Replied</Badge>
  }

  return <Badge tone="gray">{replyStatus}</Badge>
}

function SmsStatusBadge({ lead }: { lead: Lead }) {
  const smsStatus = getSmsReplyStatus(lead)

  if (hasLeadSmsReplied(lead)) {
    return <Badge tone="green">{smsStatus}</Badge>
  }

  if (isSmsPending(lead)) {
    return <Badge tone="yellow">{smsStatus}</Badge>
  }

  return <Badge tone="gray">{smsStatus}</Badge>
}

function SequenceStatusBadge({ lead }: { lead: Lead }) {
  if (hasLeadReplied(lead)) {
    return <Badge tone="yellow">Paused by reply</Badge>
  }

  return <Badge tone="gray">{getFollowUpSequenceStatus(lead)}</Badge>
}

function Badge({
  tone,
  children,
}: {
  tone: 'red' | 'yellow' | 'gray' | 'blue' | 'green'
  children: string
}) {
  const classes = {
    red: 'border-red-200 bg-red-50 text-red-700',
    yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    gray: 'border-slate-200 bg-slate-100 text-slate-700',
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
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
  const serviceTypeBookedCounts = new Map<string, number>()
  const leadSourceCounts = new Map<string, number>()
  const leadSourceBookedCounts = new Map<string, number>()
  const sequenceStatusCounts = followUpSequenceStatusOptions.reduce(
    (counts, status) => ({
      ...counts,
      [status]: 0,
    }),
    {} as Record<(typeof followUpSequenceStatusOptions)[number], number>,
  )
  const leadsByDate = new Map<string, number>()
  const bookedCallsByDate = new Map<string, number>()
  const repliesByDate = new Map<string, number>()
  const smsRepliesByDate = new Map<string, number>()
  const replyDurationsMs: number[] = []
  const scoreDistributionCounts = new Map([
    ['0-44', 0],
    ['45-74', 0],
    ['75-100', 0],
  ])

  leads.forEach((lead) => {
    const status = getLeadStatus(lead) as (typeof statusOptions)[number]
    statusCounts[status] += 1

    const temperature =
      getLeadTemperature(lead) as (typeof temperatureOptions)[number]
    temperatureCounts[temperature] += 1
    const sequenceStatus =
      getFollowUpSequenceStatus(
        lead,
      ) as (typeof followUpSequenceStatusOptions)[number]
    sequenceStatusCounts[sequenceStatus] += 1

    const serviceType =
      typeof lead.service_type === 'string' && lead.service_type.trim()
        ? lead.service_type.trim()
      : 'Unknown'
    serviceTypeCounts.set(
      serviceType,
      (serviceTypeCounts.get(serviceType) ?? 0) + 1,
    )

    const leadSource =
      typeof lead.lead_source === 'string' && lead.lead_source.trim()
        ? lead.lead_source.trim()
        : 'Unknown'
    leadSourceCounts.set(
      leadSource,
      (leadSourceCounts.get(leadSource) ?? 0) + 1,
    )

    const dateKey = getDateKey(lead.created_at)
    if (dateKey) {
      leadsByDate.set(dateKey, (leadsByDate.get(dateKey) ?? 0) + 1)
    }

    const isBookedLead =
      getLeadStatus(lead) === 'Booked' || getAppointmentStatus(lead) === 'Booked'
    if (isBookedLead) {
      serviceTypeBookedCounts.set(
        serviceType,
        (serviceTypeBookedCounts.get(serviceType) ?? 0) + 1,
      )
      leadSourceBookedCounts.set(
        leadSource,
        (leadSourceBookedCounts.get(leadSource) ?? 0) + 1,
      )
      const bookedDateKey = getDateKey(lead.booked_at ?? lead.updated_at)
      if (bookedDateKey) {
        bookedCallsByDate.set(
          bookedDateKey,
          (bookedCallsByDate.get(bookedDateKey) ?? 0) + 1,
        )
      }
    }

    const replyDateKey = getDateKey(lead.replied_at)
    if (replyDateKey && hasLeadReplied(lead)) {
      repliesByDate.set(replyDateKey, (repliesByDate.get(replyDateKey) ?? 0) + 1)
    }

    const smsReplyDateKey = getDateKey(lead.last_sms_reply_at)
    if (smsReplyDateKey && hasLeadSmsReplied(lead)) {
      smsRepliesByDate.set(
        smsReplyDateKey,
        (smsRepliesByDate.get(smsReplyDateKey) ?? 0) + 1,
      )
    }

    const replyDate = getEarliestReplyDate(lead)
    const createdDate = parseSupabaseTimestamp(lead.created_at)
    if (replyDate && createdDate && replyDate.getTime() >= createdDate.getTime()) {
      replyDurationsMs.push(replyDate.getTime() - createdDate.getTime())
    }

    const score = getLeadScore(lead)
    const scoreRange = score >= 75 ? '75-100' : score >= 45 ? '45-74' : '0-44'
    scoreDistributionCounts.set(
      scoreRange,
      (scoreDistributionCounts.get(scoreRange) ?? 0) + 1,
    )
  })

  const total = leads.length
  const qualified = statusCounts.Qualified
  const booked = leads.filter(
    (lead) =>
      getLeadStatus(lead) === 'Booked' || getAppointmentStatus(lead) === 'Booked',
  ).length
  const closed = statusCounts.Closed
  const totalLeadScore = leads.reduce(
    (scoreTotal, lead) => scoreTotal + getLeadScore(lead),
    0,
  )
  const averageLeadScore =
    total > 0 ? Math.round(totalLeadScore / total) : 0
  const aiInsightLeads = leads.filter(
    (lead) => typeof lead.ai_close_probability === 'number',
  )
  const averageCloseProbability =
    aiInsightLeads.length > 0
      ? Math.round(
          aiInsightLeads.reduce(
            (probabilityTotal, lead) =>
              probabilityTotal + (lead.ai_close_probability ?? 0),
            0,
          ) / aiInsightLeads.length,
        )
      : 0
  const highCloseProbabilityLeads = leads.filter(
    (lead) =>
      typeof lead.ai_close_probability === 'number' &&
      lead.ai_close_probability >= 70,
  ).length
  const leadsWithObjectionRisk = leads.filter(hasAiObjectionRisk).length
  const activeSequences = leads.filter(
    (lead) => getFollowUpSequenceStatus(lead) === 'Active',
  ).length
  const pausedSequences = leads.filter(
    (lead) => getFollowUpSequenceStatus(lead) === 'Paused',
  ).length
  const completedSequences = leads.filter(
    (lead) => getFollowUpSequenceStatus(lead) === 'Completed',
  ).length
  const repliedLeads = leads.filter(hasLeadReplied).length
  const smsReplies = leads.filter(hasLeadSmsReplied).length
  const totalReplies = repliedLeads + smsReplies
  const repliedStageLeads = leads.filter(hasAnyLeadReply).length
  const smsSent = leads.filter((lead) => Boolean(lead.last_sms_sent_at)).length
  const replyRate = calculatePercentage(repliedStageLeads, total)
  const emailReplyRate = calculatePercentage(repliedLeads, total)
  const smsReplyRate = calculatePercentage(smsReplies, smsSent)
  const sequenceLeads = leads.filter(
    (lead) => getFollowUpSequenceStatus(lead) !== 'Not started',
  ).length
  const noReplySequences = leads.filter(
    (lead) =>
      getFollowUpSequenceStatus(lead) !== 'Not started' && !hasAnyLeadReply(lead),
  ).length
  const sequenceReplies = leads.filter(
    (lead) =>
      getFollowUpSequenceStatus(lead) !== 'Not started' && hasAnyLeadReply(lead),
  ).length
  const sequenceReplyRate = calculatePercentage(sequenceReplies, sequenceLeads)
  const bestServiceType = getBestConversionLabel(
    serviceTypeCounts,
    serviceTypeBookedCounts,
  )
  const bestLeadSource = getBestLeadSource(leadSourceCounts, leadSourceBookedCounts)
  const highestIntentLeadCount = leads.filter((lead) => getLeadScore(lead) >= 75).length
  const averageReplyMs =
    replyDurationsMs.length > 0
      ? Math.round(
          replyDurationsMs.reduce((totalMs, durationMs) => totalMs + durationMs, 0) /
            replyDurationsMs.length,
        )
      : null
  const highestConvertingChannel =
    emailReplyRate === 0 && smsReplyRate === 0
      ? '-'
      : emailReplyRate >= smsReplyRate
        ? `Email (${emailReplyRate}%)`
        : `SMS (${smsReplyRate}%)`

  return {
    kpiCards: [
      { label: 'Total Leads', value: total },
      { label: 'Hot Leads', value: temperatureCounts.HOT },
      { label: 'Booked Calls', value: booked },
      { label: 'Email Replies', value: repliedLeads },
      { label: 'SMS Replies', value: smsReplies },
      { label: 'Total Replies', value: totalReplies },
      { label: 'Active Sequences', value: activeSequences },
      { label: 'Paused Sequences', value: pausedSequences },
      { label: 'Completed Sequences', value: completedSequences },
      { label: 'Average Lead Score', value: averageLeadScore },
      { label: 'Booking Rate', value: `${calculatePercentage(booked, total)}%` },
      { label: 'Reply Rate', value: `${replyRate}%` },
      { label: 'Avg Close Probability', value: `${averageCloseProbability}%` },
      { label: 'High Close Probability', value: highCloseProbabilityLeads },
      { label: 'Objection Risk Leads', value: leadsWithObjectionRisk },
    ],
    qualificationRate: calculatePercentage(qualified, total),
    bookingRate: calculatePercentage(booked, total),
    closeRate: calculatePercentage(closed, total),
    replyRate,
    smsReplyRate,
    funnelStages: [
      { label: 'Lead Captured', count: total, conversionFromPrevious: null },
      {
        label: 'Replied',
        count: repliedStageLeads,
        conversionFromPrevious: calculatePercentage(repliedStageLeads, total),
      },
      {
        label: 'Booked',
        count: booked,
        conversionFromPrevious: calculatePercentage(booked, repliedStageLeads),
      },
      {
        label: 'Closed',
        count: closed,
        conversionFromPrevious: calculatePercentage(closed, booked),
      },
    ],
    sequencePerformance: [
      { label: 'Active sequences', value: activeSequences },
      { label: 'Paused sequences', value: pausedSequences },
      { label: 'Completed sequences', value: completedSequences },
      { label: 'No reply sequences', value: noReplySequences },
      { label: 'Reply rate from sequences', value: `${sequenceReplyRate}%` },
    ],
    channelPerformance: [
      { label: 'Email reply count', value: repliedLeads },
      { label: 'SMS reply count', value: smsReplies },
      { label: 'Combined reply count', value: totalReplies },
      { label: 'Email reply rate', value: `${emailReplyRate}%` },
      { label: 'SMS reply rate', value: `${smsReplyRate}%` },
    ],
    topInsights: [
      { label: 'Best performing service type', value: bestServiceType },
      { label: 'Best performing lead source', value: bestLeadSource },
      {
        label: 'Highest converting follow-up channel',
        value: highestConvertingChannel,
      },
      {
        label: 'Average time to reply',
        value: averageReplyMs === null ? '-' : formatDuration(averageReplyMs),
      },
      { label: 'Highest intent lead count', value: String(highestIntentLeadCount) },
      {
        label: 'Average close probability',
        value: `${averageCloseProbability}%`,
      },
      {
        label: 'Leads with objection risk',
        value: String(leadsWithObjectionRisk),
      },
    ],
    temperatureCounts,
    leadsOverTime: buildLeadsOverTimeData(leadsByDate, timeRange),
    bookedCallsOverTime: buildCountOverTimeData(
      bookedCallsByDate,
      timeRange,
      'bookedCalls',
    ),
    repliesOverTime: buildRepliesOverTimeData(
      repliesByDate,
      smsRepliesByDate,
      timeRange,
    ),
    temperatureChartData: temperatureOptions.map((temperature) => ({
      temperature,
      leads: temperatureCounts[temperature],
    })),
    leadSourceChartData: Array.from(leadSourceCounts.entries())
      .map(([leadSource, count]) => ({ leadSource, leads: count }))
      .sort((first, second) => second.leads - first.leads),
    statusChartData: statusOptions.map((status) => ({
      status,
      leads: statusCounts[status],
    })),
    serviceTypeChartData: Array.from(serviceTypeCounts.entries())
      .map(([serviceType, count]) => ({ serviceType, leads: count }))
      .sort((first, second) => second.leads - first.leads),
    scoreDistributionData: Array.from(scoreDistributionCounts.entries()).map(
      ([scoreRange, count]) => ({ scoreRange, leads: count }),
    ),
    sequenceStatusChartData: followUpSequenceStatusOptions.map((status) => ({
      status,
      leads: sequenceStatusCounts[status],
    })),
  }
}

function isLeadInTimeRange(lead: Lead, timeRange: TimeRange) {
  console.log('selectedPerformanceWindow', timeRange)

  if (timeRange === 'All Time') {
    console.log('lead.created_at', lead.created_at)
    console.log('parsed Date value', 'not required for All Time')
    console.log('cutoff Date value', 'none')
    console.log('passes performance window filter', true)

    return true
  }

  if (typeof lead.created_at !== 'string' || lead.created_at.length === 0) {
    console.log('lead.created_at', lead.created_at)
    console.log('parsed Date value', 'invalid')
    console.log('cutoff Date value', 'not evaluated')
    console.log('passes performance window filter', false)

    return false
  }

  const parsedDate = parseSupabaseTimestamp(lead.created_at)
  const parsedDateForLog = parsedDate ?? 'invalid'
  const leadTime = parsedDate?.getTime() ?? Number.NaN

  if (Number.isNaN(leadTime)) {
    console.log('lead.created_at', lead.created_at)
    console.log('parsed Date value', parsedDateForLog)
    console.log('cutoff Date value', 'not evaluated')
    console.log('passes performance window filter', false)

    return false
  }

  const start = new Date()

  if (timeRange === 'Today') {
    start.setHours(0, 0, 0, 0)
  } else if (timeRange === 'Last 7 days') {
    start.setDate(start.getDate() - 7)
    start.setHours(0, 0, 0, 0)
  } else if (timeRange === 'Last 30 days') {
    start.setDate(start.getDate() - 30)
    start.setHours(0, 0, 0, 0)
  }

  const cutoffTime = start.getTime()
  const passesFilter = leadTime >= cutoffTime

  console.log('lead.created_at', lead.created_at)
  console.log('parsed Date value', parsedDateForLog)
  console.log('cutoff Date value', start)
  console.log('passes performance window filter', passesFilter)

  return passesFilter
}

function buildLeadsOverTimeData(
  leadsByDate: Map<string, number>,
  timeRange: TimeRange,
) {
  if (timeRange === 'All Time') {
    return Array.from(leadsByDate.entries())
      .sort(
        ([firstDate], [secondDate]) =>
          new Date(`${firstDate}T00:00:00`).getTime() -
          new Date(`${secondDate}T00:00:00`).getTime(),
      )
      .map(([dateKey, leads]) => ({
        label: formatChartDateLabel(dateKey),
        leads,
      }))
  }

  const dayCount =
    timeRange === 'Today' ? 1 : timeRange === 'Last 7 days' ? 8 : 31
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (dayCount - 1))

  return Array.from({ length: dayCount }, (_item, index) => {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + index)
    const dateKey = getTorontoDateKey(currentDate)

    return {
      label: formatChartDateLabel(dateKey),
      leads: leadsByDate.get(dateKey) ?? 0,
    }
  })
}

function buildCountOverTimeData(
  countsByDate: Map<string, number>,
  timeRange: TimeRange,
  valueKey: 'bookedCalls',
): Array<{ label: string; bookedCalls: number }> {
  if (timeRange === 'All Time') {
    return Array.from(countsByDate.entries())
      .sort(
        ([firstDate], [secondDate]) =>
          new Date(`${firstDate}T00:00:00`).getTime() -
          new Date(`${secondDate}T00:00:00`).getTime(),
      )
      .map(([dateKey, count]) => ({
        label: formatChartDateLabel(dateKey),
        [valueKey]: count,
      })) as Array<{ label: string; bookedCalls: number }>
  }

  const dayCount =
    timeRange === 'Today' ? 1 : timeRange === 'Last 7 days' ? 8 : 31
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (dayCount - 1))

  return Array.from({ length: dayCount }, (_item, index) => {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + index)
    const dateKey = getTorontoDateKey(currentDate)

    return {
      label: formatChartDateLabel(dateKey),
      [valueKey]: countsByDate.get(dateKey) ?? 0,
    }
  }) as Array<{ label: string; bookedCalls: number }>
}

function buildRepliesOverTimeData(
  repliesByDate: Map<string, number>,
  smsRepliesByDate: Map<string, number>,
  timeRange: TimeRange,
) {
  if (timeRange === 'All Time') {
    const dateKeys = new Set([
      ...Array.from(repliesByDate.keys()),
      ...Array.from(smsRepliesByDate.keys()),
    ])

    return Array.from(dateKeys)
      .sort(
        (firstDate, secondDate) =>
          new Date(`${firstDate}T00:00:00`).getTime() -
          new Date(`${secondDate}T00:00:00`).getTime(),
      )
      .map((dateKey) => ({
        label: formatChartDateLabel(dateKey),
        replies: repliesByDate.get(dateKey) ?? 0,
        smsReplies: smsRepliesByDate.get(dateKey) ?? 0,
      }))
  }

  const dayCount =
    timeRange === 'Today' ? 1 : timeRange === 'Last 7 days' ? 8 : 31
  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (dayCount - 1))

  return Array.from({ length: dayCount }, (_item, index) => {
    const currentDate = new Date(startDate)
    currentDate.setDate(startDate.getDate() + index)
    const dateKey = getTorontoDateKey(currentDate)

    return {
      label: formatChartDateLabel(dateKey),
      replies: repliesByDate.get(dateKey) ?? 0,
      smsReplies: smsRepliesByDate.get(dateKey) ?? 0,
    }
  })
}

function getBestLeadSource(
  leadSourceCounts: Map<string, number>,
  leadSourceBookedCounts: Map<string, number>,
) {
  return getBestConversionLabel(leadSourceCounts, leadSourceBookedCounts)
}

function getBestConversionLabel(
  totalCounts: Map<string, number>,
  convertedCounts: Map<string, number>,
) {
  const [bestLabel, bestTotal] = Array.from(totalCounts.entries()).sort(
    ([firstLabel, firstTotal], [secondLabel, secondTotal]) => {
      const firstRate = (convertedCounts.get(firstLabel) ?? 0) / firstTotal
      const secondRate = (convertedCounts.get(secondLabel) ?? 0) / secondTotal

      return secondRate - firstRate || secondTotal - firstTotal
    },
  )[0] ?? ['-', 0]

  if (bestLabel === '-' || bestTotal === 0) {
    return '-'
  }

  const conversionRate = calculatePercentage(
    convertedCounts.get(bestLabel) ?? 0,
    bestTotal,
  )

  return `${bestLabel} (${conversionRate}%)`
}

function hasAnyLeadReply(lead: Lead) {
  return hasLeadReplied(lead) || hasLeadSmsReplied(lead)
}

function hasAiObjectionRisk(lead: Lead) {
  return (
    typeof lead.ai_objection_risk === 'string' &&
    lead.ai_objection_risk.trim().length > 0 &&
    lead.ai_objection_risk !== 'No major objection risk detected yet.'
  )
}

function getEarliestReplyDate(lead: Lead) {
  const replyDates = [lead.replied_at, lead.last_sms_reply_at]
    .map(parseSupabaseTimestamp)
    .filter((date): date is Date => date !== null)
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime())

  return replyDates[0] ?? null
}

function formatDuration(durationMs: number) {
  const totalMinutes = Math.max(1, Math.round(durationMs / 60000))
  const days = Math.floor(totalMinutes / 1440)
  const hours = Math.floor((totalMinutes % 1440) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) {
    return `${days}d ${hours}h`
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }

  return `${minutes}m`
}

function calculatePercentage(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0
  }

  return Math.round((numerator / denominator) * 100)
}

function getDateKey(value: unknown) {
  const date = parseSupabaseTimestamp(value)

  if (!date) {
    return null
  }

  return getTorontoDateKey(date)
}

function getTorontoDateKey(date: Date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const valueByType = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  return `${valueByType.year}-${valueByType.month}-${valueByType.day}`
}

function isPendingFollowUp(lead: Lead) {
  return getFollowUpStatus(lead) === 'Pending'
}

function isFollowUpDueToday(lead: Lead) {
  const followUpDate = parseSupabaseTimestamp(lead.follow_up_at)

  return (
    isPendingFollowUp(lead) &&
    followUpDate !== null &&
    getTorontoDateKey(followUpDate) === getTorontoDateKey(new Date())
  )
}

function isFollowUpOverdue(lead: Lead) {
  const followUpDate = parseSupabaseTimestamp(lead.follow_up_at)

  return (
    isPendingFollowUp(lead) &&
    followUpDate !== null &&
    followUpDate.getTime() < Date.now()
  )
}

function isFollowUpAfterToday(lead: Lead) {
  const followUpDate = parseSupabaseTimestamp(lead.follow_up_at)

  return (
    isPendingFollowUp(lead) &&
    followUpDate !== null &&
    getTorontoDateKey(followUpDate) > getTorontoDateKey(new Date())
  )
}

function getFollowUpDisplayLabel(lead: Lead) {
  const status = getFollowUpStatus(lead)

  if (status === 'Not set') {
    return '-'
  }

  if (status === 'Completed' || status === 'Snoozed') {
    return status
  }

  if (status === 'Pending' && isFollowUpOverdue(lead)) {
    return 'Overdue'
  }

  if (status === 'Pending' && isFollowUpDueToday(lead)) {
    return 'Due Today'
  }

  if (status === 'Pending' && isFollowUpAfterToday(lead)) {
    return 'Upcoming'
  }

  return '-'
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

function getAppointmentStatus(lead: Lead) {
  return getValidAppointmentStatus(
    typeof lead.appointment_status === 'string' ? lead.appointment_status : '',
  )
}

function getValidAppointmentStatus(status: string) {
  return appointmentStatusOptions.includes(
    status as (typeof appointmentStatusOptions)[number],
  )
    ? status
    : 'Not booked'
}

function getFollowUpStatus(lead: Lead) {
  return getValidFollowUpStatus(
    typeof lead.follow_up_status === 'string' ? lead.follow_up_status : '',
  )
}

function getValidFollowUpStatus(status: string) {
  return followUpStatusOptions.includes(
    status as (typeof followUpStatusOptions)[number],
  )
    ? status
    : 'Not set'
}

function getReplyStatus(lead: Lead) {
  const status = typeof lead.reply_status === 'string' ? lead.reply_status.trim() : ''

  return status || 'No reply'
}

function hasLeadReplied(lead: Lead) {
  return getReplyStatus(lead) === 'Replied'
}

function getSmsReplyStatus(lead: Lead) {
  const status =
    typeof lead.sms_reply_status === 'string' ? lead.sms_reply_status.trim() : ''

  if (status) {
    return status
  }

  if (lead.last_sms_reply_at) {
    return 'Replied'
  }

  if (lead.last_sms_sent_at) {
    return 'Pending'
  }

  return 'No SMS'
}

function hasLeadSmsReplied(lead: Lead) {
  const status = getSmsReplyStatus(lead).toLowerCase()

  return status === 'replied' || Boolean(lead.last_sms_reply_at)
}

function isSmsPending(lead: Lead) {
  const status = getSmsReplyStatus(lead).toLowerCase()

  return (
    status === 'pending' ||
    status === 'sent' ||
    (Boolean(lead.last_sms_sent_at) && !hasLeadSmsReplied(lead))
  )
}

function getFollowUpType(lead: Lead) {
  return getValidFollowUpType(
    typeof lead.follow_up_type === 'string' ? lead.follow_up_type : '',
  )
}

function getValidFollowUpType(type: string) {
  return followUpTypeOptions.includes(type as (typeof followUpTypeOptions)[number])
    ? type
    : 'Call'
}

function getFollowUpSequenceStatus(lead: Lead) {
  return getValidFollowUpSequenceStatus(
    typeof lead.follow_up_sequence_status === 'string'
      ? lead.follow_up_sequence_status
      : '',
  )
}

function getValidFollowUpSequenceStatus(status: string) {
  return followUpSequenceStatusOptions.includes(
    status as (typeof followUpSequenceStatusOptions)[number],
  )
    ? status
    : 'Not started'
}

function getNextSequenceStep(lead: Lead) {
  return getValidNextSequenceStep(
    typeof lead.next_sequence_step === 'string' ? lead.next_sequence_step : '',
  )
}

function getValidNextSequenceStep(step: string) {
  return sequenceStepValues.includes(step as (typeof sequenceStepValues)[number])
    ? step
    : 'Initial follow-up'
}

function buildSequencePayload(
  lead: Lead,
  sequence: {
    sequenceStatus?: string
    nextSequenceStep?: string
    messageLog?: string
    markSent?: boolean
    sentVia?: 'manual' | 'n8n'
  },
  updatedAt: string,
) {
  const sequenceStatus = getValidFollowUpSequenceStatus(
    sequence.sequenceStatus ?? getFollowUpSequenceStatus(lead),
  )
  const nextSequenceStep = getValidNextSequenceStep(
    sequence.nextSequenceStep ?? getNextSequenceStep(lead),
  )
  const messageLog =
    sequence.messageLog ??
    (typeof lead.follow_up_message_log === 'string'
      ? lead.follow_up_message_log
      : '')

  if (!sequence.markSent) {
    return {
      follow_up_sequence_status: sequenceStatus,
      next_sequence_step: nextSequenceStep,
      follow_up_message_log: messageLog,
      updated_at: updatedAt,
    }
  }

  const advancedStep = getAdvancedSequenceStep(nextSequenceStep)
  const sentAction = sequence.sentVia === 'n8n' ? 'Sent' : 'Marked'
  const sentSuffix = sequence.sentVia === 'n8n' ? ' via n8n' : ''
  const sentLine = `[${formatTorontoDate(updatedAt)}] ${sentAction} ${nextSequenceStep} as sent${sentSuffix}`
  const nextMessageLog = messageLog.trim()
    ? `${messageLog.trim()}\n${sentLine}`
    : sentLine

  return {
    follow_up_sequence_status:
      advancedStep === 'Completed' ? 'Completed' : sequenceStatus,
    last_follow_up_sent_at: updatedAt,
    next_sequence_step: advancedStep,
    follow_up_message_log: nextMessageLog,
    updated_at: updatedAt,
  }
}

function getAdvancedSequenceStep(step: string) {
  if (step === 'Initial follow-up') {
    return '24-hour reminder'
  }

  if (step === '24-hour reminder') {
    return '3-day reminder'
  }

  if (step === '3-day reminder') {
    return 'Final check-in'
  }

  return 'Completed'
}

function canSendCurrentSequenceStep(lead: Lead) {
  const hasContact =
    (typeof lead.email === 'string' && lead.email.trim().length > 0) ||
    (typeof lead.phone === 'string' && lead.phone.trim().length > 0)
  const nextSequenceStep = getNextSequenceStep(lead)

  return (
    getFollowUpSequenceStatus(lead) === 'Active' &&
    sequenceStepOptions.includes(
      nextSequenceStep as (typeof sequenceStepOptions)[number],
    ) &&
    hasContact
  )
}

function hasLeadPhone(lead: Lead) {
  return typeof lead.phone === 'string' && lead.phone.trim().length > 0
}

function canSendSmsFollowUp(lead: Lead) {
  return hasLeadPhone(lead) && Boolean(N8N_SMS_WEBHOOK_URL)
}

function buildSequenceWebhookPayload(lead: Lead) {
  return {
    lead_id: lead.id ?? null,
    name: lead.name ?? null,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    business_name: lead.business_name ?? null,
    service_type: lead.service_type ?? null,
    lead_source: lead.lead_source ?? null,
    response_speed: lead.response_speed ?? null,
    calendly_url: lead.calendly_url ?? null,
    booking_link: lead.calendly_url ?? null,
    lead_score: getLeadScore(lead),
    lead_temperature: getLeadTemperature(lead),
    ai_summary: lead.ai_summary ?? null,
    ai_recommendation: lead.ai_recommendation ?? null,
    next_sequence_step: getNextSequenceStep(lead),
    follow_up_sequence_status: getFollowUpSequenceStatus(lead),
    follow_up_notes: lead.follow_up_notes ?? null,
    appointment_status: getAppointmentStatus(lead),
    status: getLeadStatus(lead),
  }
}

function buildSmsWebhookPayload(lead: Lead) {
  return {
    lead_id: lead.id ?? null,
    name: lead.name ?? null,
    phone: lead.phone ?? null,
    email: lead.email ?? null,
    business_name: lead.business_name ?? null,
    service_type: lead.service_type ?? null,
    booking_link: lead.calendly_url ?? null,
    calendly_url: lead.calendly_url ?? null,
    next_sequence_step: getNextSequenceStep(lead),
    lead_score: getLeadScore(lead),
    lead_temperature: getLeadTemperature(lead),
    sms_reply_status: getSmsReplyStatus(lead),
  }
}

function calculateLeadScore(lead: Lead) {
  let score = 20
  const reasons = ['Base score +20']
  const addScore = (points: number, reason: string) => {
    score += points
    reasons.push(`${reason} ${points > 0 ? '+' : ''}${points}`)
  }

  const serviceType =
    typeof lead.service_type === 'string'
      ? lead.service_type.trim().toLowerCase()
      : ''
  if (serviceType.includes('hvac')) {
    addScore(10, 'HVAC service')
  } else if (serviceType.includes('plumbing')) {
    addScore(10, 'Plumbing service')
  } else if (serviceType.includes('electrical')) {
    addScore(8, 'Electrical service')
  }

  if (lead.lead_source === 'Mostly phone calls') {
    addScore(10, 'Phone call lead source')
  } else if (lead.lead_source === 'Mostly website forms') {
    addScore(15, 'Website form lead source')
  } else if (lead.lead_source === 'Both calls and forms') {
    addScore(20, 'Calls and forms lead source')
  }

  if (lead.response_speed === 'Frequently') {
    addScore(25, 'Frequent response speed')
  } else if (lead.response_speed === 'Sometimes') {
    addScore(12, 'Occasional response speed')
  }

  const submissionCount = lead.submission_count ?? 0
  if (submissionCount >= 3) {
    addScore(25, 'Three or more submissions')
  } else if (submissionCount >= 2) {
    addScore(15, 'Repeat submission')
  }

  const status = getLeadStatus(lead)
  if (status === 'Contacted') {
    addScore(5, 'Contacted CRM status')
  } else if (status === 'Qualified') {
    addScore(20, 'Qualified CRM status')
  } else if (status === 'Booked') {
    addScore(35, 'Booked CRM status')
  } else if (status === 'Closed') {
    addScore(50, 'Closed CRM status')
  } else if (status === 'Lost') {
    addScore(-30, 'Lost CRM status')
  }

  const appointmentStatus = getAppointmentStatus(lead)
  if (appointmentStatus === 'Booked') {
    addScore(35, 'Booked appointment')
  } else if (appointmentStatus === 'Completed') {
    addScore(45, 'Completed appointment')
  } else if (appointmentStatus === 'Cancelled') {
    addScore(-10, 'Cancelled appointment')
  } else if (appointmentStatus === 'No-show') {
    addScore(-15, 'Appointment no-show')
  }

  const followUpStatus = getFollowUpStatus(lead)
  if (followUpStatus === 'Completed') {
    addScore(10, 'Completed follow-up')
  } else if (isFollowUpOverdue(lead)) {
    addScore(-10, 'Overdue follow-up')
  } else if (followUpStatus === 'Pending') {
    addScore(5, 'Pending follow-up')
  }

  const clampedScore = Math.min(100, Math.max(0, score))
  const temperature =
    clampedScore >= 75 ? 'HOT' : clampedScore >= 45 ? 'WARM' : 'COLD'

  return {
    score: clampedScore,
    temperature,
    reason: reasons.join('; '),
  }
}

function getLeadScorePayload(lead: Lead) {
  const { score, temperature, reason } = calculateLeadScore(lead)

  return {
    lead_score: score,
    lead_temperature: temperature,
    lead_score_reason: reason,
  }
}

function applyLeadScore(lead: Lead) {
  return {
    ...lead,
    ...getLeadScorePayload(lead),
  }
}

function getLeadScore(lead: Lead) {
  return calculateLeadScore(lead).score
}

function getLeadScoreReason(lead: Lead) {
  return calculateLeadScore(lead).reason
}

function isLeadInScoreRange(lead: Lead, scoreRange: string) {
  const score = getLeadScore(lead)

  if (scoreRange === '75+') {
    return score >= 75
  }

  if (scoreRange === '45-74') {
    return score >= 45 && score < 75
  }

  if (scoreRange === 'Under 45') {
    return score < 45
  }

  return true
}

function generateAiQualificationPlaceholder(lead: Lead) {
  const temperature = getLeadTemperature(lead)
  const serviceType = getReadableLeadField(lead.service_type, 'service')
  const leadSource = getReadableLeadField(lead.lead_source, 'unknown sources')
  const responseSpeed = getReadableLeadField(
    lead.response_speed,
    'an unknown cadence',
  )
  const recommendationByTemperature = {
    HOT: 'Prioritize immediate follow-up and push toward booking.',
    WARM: 'Follow up within 24 hours and qualify pain points.',
    COLD: 'Nurture lightly and revisit if they engage again.',
  }
  const summary = `This lead appears to be a ${temperature} ${serviceType} prospect. They report leads coming from ${leadSource.toLowerCase()} and respond ${responseSpeed}, suggesting ${getAutomationFitDescription(
    temperature,
  )} for automation.`

  return {
    summary,
    recommendation:
      recommendationByTemperature[
        temperature as keyof typeof recommendationByTemperature
      ],
  }
}

function generateAiLeadInsightsPlaceholder(lead: Lead) {
  const score = getLeadScore(lead)
  const temperature = getLeadTemperature(lead)

  if (score >= 75) {
    return {
      closeProbability: getRuleBasedCloseProbability(score, 70, 90),
      objectionRisk: getRuleBasedObjectionRisk(lead),
      suggestedResponse: getSuggestedResponseByTemperature(temperature),
      nextBestAction: 'Prioritize immediate follow-up and push toward booking.',
    }
  }

  if (score >= 45) {
    return {
      closeProbability: getRuleBasedCloseProbability(score, 40, 70),
      objectionRisk: getRuleBasedObjectionRisk(lead),
      suggestedResponse: getSuggestedResponseByTemperature(temperature),
      nextBestAction:
        'Follow up with a specific audit angle and qualify pain points.',
    }
  }

  return {
    closeProbability: getRuleBasedCloseProbability(score, 10, 40),
    objectionRisk: getRuleBasedObjectionRisk(lead),
    suggestedResponse: getSuggestedResponseByTemperature(temperature),
    nextBestAction: 'Nurture lightly and wait for stronger engagement.',
  }
}

function getRuleBasedCloseProbability(score: number, minimum: number, maximum: number) {
  const boundedScore = Math.min(100, Math.max(0, score))
  const probability =
    minimum + Math.round((boundedScore / 100) * (maximum - minimum))

  return Math.min(maximum, Math.max(minimum, probability))
}

function getRuleBasedObjectionRisk(lead: Lead) {
  if (lead.response_speed === 'Rarely / Never') {
    return 'Low urgency / may not view follow-up speed as a priority.'
  }

  if (getLeadStatus(lead) === 'Lost') {
    return 'Lead may not see enough immediate value.'
  }

  if (getAppointmentStatus(lead) === 'No-show') {
    return 'Commitment risk / may need softer re-engagement.'
  }

  if (getReplyStatus(lead) === 'No reply' && getSmsReplyStatus(lead) === 'No reply') {
    return 'Unresponsive so far.'
  }

  return 'No major objection risk detected yet.'
}

function getSuggestedResponseByTemperature(temperature: string) {
  if (temperature === 'HOT') {
    return 'You look like a strong fit. Want to book a quick audit so we can map the fastest follow-up wins?'
  }

  if (temperature === 'WARM') {
    return 'I can share a quick audit angle for where leads may be slipping through. What is the biggest follow-up gap right now?'
  }

  return 'No rush. I can send a few practical ways to tighten lead follow-up when timing makes sense.'
}

function getReadableLeadField(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : fallback
}

function getAutomationFitDescription(temperature: string) {
  if (temperature === 'HOT') {
    return 'a strong fit'
  }

  if (temperature === 'WARM') {
    return 'a moderate fit'
  }

  return 'a lighter fit'
}

function syncLeadScores(leads: Lead[]) {
  void Promise.allSettled(
    leads.map(async (lead) => {
      const scorePayload = getLeadScorePayload(lead)
      const hasCurrentScore =
        lead.lead_score === scorePayload.lead_score &&
        lead.lead_temperature === scorePayload.lead_temperature &&
        lead.lead_score_reason === scorePayload.lead_score_reason

      if (hasCurrentScore) {
        return
      }

      const query = supabase.from('leads').update(scorePayload)

      if (lead.id !== undefined && lead.id !== null) {
        await query.eq('id', lead.id)
      } else if (lead.email) {
        await query.eq('email', lead.email)
      }
    }),
  )
}

function getLeadTemperature(lead: Lead) {
  return calculateLeadScore(lead).temperature
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

function parseSupabaseTimestamp(timestamp: unknown) {
  if (typeof timestamp !== 'string' || timestamp.trim().length === 0) {
    return null
  }

  const normalizedTimestamp = timestamp.trim().replace(' ', 'T')
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalizedTimestamp)
  const timestampToParse = hasTimezone
    ? normalizedTimestamp
    : `${normalizedTimestamp}Z`
  const date = new Date(timestampToParse)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

function parseAppointmentFieldsInput({
  bookedAtDate,
  bookedAtHour,
  bookedAtMinute,
  bookedAtPeriod,
}: {
  bookedAtDate: string
  bookedAtHour: string
  bookedAtMinute: string
  bookedAtPeriod: string
}) {
  return parseTorontoDateTimeFields({
    date: bookedAtDate,
    hour: bookedAtHour,
    minute: bookedAtMinute,
    period: bookedAtPeriod,
  })
}

function parseTorontoDateTimeFields({
  date: dateValue,
  hour: hourValue,
  minute: minuteValue,
  period: periodValue,
}: {
  date: string
  hour: string
  minute: string
  period: string
}) {
  if (!dateValue) {
    return null
  }

  const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)

  if (!match) {
    return null
  }

  const hour = appointmentHourOptions.includes(
    hourValue as (typeof appointmentHourOptions)[number],
  )
    ? Number(hourValue)
    : 9
  const minute = appointmentMinuteOptions.includes(
    minuteValue as (typeof appointmentMinuteOptions)[number],
  )
    ? Number(minuteValue)
    : 0
  const period = appointmentPeriodOptions.includes(
    periodValue as (typeof appointmentPeriodOptions)[number],
  )
    ? periodValue
    : 'AM'
  const hour24 =
    period === 'AM' ? (hour === 12 ? 0 : hour) : hour === 12 ? 12 : hour + 12
  const [, year, month, day] = match
  const wallTimeAsUtc = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    hour24,
    minute,
  )
  const offset = getTimeZoneOffsetMs(
    'America/Toronto',
    new Date(wallTimeAsUtc),
  )
  const date = new Date(wallTimeAsUtc - offset)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

function formatAppointmentFields(timestamp: unknown) {
  const date = parseSupabaseTimestamp(timestamp)

  if (!date) {
    return {
      date: '',
      hour: '09',
      minute: '00',
      period: 'AM',
    }
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Toronto',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const valueByType = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )
  const hour24 = Number(valueByType.hour)
  const hour12 = hour24 % 12 || 12

  return {
    date: `${valueByType.year}-${valueByType.month}-${valueByType.day}`,
    hour: String(hour12).padStart(2, '0'),
    minute: appointmentMinuteOptions.includes(
      valueByType.minute as (typeof appointmentMinuteOptions)[number],
    )
      ? valueByType.minute
      : '00',
    period: hour24 >= 12 ? 'PM' : 'AM',
  }
}

function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const valueByType = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )
  const zonedTimeAsUtc = Date.UTC(
    Number(valueByType.year),
    Number(valueByType.month) - 1,
    Number(valueByType.day),
    Number(valueByType.hour),
    Number(valueByType.minute),
    Number(valueByType.second),
  )

  return zonedTimeAsUtc - date.getTime()
}

function formatTorontoDate(timestamp: unknown) {
  const date = parseSupabaseTimestamp(timestamp)

  if (!date) {
    return '-'
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Toronto',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
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
