"use client";

import Link from "next/link";
import Image from "next/image";
import { Camera, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Small ScopeScan teaser section for the homepage.
 * Marketing-only - links to /scopescan landing page.
 * Does NOT include Take Photo / Upload Photo buttons.
 */
export function ScopeScanTeaser() {
  const thumbnails = [
    { src: "/images/scopescan/projects/bathroom-real.jpg", alt: "Bathroom analysis" },
    { src: "/images/scopescan/projects/kitchen-real.jpg", alt: "Kitchen analysis" },
    { src: "/images/scopescan/projects/roof-real.jpg", alt: "Roofing analysis" },
    { src: "/images/scopescan/hero.jpg", alt: "General project analysis" },
  ];

  return (
    <section 
      className="py-12 sm:py-16 bg-gradient-to-br from-slate-50 to-slate-100 border-y border-slate-200" 
      data-testid="section-scopescan-teaser"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <h2 
                  className="text-xl sm:text-2xl font-heading font-bold text-slate-900"
                  data-testid="scopescan-teaser-headline"
                >
                  ScopeScan: Photo → Proposal in Minutes
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-base max-w-lg">
                Snap a few job site photos, and our AI generates a detailed scope of work with pricing.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/scopescan/demo" data-testid="teaser-cta-primary">
                <Button className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Try Demo
                </Button>
              </Link>
              <Link href="/scopescan" data-testid="teaser-cta-secondary">
                <Button variant="outline" className="w-full sm:w-auto">
                  Learn More
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Thumbnails Row */}
          <div 
            className="grid grid-cols-4 gap-3 sm:gap-4"
            data-testid="scopescan-teaser-thumbnails"
          >
            {thumbnails.map((thumb, index) => (
              <div 
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden bg-white shadow-sm border border-slate-200"
              >
                <Image
                  src={thumb.src}
                  alt={thumb.alt}
                  fill
                  className="object-cover"
                />
                <div className="absolute bottom-1 right-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500 drop-shadow" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
