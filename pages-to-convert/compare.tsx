'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { ArrowRight, Check, X, Star, Clock, DollarSign, Zap, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CompetitorData {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  competitorDescription: string;
  targetAudience: string;
  pricing: string;
  limitations: string[];
  scopegenAdvantages: string[];
  featureComparison: {
    feature: string;
    scopegen: boolean | string;
    competitor: boolean | string;
  }[];
}

export const competitors: Record<string, CompetitorData> = {
  "jobnimbus": {
    slug: "jobnimbus",
    name: "JobNimbus",
    title: "ScopeGen vs JobNimbus | Better Proposal Software for Contractors",
    metaDescription: "Compare ScopeGen vs JobNimbus for contractor proposals. See why contractors choose ScopeGen for faster, more professional scope of work generation.",
    heroTitle: "ScopeGen vs JobNimbus",
    heroSubtitle: "Looking for a JobNimbus alternative? See how ScopeGen delivers faster proposals with less complexity.",
    competitorDescription: "JobNimbus is a full CRM and project management platform designed primarily for roofing contractors.",
    targetAudience: "Roofing contractors needing full CRM",
    pricing: "$200+/month",
    limitations: [
      "Complex setup requires significant training",
      "Proposal templates are basic and generic",
      "Overkill for contractors who just need proposals",
      "Expensive monthly subscription",
      "Steep learning curve for new users"
    ],
    scopegenAdvantages: [
      "Create professional proposals in under 5 minutes",
      "Trade-specific templates with detailed scope language",
      "No complex setup or training required",
      "Affordable pricing for small contractors",
      "Focus on what matters: winning more jobs"
    ],
    featureComparison: [
      { feature: "Professional Proposals", scopegen: true, competitor: true },
      { feature: "Trade-Specific Templates", scopegen: true, competitor: false },
      { feature: "Scope of Work Generation", scopegen: "Instant AI-powered", competitor: "Manual entry" },
      { feature: "Setup Time", scopegen: "5 minutes", competitor: "Days/Weeks" },
      { feature: "Learning Curve", scopegen: "None", competitor: "Steep" },
      { feature: "Mobile Friendly", scopegen: true, competitor: true },
      { feature: "Free Preview", scopegen: true, competitor: false },
      { feature: "Starting Price", scopegen: "$29/mo", competitor: "$200+/mo" }
    ]
  },
  "buildbook": {
    slug: "buildbook",
    name: "Buildbook",
    title: "ScopeGen vs Buildbook | Faster Contractor Proposal Software",
    metaDescription: "Compare ScopeGen vs Buildbook for contractor proposals. ScopeGen offers faster proposal generation with trade-specific templates and simpler pricing.",
    heroTitle: "ScopeGen vs Buildbook",
    heroSubtitle: "Need an alternative to Buildbook? ScopeGen gets you from estimate to proposal in minutes, not hours.",
    competitorDescription: "Buildbook is a project management and client communication platform for residential contractors and remodelers.",
    targetAudience: "Residential remodelers and builders",
    pricing: "$99-299/month",
    limitations: [
      "Focuses on project management over proposals",
      "Generic proposal templates",
      "Monthly cost adds up for small operations",
      "Requires time to set up properly",
      "Better suited for larger teams"
    ],
    scopegenAdvantages: [
      "Purpose-built for proposal generation",
      "Pre-written scope language for 9+ trades",
      "No project management complexity",
      "Simple, transparent pricing",
      "Perfect for solo contractors and small teams"
    ],
    featureComparison: [
      { feature: "Professional Proposals", scopegen: true, competitor: true },
      { feature: "Trade-Specific Templates", scopegen: true, competitor: false },
      { feature: "Scope of Work Generation", scopegen: "Instant", competitor: "Manual" },
      { feature: "Client Portal", scopegen: true, competitor: true },
      { feature: "Setup Time", scopegen: "5 minutes", competitor: "Hours" },
      { feature: "Free Preview", scopegen: true, competitor: false },
      { feature: "Starting Price", scopegen: "$29/mo", competitor: "$99/mo" }
    ]
  },
  "joist": {
    slug: "joist",
    name: "Joist",
    title: "ScopeGen vs Joist | Professional Proposal Generator for Contractors",
    metaDescription: "Compare ScopeGen vs Joist for contractor estimates and proposals. See why ScopeGen's trade-specific templates win more jobs.",
    heroTitle: "ScopeGen vs Joist",
    heroSubtitle: "Considering Joist alternatives? ScopeGen offers more professional proposals with detailed scope of work included.",
    competitorDescription: "Joist is an estimating and invoicing app popular with contractors for quick estimates and payments.",
    targetAudience: "General contractors needing estimates",
    pricing: "$19.99-49.99/month",
    limitations: [
      "Estimates are basic line items only",
      "No detailed scope of work language",
      "Proposals look generic",
      "Limited customization options",
      "No trade-specific templates"
    ],
    scopegenAdvantages: [
      "Full scope of work with professional language",
      "Pre-built templates for 9 contractor trades",
      "Proposals that impress clients",
      "Include warranties, exclusions, and terms",
      "Stand out from competitors"
    ],
    featureComparison: [
      { feature: "Line Item Estimates", scopegen: true, competitor: true },
      { feature: "Detailed Scope of Work", scopegen: true, competitor: false },
      { feature: "Trade-Specific Templates", scopegen: true, competitor: false },
      { feature: "Professional Formatting", scopegen: "Premium", competitor: "Basic" },
      { feature: "Warranty Language", scopegen: true, competitor: false },
      { feature: "Mobile App", scopegen: "Web-based", competitor: true },
      { feature: "Free Preview", scopegen: true, competitor: false },
      { feature: "Starting Price", scopegen: "$29/mo", competitor: "$19.99/mo" }
    ]
  },
  "houzz-pro": {
    slug: "houzz-pro",
    name: "Houzz Pro",
    title: "ScopeGen vs Houzz Pro | Better Proposal Software for Contractors",
    metaDescription: "Compare ScopeGen vs Houzz Pro for contractor proposals. Get faster proposals without the lead generation fees.",
    heroTitle: "ScopeGen vs Houzz Pro",
    heroSubtitle: "Looking for a Houzz Pro alternative for proposals? ScopeGen focuses on what you need: professional proposals, fast.",
    competitorDescription: "Houzz Pro is a marketing and business management platform that includes lead generation and proposal tools.",
    targetAudience: "Home improvement professionals",
    pricing: "$65-999/month",
    limitations: [
      "Expensive monthly fees plus lead costs",
      "Proposal tools are secondary feature",
      "Tied to Houzz lead generation ecosystem",
      "Generic templates across trades",
      "Complex platform with many unused features"
    ],
    scopegenAdvantages: [
      "Proposal-focused with no lead generation fees",
      "Trade-specific scope templates",
      "Use your own leads, your own clients",
      "Simple pricing, no hidden costs",
      "Get proposals done in minutes"
    ],
    featureComparison: [
      { feature: "Professional Proposals", scopegen: true, competitor: true },
      { feature: "Trade-Specific Templates", scopegen: true, competitor: false },
      { feature: "Lead Generation", scopegen: "Not included", competitor: "Paid extra" },
      { feature: "Scope of Work", scopegen: "Detailed", competitor: "Basic" },
      { feature: "Setup Time", scopegen: "5 minutes", competitor: "Hours" },
      { feature: "Free Preview", scopegen: true, competitor: false },
      { feature: "Starting Price", scopegen: "$29/mo", competitor: "$65/mo" }
    ]
  },
  "companycam": {
    slug: "companycam",
    name: "CompanyCam",
    title: "ScopeGen vs CompanyCam | Proposal Software Comparison",
    metaDescription: "Compare ScopeGen vs CompanyCam for contractor proposals. While CompanyCam excels at photos, ScopeGen wins at professional proposals.",
    heroTitle: "ScopeGen vs CompanyCam",
    heroSubtitle: "CompanyCam is great for photos, but you need professional proposals. That's where ScopeGen comes in.",
    competitorDescription: "CompanyCam is a photo documentation and communication app designed for contractors to capture and share job site photos.",
    targetAudience: "Contractors needing photo documentation",
    pricing: "$19-49/user/month",
    limitations: [
      "Photo-focused, not proposal-focused",
      "No scope of work generation",
      "Proposals require separate tool",
      "Per-user pricing adds up",
      "Doesn't replace proposal software"
    ],
    scopegenAdvantages: [
      "Purpose-built for proposals",
      "Complete scope of work included",
      "Trade-specific professional templates",
      "Works alongside your photo tools",
      "Simple flat-rate pricing"
    ],
    featureComparison: [
      { feature: "Photo Documentation", scopegen: false, competitor: true },
      { feature: "Professional Proposals", scopegen: true, competitor: false },
      { feature: "Scope of Work", scopegen: true, competitor: false },
      { feature: "Trade-Specific Templates", scopegen: true, competitor: false },
      { feature: "Team Communication", scopegen: false, competitor: true },
      { feature: "Free Preview", scopegen: true, competitor: false },
      { feature: "Starting Price", scopegen: "$29/mo", competitor: "$19/user/mo" }
    ]
  },
  "housecall-pro": {
    slug: "housecall-pro",
    name: "Housecall Pro",
    title: "ScopeGen vs Housecall Pro | Contractor Proposal Comparison",
    metaDescription: "Compare ScopeGen vs Housecall Pro for contractor proposals. See why ScopeGen's focused approach wins for proposal generation.",
    heroTitle: "ScopeGen vs Housecall Pro",
    heroSubtitle: "Need proposals without the full field service management suite? ScopeGen delivers professional proposals without the complexity.",
    competitorDescription: "Housecall Pro is a field service management platform with scheduling, dispatching, invoicing, and basic proposal features.",
    targetAudience: "Service contractors (HVAC, plumbing, electrical)",
    pricing: "$65-169/month",
    limitations: [
      "Proposal feature is basic add-on",
      "Generic templates across all trades",
      "Complex system for simple needs",
      "Expensive for proposal-only use",
      "No detailed scope language"
    ],
    scopegenAdvantages: [
      "Proposals are the main feature",
      "Trade-specific detailed scopes",
      "No scheduling/dispatching overhead",
      "Affordable standalone pricing",
      "Professional results in minutes"
    ],
    featureComparison: [
      { feature: "Professional Proposals", scopegen: true, competitor: true },
      { feature: "Trade-Specific Templates", scopegen: true, competitor: false },
      { feature: "Detailed Scope of Work", scopegen: true, competitor: false },
      { feature: "Scheduling/Dispatch", scopegen: false, competitor: true },
      { feature: "Setup Time", scopegen: "5 minutes", competitor: "Days" },
      { feature: "Free Preview", scopegen: true, competitor: false },
      { feature: "Starting Price", scopegen: "$29/mo", competitor: "$65/mo" }
    ]
  }
};

