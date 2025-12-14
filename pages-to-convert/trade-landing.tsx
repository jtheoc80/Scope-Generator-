'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Clock, DollarSign, FileCheck, Shield, Star, MapPin, HelpCircle, BookOpen, Lightbulb, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface FAQ {
  question: string;
  answer: string;
}

interface TradeData {
  slug: string;
  name: string;
  title: string;
  metaDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  benefits: string[];
  features: string[];
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialBusiness: string;
  priceRange: string;
  commonProjects: string[];
  faqs: FAQ[];
  seoContent: {
    writeProposalTitle: string;
    writeProposalContent: string;
    estimateTitle: string;
    estimateContent: string;
    whyChooseTitle: string;
    whyChooseContent: string;
  };
}

interface CityData {
  name: string;
  state: string;
  tagline: string;
  population: string;
}

export const cityData: Record<string, CityData> = {
  "houston": {
    name: "Houston",
    state: "TX",
    tagline: "Serving the Greater Houston Metro Area",
    population: "2.3M+"
  },
  "dallas": {
    name: "Dallas",
    state: "TX",
    tagline: "Serving Dallas-Fort Worth Metroplex",
    population: "1.3M+"
  },
  "austin": {
    name: "Austin",
    state: "TX",
    tagline: "Serving Austin and Central Texas",
    population: "1M+"
  },
  "san-antonio": {
    name: "San Antonio",
    state: "TX",
    tagline: "Serving San Antonio and South Texas",
    population: "1.5M+"
  },
  "fort-worth": {
    name: "Fort Worth",
    state: "TX",
    tagline: "Serving Fort Worth and Tarrant County",
    population: "930K+"
  }
};

export const tradeCityRoutes = ["bathroom-remodeling", "kitchen-remodeling", "roofing"];
export const cityKeys = Object.keys(cityData);

