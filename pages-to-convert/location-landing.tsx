'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Clock, DollarSign, FileCheck, MapPin, Shield, Star } from "lucide-react";

interface CityData {
  name: string;
  slug: string;
  state: string;
  region: "northern" | "southern";
  marketContext: string;
  population: string;
  constructionGrowth: string;
}

interface TradeData {
  slug: string;
  name: string;
  displayName: string;
  benefits: string[];
  features: string[];
  priceRange: string;
  commonProjects: string[];
}

const cities: Record<string, CityData> = {
  "new-york": {
    name: "New York",
    slug: "new-york",
    state: "NY",
    region: "northern",
    marketContext: "Serving the tri-state area's competitive construction market with millions of residential and commercial properties",
    population: "8.3 million",
    constructionGrowth: "Strong demand for renovations in brownstones, co-ops, and high-rises"
  },
  "chicago": {
    name: "Chicago",
    slug: "chicago",
    state: "IL",
    region: "northern",
    marketContext: "Supporting the Midwest's largest metropolitan construction market with diverse residential needs",
    population: "2.7 million",
    constructionGrowth: "Growing demand for vintage home updates and new construction"
  },
  "boston": {
    name: "Boston",
    slug: "boston",
    state: "MA",
    region: "northern",
    marketContext: "Serving New England's historic properties and modern developments across the Greater Boston area",
    population: "675,000",
    constructionGrowth: "High demand for historic home renovations and energy-efficient upgrades"
  },
  "philadelphia": {
    name: "Philadelphia",
    slug: "philadelphia",
    state: "PA",
    region: "northern",
    marketContext: "Supporting Philadelphia's mix of historic rowhouses and modern developments",
    population: "1.6 million",
    constructionGrowth: "Strong market for rowhome renovations and neighborhood revitalization"
  },
  "detroit": {
    name: "Detroit",
    slug: "detroit",
    state: "MI",
    region: "northern",
    marketContext: "Serving Detroit's resurgent construction market with renewed investment in residential properties",
    population: "639,000",
    constructionGrowth: "Rapid growth in home renovations and new residential developments"
  },
  "houston": {
    name: "Houston",
    slug: "houston",
    state: "TX",
    region: "southern",
    marketContext: "Serving the nation's fourth-largest city with year-round construction opportunities",
    population: "2.3 million",
    constructionGrowth: "Booming residential market with strong new construction and renovation demand"
  },
  "dallas": {
    name: "Dallas",
    slug: "dallas",
    state: "TX",
    region: "southern",
    marketContext: "Supporting the Dallas-Fort Worth metroplex's explosive growth in residential construction",
    population: "1.3 million",
    constructionGrowth: "One of America's fastest-growing markets for residential contractors"
  },
  "atlanta": {
    name: "Atlanta",
    slug: "atlanta",
    state: "GA",
    region: "southern",
    marketContext: "Serving the Southeast's largest metropolitan area with diverse construction needs",
    population: "498,000",
    constructionGrowth: "Strong demand for home renovations and new residential developments"
  },
  "miami": {
    name: "Miami",
    slug: "miami",
    state: "FL",
    region: "southern",
    marketContext: "Serving South Florida's dynamic real estate market with unique coastal construction requirements",
    population: "442,000",
    constructionGrowth: "High demand for luxury renovations and hurricane-resistant upgrades"
  },
  "phoenix": {
    name: "Phoenix",
    slug: "phoenix",
    state: "AZ",
    region: "southern",
    marketContext: "Supporting one of America's fastest-growing cities with year-round construction activity",
    population: "1.6 million",
    constructionGrowth: "Explosive growth in residential construction and home improvement projects"
  }
};

