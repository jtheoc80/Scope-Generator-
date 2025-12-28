import { Metadata } from "next";
import { notFound } from "next/navigation";
import { tradeData, getTradeKeys, cityData, tradeSupportsCities } from "@/lib/trade-data";
import TradeLandingPageClient from "./trade-landing-client";

interface PageProps {
  params: Promise<{ trade: string }>;
}

// Generate static paths for all trades
export async function generateStaticParams() {
  return getTradeKeys().map((trade) => ({
    trade,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { trade: tradeSlug } = await params;
  const trade = tradeData[tradeSlug];

  if (!trade) {
    return {
      title: "Trade Not Found | ScopeGen",
    };
  }

  return {
    title: trade.title,
    description: trade.metaDescription,
    keywords: [
      `${trade.name.toLowerCase()} proposal software`,
      `${trade.name.toLowerCase()} contractor estimates`,
      `${trade.name.toLowerCase()} proposal template`,
      "contractor proposal software",
      "construction proposal templates",
      "free contractor estimates",
    ],
    openGraph: {
      title: trade.title,
      description: trade.metaDescription,
      type: "website",
      url: `https://scopegenerator.com/for/${tradeSlug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: trade.title,
      description: trade.metaDescription,
    },
    alternates: {
      canonical: `https://scopegenerator.com/for/${tradeSlug}`,
    },
  };
}

// Generate JSON-LD structured data
function generateJsonLd(tradeSlug: string) {
  const trade = tradeData[tradeSlug];
  if (!trade) return null;

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: trade.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const softwareStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `ScopeGen ${trade.name} Proposal Software`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to preview, paid plans for full features",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      ratingCount: "127",
      bestRating: "5",
    },
  };

  return { faqStructuredData, softwareStructuredData };
}

export default async function TradeLandingPage({ params }: PageProps) {
  const { trade: tradeSlug } = await params;
  const trade = tradeData[tradeSlug];

  if (!trade) {
    notFound();
  }

  const jsonLd = generateJsonLd(tradeSlug);
  const supportsCities = tradeSupportsCities(tradeSlug);

  return (
    <>
      {/* JSON-LD Structured Data */}
      {jsonLd && (
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd.faqStructuredData),
            }}
          />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(jsonLd.softwareStructuredData),
            }}
          />
        </>
      )}
      <TradeLandingPageClient 
        trade={trade} 
        tradeSlug={tradeSlug}
        supportsCities={supportsCities}
        cities={supportsCities ? cityData : undefined}
      />
    </>
  );
}
