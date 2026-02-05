import { Metadata } from "next";
import { notFound } from "next/navigation";
import { tradeData, getTradeKeys, cityData, cityKeys, tradeSupportsCities } from "@/lib/trade-data";
import CityTradeLandingClient from "./city-trade-landing-client";

interface PageProps {
  params: Promise<{ trade: string; city: string }>;
}

// Generate static paths for all trade + city combinations
export async function generateStaticParams() {
  const params: { trade: string; city: string }[] = [];
  
  for (const trade of getTradeKeys()) {
    if (tradeSupportsCities(trade)) {
      for (const city of cityKeys) {
        params.push({ trade, city });
      }
    }
  }
  
  return params;
}

// Force dynamic rendering to ensure QueryClientProvider is available
export const dynamic = 'force-dynamic';

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { trade: tradeSlug, city: citySlug } = await params;
  const trade = tradeData[tradeSlug];
  const city = cityData[citySlug];

  if (!trade || !city) {
    return {
      title: "Page Not Found | ScopeGen",
    };
  }

  const title = `${trade.name} Proposals in ${city.name}, ${city.state} | ScopeGen`;
  const description = `Create professional ${trade.name.toLowerCase()} proposals for ${city.name}, ${city.state} contractors. ${trade.metaDescription.split('. ').slice(1).join('. ')}`;

  return {
    title,
    description,
    keywords: [
      `${trade.name.toLowerCase()} proposal software ${city.name}`,
      `${trade.name.toLowerCase()} contractor ${city.name}`,
      `${trade.name.toLowerCase()} estimates ${city.state}`,
      `${city.name} contractor proposal software`,
      "construction proposal templates",
    ],
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://scopegenerator.com/for/${tradeSlug}/${citySlug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://scopegenerator.com/for/${tradeSlug}/${citySlug}`,
    },
  };
}

// Generate JSON-LD structured data
function generateJsonLd(tradeSlug: string, citySlug: string) {
  const trade = tradeData[tradeSlug];
  const city = cityData[citySlug];
  if (!trade || !city) return null;

  const faqStructuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: trade.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question.replace("contractor", `${city.name} contractor`),
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  const localBusinessStructuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `ScopeGen ${trade.name} Proposal Software`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    areaServed: {
      "@type": "City",
      name: city.name,
      containedInPlace: {
        "@type": "State",
        name: city.state,
      },
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to preview, paid plans for full features",
    },
  };

  return { faqStructuredData, localBusinessStructuredData };
}

export default async function CityTradeLandingPage({ params }: PageProps) {
  const { trade: tradeSlug, city: citySlug } = await params;
  const trade = tradeData[tradeSlug];
  const city = cityData[citySlug];

  // Return 404 if trade doesn't support cities or if trade/city doesn't exist
  if (!trade || !city || !tradeSupportsCities(tradeSlug)) {
    notFound();
  }

  const jsonLd = generateJsonLd(tradeSlug, citySlug);

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
              __html: JSON.stringify(jsonLd.localBusinessStructuredData),
            }}
          />
        </>
      )}
      <CityTradeLandingClient 
        trade={trade} 
        tradeSlug={tradeSlug}
        city={city}
        citySlug={citySlug}
        allCities={cityData}
      />
    </>
  );
}