const trades: Record<string, TradeData> = {
  "bathroom": {
    slug: "bathroom",
    name: "Bathroom Remodeling",
    displayName: "Bathroom Remodel",
    benefits: [
      "Pre-built scope templates for 5+ bathroom project types",
      "Itemized pricing with labor and materials breakdown",
      "Include fixtures, tile, plumbing, and electrical work",
      "Professional warranty and exclusions language"
    ],
    features: [
      "Tub-to-Shower Conversion Proposals",
      "Full Bathroom Gut & Remodel Scopes",
      "Half Bath / Powder Room Templates",
      "ADA Accessibility Bathroom Upgrades",
      "Vanity & Faucet Replacement Proposals"
    ],
    priceRange: "$1,800 - $28,000+",
    commonProjects: ["Tub-to-shower conversion", "Master bath remodel", "Guest bathroom update", "ADA accessibility retrofit"]
  },
  "kitchen": {
    slug: "kitchen",
    name: "Kitchen Remodeling",
    displayName: "Kitchen Remodel",
    benefits: [
      "Detailed cabinet and countertop specifications",
      "Appliance installation scope included",
      "Electrical and plumbing work templates",
      "Material allowances and upgrade options"
    ],
    features: [
      "Full Kitchen Gut & Replace Proposals",
      "Cabinet Refacing & Painting Scopes",
      "Countertop Replacement Templates",
      "Backsplash Installation Proposals",
      "Island Addition & Layout Changes"
    ],
    priceRange: "$8,000 - $85,000+",
    commonProjects: ["Cabinet refacing", "Countertop replacement", "Full kitchen remodel", "Island installation"]
  },
  "roofing": {
    slug: "roofing",
    name: "Roofing",
    displayName: "Roofing",
    benefits: [
      "Square footage-based pricing calculations",
      "Material specifications for all roof types",
      "Tear-off and disposal scope included",
      "Weather and warranty provisions"
    ],
    features: [
      "Asphalt Shingle Replacement Proposals",
      "Metal Roofing Installation Scopes",
      "Flat Roof / TPO / EPDM Templates",
      "Roof Repair & Patch Estimates",
      "Gutter & Downspout Proposals"
    ],
    priceRange: "$3,500 - $25,000+",
    commonProjects: ["Full roof replacement", "Storm damage repair", "Gutter installation", "Flat roof coating"]
  },
  "painting": {
    slug: "painting",
    name: "Painting",
    displayName: "Painting",
    benefits: [
      "Room-by-room scope breakdowns",
      "Prep work and surface repair included",
      "Paint brand and finish specifications",
      "Color selection and coat specifications"
    ],
    features: [
      "Interior Room Painting Proposals",
      "Exterior House Painting Scopes",
      "Cabinet Painting & Refinishing",
      "Deck & Fence Staining Templates",
      "Commercial Painting Estimates"
    ],
    priceRange: "$800 - $15,000+",
    commonProjects: ["Interior repaint", "Exterior house painting", "Cabinet refinishing", "Deck staining"]
  },
  "landscaping": {
    slug: "landscaping",
    name: "Landscaping",
    displayName: "Landscaping",
    benefits: [
      "Plant and material specifications",
      "Hardscape measurement calculations",
      "Irrigation system design scope",
      "Maintenance plans and warranties"
    ],
    features: [
      "Lawn Installation & Sod Proposals",
      "Patio & Walkway Hardscape Scopes",
      "Retaining Wall Construction",
      "Irrigation System Installation",
      "Tree & Shrub Planting Templates"
    ],
    priceRange: "$1,500 - $50,000+",
    commonProjects: ["Backyard redesign", "Patio installation", "Irrigation system", "Front yard curb appeal"]
  },
  "hvac": {
    slug: "hvac",
    name: "HVAC",
    displayName: "HVAC",
    benefits: [
      "Equipment specifications and SEER ratings",
      "Load calculation documentation",
      "Ductwork and refrigerant line scope",
      "Warranty and maintenance terms"
    ],
    features: [
      "Central AC Installation Proposals",
      "Furnace Replacement Scopes",
      "Mini-Split System Templates",
      "Ductwork Installation & Repair",
      "Heat Pump Conversion Estimates"
    ],
    priceRange: "$3,000 - $20,000+",
    commonProjects: ["AC replacement", "Furnace installation", "Mini-split install", "Duct cleaning"]
  },
  "plumbing": {
    slug: "plumbing",
    name: "Plumbing",
    displayName: "Plumbing",
    benefits: [
      "Fixture and material specifications",
      "Permit and code compliance language",
      "Warranty and guarantee terms",
      "Emergency service provisions"
    ],
    features: [
      "Water Heater Installation Proposals",
      "Whole-House Repipe Scopes",
      "Bathroom Plumbing Rough-In",
      "Drain Cleaning & Sewer Repair",
      "Gas Line Installation Templates"
    ],
    priceRange: "$500 - $15,000+",
    commonProjects: ["Water heater replacement", "Pipe repair", "Bathroom addition", "Sewer line repair"]
  },
  "electrical": {
    slug: "electrical",
    name: "Electrical",
    displayName: "Electrical",
    benefits: [
      "Code compliance and permit language",
      "Circuit and amperage specifications",
      "Material and fixture lists",
      "Safety and warranty provisions"
    ],
    features: [
      "Electrical Panel Upgrade Proposals",
      "Whole-House Rewiring Scopes",
      "Lighting Installation Templates",
      "EV Charger Installation Estimates",
      "Generator Installation Proposals"
    ],
    priceRange: "$300 - $12,000+",
    commonProjects: ["Panel upgrade", "Outlet installation", "Lighting upgrade", "EV charger install"]
  },
  "flooring": {
    slug: "flooring",
    name: "Flooring",
    displayName: "Flooring",
    benefits: [
      "Square footage calculations included",
      "Subfloor prep and leveling scope",
      "Transition and trim specifications",
      "Material waste factor included"
    ],
    features: [
      "Hardwood Flooring Installation",
      "Tile Floor Installation Scopes",
      "Luxury Vinyl Plank (LVP) Templates",
      "Carpet Installation & Removal",
      "Epoxy Floor Coating Proposals"
    ],
    priceRange: "$2,000 - $20,000+",
    commonProjects: ["Hardwood installation", "Tile flooring", "LVP installation", "Carpet replacement"]
  }
};

