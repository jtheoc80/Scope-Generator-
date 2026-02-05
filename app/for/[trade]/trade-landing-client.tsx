'use client';

import Link from "next/link";
import LayoutWrapper from "@/components/layout-wrapper";
import { 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  FileCheck, 
  Shield, 
  Star, 
  MapPin, 
  HelpCircle, 
  BookOpen, 
  Lightbulb, 
  ChevronDown,
  Bath,
  ChefHat,
  Home as HomeIcon,
  Paintbrush,
  Plug,
  Wrench,
  Thermometer,
  TreePine,
  Hammer,
  Square,
  Grid3X3,
  Fence,
  Layers
} from "lucide-react";
import type { TradeData, CityData } from "@/lib/trade-data";

interface TradeLandingPageClientProps {
  trade: TradeData;
  tradeSlug: string;
  supportsCities?: boolean;
  cities?: Record<string, CityData>;
}

// Map trade slugs to icons
const tradeIcons: Record<string, React.ElementType> = {
  bathroom: Bath,
  kitchen: ChefHat,
  roofing: HomeIcon,
  painting: Paintbrush,
  electrical: Plug,
  plumbing: Wrench,
  hvac: Thermometer,
  landscaping: TreePine,
  flooring: Grid3X3,
  siding: Layers,
  drywall: Square,
  windows: Grid3X3,
  deck: Hammer,
  fence: Fence,
  concrete: Square,
  tile: Grid3X3,
  cabinet: Square,
};

