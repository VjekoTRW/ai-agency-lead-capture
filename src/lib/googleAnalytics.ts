const GA_MEASUREMENT_ID = 'G-ZLHR0R1E7S'
const GA_SCRIPT_ID = 'ga4-script'

type GtagCommand =
  | ['js', Date]
  | ['config', string, Record<string, unknown>?]
  | ['event', string, Record<string, unknown>?]

declare global {
  interface Window {
    dataLayer?: GtagCommand[]
    gtag?: (...args: GtagCommand) => void
  }
}

let isInitialized = false

const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  window.gtag?.('event', eventName, parameters)
}

export const initializeGoogleAnalytics = () => {
  if (isInitialized) {
    return
  }

  isInitialized = true
  window.dataLayer = window.dataLayer ?? []
  window.gtag =
    window.gtag ??
    function gtag(...args: GtagCommand) {
      window.dataLayer?.push(args)
    }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GA_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    document.head.appendChild(script)
  }

  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false })
  trackEvent('page_view', {
    page_location: window.location.href,
    page_path: window.location.pathname,
    page_title: document.title,
  })
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
