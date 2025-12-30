'use client';

import Layout from "@/components/layout";
import Link from "next/link";
import Image from "next/image";
import { 
  Camera, 
  Sparkles, 
  Clock, 
  Target, 
  ArrowRight,
  CheckCircle2,
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

  const exampleProjects = [
    { 
      src: "/scopescan-example-1.svg", 
      alt: "Bathroom remodel project analyzed by ScopeScan",
      label: "Bathroom Remodel",
      output: "Scope generated: 12 line items"
    },
    { 
      src: "/scopescan-example-2.svg", 
      alt: "Kitchen renovation project analyzed by ScopeScan",
      label: "Kitchen Renovation",
      output: "Scope generated: 18 line items"
    },
    { 
      src: "/scopescan-example-3.svg", 
      alt: "Roof replacement project analyzed by ScopeScan",
      label: "Roof Replacement",
      output: "Scope generated: 9 line items"
    },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden py-16 sm:py-24" data-testid="scopescan-hero">
        <div className="absolute inset-0 z-0 opacity-10 bg-gradient-to-br from-orange-500 to-amber-500" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-lg mb-6">
              <Camera className="w-8 h-8 text-white" />
            </div>
            
            <h1 
              className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold mb-4 leading-tight"
              data-testid="scopescan-headline"
            >
              Turn Job Site Photos Into Detailed Proposals
            </h1>
            
            <p 
              className="text-lg sm:text-xl text-slate-300 mb-8 max-w-2xl mx-auto"
              data-testid="scopescan-subheadline"
            >
              ScopeScan uses AI to analyze your photos and generate accurate scope items, 
              material lists, and pricing—all in minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/m/create" data-testid="cta-start-scopescan">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-lg bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start ScopeScan
                </Button>
              </Link>
              <Link href="#examples" data-testid="cta-see-examples">
                <Button 
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-14 px-8 text-lg border-slate-600 text-white hover:bg-slate-800"
                >
                  See Examples
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-slate-400 mt-4">
              No credit card required • First proposal free
            </p>
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

      {/* Proof Section - Real Projects */}
      <section id="examples" className="py-16 sm:py-20 bg-slate-50 border-y border-slate-100" data-testid="scopescan-proof-section">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-3">
                Real Projects Analyzed by ScopeScan
              </h2>
              <p className="text-slate-600">
                See how ScopeScan transforms job site photos into detailed scopes.
              </p>
            </div>
            
            <div 
              className="grid sm:grid-cols-3 gap-6"
              data-testid="example-projects-grid"
            >
              {exampleProjects.map((project, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-slate-200"
                >
                  {/* Photo Thumbnail */}
                  <div className="aspect-[4/3] relative bg-slate-100">
                    <Image
                      src={project.src}
                      alt={project.alt}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Output Preview */}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span className="font-medium text-slate-900">{project.label}</span>
                    </div>
                    <p className="text-sm text-slate-500">{project.output}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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
                  <div className="w-14 h-14 rounded-full bg-slate-900 text-white flex items-center justify-center text-2xl font-bold mx-auto mb-4">
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
      <section className="py-16 sm:py-20 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            Ready to save hours on every estimate?
          </h2>
          <p className="text-slate-300 mb-8 max-w-lg mx-auto">
            Join hundreds of contractors using ScopeScan to close more deals, faster.
          </p>
          <Link href="/m/create" data-testid="cta-final-start-scopescan">
            <Button 
              size="lg"
              className="h-14 px-10 text-lg bg-orange-500 hover:bg-orange-600 shadow-lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              Start ScopeScan Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
          <p className="text-sm text-slate-500 mt-4">
            No credit card required
          </p>
        </div>
      </section>
    </Layout>
  );
}
