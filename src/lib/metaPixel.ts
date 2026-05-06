const META_PIXEL_ID = '4660723687533130'
const META_PIXEL_SCRIPT_ID = 'meta-pixel-script'

type FbqCommand =
  | ['init', string]
  | ['track', string, Record<string, unknown>?]
  | ['trackCustom', string, Record<string, unknown>?]

interface MetaPixelFunction {
  (...args: FbqCommand): void
  callMethod?: (...args: FbqCommand) => void
  push?: MetaPixelFunction
  loaded?: boolean
  version?: string
  queue?: FbqCommand[]
}

declare global {
  interface Window {
    fbq?: MetaPixelFunction
    _fbq?: MetaPixelFunction
  }
}

let isInitialized = false

const trackEvent = (
  eventType: 'track' | 'trackCustom',
  eventName: string,
  parameters?: Record<string, unknown>,
) => {
  window.fbq?.(eventType, eventName, parameters)
}

export const initializeMetaPixel = () => {
  if (isInitialized) {
    return
  }

  isInitialized = true

  if (!window.fbq) {
    const fbq: MetaPixelFunction = (...args: FbqCommand) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args)
      } else {
        fbq.queue?.push(args)
      }
    }

    fbq.push = fbq
    fbq.loaded = true
    fbq.version = '2.0'
    fbq.queue = []
    window.fbq = fbq
    window._fbq = fbq
  }

  if (!document.getElementById(META_PIXEL_SCRIPT_ID)) {
    const script = document.createElement('script')
    script.id = META_PIXEL_SCRIPT_ID
    script.async = true
    script.src = 'https://connect.facebook.net/en_US/fbevents.js'
    document.head.appendChild(script)
  }

  window.fbq('init', META_PIXEL_ID)
  trackEvent('track', 'PageView')
}

export const trackLead = () => {
  trackEvent('track', 'Lead')
}

export const trackHotLead = () => {
  trackEvent('trackCustom', 'HotLead')
}

export const trackRepeatLead = () => {
  trackEvent('trackCustom', 'RepeatLead')
}

export const trackCalendlyClick = () => {
  trackEvent('trackCustom', 'CalendlyClick')
}

export const trackFormStarted = () => {
  trackEvent('trackCustom', 'FormStarted')
}

export const trackFormCompleted = () => {
  trackEvent('trackCustom', 'FormCompleted')
}
