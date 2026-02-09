import Script from "next/script";

// Google Tag Manager container ID
// Env-var override supported; falls back to the hard-coded production container.
const GTM_ID =
  process.env.NEXT_PUBLIC_GTM_ID ?? "GTM-M7KNZBNP";

/**
 * GTM <head> script — place inside <head> in the root layout.
 * Loads the GTM container asynchronously via next/script.
 */
export function GoogleTagManagerScript() {
  if (!GTM_ID) return null;

  return (
    <Script id="gtm-head" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  );
}

/**
 * GTM <noscript> fallback — place immediately after the opening <body> tag
 * in the root layout so tracking works even when JS is disabled.
 */
export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  );
}
