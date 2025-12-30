'use client';

import Layout from "@/components/layout";
import Link from "next/link";
import { ScopeExamples } from "@/components/scopescan/ScopeExamples";
import { 
  Camera, 
  Sparkles, 
  Clock, 
  Target, 
  ArrowRight,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * ScopeScan Marketing Landing Page
 * Professional marketing page for ScopeScan - no camera/upload UI
 * Links to /m/create for actual tool usage
 */
export default function ScopeScanPage() {
  const benefits = [
    {
      icon: Sparkles,
      title: "AI-Powered Analysis",
      description: "Photos are automatically analyzed to identify scope items, materials, and labor needs.",
    },
    {
      icon: Clock,
      title: "Save 2+ Hours Per Estimate",
      description: "Skip manual measurements. Get accurate line items in minutes, not hours.",
    },
    {
      icon: Target,
      title: "Never Miss a Detail",
      description: "Our AI catches what you might overlook—from trim work to fixtures.",
    },
  ];

  const howItWorks = [
    { step: "1", title: "Snap Photos", description: "Take 6-10 photos of the job site" },
    { step: "2", title: "AI Analyzes", description: "Vision AI extracts scope items" },
    { step: "3", title: "Review & Send", description: "Edit pricing, then send proposal" },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-slate-50 py-12 sm:py-16 lg:py-20" data-testid="scopescan-hero">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-12 sm:px-10 sm:py-16">
            {/* Subtle top glow */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-orange-200/50 blur-3xl"
            />

            <div className="relative text-center">
              <div className="mb-4 flex justify-center">
                <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                  ScopeScan
                </span>
              </div>

              <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-sm mb-6">
                <Camera className="w-8 h-8 text-white" />
              </div>

              <h1
                className="text-balance text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-4 leading-tight text-slate-900"
                data-testid="scopescan-headline"
              >
                Turn Job Site Photos Into Detailed Proposals
              </h1>

              <p
                className="text-lg sm:text-xl text-slate-600 mb-8 max-w-2xl mx-auto"
                data-testid="scopescan-subheadline"
              >
                ScopeScan uses AI to analyze your photos and generate accurate scope items,
                material lists, and pricing—all in minutes.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/sign-in?redirect_url=%2Fm%2Fcreate" data-testid="cta-start-scopescan">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto h-14 px-8 text-lg bg-orange-500 hover:bg-orange-600 shadow-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    Start ScopeScan
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/scopescan/demo" data-testid="cta-try-demo">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto h-14 px-8 text-lg border-slate-300 text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Try Demo
                  </Button>
                </Link>
              </div>

              {/* Trust / benefit strip */}
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
                <span className="inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  Demo available instantly
                </span>
                <span className="inline-flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Sign in required for full tool
                </span>
                <span className="inline-flex items-center gap-2">
                  <Target className="w-4 h-4 text-slate-400" />
                  Built for fast quoting on-site
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-3">
                Why Contractors Love ScopeScan
              </h2>
              <p className="text-slate-600 max-w-xl mx-auto">
                Stop spending hours writing proposals. Let AI do the heavy lifting.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="bg-slate-50 rounded-xl p-6 border border-slate-100"
                  data-testid={`benefit-card-${index + 1}`}
                >
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-orange-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{benefit.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ScopeExamples />

      {/* How It Works */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-3">
                How ScopeScan Works
              </h2>
              <p className="text-slate-600">
                Three simple steps to a professional proposal.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-3 gap-8">
              {howItWorks.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="w-14 h-14 rounded-full bg-orange-500 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-2">{item.title}</h3>
                  <p className="text-slate-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Strip */}
      <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-sm px-6 py-10 sm:px-10 sm:py-12 text-center">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Ready to save hours on every estimate?
            </h2>
            <p className="text-slate-600 mb-8 max-w-lg mx-auto">
              Join hundreds of contractors using ScopeScan to close more deals, faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/sign-in?redirect_url=%2Fm%2Fcreate" data-testid="cta-final-start-scopescan">
                <Button
                  size="lg"
                  className="h-14 px-10 text-lg bg-orange-500 hover:bg-orange-600 shadow-sm focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start ScopeScan
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/scopescan/demo" data-testid="cta-final-try-demo">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 px-10 text-lg border-slate-300 text-slate-900 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Try Demo First
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500 mt-4">
              Demo available instantly • Sign in for full tool
            </p>
          </div>
        </div>
      </section>
    </Layout>
  );
}