const testimonials: Record<string, { quote: string; author: string; business: string }> = {
  "bathroom": {
    quote: "ScopeGen cut my proposal time from 2 hours to 10 minutes. My bathroom remodel quotes look more professional than contractors twice my size.",
    author: "Mike Rodriguez",
    business: "Rodriguez Bath & Tile"
  },
  "kitchen": {
    quote: "My kitchen remodel proposals used to take forever to write. Now I can send professional quotes same-day and close more deals.",
    author: "Sarah Chen",
    business: "Premier Kitchen & Bath"
  },
  "roofing": {
    quote: "I was writing roofing estimates by hand for years. ScopeGen makes me look like a much bigger operation.",
    author: "Dave Thompson",
    business: "Thompson Roofing Co."
  },
  "painting": {
    quote: "My painting proposals look so professional now. Clients take me seriously and I win more bids.",
    author: "James Wilson",
    business: "Wilson Pro Painters"
  },
  "landscaping": {
    quote: "ScopeGen helped me present landscaping proposals that match my vision. My close rate went up 40%.",
    author: "Maria Santos",
    business: "Santos Landscaping Design"
  },
  "hvac": {
    quote: "HVAC proposals need to be detailed and technical. ScopeGen handles all of that automatically.",
    author: "Robert Kim",
    business: "Kim's Heating & Cooling"
  },
  "plumbing": {
    quote: "I used to dread writing plumbing estimates. Now I create professional proposals in minutes.",
    author: "Tom Anderson",
    business: "Anderson Plumbing Services"
  },
  "electrical": {
    quote: "My electrical proposals are now as professional as the big companies. Clients trust me more.",
    author: "Chris Martinez",
    business: "Martinez Electric LLC"
  },
  "flooring": {
    quote: "Flooring estimates used to take me hours. Now I send professional proposals the same day I measure.",
    author: "Lisa Park",
    business: "Park Flooring Solutions"
  }
};

interface LocationLandingPageProps {
  citySlug: string;
  tradeSlug: string;
}

