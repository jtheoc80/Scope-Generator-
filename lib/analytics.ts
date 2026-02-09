declare global {
  interface Window {
    gtag: (...args: unknown[]) => void;
    dataLayer: unknown[];
  }
}

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ??
  // Back-compat for Vite-era env naming (only works if exposed as NEXT_PUBLIC_*)
  process.env.NEXT_PUBLIC_VITE_GA_MEASUREMENT_ID;

export const initGA = () => {
  if (!GA_MEASUREMENT_ID) {
    console.warn('Google Analytics Measurement ID not found');
    return;
  }

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);
};

export const trackPageView = (url: string) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag('config', GA_MEASUREMENT_ID, { page_path: url });
};

export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Google Ads Conversion Tracking
const GOOGLE_ADS_CONVERSION_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL;

/**
 * Track a Google Ads purchase conversion
 * Call this after a successful Stripe checkout/purchase
 * @param transactionId - Optional transaction ID (e.g., Stripe session ID) for deduplication
 * @param value - Optional conversion value in dollars
 * @param currency - Currency code (defaults to USD)
 */
export const trackGoogleAdsConversion = (
  transactionId?: string,
  value?: number,
  currency: string = 'USD'
) => {
  if (!GOOGLE_ADS_CONVERSION_LABEL) {
    return;
  }

  if (!window.gtag) {
    console.warn('Google Ads conversion tracking: gtag not available');
    return;
  }

  window.gtag('event', 'conversion', {
    send_to: GOOGLE_ADS_CONVERSION_LABEL,
    transaction_id: transactionId || '',
    value: value,
    currency: currency,
  });
};