const tradeData: Record<string, TradeData> = {
  "bathroom-remodeling-proposal": {
    slug: "bathroom",
    name: "Bathroom Remodeling",
    title: "Bathroom Remodeling Proposal Software | Free Construction Templates | ScopeGen",
    metaDescription: "Best contractor proposal software for bathroom remodeling. Create professional contractor estimates with free construction proposal templates. E-signature included.",
    heroTitle: "Contractor Proposal Software for Bathroom Remodeling",
    heroSubtitle: "Generate professional contractor estimates for tub-to-shower conversions, full bathroom remodels, and accessibility upgrades. Free construction proposal templates with e-signature.",
    benefits: [
      "Free construction proposal templates for 5+ bathroom project types",
      "Professional contractor estimates with labor and materials breakdown",
      "Construction proposal with e-signature built in",
      "Best proposal software for small contractors starting out"
    ],
    features: [
      "Tub-to-Shower Conversion Proposals",
      "Full Bathroom Gut & Remodel Scopes",
      "Half Bath / Powder Room Templates",
      "ADA Accessibility Bathroom Upgrades",
      "Vanity & Faucet Replacement Proposals"
    ],
    testimonialQuote: "ScopeGen cut my proposal time from 2 hours to 10 minutes. My bathroom remodel quotes look more professional than contractors twice my size.",
    testimonialAuthor: "Mike Rodriguez",
    testimonialBusiness: "Rodriguez Bath & Tile",
    priceRange: "$1,800 - $28,000+",
    commonProjects: ["Tub-to-shower conversion", "Master bath remodel", "Guest bathroom update", "ADA accessibility retrofit"],
    faqs: [
      {
        question: "How do I write a professional contractor proposal for bathroom remodeling?",
        answer: "A professional bathroom remodeling proposal should include a detailed scope of work, itemized pricing for labor and materials, project timeline, payment terms, warranty information, and exclusions. Using contractor proposal software like ScopeGen helps you create comprehensive proposals that cover all these elements in minutes instead of hours."
      },
      {
        question: "What should be included in a bathroom remodeling estimate?",
        answer: "A complete bathroom remodeling estimate should include demolition costs, plumbing work, electrical upgrades, fixtures (toilet, vanity, shower/tub), tile and flooring, paint, ventilation, and labor costs. Professional contractor estimates also account for permits, disposal fees, and a contingency for unexpected issues."
      },
      {
        question: "How much does contractor proposal software cost?",
        answer: "Contractor proposal software ranges from free basic plans to $50+/month for premium features. ScopeGen offers a free tier with proposal previews, making it the best proposal software for small contractors who want to try before committing. Paid plans unlock unlimited proposals and e-signature capabilities."
      },
      {
        question: "Can I get a free construction proposal template for bathroom remodeling?",
        answer: "Yes! ScopeGen provides free construction proposal templates specifically designed for bathroom remodeling contractors. You can preview your proposal for free before upgrading to send it to clients with professional e-signature functionality."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Bathroom Remodeling Proposal",
      writeProposalContent: "Writing a contractor proposal for bathroom remodeling requires attention to detail. Start by conducting a thorough site visit to assess the existing conditions. Document the current layout, plumbing locations, electrical setup, and any potential issues like water damage or mold. Your construction proposal templates should include separate line items for demolition, rough-in plumbing, electrical work, waterproofing, tile installation, fixtures, and finishing touches. Professional contractor estimates also specify material brands and model numbers when possible.",
      estimateTitle: "What Makes a Professional Contractor Estimate Stand Out",
      estimateContent: "The best contractor estimates are clear, detailed, and easy for homeowners to understand. Use contractor estimate software to create itemized breakdowns that show exactly where their money is going. Include photos from the site visit, reference similar completed projects, and explain your process step-by-step. Construction bid software helps you maintain consistency across all your proposals while saving hours of administrative work.",
      whyChooseTitle: "Why Contractors Choose ScopeGen Proposal Software",
      whyChooseContent: "Small contractors need proposal software for contractors that's easy to use and doesn't break the bank. ScopeGen offers free construction proposal templates that look professional and can be customized for any bathroom project. Our construction proposal with e-signature feature lets clients approve and sign digitally, speeding up your sales cycle. Whether you're writing your first contractor proposal or your hundredth, our contractor proposal software makes the process simple."
    }
  },
  "kitchen-remodeling-proposal": {
    slug: "kitchen",
    name: "Kitchen Remodeling",
    title: "Kitchen Remodeling Proposal Software | Construction Bid Templates | ScopeGen",
    metaDescription: "Contractor proposal software for kitchen remodeling. Free construction proposal templates with professional contractor estimates. Construction bid software with e-signature.",
    heroTitle: "Construction Proposal Software for Kitchen Remodeling",
    heroSubtitle: "Create professional contractor estimates for cabinet installation, countertop replacement, and complete kitchen renovations. Construction bid software with free templates.",
    benefits: [
      "Free construction proposal templates for kitchen projects",
      "Professional contractor estimates with detailed breakdowns",
      "Construction bid software for accurate pricing",
      "Proposal software for contractors with e-signature"
    ],
    features: [
      "Full Kitchen Gut & Replace Proposals",
      "Cabinet Refacing & Painting Scopes",
      "Countertop Replacement Templates",
      "Backsplash Installation Proposals",
      "Island Addition & Layout Changes"
    ],
    testimonialQuote: "My kitchen remodel proposals used to take forever to write. Now I can send professional quotes same-day and close more deals.",
    testimonialAuthor: "Sarah Chen",
    testimonialBusiness: "Premier Kitchen & Bath",
    priceRange: "$8,000 - $85,000+",
    commonProjects: ["Cabinet refacing", "Countertop replacement", "Full kitchen remodel", "Island installation"],
    faqs: [
      {
        question: "How do I write a professional contractor proposal for kitchen remodeling?",
        answer: "A professional kitchen remodeling proposal should detail every aspect of the project: demolition, cabinet installation, countertop fabrication and installation, electrical work, plumbing, appliance installation, backsplash, flooring, and painting. Include material specifications, allowances, timeline, and payment milestones. Contractor proposal software helps you organize all these details professionally."
      },
      {
        question: "What should be included in a kitchen remodeling estimate?",
        answer: "A comprehensive kitchen estimate includes cabinets (stock, semi-custom, or custom), countertops (material and linear footage), appliances, plumbing fixtures, electrical upgrades, flooring, backsplash, paint, hardware, and labor for each trade. Professional contractor estimates also factor in permits, disposal, and project management."
      },
      {
        question: "How much does kitchen remodeling proposal software cost?",
        answer: "Kitchen remodeling proposal software typically costs $0-50/month depending on features. ScopeGen offers free construction proposal templates you can preview before committing, making it the best proposal software for small contractors who want professional results without upfront costs."
      },
      {
        question: "Can I use construction bid software for kitchen renovation estimates?",
        answer: "Absolutely! Construction bid software like ScopeGen streamlines the entire proposal process. Create professional contractor estimates quickly, send construction proposals with e-signature, and track client responses all in one place."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Winning Kitchen Remodeling Proposal",
      writeProposalContent: "Learning how to write a contractor proposal for kitchen remodeling can transform your business. Start with a detailed site assessment, measuring every cabinet, appliance space, and outlet location. Your construction proposal templates should break down costs by category: demolition, cabinetry, countertops, plumbing, electrical, flooring, and finishing. Professional contractor estimates include material specifications with brands, model numbers, and color selections when possible.",
      estimateTitle: "Creating Accurate Kitchen Remodeling Estimates",
      estimateContent: "Contractor estimate software helps you build accurate quotes for kitchen projects of any size. Account for hidden costs like outdated wiring, plumbing modifications, or structural issues behind walls. The best construction bid software allows you to create tiered proposals with good-better-best options, helping clients choose the right scope for their budget.",
      whyChooseTitle: "Best Proposal Software for Kitchen Contractors",
      whyChooseContent: "Kitchen contractors need proposal software that handles complex projects with multiple phases and trades. ScopeGen provides construction proposal templates designed specifically for kitchen remodeling, with built-in line items for every common task. Our construction proposal with e-signature feature means clients can approve your proposal from their phone, getting projects started faster."
    }
  },
  "roofing-proposal": {
    slug: "roofing",
    name: "Roofing",
    title: "Roofing Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Best roofing contractor proposal software with free construction proposal templates. Create professional contractor estimates for shingle, metal, and flat roofs. E-signature included.",
    heroTitle: "Contractor Proposal Software for Roofing Professionals",
    heroSubtitle: "Generate professional contractor estimates for shingle replacement, metal roofing, and flat roof systems. Free construction proposal templates with accurate material calculations.",
    benefits: [
      "Free construction proposal templates for all roof types",
      "Professional contractor estimates with square footage pricing",
      "Construction bid software for accurate material takeoffs",
      "Construction proposal with e-signature for faster approvals"
    ],
    features: [
      "Asphalt Shingle Replacement Proposals",
      "Metal Roofing Installation Scopes",
      "Flat Roof / TPO / EPDM Templates",
      "Roof Repair & Patch Estimates",
      "Gutter & Downspout Proposals"
    ],
    testimonialQuote: "I was writing roofing estimates by hand for years. ScopeGen makes me look like a much bigger operation.",
    testimonialAuthor: "Dave Thompson",
    testimonialBusiness: "Thompson Roofing Co.",
    priceRange: "$3,500 - $25,000+",
    commonProjects: ["Full roof replacement", "Storm damage repair", "Gutter installation", "Flat roof coating"],
    faqs: [
      {
        question: "How do I write a professional roofing contractor proposal?",
        answer: "A professional roofing proposal includes roof measurements (squares), material specifications (shingle type, brand, color), tear-off and disposal, underlayment and ice/water shield, flashing and ventilation details, timeline, warranty information, and payment terms. Contractor proposal software helps ensure you don't miss any critical details."
      },
      {
        question: "What should be included in a roofing estimate?",
        answer: "A complete roofing estimate covers materials (shingles, underlayment, flashing, vents), labor for tear-off and installation, disposal fees, permit costs, and any structural repairs. Professional contractor estimates also include drip edge, ridge caps, and pipe boots as separate line items for transparency."
      },
      {
        question: "How much does roofing proposal software cost?",
        answer: "Roofing proposal software ranges from free to $60/month. ScopeGen offers free construction proposal templates with preview capability, making it ideal for small roofing contractors who want professional proposals without monthly fees upfront."
      },
      {
        question: "What's the best way to price a roofing job?",
        answer: "Price roofing jobs by measuring total squares, factoring in roof pitch complexity, number of layers to remove, and accessibility. Construction bid software can help you maintain consistent pricing while accounting for market rates in your area."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Roofing Proposal That Wins Jobs",
      writeProposalContent: "Knowing how to write a contractor proposal for roofing sets you apart from competitors. Start with accurate measurements using drone imagery or on-roof inspection. Your construction proposal templates should detail every component: starter strips, field shingles, ridge caps, underlayment type, ice and water shield locations, flashing at walls and valleys, and ventilation requirements. Professional contractor estimates show homeowners exactly what they're paying for.",
      estimateTitle: "Creating Professional Roofing Estimates",
      estimateContent: "Contractor estimate software helps you build accurate roofing quotes quickly. Calculate material needs based on waste factors (typically 10-15% for basic roofs, more for complex designs). Include labor rates for different roof pitches and account for extras like chimney flashing, skylight sealing, or gutter re-attachment. Construction bid software keeps your pricing consistent across all jobs.",
      whyChooseTitle: "Why Roofing Contractors Choose ScopeGen",
      whyChooseContent: "Roofing contractors need proposal software for contractors that handles the unique aspects of roof work. ScopeGen's free construction proposal templates include pre-built line items for shingles, underlayment, flashing, and more. Our construction proposal with e-signature feature lets homeowners approve storm damage repairs quickly, helping you secure jobs faster in competitive markets."
    }
  },
  "painting-proposal": {
    slug: "painting",
    name: "Painting",
    title: "Painting Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for painting professionals. Free construction proposal templates for interior and exterior painting. Create professional contractor estimates fast.",
    heroTitle: "Proposal Software for Painting Contractors",
    heroSubtitle: "Generate professional contractor estimates for interior painting, exterior house painting, and specialty finishes. Free construction proposal templates with room-by-room breakdowns.",
    benefits: [
      "Free construction proposal templates for all painting projects",
      "Professional contractor estimates with detailed prep work",
      "Best proposal software for small contractors",
      "Construction proposal with e-signature included"
    ],
    features: [
      "Interior Room Painting Proposals",
      "Exterior House Painting Scopes",
      "Cabinet Painting & Refinishing",
      "Deck & Fence Staining Templates",
      "Commercial Painting Estimates"
    ],
    testimonialQuote: "My painting proposals look so professional now. Clients take me seriously and I win more bids.",
    testimonialAuthor: "James Wilson",
    testimonialBusiness: "Wilson Pro Painters",
    priceRange: "$800 - $15,000+",
    commonProjects: ["Interior repaint", "Exterior house painting", "Cabinet refinishing", "Deck staining"],
    faqs: [
      {
        question: "How do I write a professional painting contractor proposal?",
        answer: "A professional painting proposal includes a detailed scope covering prep work (patching, sanding, priming), number of coats, paint brand and color selections, surface areas, and timeline. Using contractor proposal software ensures you include all critical details and present them professionally to potential clients."
      },
      {
        question: "What should be included in a painting estimate?",
        answer: "A complete painting estimate covers labor, materials (paint, primer, caulk, tape), surface preparation, number of coats, and any specialty finishes. Professional contractor estimates also detail what's excluded, such as wallpaper removal or major drywall repairs, to set clear expectations."
      },
      {
        question: "How much does painting proposal software cost?",
        answer: "Painting proposal software ranges from free to $40/month. ScopeGen provides free construction proposal templates that painting contractors can use to create professional estimates without upfront costs—perfect for the best proposal software for small contractors."
      },
      {
        question: "How do painting contractors calculate square footage?",
        answer: "Calculate paintable square footage by measuring wall height times perimeter, then subtracting windows and doors. Contractor estimate software can help you standardize these calculations and ensure consistent, accurate pricing across all your painting proposals."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Painting Proposal",
      writeProposalContent: "Learning how to write a contractor proposal for painting jobs is essential for growing your business. Start by conducting a thorough walkthrough, noting surface conditions, existing paint problems, and areas requiring extra prep. Your construction proposal templates should itemize prep work, primer coats, finish coats, and any specialty applications like texture or accent walls. Professional contractor estimates specify paint brands, sheens, and estimated coverage.",
      estimateTitle: "Creating Accurate Painting Estimates",
      estimateContent: "Contractor estimate software helps painting professionals build accurate quotes. Calculate labor based on production rates (typically 200-400 sq ft per hour for interior walls) and factor in ceiling heights, trim detail, and surface condition. Construction bid software helps you maintain consistent pricing while adjusting for job-specific variables.",
      whyChooseTitle: "Best Proposal Software for Painting Contractors",
      whyChooseContent: "Painting contractors need proposal software for contractors that's quick and easy to use between job sites. ScopeGen's free construction proposal templates are designed for painters, with room-by-room breakdowns and prep work already built in. Our construction proposal with e-signature feature lets clients approve on the spot, helping you win more jobs."
    }
  },
  "landscaping-proposal": {
    slug: "landscaping",
    name: "Landscaping",
    title: "Landscaping Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for landscaping professionals. Create professional contractor estimates with free construction proposal templates. Hardscape and irrigation templates included.",
    heroTitle: "Proposal Software for Landscaping Contractors",
    heroSubtitle: "Generate professional contractor estimates for lawn installation, hardscaping, irrigation systems, and outdoor living spaces. Free construction proposal templates designed for landscapers.",
    benefits: [
      "Free construction proposal templates for landscape projects",
      "Professional contractor estimates with plant specifications",
      "Construction bid software for hardscape pricing",
      "Best proposal software for small contractors"
    ],
    features: [
      "Lawn Installation & Sod Proposals",
      "Patio & Walkway Hardscape Scopes",
      "Retaining Wall Construction",
      "Irrigation System Installation",
      "Tree & Shrub Planting Templates"
    ],
    testimonialQuote: "ScopeGen helped me present landscaping proposals that match my vision. My close rate went up 40%.",
    testimonialAuthor: "Maria Santos",
    testimonialBusiness: "Santos Landscaping Design",
    priceRange: "$1,500 - $50,000+",
    commonProjects: ["Backyard redesign", "Patio installation", "Irrigation system", "Front yard curb appeal"],
    faqs: [
      {
        question: "How do I write a professional landscaping contractor proposal?",
        answer: "A professional landscaping proposal should include detailed plant lists with quantities and sizes, hardscape materials and dimensions, irrigation specifications, installation timeline, and maintenance recommendations. Contractor proposal software helps you organize complex landscape designs into clear, professional proposals."
      },
      {
        question: "What should be included in a landscaping estimate?",
        answer: "A complete landscaping estimate covers plants and materials, soil amendments, mulch, edging, irrigation components, hardscape materials, labor, equipment rental, and disposal. Professional contractor estimates also include site preparation, grading, and any required permits."
      },
      {
        question: "How much does landscaping proposal software cost?",
        answer: "Landscaping proposal software typically costs $0-50/month. ScopeGen offers free construction proposal templates for landscapers, making it the best proposal software for small contractors who want to create professional estimates without subscription fees."
      },
      {
        question: "How do I price landscaping jobs accurately?",
        answer: "Price landscaping jobs by measuring areas precisely, calculating material quantities with waste factors, and estimating labor hours for each phase. Construction bid software helps maintain consistent pricing across similar projects while accounting for site-specific variables."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Landscaping Proposal",
      writeProposalContent: "Knowing how to write a contractor proposal for landscaping projects helps you win larger jobs. Start with a site analysis noting soil conditions, drainage, sun exposure, and existing vegetation. Your construction proposal templates should include detailed plant schedules with botanical names, sizes at planting, and spacing. Professional contractor estimates show hardscape dimensions with material specifications and installation methods.",
      estimateTitle: "Creating Accurate Landscaping Estimates",
      estimateContent: "Contractor estimate software helps landscapers build profitable quotes. Calculate material quantities accurately—including 10-15% waste for plants and 15-20% for hardscape materials. Factor in equipment costs for excavation, grading, and installation. Construction bid software keeps your pricing consistent while helping you track profitability across different project types.",
      whyChooseTitle: "Why Landscaping Contractors Choose ScopeGen",
      whyChooseContent: "Landscaping contractors need proposal software for contractors that handles both softscape and hardscape elements. ScopeGen's free construction proposal templates include pre-built sections for planting, irrigation, pavers, and retaining walls. Our construction proposal with e-signature feature lets clients approve designs faster, helping you start projects sooner and manage your seasonal workflow."
    }
  },
  "hvac-proposal": {
    slug: "hvac",
    name: "HVAC",
    title: "HVAC Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for HVAC professionals. Create professional contractor estimates for AC, heating, and ductwork. Free construction proposal templates with e-signature.",
    heroTitle: "Proposal Software for HVAC Contractors",
    heroSubtitle: "Generate professional contractor estimates for AC installation, furnace replacement, and ductwork. Free construction proposal templates with equipment specifications and SEER ratings.",
    benefits: [
      "Free construction proposal templates for HVAC projects",
      "Professional contractor estimates with load calculations",
      "Construction bid software for accurate equipment pricing",
      "Construction proposal with e-signature for quick approvals"
    ],
    features: [
      "Central AC Installation Proposals",
      "Furnace Replacement Scopes",
      "Mini-Split System Templates",
      "Ductwork Installation & Repair",
      "Heat Pump Conversion Estimates"
    ],
    testimonialQuote: "HVAC proposals need to be detailed and technical. ScopeGen handles all of that automatically.",
    testimonialAuthor: "Robert Kim",
    testimonialBusiness: "Kim's Heating & Cooling",
    priceRange: "$3,000 - $20,000+",
    commonProjects: ["AC replacement", "Furnace installation", "Mini-split install", "Duct cleaning"],
    faqs: [
      {
        question: "How do I write a professional HVAC contractor proposal?",
        answer: "A professional HVAC proposal includes equipment specifications (model, SEER/AFUE ratings, tonnage), installation scope, ductwork modifications, electrical requirements, thermostat options, warranty details, and maintenance recommendations. Contractor proposal software ensures you include all technical details homeowners need."
      },
      {
        question: "What should be included in an HVAC estimate?",
        answer: "A complete HVAC estimate covers equipment costs, installation labor, ductwork materials and fabrication, refrigerant line set, electrical connections, permit fees, and removal/disposal of old equipment. Professional contractor estimates also detail efficiency ratings and expected energy savings."
      },
      {
        question: "How much does HVAC proposal software cost?",
        answer: "HVAC proposal software ranges from free to $75/month for premium features. ScopeGen offers free construction proposal templates that HVAC contractors can use to create professional estimates, making it the best proposal software for small contractors starting out."
      },
      {
        question: "What equipment details should an HVAC proposal include?",
        answer: "Include manufacturer, model number, SEER rating (for AC), AFUE rating (for furnaces), BTU capacity, warranty terms, and expected lifespan. Construction bid software helps you maintain accurate equipment databases for consistent pricing."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional HVAC Proposal",
      writeProposalContent: "Learning how to write a contractor proposal for HVAC work requires technical precision. Start with a Manual J load calculation to properly size equipment. Your construction proposal templates should specify equipment models, efficiency ratings, and capacity. Professional contractor estimates include detailed scope for ductwork modifications, electrical requirements, and refrigerant line routing. Always include warranty terms for both equipment and labor.",
      estimateTitle: "Creating Accurate HVAC Estimates",
      estimateContent: "Contractor estimate software helps HVAC professionals build accurate quotes. Factor in equipment costs, installation complexity (attic, basement, closet), ductwork requirements, and any electrical upgrades needed. Construction bid software helps you maintain current pricing for popular equipment brands and models.",
      whyChooseTitle: "Why HVAC Contractors Choose ScopeGen",
      whyChooseContent: "HVAC contractors need proposal software for contractors that handles technical specifications accurately. ScopeGen's free construction proposal templates include equipment specification fields, efficiency ratings, and warranty documentation. Our construction proposal with e-signature feature helps close deals faster, especially during peak season when homeowners need quick responses."
    }
  },
  "plumbing-proposal": {
    slug: "plumbing",
    name: "Plumbing",
    title: "Plumbing Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for plumbing professionals. Create professional contractor estimates for water heaters, pipe repair, and plumbing. Free construction proposal templates.",
    heroTitle: "Proposal Software for Plumbing Contractors",
    heroSubtitle: "Generate professional contractor estimates for water heater installation, pipe replacement, and fixture installation. Free construction proposal templates with detailed scopes.",
    benefits: [
      "Free construction proposal templates for plumbing work",
      "Professional contractor estimates with fixture specs",
      "Construction bid software for accurate pricing",
      "Best proposal software for small contractors"
    ],
    features: [
      "Water Heater Installation Proposals",
      "Whole-House Repipe Scopes",
      "Bathroom Plumbing Rough-In",
      "Drain Cleaning & Sewer Repair",
      "Gas Line Installation Templates"
    ],
    testimonialQuote: "I used to dread writing plumbing estimates. Now I create professional proposals in minutes.",
    testimonialAuthor: "Tom Anderson",
    testimonialBusiness: "Anderson Plumbing Services",
    priceRange: "$500 - $15,000+",
    commonProjects: ["Water heater replacement", "Pipe repair", "Bathroom addition", "Sewer line repair"],
    faqs: [
      {
        question: "How do I write a professional plumbing contractor proposal?",
        answer: "A professional plumbing proposal includes detailed scope of work, fixture specifications, material types (copper, PEX, PVC), permit requirements, timeline, warranty information, and payment terms. Contractor proposal software helps you create comprehensive proposals that build trust with homeowners."
      },
      {
        question: "What should be included in a plumbing estimate?",
        answer: "A complete plumbing estimate covers labor, materials (pipes, fittings, fixtures), permit fees, equipment rental if needed, and any restoration work. Professional contractor estimates also specify fixture brands and models so clients know exactly what they're getting."
      },
      {
        question: "How much does plumbing proposal software cost?",
        answer: "Plumbing proposal software ranges from free to $50/month. ScopeGen offers free construction proposal templates for plumbers, making it ideal for small plumbing contractors who want professional-looking estimates without monthly fees."
      },
      {
        question: "Should plumbing proposals include warranty information?",
        answer: "Yes! Professional contractor estimates always include warranty details for both materials and workmanship. Clearly stating your warranty builds trust and differentiates you from competitors who don't offer guarantees."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Plumbing Proposal",
      writeProposalContent: "Understanding how to write a contractor proposal for plumbing work sets you apart from competitors. Start by inspecting the existing system and documenting current conditions. Your construction proposal templates should detail materials (pipe type, fixture brands), labor for each task, and any required permits. Professional contractor estimates include clear timelines and explain potential complications homeowners should be aware of.",
      estimateTitle: "Creating Accurate Plumbing Estimates",
      estimateContent: "Contractor estimate software helps plumbers build accurate, profitable quotes. Factor in material costs, labor rates, permit fees, and equipment rental. Account for potential surprises like corroded fittings or unexpected pipe conditions. Construction bid software helps you maintain consistent pricing while building in appropriate contingencies.",
      whyChooseTitle: "Why Plumbing Contractors Choose ScopeGen",
      whyChooseContent: "Plumbing contractors need proposal software for contractors that's fast and mobile-friendly. ScopeGen's free construction proposal templates are designed for on-site use, letting you create estimates immediately after inspection. Our construction proposal with e-signature feature means clients can approve work on the spot for emergency repairs."
    }
  },
  "electrical-proposal": {
    slug: "electrical",
    name: "Electrical",
    title: "Electrical Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for electricians. Create professional contractor estimates for panel upgrades, rewiring, and lighting. Free construction proposal templates included.",
    heroTitle: "Proposal Software for Electrical Contractors",
    heroSubtitle: "Generate professional contractor estimates for panel upgrades, rewiring, and electrical installations. Free construction proposal templates with code compliance language.",
    benefits: [
      "Free construction proposal templates for electrical work",
      "Professional contractor estimates with circuit specs",
      "Construction bid software for permit-ready proposals",
      "Construction proposal with e-signature for approvals"
    ],
    features: [
      "Electrical Panel Upgrade Proposals",
      "Whole-House Rewiring Scopes",
      "Lighting Installation Templates",
      "EV Charger Installation Estimates",
      "Generator Installation Proposals"
    ],
    testimonialQuote: "My electrical proposals are now as professional as the big companies. Clients trust me more.",
    testimonialAuthor: "Chris Martinez",
    testimonialBusiness: "Martinez Electric LLC",
    priceRange: "$300 - $12,000+",
    commonProjects: ["Panel upgrade", "Outlet installation", "Lighting upgrade", "EV charger install"],
    faqs: [
      {
        question: "How do I write a professional electrical contractor proposal?",
        answer: "A professional electrical proposal includes scope of work, circuit specifications, material lists, permit requirements, code compliance statements, and warranty information. Using contractor proposal software ensures your proposals meet industry standards and build homeowner confidence."
      },
      {
        question: "What should be included in an electrical estimate?",
        answer: "A complete electrical estimate covers labor, materials (wire, breakers, fixtures), permit fees, inspection costs, and any structural work needed for access. Professional contractor estimates also specify wire gauge, circuit capacity, and fixture specifications."
      },
      {
        question: "How much does electrical proposal software cost?",
        answer: "Electrical proposal software ranges from free to $60/month. ScopeGen provides free construction proposal templates for electricians, making it the best proposal software for small contractors who want professional results without high costs."
      },
      {
        question: "Should electrical proposals include permit information?",
        answer: "Yes! Professional contractor estimates always detail permit requirements and associated fees. This transparency builds trust and ensures clients understand the full scope of compliant electrical work."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Electrical Proposal",
      writeProposalContent: "Learning how to write a contractor proposal for electrical work requires attention to code compliance. Document existing panel capacity, current wiring type, and any safety concerns during inspection. Your construction proposal templates should specify wire gauge, circuit breaker sizes, and fixture wattages. Professional contractor estimates include permit costs and explain the inspection process to homeowners.",
      estimateTitle: "Creating Accurate Electrical Estimates",
      estimateContent: "Contractor estimate software helps electricians build code-compliant quotes. Calculate material needs based on wire runs, fixture counts, and device boxes required. Factor in permit fees, inspection scheduling, and any required structural work. Construction bid software helps maintain consistent pricing while ensuring nothing is overlooked.",
      whyChooseTitle: "Why Electrical Contractors Choose ScopeGen",
      whyChooseContent: "Electrical contractors need proposal software for contractors that handles technical specifications and code requirements. ScopeGen's free construction proposal templates include pre-built sections for panel upgrades, circuit additions, and specialty installations. Our construction proposal with e-signature feature helps close deals quickly, especially for EV charger installations where homeowners want to act fast."
    }
  },
  "flooring-proposal": {
    slug: "flooring",
    name: "Flooring",
    title: "Flooring Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for flooring professionals. Create professional contractor estimates for hardwood, tile, and LVP. Free construction proposal templates.",
    heroTitle: "Proposal Software for Flooring Contractors",
    heroSubtitle: "Generate professional contractor estimates for hardwood, tile, luxury vinyl, and carpet installation. Free construction proposal templates with material calculations.",
    benefits: [
      "Free construction proposal templates for all floor types",
      "Professional contractor estimates with square footage",
      "Construction bid software for accurate material takeoffs",
      "Best proposal software for small contractors"
    ],
    features: [
      "Hardwood Flooring Installation",
      "Tile Floor Installation Scopes",
      "Luxury Vinyl Plank (LVP) Templates",
      "Carpet Installation & Removal",
      "Epoxy Floor Coating Proposals"
    ],
    testimonialQuote: "Flooring estimates used to take me hours. Now I send professional proposals the same day I measure.",
    testimonialAuthor: "Lisa Park",
    testimonialBusiness: "Park Flooring Solutions",
    priceRange: "$2,000 - $20,000+",
    commonProjects: ["Hardwood installation", "Tile flooring", "LVP installation", "Carpet replacement"],
    faqs: [
      {
        question: "How do I write a professional flooring contractor proposal?",
        answer: "A professional flooring proposal includes detailed measurements, material specifications (type, brand, color), subfloor preparation scope, transition details, and installation timeline. Contractor proposal software helps you create comprehensive proposals that cover all aspects of the flooring project."
      },
      {
        question: "What should be included in a flooring estimate?",
        answer: "A complete flooring estimate covers materials, underlayment, transitions and trim, removal of existing flooring, subfloor prep, and installation labor. Professional contractor estimates include a waste factor (typically 10-15%) to ensure adequate material is ordered."
      },
      {
        question: "How much does flooring proposal software cost?",
        answer: "Flooring proposal software ranges from free to $45/month. ScopeGen offers free construction proposal templates for flooring contractors, making it the best proposal software for small contractors who want professional estimates without upfront costs."
      },
      {
        question: "How do flooring contractors calculate material needs?",
        answer: "Calculate total square footage plus 10-15% waste factor depending on room layout and pattern. Construction bid software helps maintain accurate calculations and ensures consistent pricing across similar projects."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Flooring Proposal",
      writeProposalContent: "Understanding how to write a contractor proposal for flooring projects helps win larger jobs. Measure every room precisely, noting closets, transitions, and direction of installation. Your construction proposal templates should itemize materials, underlayment, transitions, and any required subfloor work. Professional contractor estimates specify the flooring product by name, color code, and warranty details.",
      estimateTitle: "Creating Accurate Flooring Estimates",
      estimateContent: "Contractor estimate software helps flooring professionals build profitable quotes. Calculate material needs based on room dimensions plus appropriate waste factors. Factor in transition strips, quarter-round, and any subfloor repairs. Construction bid software helps you maintain consistent pricing across different flooring types and installation methods.",
      whyChooseTitle: "Why Flooring Contractors Choose ScopeGen",
      whyChooseContent: "Flooring contractors need proposal software for contractors that handles multiple flooring types efficiently. ScopeGen's free construction proposal templates include pre-built sections for hardwood, tile, LVP, and carpet. Our construction proposal with e-signature feature helps close deals on-site after measuring, reducing callbacks and winning more jobs."
    }
  },
  "siding-proposal": {
    slug: "siding",
    name: "Siding",
    title: "Siding Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for siding professionals. Create professional contractor estimates for vinyl, fiber cement, and wood siding. Free construction proposal templates.",
    heroTitle: "Proposal Software for Siding Contractors",
    heroSubtitle: "Generate professional contractor estimates for vinyl, fiber cement, and wood siding installation. Free construction proposal templates with material calculations.",
    benefits: [
      "Free construction proposal templates for all siding types",
      "Professional contractor estimates with square footage",
      "Construction bid software for accurate takeoffs",
      "Construction proposal with e-signature included"
    ],
    features: [
      "Vinyl Siding Installation Proposals",
      "Fiber Cement (Hardie) Siding Scopes",
      "Wood Siding Installation Templates",
      "Siding Repair & Replacement Estimates",
      "Soffit & Fascia Installation Proposals"
    ],
    testimonialQuote: "ScopeGen makes my siding proposals look professional. Clients can see exactly what they're getting.",
    testimonialAuthor: "Carlos Hernandez",
    testimonialBusiness: "Hernandez Exteriors",
    priceRange: "$5,000 - $25,000+",
    commonProjects: ["Full siding replacement", "Partial siding repair", "Soffit & fascia", "Accent siding"],
    faqs: [
      {
        question: "How do I write a professional siding contractor proposal?",
        answer: "A professional siding proposal includes material specifications (type, brand, color), square footage calculations, tear-off and disposal scope, weather barrier details, and trim specifications. Contractor proposal software helps ensure all exterior details are covered comprehensively."
      },
      {
        question: "What should be included in a siding estimate?",
        answer: "A complete siding estimate covers materials, labor for removal and installation, weather barrier, J-channel and trim, soffit and fascia if included, and disposal. Professional contractor estimates also detail flashing around windows and doors."
      },
      {
        question: "How much does siding proposal software cost?",
        answer: "Siding proposal software ranges from free to $55/month. ScopeGen provides free construction proposal templates for siding contractors, offering the best proposal software for small contractors who want professional results."
      },
      {
        question: "What details should siding proposals include?",
        answer: "Include material type and brand, color selections, square footage, linear feet of trim, number of squares to remove, and warranty information. Construction bid software helps standardize these details across all your proposals."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Siding Proposal",
      writeProposalContent: "Knowing how to write a contractor proposal for siding projects wins bigger jobs. Measure all walls, gables, and soffits carefully. Your construction proposal templates should itemize siding squares, J-channel, starter strips, corners, and all trim pieces. Professional contractor estimates specify the siding product by manufacturer and color name, plus warranty details.",
      estimateTitle: "Creating Accurate Siding Estimates",
      estimateContent: "Contractor estimate software helps siding professionals build accurate quotes. Calculate material needs based on wall measurements plus 10-15% waste. Factor in complexity for gables, dormers, and multi-story work. Construction bid software helps maintain consistent pricing while adjusting for job-specific challenges.",
      whyChooseTitle: "Why Siding Contractors Choose ScopeGen",
      whyChooseContent: "Siding contractors need proposal software for contractors that handles exterior projects completely. ScopeGen's free construction proposal templates include all siding types plus soffit, fascia, and trim. Our construction proposal with e-signature feature lets homeowners approve quickly, especially after storm damage when timing matters."
    }
  },
  "drywall-proposal": {
    slug: "drywall",
    name: "Drywall",
    title: "Drywall Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for drywall professionals. Create professional contractor estimates for installation, repair, and texturing. Free construction proposal templates.",
    heroTitle: "Proposal Software for Drywall Contractors",
    heroSubtitle: "Generate professional contractor estimates for drywall installation, repair, and texturing. Free construction proposal templates with material calculations.",
    benefits: [
      "Free construction proposal templates for drywall work",
      "Professional contractor estimates with board footage",
      "Construction bid software for finishing levels",
      "Best proposal software for small contractors"
    ],
    features: [
      "New Drywall Installation Proposals",
      "Drywall Repair & Patching Scopes",
      "Texture Application Templates",
      "Ceiling Drywall Installation",
      "Soundproofing Drywall Proposals"
    ],
    testimonialQuote: "Drywall estimates are tricky to get right. ScopeGen helps me price jobs accurately every time.",
    testimonialAuthor: "Steve Miller",
    testimonialBusiness: "Miller Drywall Services",
    priceRange: "$800 - $12,000+",
    commonProjects: ["Basement finishing", "Drywall repair", "Garage drywall", "Ceiling texture"],
    faqs: [
      {
        question: "How do I write a professional drywall contractor proposal?",
        answer: "A professional drywall proposal includes board footage calculations, finishing level specifications (levels 0-5), texture type, primer requirements, and timeline. Contractor proposal software helps you create detailed proposals that clearly communicate scope to homeowners."
      },
      {
        question: "What should be included in a drywall estimate?",
        answer: "A complete drywall estimate covers drywall sheets, joint compound, tape, screws/nails, corner bead, labor for hanging and finishing, and any texturing. Professional contractor estimates also specify finishing level and texture matching for repairs."
      },
      {
        question: "How much does drywall proposal software cost?",
        answer: "Drywall proposal software ranges from free to $40/month. ScopeGen offers free construction proposal templates for drywall contractors, making it the best proposal software for small contractors who want professional estimates."
      },
      {
        question: "What are drywall finishing levels and why do they matter?",
        answer: "Finishing levels (0-5) specify the quality of finish from basic fire taping to smooth walls ready for high-gloss paint. Professional contractor estimates always specify finishing level so clients understand the quality they're paying for."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Drywall Proposal",
      writeProposalContent: "Learning how to write a contractor proposal for drywall work ensures profitable projects. Calculate board footage by measuring wall and ceiling areas. Your construction proposal templates should specify drywall thickness, finishing level, and texture type. Professional contractor estimates include separate line items for hanging, taping, finishing, and texturing.",
      estimateTitle: "Creating Accurate Drywall Estimates",
      estimateContent: "Contractor estimate software helps drywall professionals build accurate quotes. Factor in material waste (typically 5-10%), corner bead linear footage, and complexity of the space. Construction bid software helps maintain consistent pricing for different finishing levels and texture applications.",
      whyChooseTitle: "Why Drywall Contractors Choose ScopeGen",
      whyChooseContent: "Drywall contractors need proposal software for contractors that handles finishing specifications accurately. ScopeGen's free construction proposal templates include finishing level options and texture matching. Our construction proposal with e-signature feature helps close deals faster, especially for repair work where homeowners want quick turnaround."
    }
  },
  "window-installation-proposal": {
    slug: "windows",
    name: "Window Installation",
    title: "Window Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for window installers. Create professional contractor estimates for replacement and new windows. Free construction proposal templates.",
    heroTitle: "Proposal Software for Window Contractors",
    heroSubtitle: "Generate professional contractor estimates for replacement windows and new construction. Free construction proposal templates with per-window pricing.",
    benefits: [
      "Free construction proposal templates for window projects",
      "Professional contractor estimates with per-window pricing",
      "Construction bid software for accurate quotes",
      "Construction proposal with e-signature"
    ],
    features: [
      "Replacement Window Proposals",
      "New Construction Window Scopes",
      "Energy-Efficient Upgrade Templates",
      "Bay & Bow Window Installation",
      "Egress Window Proposals"
    ],
    testimonialQuote: "Window quotes used to be a pain. Now I send professional proposals that help me win more jobs.",
    testimonialAuthor: "Jennifer Walsh",
    testimonialBusiness: "Walsh Windows & Doors",
    priceRange: "$3,000 - $20,000+",
    commonProjects: ["Whole-house window replacement", "Single window replacement", "Energy upgrade", "Egress window"],
    faqs: [
      {
        question: "How do I write a professional window installation proposal?",
        answer: "A professional window proposal includes window specifications (brand, series, size, style), energy ratings, trim and casing details, installation method, warranty information, and timeline. Contractor proposal software helps you present all these details professionally."
      },
      {
        question: "What should be included in a window replacement estimate?",
        answer: "A complete window estimate covers window units, installation labor, exterior trim/capping, interior trim, disposal of old windows, and any required structural modifications. Professional contractor estimates include energy ratings and expected efficiency improvements."
      },
      {
        question: "How much does window installation proposal software cost?",
        answer: "Window installation proposal software ranges from free to $50/month. ScopeGen offers free construction proposal templates for window contractors, making it the best proposal software for small contractors looking to grow."
      },
      {
        question: "Should window proposals include energy efficiency information?",
        answer: "Yes! Professional contractor estimates include U-factor and SGHC ratings to help homeowners understand energy savings. This information can help justify premium window options and differentiate you from competitors."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Window Installation Proposal",
      writeProposalContent: "Knowing how to write a contractor proposal for window installation wins larger whole-house jobs. Measure each window opening precisely and note any structural concerns. Your construction proposal templates should specify window brand, series, energy ratings, and glass options. Professional contractor estimates include both interior and exterior trim details.",
      estimateTitle: "Creating Accurate Window Installation Estimates",
      estimateContent: "Contractor estimate software helps window professionals build accurate quotes. Price each window based on size, type (double-hung, casement, etc.), and features. Factor in trim materials, any structural work, and removal/disposal. Construction bid software helps maintain consistent per-window pricing.",
      whyChooseTitle: "Why Window Contractors Choose ScopeGen",
      whyChooseContent: "Window contractors need proposal software for contractors that handles multiple window types and options. ScopeGen's free construction proposal templates include per-window breakdowns and energy specifications. Our construction proposal with e-signature feature helps close deals on-site after the initial consultation."
    }
  },
  "deck-building-proposal": {
    slug: "deck",
    name: "Deck Building",
    title: "Deck Builder Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for deck builders. Create professional contractor estimates for wood and composite decks. Free construction proposal templates.",
    heroTitle: "Proposal Software for Deck Builders",
    heroSubtitle: "Generate professional contractor estimates for new deck construction, repairs, and refinishing. Free construction proposal templates with material options.",
    benefits: [
      "Free construction proposal templates for deck projects",
      "Professional contractor estimates with material options",
      "Construction bid software for square footage pricing",
      "Construction proposal with e-signature included"
    ],
    features: [
      "New Deck Construction Proposals",
      "Composite Decking Installation",
      "Deck Repair & Board Replacement",
      "Deck Staining & Sealing Scopes",
      "Pergola & Cover Addition Templates"
    ],
    testimonialQuote: "My deck proposals are now detailed and professional. Clients trust me more and I close faster.",
    testimonialAuthor: "Brian Foster",
    testimonialBusiness: "Foster Deck & Patio",
    priceRange: "$4,000 - $35,000+",
    commonProjects: ["New deck build", "Deck replacement", "Deck staining", "Railing replacement"],
    faqs: [
      {
        question: "How do I write a professional deck building proposal?",
        answer: "A professional deck proposal includes material specifications (wood or composite), dimensions, railing details, stair count, footing requirements, permit information, and timeline. Contractor proposal software helps present all options clearly so clients can make informed decisions."
      },
      {
        question: "What should be included in a deck building estimate?",
        answer: "A complete deck estimate covers decking materials, framing lumber, hardware, railings, stairs, footings/concrete, labor, permits, and any site preparation. Professional contractor estimates also include maintenance recommendations for the chosen materials."
      },
      {
        question: "How much does deck proposal software cost?",
        answer: "Deck proposal software ranges from free to $50/month. ScopeGen offers free construction proposal templates for deck builders, making it the best proposal software for small contractors growing their business."
      },
      {
        question: "Should I offer wood and composite options in my proposals?",
        answer: "Yes! Professional contractor estimates often include both wood and composite options with pricing so clients can choose based on budget and maintenance preferences. Construction bid software makes it easy to create comparison proposals."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Deck Building Proposal",
      writeProposalContent: "Understanding how to write a contractor proposal for deck projects helps win larger outdoor living jobs. Measure the deck area, note elevation changes, and assess soil conditions for footings. Your construction proposal templates should detail decking type, joist spacing, railing style, and stair specifications. Professional contractor estimates include material grades and expected lifespan.",
      estimateTitle: "Creating Accurate Deck Building Estimates",
      estimateContent: "Contractor estimate software helps deck builders create profitable quotes. Calculate board feet for framing, square footage for decking, and linear feet for railings. Factor in footing depth based on frost line and local codes. Construction bid software helps maintain consistent pricing across similar deck designs.",
      whyChooseTitle: "Why Deck Builders Choose ScopeGen",
      whyChooseContent: "Deck builders need proposal software for contractors that presents material options clearly. ScopeGen's free construction proposal templates include wood and composite comparisons with accurate pricing. Our construction proposal with e-signature feature helps close deals quickly during the busy spring and summer seasons."
    }
  },
  "fence-installation-proposal": {
    slug: "fence",
    name: "Fence Installation",
    title: "Fence Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for fence installers. Create professional contractor estimates for wood, vinyl, and chain link fences. Free construction proposal templates.",
    heroTitle: "Proposal Software for Fence Contractors",
    heroSubtitle: "Generate professional contractor estimates for wood, vinyl, and chain link fencing. Free construction proposal templates with linear footage pricing.",
    benefits: [
      "Free construction proposal templates for fencing",
      "Professional contractor estimates with linear footage",
      "Construction bid software for gate pricing",
      "Best proposal software for small contractors"
    ],
    features: [
      "Wood Privacy Fence Proposals",
      "Vinyl Fence Installation Scopes",
      "Chain Link Fence Templates",
      "Gate Installation & Repair",
      "Fence Repair & Replacement Estimates"
    ],
    testimonialQuote: "Fence estimates are straightforward with ScopeGen. I can quote jobs on-site and send proposals immediately.",
    testimonialAuthor: "Tony Russo",
    testimonialBusiness: "Russo Fence Co.",
    priceRange: "$1,500 - $15,000+",
    commonProjects: ["Privacy fence", "Chain link fence", "Gate installation", "Fence repair"],
    faqs: [
      {
        question: "How do I write a professional fence installation proposal?",
        answer: "A professional fence proposal includes linear footage, fence height, post spacing and depth, material specifications, gate details, and timeline. Contractor proposal software helps you create clear proposals that show exactly what clients are getting."
      },
      {
        question: "What should be included in a fence installation estimate?",
        answer: "A complete fence estimate covers materials (posts, rails, pickets/panels), concrete for posts, hardware, gates, labor, removal of old fence if applicable, and permits. Professional contractor estimates break down per-linear-foot pricing for transparency."
      },
      {
        question: "How much does fence proposal software cost?",
        answer: "Fence proposal software ranges from free to $40/month. ScopeGen offers free construction proposal templates for fence contractors, making it the best proposal software for small contractors who want quick, professional estimates."
      },
      {
        question: "How do fence contractors price jobs?",
        answer: "Price fence jobs by linear footage, factoring in material type, fence height, number of gates, terrain difficulty, and post hole conditions. Construction bid software helps maintain consistent per-foot pricing across similar projects."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Fence Installation Proposal",
      writeProposalContent: "Learning how to write a contractor proposal for fence installation helps win more residential and commercial jobs. Measure the property line accurately and note any terrain challenges. Your construction proposal templates should detail fence type, height, post spacing, and gate specifications. Professional contractor estimates include utility locate requirements and any HOA restrictions.",
      estimateTitle: "Creating Accurate Fence Installation Estimates",
      estimateContent: "Contractor estimate software helps fence professionals build profitable quotes. Calculate materials based on linear footage and standard post spacing. Factor in corner posts, end posts, gate posts, and terrain difficulty. Construction bid software helps maintain consistent pricing while adjusting for job-specific conditions.",
      whyChooseTitle: "Why Fence Contractors Choose ScopeGen",
      whyChooseContent: "Fence contractors need proposal software for contractors that works quickly on-site. ScopeGen's free construction proposal templates let you measure a property and send a proposal within minutes. Our construction proposal with e-signature feature helps close deals immediately while you're still on location."
    }
  },
  "concrete-proposal": {
    slug: "concrete",
    name: "Concrete",
    title: "Concrete Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for concrete professionals. Create professional contractor estimates for driveways, patios, and foundations. Free construction proposal templates.",
    heroTitle: "Proposal Software for Concrete Contractors",
    heroSubtitle: "Generate professional contractor estimates for driveways, patios, sidewalks, and foundations. Free construction proposal templates with accurate material calculations.",
    benefits: [
      "Free construction proposal templates for concrete work",
      "Professional contractor estimates with PSI specs",
      "Construction bid software for accurate yardage",
      "Construction proposal with e-signature"
    ],
    features: [
      "Driveway Installation Proposals",
      "Patio & Sidewalk Scopes",
      "Foundation Repair Templates",
      "Stamped Concrete Estimates",
      "Concrete Removal & Replacement"
    ],
    testimonialQuote: "Concrete work requires detailed estimates. ScopeGen helps me include everything so there are no surprises.",
    testimonialAuthor: "Mark Johnson",
    testimonialBusiness: "Johnson Concrete Services",
    priceRange: "$2,000 - $25,000+",
    commonProjects: ["Driveway replacement", "Patio installation", "Sidewalk repair", "Foundation work"],
    faqs: [
      {
        question: "How do I write a professional concrete contractor proposal?",
        answer: "A professional concrete proposal includes dimensions, thickness, PSI specifications, reinforcement details, finishing type, and timeline. Contractor proposal software helps present technical details in a way homeowners understand while ensuring nothing is overlooked."
      },
      {
        question: "What should be included in a concrete estimate?",
        answer: "A complete concrete estimate covers site preparation, forms, reinforcement (rebar/mesh), concrete materials, finishing (broom, stamped, exposed aggregate), curing, and sealing. Professional contractor estimates also include removal of existing concrete if applicable."
      },
      {
        question: "How much does concrete proposal software cost?",
        answer: "Concrete proposal software ranges from free to $50/month. ScopeGen offers free construction proposal templates for concrete contractors, making it the best proposal software for small contractors who need professional-looking estimates."
      },
      {
        question: "How do concrete contractors calculate material needs?",
        answer: "Calculate cubic yards by measuring length x width x depth, adding 5-10% for waste. Construction bid software helps maintain accurate calculations for different slab thicknesses and accounts for overdig and form waste."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Concrete Proposal",
      writeProposalContent: "Knowing how to write a contractor proposal for concrete work builds trust and wins jobs. Assess the site conditions including drainage and soil type. Your construction proposal templates should specify concrete thickness, PSI rating, reinforcement type, and finish style. Professional contractor estimates include curing time requirements and explain any limitations on use during the curing period.",
      estimateTitle: "Creating Accurate Concrete Estimates",
      estimateContent: "Contractor estimate software helps concrete professionals build accurate quotes. Calculate yardage based on dimensions and add appropriate waste factors. Factor in form lumber, reinforcement, finishing labor, and any required removal work. Construction bid software helps maintain consistent square-footage pricing for similar project types.",
      whyChooseTitle: "Why Concrete Contractors Choose ScopeGen",
      whyChooseContent: "Concrete contractors need proposal software for contractors that handles technical specifications accurately. ScopeGen's free construction proposal templates include concrete PSI specs, finishing options, and reinforcement details. Our construction proposal with e-signature feature helps lock in jobs quickly, especially important during good weather windows."
    }
  },
  "tile-installation-proposal": {
    slug: "tile",
    name: "Tile Installation",
    title: "Tile Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for tile installers. Create professional contractor estimates for floor, backsplash, and shower tile. Free construction proposal templates.",
    heroTitle: "Proposal Software for Tile Contractors",
    heroSubtitle: "Generate professional contractor estimates for floor tile, backsplash, and shower installations. Free construction proposal templates with pattern options.",
    benefits: [
      "Free construction proposal templates for tile work",
      "Professional contractor estimates with square footage",
      "Construction bid software for accurate pricing",
      "Best proposal software for small contractors"
    ],
    features: [
      "Floor Tile Installation Proposals",
      "Backsplash Installation Scopes",
      "Shower & Tub Surround Templates",
      "Outdoor Tile Installation",
      "Tile Repair & Replacement Estimates"
    ],
    testimonialQuote: "Tile jobs have lots of details. ScopeGen helps me capture everything and present it professionally.",
    testimonialAuthor: "Angela Martinez",
    testimonialBusiness: "Martinez Tile & Stone",
    priceRange: "$1,500 - $18,000+",
    commonProjects: ["Kitchen backsplash", "Bathroom floor tile", "Shower tile", "Outdoor patio tile"],
    faqs: [
      {
        question: "How do I write a professional tile installation proposal?",
        answer: "A professional tile proposal includes square footage, tile specifications, pattern layout, substrate preparation, grout color, and timeline. Contractor proposal software helps ensure all details are captured and presented clearly to clients."
      },
      {
        question: "What should be included in a tile installation estimate?",
        answer: "A complete tile estimate covers tile materials, thinset, grout, backer board, waterproofing for wet areas, trim pieces, and labor. Professional contractor estimates include waste factor (typically 10-15%) and specify grout color and sealer requirements."
      },
      {
        question: "How much does tile proposal software cost?",
        answer: "Tile proposal software ranges from free to $45/month. ScopeGen offers free construction proposal templates for tile contractors, making it the best proposal software for small contractors who want professional estimates."
      },
      {
        question: "What waste factor should tile estimates include?",
        answer: "Standard tile waste factor is 10-15%, increasing to 15-20% for diagonal patterns or complex layouts. Construction bid software helps calculate accurate material quantities including appropriate waste factors."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Tile Installation Proposal",
      writeProposalContent: "Understanding how to write a contractor proposal for tile work wins more bathroom and kitchen projects. Assess substrate conditions and note any prep work needed. Your construction proposal templates should specify tile size, pattern, layout direction, and grout color. Professional contractor estimates include waterproofing details for shower and wet area installations.",
      estimateTitle: "Creating Accurate Tile Installation Estimates",
      estimateContent: "Contractor estimate software helps tile professionals build profitable quotes. Calculate square footage and add appropriate waste for pattern complexity. Factor in substrate prep, waterproofing, and trim pieces like bullnose and Schluter strips. Construction bid software helps maintain consistent pricing across different tile sizes and patterns.",
      whyChooseTitle: "Why Tile Contractors Choose ScopeGen",
      whyChooseContent: "Tile contractors need proposal software for contractors that handles complex material calculations. ScopeGen's free construction proposal templates include waste factors and pattern options. Our construction proposal with e-signature feature helps close deals during the selection process while clients are excited about their new tile."
    }
  },
  "cabinet-installation-proposal": {
    slug: "cabinet",
    name: "Cabinet Installation",
    title: "Cabinet Contractor Proposal Software | Free Estimate Templates | ScopeGen",
    metaDescription: "Contractor proposal software for cabinet installers. Create professional contractor estimates for kitchen cabinets and vanities. Free construction proposal templates.",
    heroTitle: "Proposal Software for Cabinet Contractors",
    heroSubtitle: "Generate professional contractor estimates for kitchen cabinets, bathroom vanities, and custom cabinetry. Free construction proposal templates with detailed specs.",
    benefits: [
      "Free construction proposal templates for cabinet work",
      "Professional contractor estimates with cabinet counts",
      "Construction bid software for accurate pricing",
      "Construction proposal with e-signature"
    ],
    features: [
      "Kitchen Cabinet Installation Proposals",
      "Bathroom Vanity Installation Scopes",
      "Cabinet Refacing Templates",
      "Custom Cabinet Estimates",
      "Cabinet Hardware Replacement"
    ],
    testimonialQuote: "Cabinet proposals need to be detailed. ScopeGen makes it easy to show clients exactly what they're getting.",
    testimonialAuthor: "David Lee",
    testimonialBusiness: "Lee Cabinet Installers",
    priceRange: "$3,000 - $30,000+",
    commonProjects: ["Kitchen cabinet install", "Bathroom vanity", "Cabinet refacing", "Pantry cabinets"],
    faqs: [
      {
        question: "How do I write a professional cabinet installation proposal?",
        answer: "A professional cabinet proposal includes cabinet count and sizes, door style and finish, hardware specifications, countertop coordination, demolition scope, and installation timeline. Contractor proposal software ensures all details are organized and presented professionally."
      },
      {
        question: "What should be included in a cabinet installation estimate?",
        answer: "A complete cabinet estimate covers cabinet units, hardware, installation labor, demolition and disposal of old cabinets, countertop coordination, and any required plumbing/electrical modifications. Professional contractor estimates include cabinet specifications and warranty information."
      },
      {
        question: "How much does cabinet installation proposal software cost?",
        answer: "Cabinet installation proposal software ranges from free to $55/month. ScopeGen offers free construction proposal templates for cabinet contractors, making it the best proposal software for small contractors who want professional estimates."
      },
      {
        question: "How should cabinet proposals handle countertop coordination?",
        answer: "Professional contractor estimates clearly state whether countertops are included or separate. If coordinating with a countertop fabricator, include templating timelines and explain the installation sequence to set proper expectations."
      }
    ],
    seoContent: {
      writeProposalTitle: "How to Write a Professional Cabinet Installation Proposal",
      writeProposalContent: "Knowing how to write a contractor proposal for cabinet installation wins larger kitchen and bath projects. Document existing cabinet dimensions and note any structural concerns. Your construction proposal templates should specify cabinet brand, door style, finish color, and hardware selections. Professional contractor estimates include demolition scope and explain any required modifications to plumbing or electrical.",
      estimateTitle: "Creating Accurate Cabinet Installation Estimates",
      estimateContent: "Contractor estimate software helps cabinet professionals build accurate quotes. Calculate based on cabinet count, size categories (base, wall, tall), and complexity of installation. Factor in hardware, demolition, disposal, and any modifications to existing utilities. Construction bid software helps maintain consistent pricing across cabinet lines and grades.",
      whyChooseTitle: "Why Cabinet Contractors Choose ScopeGen",
      whyChooseContent: "Cabinet contractors need proposal software for contractors that handles complex specifications and options. ScopeGen's free construction proposal templates include cabinet counts, hardware selections, and countertop coordination. Our construction proposal with e-signature feature helps close deals during showroom visits while clients are excited about their selections."
    }
  }
};

interface TradeLandingPageProps {
  tradeSlug: string;
  citySlug?: string;
}

export default function TradeLandingPage({ tradeSlug, citySlug }: TradeLandingPageProps) {
  const { t } = useLanguage();
  const trade = tradeData[tradeSlug];
  const city = citySlug ? cityData[citySlug] : null;

  useEffect(() => {
    const originalTitle = document.title;
    const metaDesc = document.querySelector('meta[name="description"]');
    const originalDescription = metaDesc?.getAttribute("content") || "";
    
    if (trade) {
      const cityPrefix = city ? `${city.name}, ${city.state} ` : "";
      const title = city 
        ? `${trade.name} Proposals in ${city.name}, ${city.state} | ScopeGen`
        : trade.title;
      const description = city
        ? `Create professional ${trade.name.toLowerCase()} proposals for ${city.name}, ${city.state} contractors. ${trade.metaDescription.split('. ').slice(1).join('. ')}`
        : trade.metaDescription;
      
      document.title = title;
      if (metaDesc) {
        metaDesc.setAttribute("content", description);
      }
    }
    
    return () => {
      document.title = originalTitle;
      if (metaDesc) {
        metaDesc.setAttribute("content", originalDescription);
      }
    };
  }, [trade, city]);

  if (!trade) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Trade Not Found</h1>
          <p className="text-muted-foreground mb-8">The trade category you're looking for doesn't exist.</p>
          <Link href="/" className="text-primary hover:underline">Return to Home</Link>
        </div>
      </Layout>
    );
  }

  const heroTitle = city 
    ? `${trade.name} Proposals in ${city.name}`
    : trade.heroTitle;
  
  const heroSubtitle = city
    ? `${city.tagline}. ${trade.heroSubtitle}`
    : trade.heroSubtitle;

  const badgeText = city 
    ? `${trade.name} Contractors in ${city.name}, ${city.state}`
    : `${trade.name} Contractors`;

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
              {city && <MapPin className="w-4 h-4" />}
              {badgeText}
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-heading font-bold leading-tight mb-6" data-testid="heading-trade-title">
              {heroTitle}
            </h1>
            
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
              {heroSubtitle}
            </p>
            
            {city && (
              <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mb-8">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {city.name}, {city.state}
                </span>
                <span>|</span>
                <span>Population: {city.population}</span>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href={`/app?trade=${trade.slug}${city ? `&city=${citySlug}` : ''}`}
                className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-secondary text-slate-900 font-bold text-lg hover:bg-secondary/90 transition-all hover:scale-105 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                data-testid="button-create-proposal"
              >
                Create {trade.name} Proposal
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

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
              Why Use ScopeGen for {trade.name} Proposals{city ? ` in ${city.name}` : ''}?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Stop spending hours writing proposals by hand. Our {trade.name.toLowerCase()} templates include everything you need{city ? ` to serve ${city.name} homeowners` : ''}.
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
                {trade.name} Proposal Templates{city ? ` for ${city.name}` : ''}
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
                  href={`/app?trade=${trade.slug}${city ? `&city=${citySlug}` : ''}`}
                  className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-primary text-white font-bold hover:bg-primary/90 transition-colors"
                  data-testid="button-try-templates"
                >
                  Try These Templates Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-slate-200 shadow-lg p-6">
              <div className="text-sm text-muted-foreground mb-2">Typical Project Range{city ? ` in ${city.name}` : ''}</div>
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
              "{trade.testimonialQuote}"
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
                href={`/app?trade=${trade.slug}${city ? `&city=${citySlug}` : ''}`}
                className="inline-flex items-center text-primary font-semibold hover:underline"
                data-testid="link-try-scopegen"
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
            
            <div className="space-y-4" itemScope itemType="https://schema.org/FAQPage">
              {trade.faqs.map((faq, index) => (
                <div 
                  key={index}
                  className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                  itemScope
                  itemProp="mainEntity"
                  itemType="https://schema.org/Question"
                >
                  <details className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-slate-50 transition-colors list-none">
                      <h3 className="font-semibold text-slate-900 text-left pr-4" itemProp="name">
                        {faq.question}
                      </h3>
                      <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <div 
                      className="px-6 pb-6 text-muted-foreground leading-relaxed"
                      itemScope
                      itemProp="acceptedAnswer"
                      itemType="https://schema.org/Answer"
                    >
                      <p itemProp="text">{faq.answer}</p>
                    </div>
                  </details>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* City-specific section for other cities */}
      {city && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-heading font-bold text-slate-900 mb-4">
                {trade.name} Services in Other Texas Cities
              </h2>
            </div>
            <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
              {Object.entries(cityData)
                .filter(([slug]) => slug !== citySlug)
                .map(([slug, cityInfo]) => {
                  const tradeName = tradeSlug.replace('-proposal', '');
                  return (
                    <Link
                      key={slug}
                      href={`/${tradeName}-${slug}`}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-full text-sm text-slate-700 transition-colors"
                    >
                      <MapPin className="w-3 h-3" />
                      {cityInfo.name}
                    </Link>
                  );
                })}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-primary py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-white mb-4">
            Ready to Create Your First {trade.name} Proposal{city ? ` in ${city.name}` : ''}?
          </h2>
          <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
            Join thousands of contractors who save hours every week with professional proposals.
          </p>
          <Link 
            href={`/app?trade=${trade.slug}${city ? `&city=${citySlug}` : ''}`}
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
