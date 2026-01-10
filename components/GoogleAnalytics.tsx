import Script from "next/script";

// Primary source: Vercel/Next public env var.
// Fallback in production only: hard-coded GA4 Measurement ID to ensure tracking
// works even if env var isn't configured. In development, we skip tracking
// entirely if no env var is set to avoid polluting analytics.
const FALLBACK_PRODUCTION_GA_ID = "G-2S3Z6LCF7K";

const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? 
  (process.env.NODE_ENV === 'production' ? FALLBACK_PRODUCTION_GA_ID : undefined);

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_path: window.location.pathname
          });
        `}
      </Script>
    </>
  );
}
