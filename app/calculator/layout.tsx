import type { Metadata } from "next";
import { generateFAQSchema, generateBreadcrumbSchema } from "@/lib/seo/jsonld";

export const metadata: Metadata = {
  title: "Free Contractor Price Calculator 2025 - Instant Cost Estimates",
  description: "Get instant cost estimates for bathroom remodels, kitchen renovations, roofing, HVAC, plumbing, electrical, and 15+ more trades. Free contractor price calculator with regional pricing adjustments for all 50 states.",
  keywords: [
    "contractor price calculator",
    "remodeling cost estimate", 
    "construction cost calculator", 
    "home improvement costs", 
    "contractor pricing",
    "bathroom remodel cost",
    "kitchen renovation cost", 
    "roofing estimate",
    "hvac installation cost",
    "plumbing cost calculator",
    "electrical estimate",
    "flooring cost calculator",
  ],
  authors: [{ name: "ScopeGen" }],
  openGraph: {
    title: "Free Contractor Price Calculator 2025 - Instant Cost Estimates",
    description: "Get instant cost estimates for any remodeling or construction project. No signup required. Regional pricing for all 50 states.",
    url: "https://scopegenerator.com/calculator",
    type: "website",
    images: [
      {
        url: "/opengraph.jpg",
        width: 1200,
        height: 630,
        alt: "Free Contractor Price Calculator - Instant Cost Estimates",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Contractor Price Calculator 2025",
    description: "Get instant cost estimates for any remodeling or construction project. No signup required.",
    images: ["/opengraph.jpg"],
  },
  alternates: {
    canonical: "https://scopegenerator.com/calculator",
  },
};

// FAQ data for schema
const calculatorFAQs = [
  {
    question: "How accurate are these contractor price estimates?",
    answer: "Our estimates are based on national industry data and regional cost adjustments. They provide a solid ballpark range, but actual quotes from local contractors may vary based on specific project requirements, material choices, and labor rates in your area. Always get 2-3 professional quotes for your project."
  },
  {
    question: "What's included in the labor vs. materials breakdown?",
    answer: "Materials include all physical supplies needed for the job (fixtures, tiles, lumber, paint, etc.). Labor covers the cost of skilled tradespeople including installation, prep work, and cleanup. Some projects are more labor-intensive (like painting), while others have higher material costs (like window replacement)."
  },
  {
    question: "Why do prices vary so much by location?",
    answer: "Labor costs, material availability, permit requirements, and cost of living all vary significantly by region. For example, projects in California or New York typically cost 20-35% more than the national average, while states like Mississippi or Arkansas may be 15-20% lower."
  },
  {
    question: "How do I get an exact quote for my project?",
    answer: "Use our calculator for a ballpark estimate, then click 'Get a Professional Proposal' to create a detailed scope of work. You can share this with local contractors to get accurate, apples-to-apples quotes based on your specific requirements."
  },
  {
    question: "Can I embed this calculator on my website?",
    answer: "Yes! We encourage bloggers, home improvement sites, and contractor websites to embed this calculator. Use the embed code provided below the calculator. It's free to use and helps homeowners get quick estimates."
  },
];

export default function CalculatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Generate structured data
  const faqSchema = generateFAQSchema(calculatorFAQs);
  
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: "Calculator", url: "/calculator" },
  ]);

  // WebApplication schema specific to the calculator
  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Free Contractor Price Calculator",
    applicationCategory: "UtilityApplication",
    operatingSystem: "Web",
    description: "Free online calculator for estimating contractor and remodeling project costs. Includes regional pricing adjustments for all 50 US states.",
    url: "https://scopegenerator.com/calculator",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "17+ contractor trades supported",
      "Regional pricing for all 50 states",
      "Labor vs materials breakdown",
      "Project timeline estimates",
      "Embeddable widget available",
    ],
  };

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      {children}
    </>
  );
}