export default function TradeLandingPageClient({ 
  trade, 
  tradeSlug, 
  supportsCities,
  cities 
}: TradeLandingPageClientProps) {
  const TradeIcon = tradeIcons[trade.slug] || Hammer;

  return (
    <LayoutWrapper>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <TradeIcon className="w-4 h-4" />
              {trade.name} Contractors
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight mb-6">
              {trade.heroTitle}
            </h1>
            
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              {trade.heroSubtitle}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/app?trade=${trade.slug}`}
                className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-secondary text-slate-900 font-bold text-lg hover:bg-secondary/90 transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
              >
                Create {trade.name} Proposal
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a 
                href="#features" 
                className="inline-flex items-center justify-center h-14 px-8 rounded-md border border-slate-700 bg-slate-800/50 text-white font-medium hover:bg-slate-800 transition-colors"
              >
                See What&apos;s Included
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Why Use ScopeGen for {trade.name} Proposals?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop spending hours writing proposals by hand. Our {trade.name.toLowerCase()} templates include everything you need.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {trade.benefits.map((benefit, index) => (
              <div key={index} className="bg-slate-50 rounded-lg p-6 border border-slate-100">
                <CheckCircle2 className="w-8 h-8 text-green-500 mb-4" />
                <p className="text-slate-700 font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
            <div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-6">
                {trade.name} Proposal Templates
              </h2>
              <p className="text-muted-foreground mb-8">
                Our {trade.name.toLowerCase()} proposal generator includes pre-built templates for the most common project types. Just select your options and get a professional scope of work instantly.
              </p>
              
              <ul className="space-y-4">
                {trade.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <FileCheck className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-8">
                <Link 
                  href={`/app?trade=${trade.slug}`}
                  className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
                >
                  Try These Templates Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
              <div className="text-sm text-muted-foreground mb-2">Typical Project Range</div>
              <div className="text-3xl font-heading font-bold text-slate-900 mb-6">{trade.priceRange}</div>
              
              <div className="text-sm font-medium text-slate-700 mb-3">Common Projects:</div>
              <div className="flex flex-wrap gap-2">
                {trade.commonProjects.map((project, index) => (
                  <span key={index} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm">
                    {project}
                  </span>
                ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>2 min to create</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Warranty included</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className="w-6 h-6 fill-secondary text-secondary" />
              ))}
            </div>
            
            <blockquote className="text-xl sm:text-2xl text-slate-900 font-medium mb-6 leading-relaxed">
              &quot;{trade.testimonialQuote}&quot;
            </blockquote>
            
            <div>
              <div className="font-bold text-slate-900">{trade.testimonialAuthor}</div>
              <div className="text-muted-foreground">{trade.testimonialBusiness}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Create Your {trade.name} Proposal in 3 Steps
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Select Project Type", desc: `Choose from our ${trade.name.toLowerCase()} templates and customize options` },
              { step: "2", title: "Add Client Details", desc: "Enter your client's name, address, and project specifics" },
              { step: "3", title: "Send Professional Proposal", desc: "Download, email, or share your proposal with a link" }
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 bg-secondary rounded-full flex items-center justify-center text-2xl font-heading font-bold text-slate-900 shadow-lg mx-auto mb-4 border-4 border-white">
                  {item.step}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Content Sections */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-heading font-bold text-slate-900">
                    {trade.seoContent.writeProposalTitle}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {trade.seoContent.writeProposalContent}
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-8 border border-slate-100">
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-heading font-bold text-slate-900">
                    {trade.seoContent.estimateTitle}
                  </h2>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {trade.seoContent.estimateContent}
                </p>
              </div>
            </div>
            
            <div className="bg-primary/5 rounded-xl p-8 border border-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <Lightbulb className="w-6 h-6 text-secondary" />
                <h2 className="text-xl font-heading font-bold text-slate-900">
                  {trade.seoContent.whyChooseTitle}
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {trade.seoContent.whyChooseContent}
              </p>
              <Link 
                href={`/app?trade=${trade.slug}`}
                className="inline-flex items-center text-primary font-semibold hover:underline"
              >
                Try ScopeGen Free Today
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <HelpCircle className="w-4 h-4" />
                Frequently Asked Questions
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
                Common Questions About {trade.name} Proposals
              </h2>
              <p className="text-muted-foreground">
                Get answers to the questions contractors ask most about creating professional proposals.
              </p>
            </div>
            
            <div className="space-y-4">
              {trade.faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                >
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-slate-50 transition-colors list-none">
                      <h3 className="font-semibold text-slate-900 text-left pr-4">
                        {faq.question}
                      </h3>
                      <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* City-specific Links (if trade supports cities) */}
      {supportsCities && cities && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                {trade.name} Services by Location
              </h2>
              <p className="text-muted-foreground">
                Find {trade.name.toLowerCase()} proposal templates tailored for your city.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {Object.entries(cities).map(([citySlug, cityInfo]) => (
                <Link
                  key={citySlug}
                  href={`/for/${tradeSlug}/${citySlug}`}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors"
                >
                  <MapPin className="w-3 h-3" />
                  {cityInfo.name}, {cityInfo.state}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related Trades Section */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
              Explore Other Trade Proposals
            </h2>
          </div>
          <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
            {[
              { slug: "bathroom-remodeling", name: "Bathroom Remodeling" },
              { slug: "kitchen-remodeling", name: "Kitchen Remodeling" },
              { slug: "roofing", name: "Roofing" },
              { slug: "hvac", name: "HVAC" },
              { slug: "plumbing", name: "Plumbing" },
              { slug: "electrical", name: "Electrical" },
              { slug: "painting", name: "Painting" },
              { slug: "landscaping", name: "Landscaping" },
            ]
              .filter(t => t.slug !== tradeSlug)
              .slice(0, 6)
              .map((t) => (
                <Link
                  key={t.slug}
                  href={`/for/${t.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-primary hover:bg-primary/5 rounded-full text-sm text-slate-700 transition-colors"
                >
                  {t.name}
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            Ready to Create Your First {trade.name} Proposal?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Join thousands of contractors who save hours every week with professional proposals.
          </p>
          <Link 
            href={`/app?trade=${trade.slug}`}
            className="inline-block bg-secondary text-slate-900 font-bold text-lg px-10 py-4 rounded-md hover:bg-white hover:text-primary transition-colors shadow-lg"
          >
            Start Now — It&apos;s Free to Preview
          </Link>
        </div>
      </section>
    </LayoutWrapper>
  );
}
