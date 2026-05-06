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
let isInitializing = false
const pendingEvents: Array<['event', string, Record<string, unknown>?]> = []

const trackEvent = (eventName: string, parameters?: Record<string, unknown>) => {
  if (!isInitialized) {
    pendingEvents.push(['event', eventName, parameters])
    return
  }

  window.gtag?.('event', eventName, parameters)
  console.log(`GA4 event fired: ${eventName}`)
}

export const initializeGoogleAnalytics = () => {
  if (isInitialized || isInitializing) {
    return
  }

  isInitializing = true
  window.dataLayer = window.dataLayer ?? []
  window.gtag =
    window.gtag ??
    function gtag(...args: GtagCommand) {
      window.dataLayer?.push(args)
    }

  const completeInitialization = () => {
    if (isInitialized) {
      return
    }

    window.gtag?.('js', new Date())
    window.gtag?.('config', GA_MEASUREMENT_ID)
    isInitialized = true
    isInitializing = false
    console.log('GA4 initialized')

    while (pendingEvents.length > 0) {
      const [, eventName, parameters] = pendingEvents.shift()!
      trackEvent(eventName, parameters)
    }
  }

  const existingScript = document.getElementById(GA_SCRIPT_ID)

  if (existingScript) {
    completeInitialization()
    return
  }

  if (!document.getElementById(GA_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = GA_SCRIPT_ID
    script.async = true
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
    script.onload = completeInitialization
    script.onerror = () => {
      isInitializing = false
      console.error('GA4 script failed to load')
    }
    document.head.appendChild(script)
  }
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
