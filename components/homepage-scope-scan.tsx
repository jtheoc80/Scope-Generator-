"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  Camera, 
  Sparkles, 
  Clock, 
  Target, 
  ArrowRight,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Marketing-focused ScopeScan section for the homepage.
 * Highlights the value proposition and links to the actual ScopeScan tool.
 */
export function HomepageScopeScan() {
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
      src: "/images/scopescan/projects/bathroom-real.jpg", 
      alt: "Bathroom remodel project analyzed by ScopeScan",
      label: "Bathroom Remodel" 
    },
    { 
      src: "/images/scopescan/projects/kitchen-real.jpg", 
      alt: "Kitchen renovation project analyzed by ScopeScan",
      label: "Kitchen Renovation" 
    },
    { 
      src: "/images/scopescan/projects/roof-real.jpg", 
      alt: "Roof replacement project analyzed by ScopeScan",
      label: "Roof Replacement" 
    },
  ];

  return (
    <section 
      className="py-12 sm:py-16 lg:py-20 bg-gradient-to-br from-orange-50 to-amber-50 border-y border-orange-100" 
      data-testid="section-scope-scan"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-orange-500 rounded-2xl shadow-lg mb-4">
              <Camera className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h2 
              className="text-2xl sm:text-3xl lg:text-4xl font-heading font-bold text-slate-900 mb-3"
              data-testid="scope-scan-heading"
            >
              Turn Job Site Photos Into Detailed Proposals
            </h2>
            <p 
              className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto"
              data-testid="scope-scan-subheadline"
            >
              ScopeScan uses AI to analyze your photos and generate accurate scope items, 
              material lists, and pricing—all in minutes.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-3 gap-6 mb-10 sm:mb-14">
            {benefits.map((benefit, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-5 sm:p-6 shadow-sm border border-orange-100"
                data-testid={`benefit-${index + 1}`}
              >
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <benefit.icon className="w-5 h-5 text-orange-600" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{benefit.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>

          {/* Example Projects Gallery */}
          <div className="mb-10 sm:mb-14">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 text-center mb-6">
              Real Projects Analyzed by ScopeScan
            </h3>
            <div 
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
              data-testid="example-projects-grid"
            >
              {exampleProjects.map((project, index) => (
                <div 
                  key={index}
                  className="relative rounded-xl overflow-hidden bg-white shadow-sm border border-orange-100 group"
                >
                  <div className="aspect-[4/3] relative">
                    <Image
                      src={project.src}
                      alt={project.alt}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <span className="text-white text-sm font-medium flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                      {project.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-orange-100 mb-10 sm:mb-14">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 text-center mb-6">
              How ScopeScan Works
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {howItWorks.map((item, index) => (
                <div key={index} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl font-bold mb-3">
                    {item.step}
                  </div>
                  <h4 className="font-bold text-slate-900 mb-1">{item.title}</h4>
                  <p className="text-sm text-slate-600">{item.description}</p>
                  {index < howItWorks.length - 1 && (
                    <ArrowRight className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-300" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/scopescan/demo" data-testid="cta-try-scopescan">
                <Button 
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base sm:text-lg bg-orange-500 hover:bg-orange-600 shadow-lg hover:shadow-xl transition-all"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Try Demo
                </Button>
              </Link>
              <Link href="/sign-in?redirect_url=%2Fm%2Fcreate" data-testid="cta-start-scopescan">
                <Button 
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 sm:h-14 px-8 text-base sm:text-lg border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  <Camera className="w-5 h-5 mr-2" />
                  Start ScopeScan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
            <p className="text-sm text-slate-500 flex items-center justify-center gap-2">
              <Lock className="w-3 h-3" />
              Sign in required for full tool • Demo available instantly
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
