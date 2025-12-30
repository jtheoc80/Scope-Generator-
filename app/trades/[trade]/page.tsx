import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Layout from "@/components/layout";
import {
  getTradeDefinition,
  tradeDefinitions,
  type TradeKey,
} from "@/lib/trades/tradeDefinitions";
import { ArrowRight, CheckCircle2, PlusCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ trade: string }>;
}

export async function generateStaticParams(): Promise<
  Array<{ trade: TradeKey }>
> {
  return (Object.keys(tradeDefinitions) as TradeKey[]).map((trade) => ({
    trade,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { trade: tradeParam } = await params;
  const def = getTradeDefinition(tradeParam);

  if (!def) {
    return {
      title: "Trade Not Found | ScopeGen",
    };
  }

  return {
    title: def.heroTitle,
    description: def.heroSubtitle,
    keywords: [
      `${def.name.toLowerCase()} proposal software`,
      `${def.name.toLowerCase()} contractor estimates`,
      `${def.name.toLowerCase()} proposal template`,
      "contractor proposal software",
      "construction proposal templates",
      "free contractor estimates",
    ],
    openGraph: {
      title: def.heroTitle,
      description: def.heroSubtitle,
      type: "website",
      url: `https://scopegenerator.com/trades/${def.key}`,
    },
    twitter: {
      card: "summary_large_image",
      title: def.heroTitle,
      description: def.heroSubtitle,
    },
    alternates: {
      canonical: `https://scopegenerator.com/trades/${def.key}`,
    },
  };
}

export default async function TradePage({ params }: PageProps) {
  const { trade: tradeParam } = await params;
  const def = getTradeDefinition(tradeParam);

  if (!def) notFound();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative bg-primary text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/30" />
        </div>
        <div className="container mx-auto px-4 py-16 md:py-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              {def.name} proposals
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight mb-6">
              {def.heroTitle}
            </h1>
            <p className="text-lg text-primary-foreground/70 max-w-2xl mb-8 leading-relaxed">
              {def.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={`/generator?trade=${def.key}`}
                className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-secondary text-secondary-foreground font-bold text-lg hover:bg-secondary/90 transition-all hover:scale-[1.02] shadow-[0_0_20px_rgba(249,115,22,0.25)]"
                data-testid="trade-cta"
              >
                {def.cta.label}
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a
                href="#included"
                className="inline-flex items-center justify-center h-14 px-8 rounded-md border border-border bg-primary/50 text-primary-foreground font-medium hover:bg-primary/70 transition-colors"
              >
                See What&apos;s Included
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* What's included */}
      <section id="included" className="py-14 bg-card">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
              What&apos;s included for {def.name.toLowerCase()}
            </h2>
            <p className="text-muted-foreground mb-8">
              Trade-specific defaults help you start in the right place — and
              keep your scope consistent.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {def.whatsIncluded.map((item) => (
                <div
                  key={item}
                  className="bg-accent rounded-lg p-5 border border-border flex gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div className="text-card-foreground">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-14 bg-accent">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground mb-4">
              Common add-ons
            </h2>
            <p className="text-muted-foreground mb-8">
              Add-ons are fast to include and keep your estimate aligned with
              the actual scope.
            </p>

            <div className="grid md:grid-cols-2 gap-4">
              {def.addOns.map((item) => (
                <div
                  key={item}
                  className="bg-card rounded-lg p-5 border border-border flex gap-3"
                >
                  <PlusCircle className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                  <div className="text-card-foreground">{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            Ready to generate a {def.name.toLowerCase()} proposal?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            We&apos;ll open the generator with {def.name.toLowerCase()}{" "}
            preselected so you can start immediately.
          </p>
          <Link
            href={`/generator?trade=${def.key}`}
            className="inline-flex items-center justify-center bg-secondary text-secondary-foreground font-bold text-lg px-10 py-4 rounded-md hover:bg-card hover:text-primary transition-colors shadow-lg"
            data-testid="trade-cta-footer"
          >
            {def.cta.label}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