export const competitorSlugs = Object.keys(competitors);

interface ComparePageProps {
  competitorSlug: string;
}

export default function ComparePage({ competitorSlug }: ComparePageProps) {
  const data = competitors[competitorSlug];

  useEffect(() => {
    if (data) {
      document.title = data.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", data.metaDescription);
      }
    }
  }, [data]);

  if (!data) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Comparison not found</h1>
          <Link href="/">
            <Button className="mt-4">Go Home</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 text-orange-400 px-4 py-2 rounded-full text-sm mb-6">
              <Star className="h-4 w-4" />
              Comparison Guide
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-6" data-testid="compare-hero-title">
              {data.heroTitle}
            </h1>
            <p className="text-xl text-slate-300 mb-8" data-testid="compare-hero-subtitle">
              {data.heroSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="compare-cta-try">
                  Try ScopeGen Free <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="bg-slate-50 rounded-xl p-8 border border-slate-200">
                <h3 className="text-xl font-bold text-slate-900 mb-4">{data.name}</h3>
                <p className="text-slate-600 mb-4">{data.competitorDescription}</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Target:</span> {data.targetAudience}</p>
                  <p><span className="font-semibold">Pricing:</span> {data.pricing}</p>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-8 border-2 border-orange-300">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-orange-500" />
                  <h3 className="text-xl font-bold text-slate-900">ScopeGen</h3>
                </div>
                <p className="text-slate-600 mb-4">Purpose-built proposal generator for contractors. Create professional scopes of work in minutes, not hours.</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Target:</span> All contractor trades</p>
                  <p><span className="font-semibold">Pricing:</span> Free preview, $29/mo Pro</p>
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-display font-bold text-center mb-8">Feature Comparison</h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-16">
              <table className="w-full" data-testid="compare-feature-table">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left py-4 px-6 font-semibold text-slate-900">Feature</th>
                    <th className="text-center py-4 px-6 font-semibold text-orange-600">ScopeGen</th>
                    <th className="text-center py-4 px-6 font-semibold text-slate-600">{data.name}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.featureComparison.map((row, i) => (
                    <tr key={i} className="border-t border-slate-100">
                      <td className="py-4 px-6 text-slate-700">{row.feature}</td>
                      <td className="py-4 px-6 text-center">
                        {typeof row.scopegen === "boolean" ? (
                          row.scopegen ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-orange-600 font-medium">{row.scopegen}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {typeof row.competitor === "boolean" ? (
                          row.competitor ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <X className="h-5 w-5 text-slate-300 mx-auto" />
                          )
                        ) : (
                          <span className="text-slate-600">{row.competitor}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <X className="h-5 w-5 text-red-500" />
                  {data.name} Limitations
                </h3>
                <ul className="space-y-3">
                  {data.limitations.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600">
                      <X className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  Why Contractors Choose ScopeGen
                </h3>
                <ul className="space-y-3">
                  {data.scopegenAdvantages.map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-600">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold mb-4">Ready to try ScopeGen?</h2>
            <p className="text-lg text-slate-600 mb-8">
              See the difference for yourself. Create your first professional proposal in under 5 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/app">
                <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-white gap-2" data-testid="compare-bottom-cta">
                  Create Free Proposal <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">Compare ScopeGen to Other Tools</h3>
            <div className="flex flex-wrap justify-center gap-3">
              {competitorSlugs.filter(s => s !== competitorSlug).map(slug => (
                <Link key={slug} href={`/compare/${slug}`}>
                  <Button variant="outline" size="sm" data-testid={`compare-link-${slug}`}>
                    vs {competitors[slug].name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
