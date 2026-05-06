const GA_MEASUREMENT_ID = 'G-ZLHR0R1E7S'
const GA_SCRIPT_ID = 'ga4-script'

type GtagCommand =
  | ['js', Date]
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?]

declare global {
  interface Window {
    dataLayer?: IArguments[]
    gtag?: (...args: GtagCommand) => void
  }
}

let isInitialized = false

const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (!isInitialized) {
    initializeGoogleAnalytics()
  }

  if (!window.gtag) {
    return
  }

  window.gtag('event', eventName, parameters)
  console.log(`GA4 event fired: ${eventName}`)
}

export const initializeGoogleAnalytics = () => {
  if (isInitialized) {
    return
  }

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag(..._args: GtagCommand) {
    window.dataLayer?.push(arguments)
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GA_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: true,
  })
  isInitialized = true
  console.log('GA4 initialized')
}

export const trackLead = () => {
  trackEvent('Lead')
}

export const trackHotLead = () => {
  trackEvent('HotLead')
}

export const trackRepeatLead = () => {
  trackEvent('RepeatLead')
}

export const trackCalendlyClick = () => {
  trackEvent('CalendlyClick')
}

export const trackFormStarted = () => {
  trackEvent('FormStarted')
}

export const trackFormCompleted = () => {
  trackEvent('FormCompleted')
}