export default function LocationLandingPage({ citySlug, tradeSlug }: LocationLandingPageProps) {
  const city = cities[citySlug];
  const trade = trades[tradeSlug];
  const testimonial = testimonials[tradeSlug];

  useEffect(() => {
    const originalTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDescription = metaDesc?.getAttribute("content") || "";
    
    if (city && trade) {
      document.title = `${trade.displayName} Proposals for ${city.name} Contractors | ScopeGen`;
      if (metaDesc) {
        metaDesc.setAttribute("content", `Create professional ${trade.name.toLowerCase()} proposals for ${city.name}, ${city.state} contractors. Generate quotes in 60 seconds. Free preview.`);
      }
    }
    
    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        metaDesc.setAttribute("content", originalDescription);
      }
    };
  }, [city, trade]);

  if (!city || !trade) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Page Not Found</h1>
          <p className="text-muted-foreground mb-8">The location or trade you're looking for doesn't exist.</p>
          <Link href="/" className="text-primary hover:underline">Return to Home</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="w-full h-full bg-gradient-to-br from-secondary/30 to-primary/30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-secondary/20 text-secondary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
              <MapPin className="w-4 h-4" />
              {city.name}, {city.state} • {trade.name} Contractors
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight mb-6" data-testid="heading-location-title">
              Professional {trade.name} Proposals for {city.name} Contractors
            </h1>
            
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              Generate detailed {trade.name.toLowerCase()} scopes of work tailored for the {city.name} market. {city.marketContext}.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/app?trade=${trade.slug}`}
                className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-secondary text-slate-900 font-bold text-lg hover:bg-secondary/90 transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                data-testid="button-create-proposal"
              >
                Create {trade.displayName} Proposal
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a 
                href="#features" 
                className="inline-flex items-center justify-center h-14 px-8 rounded-md border border-slate-700 bg-slate-800/50 text-white font-medium hover:bg-slate-800 transition-colors"
                data-testid="link-view-features"
              >
                See What's Included
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Local Market Context */}
      <section className="py-12 bg-primary/5 border-b border-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-primary font-medium mb-3">
              <MapPin className="w-5 h-5" />
              Serving {city.name}'s Construction Market
            </div>
            <p className="text-slate-700">
              {city.constructionGrowth}. With a population of {city.population}, {city.name} contractors need professional proposals to stand out in this competitive market.
            </p>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Why {city.name} Contractors Choose ScopeGen for {trade.name} Proposals
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop spending hours writing proposals by hand. Our {trade.name.toLowerCase()} templates include everything {city.name} contractors need.
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
                {trade.name} Proposal Templates for {city.name}
              </h2>
              <p className="text-muted-foreground mb-8">
                Our {trade.name.toLowerCase()} proposal generator includes pre-built templates optimized for {city.name}, {city.state} contractors. Just select your options and get a professional scope of work instantly.
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
                  data-testid="button-try-templates"
                >
                  Try These Templates Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <MapPin className="w-4 h-4" />
                {city.name}, {city.state} Market
              </div>
              <div className="text-sm text-muted-foreground mb-2">Typical Project Range</div>
              <div className="text-3xl font-heading font-bold text-slate-900 mb-6">{trade.priceRange}</div>
              
              <div className="text-sm font-medium text-slate-700 mb-3">Common Projects in {city.name}:</div>
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
              "{testimonial.quote}"
            </blockquote>
            
            <div>
              <div className="font-bold text-slate-900">{testimonial.author}</div>
              <div className="text-muted-foreground">{testimonial.business}</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Create Your {city.name} {trade.name} Proposal in 3 Steps
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Select Project Type", desc: `Choose from our ${trade.name.toLowerCase()} templates and customize for ${city.name} clients` },
              { step: "2", title: "Add Client Details", desc: `Enter your ${city.name} client's name, address, and project specifics` },
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

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            Ready to Create Your First {city.name} {trade.name} Proposal?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Join thousands of {city.name} contractors who save hours every week with professional proposals.
          </p>
          <Link 
            href={`/app?trade=${trade.slug}`}
            className="inline-block bg-secondary text-slate-900 font-bold text-lg px-10 py-4 rounded-md hover:bg-white hover:text-primary transition-colors shadow-lg"
            data-testid="button-start-now"
          >
            Start Now — It's Free to Preview
          </Link>
        </div>
      </section>
    </Layout>
  );
}

export { cities, trades };
