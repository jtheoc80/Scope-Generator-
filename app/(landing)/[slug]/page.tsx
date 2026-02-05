import { Metadata } from "next";
import { notFound } from "next/navigation";
import LayoutWrapper from "@/components/layout-wrapper";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Calculator, FileText, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLandingPageSlugs, getLandingPageBySlug } from "@/lib/landing-pages-data";
import { generateFAQSchema, generateBreadcrumbSchema, generateWebPageSchema } from "@/lib/seo/jsonld";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static paths for all landing pages
export async function generateStaticParams() {
  return getLandingPageSlugs().map((slug) => ({ slug }));
}

// Force dynamic rendering to ensure QueryClientProvider is available
// This prevents "No QueryClient set" errors during static generation
// The Layout component uses useAuth() which requires QueryClientProvider
export const dynamic = 'force-dynamic';

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const page = getLandingPageBySlug(slug);

  if (!page) {
    return {
      title: "Page Not Found | ScopeGen",
    };
  }

  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: [
      slug.replace(/-/g, " "),
      "contractor estimate",
      "proposal generator",
      "construction estimate",
      "free template",
    ],
    alternates: {
      canonical: `https://scopegenerator.com/${page.slug}`,
    },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url: `https://scopegenerator.com/${page.slug}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: page.metaTitle,
      description: page.metaDescription,
    },
  };
}

export default async function LandingPage({ params }: PageProps) {
  const { slug } = await params;
  const page = getLandingPageBySlug(slug);

  if (!page) {
    notFound();
  }

  // Generate structured data
  const faqSchema = generateFAQSchema(page.faqs);
  const breadcrumbs = generateBreadcrumbSchema([
    { name: "Home", url: "/" },
    { name: page.title, url: `/${page.slug}` },
  ]);
  const webPageSchema = generateWebPageSchema({
    name: page.title,
    description: page.metaDescription,
    url: `https://scopegenerator.com/${page.slug}`,
  });

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: page.title,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: page.metaDescription,
    url: `https://scopegenerator.com/${page.slug}`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to preview, paid plans for full features",
    },
  };

  return (
    <LayoutWrapper>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center">
                <FileText className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6">
              {page.h1}
            </h1>
            <p className="text-lg md:text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              {page.heroSubtitle}
            </p>
            {page.priceRange !== "Varies by project" && (
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full mb-8">
                <DollarSign className="w-5 h-5 text-orange-400" />
                <span className="text-orange-300 font-medium">Typical range: {page.priceRange}</span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={page.ctaUrl}>
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2 text-lg h-14 px-8">
                  {page.ctaText} <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/calculator">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 gap-2 text-lg h-14 px-8">
                  <Calculator className="w-5 h-5" /> Try Calculator First
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-6">
              What&apos;s Included in Your Estimate
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {page.content.whatIsIncluded.map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate md:prose-lg max-w-none">
              <p className="text-lg text-slate-700 leading-relaxed mb-8">
                {page.content.intro}
              </p>
              
              <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">
                Why Use a {page.title.replace("Free ", "")}?
              </h2>
              <p className="text-slate-700 leading-relaxed">
                {page.content.whyUseGenerator}
              </p>

              <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-4">
                How It Works
              </h2>
              <div className="grid gap-4">
                {page.content.howItWorks.map((step, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 bg-white rounded-lg border">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <span className="text-slate-700">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Common Projects Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-8">
              Common Project Price Ranges
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {page.content.commonProjects.map((project, index) => (
                <div key={index} className="p-5 bg-slate-50 rounded-xl border hover:border-orange-300 transition-colors">
                  <h3 className="font-semibold text-slate-900">{project.name}</h3>
                  <p className="text-orange-600 font-medium mt-1">{project.priceRange}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-500 mt-6">
              * Prices are national averages and may vary by region, materials selected, and project complexity.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display font-bold text-slate-900 mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {page.faqs.map((faq, index) => (
                <details key={index} className="bg-white rounded-xl border overflow-hidden group">
                  <summary className="px-6 py-4 cursor-pointer font-semibold text-slate-900 hover:bg-slate-50 transition-colors list-none flex items-center justify-between">
                    {faq.question}
                    <span className="text-slate-400 group-open:rotate-180 transition-transform ml-4">▼</span>
                  </summary>
                  <div className="px-6 pb-4 text-slate-600">
                    {faq.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related Pages Section */}
      <section className="py-12 bg-white border-t">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Related Tools & Templates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {page.relatedPages.map((relatedSlug) => {
                const relatedPage = getLandingPageBySlug(relatedSlug);
                if (!relatedPage) return null;
                return (
                  <Link 
                    key={relatedSlug} 
                    href={`/${relatedSlug}`}
                    className="p-4 bg-slate-50 rounded-lg border hover:border-orange-300 hover:bg-orange-50/50 transition-colors group"
                  >
                    <h3 className="font-semibold text-slate-900 group-hover:text-orange-600 transition-colors">
                      {relatedPage.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                      {relatedPage.heroSubtitle.substring(0, 80)}...
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-orange-500 to-orange-600">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-4">
            Ready to Create Your Estimate?
          </h2>
          <p className="text-orange-100 text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of contractors who save hours every week with professional estimate generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={page.ctaUrl}>
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 gap-2 text-lg h-14 px-8">
                {page.ctaText} <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/blog">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 gap-2 text-lg h-14 px-8">
                Read Contractor Tips
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </LayoutWrapper>
  );
}
