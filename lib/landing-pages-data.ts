/**
 * SEO Landing Pages Data
 * High-intent keyword targeting pages for contractor estimate/template searches
 */

export interface LandingPageFAQ {
  question: string;
  answer: string;
}

export interface LandingPageData {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  heroSubtitle: string;
  priceRange: string;
  ctaText: string;
  ctaUrl: string;
  content: {
    intro: string;
    whatIsIncluded: string[];
    whyUseGenerator: string;
    howItWorks: string[];
    commonProjects: { name: string; priceRange: string }[];
  };
  faqs: LandingPageFAQ[];
  relatedPages: string[];
}

export const landingPagesData: Record<string, LandingPageData> = {
  "contractor-estimate-generator": {
    slug: "contractor-estimate-generator",
    title: "Free Contractor Estimate Generator",
    metaTitle: "Free Contractor Estimate Generator | Create Estimates in 60 Seconds",
    metaDescription: "Generate professional contractor estimates instantly. Free estimate generator for bathroom, kitchen, roofing, HVAC, plumbing, electrical, and 15+ trades. No signup required.",
    h1: "Free Contractor Estimate Generator",
    heroSubtitle: "Create professional, detailed contractor estimates in under 60 seconds. Perfect for bathroom remodelers, roofers, HVAC technicians, plumbers, electricians, and more.",
    priceRange: "Varies by project",
    ctaText: "Generate Your Estimate",
    ctaUrl: "/app",
    content: {
      intro: "Stop spending hours writing estimates by hand. Our free contractor estimate generator creates professional, itemized estimates that help you win more jobs and look more professional than your competition. Whether you're a solo contractor or run a team, having professional estimates is essential for closing deals and setting clear client expectations.",
      whatIsIncluded: [
        "Detailed line-item breakdowns for labor and materials",
        "Regional pricing adjustments for your local market",
        "Professional PDF output ready to send to clients",
        "Customizable templates for 17+ contractor trades",
        "Material and labor cost calculations",
        "Project timeline estimates",
      ],
      whyUseGenerator: "Handwritten estimates look unprofessional and take hours to create. Spreadsheets are better but still time-consuming. A professional estimate generator like ScopeGen creates detailed, accurate estimates in minutes—letting you send more proposals and win more jobs. Contractors who use professional estimating tools typically see 30-50% improvement in their proposal close rates.",
      howItWorks: [
        "Select your trade (bathroom, kitchen, roofing, etc.)",
        "Answer a few questions about the project scope",
        "Review and customize the generated estimate",
        "Download as PDF or send directly to your client",
      ],
      commonProjects: [
        { name: "Bathroom Remodel", priceRange: "$8,000 - $28,000" },
        { name: "Kitchen Renovation", priceRange: "$25,000 - $85,000" },
        { name: "Roof Replacement", priceRange: "$8,000 - $25,000" },
        { name: "HVAC Installation", priceRange: "$5,000 - $15,000" },
      ],
    },
    faqs: [
      {
        question: "Is the contractor estimate generator really free?",
        answer: "Yes! You can preview your estimate completely free. To unlock full features like PDF download and e-signature, you can choose a paid plan, but the estimate generation itself is free to try."
      },
      {
        question: "How accurate are the estimates?",
        answer: "Our estimates are based on national industry data with regional adjustments for your area. They provide an excellent starting point, though final prices should account for your specific costs, profit margin, and local market conditions."
      },
    ],
    relatedPages: ["scope-of-work-generator", "bathroom-remodel-estimate-template", "kitchen-remodel-estimate-template"],
  },
  "scope-of-work-generator": {
    slug: "scope-of-work-generator",
    title: "Free Scope of Work Generator",
    metaTitle: "Free Scope of Work Generator | Professional SOW Templates",
    metaDescription: "Create detailed scopes of work instantly. Free scope generator for construction, remodeling, and contractor projects. Professional templates with e-signature.",
    h1: "Free Scope of Work Generator",
    heroSubtitle: "Generate detailed, professional scopes of work that protect your business and set clear client expectations. Used by thousands of contractors nationwide.",
    priceRange: "Varies by project",
    ctaText: "Create Your Scope of Work",
    ctaUrl: "/app",
    content: {
      intro: "A clear scope of work is the foundation of every successful project. It defines exactly what work will be performed, what materials will be used, and what's excluded—preventing disputes and protecting both you and your clients. Our scope of work generator creates comprehensive, professional documents in minutes instead of hours.",
      whatIsIncluded: [
        "Detailed project descriptions for each phase",
        "Material specifications with brands and quantities",
        "Labor breakdown by task",
        "Clear exclusions to prevent scope creep",
        "Payment milestones and terms",
        "Warranty and guarantee language",
      ],
      whyUseGenerator: "Vague scopes lead to disputes, unpaid extras, and unhappy clients. A detailed scope of work sets professional expectations and gives you documentation if questions arise. Our generator ensures you include all critical details for your specific trade and project type—no more forgetting important line items.",
      howItWorks: [
        "Select your project type and trade",
        "Specify project details and materials",
        "Review the generated scope of work",
        "Customize, download, or send for e-signature",
      ],
      commonProjects: [
        { name: "Full Bathroom Remodel", priceRange: "$15,000 - $35,000" },
        { name: "Kitchen Cabinet Installation", priceRange: "$8,000 - $25,000" },
        { name: "Exterior Painting", priceRange: "$4,000 - $12,000" },
        { name: "Flooring Installation", priceRange: "$3,000 - $15,000" },
      ],
    },
    faqs: [
      {
        question: "What's the difference between a scope of work and an estimate?",
        answer: "An estimate focuses on costs and pricing. A scope of work details exactly what work will be performed, how it will be done, and what's included or excluded. The best proposals include both—clear scope AND transparent pricing."
      },
      {
        question: "Can I customize the generated scope of work?",
        answer: "Absolutely! The generator creates a starting point based on your project type. You can then add, remove, or modify any section to match your specific project requirements."
      },
    ],
    relatedPages: ["contractor-estimate-generator", "bathroom-remodel-estimate-template", "roofing-estimate-template"],
  },
  "bathroom-remodel-estimate-template": {
    slug: "bathroom-remodel-estimate-template",
    title: "Free Bathroom Remodel Estimate Template",
    metaTitle: "Bathroom Remodel Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free bathroom remodel estimate template for contractors. Professional templates for tub-to-shower conversions, full remodels, and bathroom renovations. Generate estimates instantly.",
    h1: "Free Bathroom Remodel Estimate Template",
    heroSubtitle: "Create professional bathroom remodeling estimates in minutes. Templates for tub-to-shower conversions, full gut renovations, half baths, and accessibility upgrades.",
    priceRange: "$8,000 - $35,000+",
    ctaText: "Create Bathroom Estimate",
    ctaUrl: "/app?trade=bathroom",
    content: {
      intro: "Bathroom remodeling is one of the most popular home improvement projects, and homeowners expect professional estimates before choosing a contractor. Our bathroom remodel estimate template helps you create detailed, accurate proposals that win jobs. Include everything from demolition to finishing touches, with regional pricing adjustments for your market.",
      whatIsIncluded: [
        "Demolition and disposal costs",
        "Plumbing rough-in and fixture installation",
        "Electrical work (GFCI outlets, lighting, exhaust fan)",
        "Waterproofing and backer board",
        "Tile installation (floor, walls, shower)",
        "Vanity, toilet, and fixture installation",
        "Paint, trim, and finishing work",
      ],
      whyUseGenerator: "Bathroom remodel estimates are complex—there are dozens of line items to consider, from demo to final cleanup. Missing items means either eating costs or awkward change order conversations. Our template includes all common bathroom remodeling tasks, organized by phase, so you never forget to price important work.",
      howItWorks: [
        "Select bathroom remodel as your project type",
        "Choose the specific scope (tub-to-shower, full remodel, etc.)",
        "Enter project size and material selections",
        "Generate and customize your estimate",
      ],
      commonProjects: [
        { name: "Tub-to-Shower Conversion", priceRange: "$8,000 - $15,000" },
        { name: "Full Bathroom Gut Remodel", priceRange: "$18,000 - $35,000" },
        { name: "Half Bath Renovation", priceRange: "$6,000 - $12,000" },
        { name: "ADA Accessibility Upgrade", priceRange: "$12,000 - $25,000" },
      ],
    },
    faqs: [
      {
        question: "What should be included in a bathroom remodel estimate?",
        answer: "A complete estimate should include demolition, plumbing, electrical, waterproofing, tile/flooring, fixtures (toilet, vanity, shower/tub), paint, and finishing. Don't forget permits, disposal fees, and any structural work if walls are being moved."
      },
      {
        question: "How long does a typical bathroom remodel take?",
        answer: "Timeline varies by scope: a simple vanity replacement might take 1-2 days, while a full gut remodel typically takes 2-4 weeks. Our estimates include timeline projections based on project complexity."
      },
    ],
    relatedPages: ["kitchen-remodel-estimate-template", "contractor-estimate-generator", "plumbing-estimate-template"],
  },
  "kitchen-remodel-estimate-template": {
    slug: "kitchen-remodel-estimate-template",
    title: "Free Kitchen Remodel Estimate Template",
    metaTitle: "Kitchen Remodel Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free kitchen remodel estimate template for contractors. Professional templates for cabinet installation, countertops, full renovations. Regional pricing included.",
    h1: "Free Kitchen Remodel Estimate Template",
    heroSubtitle: "Create comprehensive kitchen remodeling estimates that win jobs. Templates for cabinet refacing, countertop replacement, full renovations, and everything in between.",
    priceRange: "$15,000 - $100,000+",
    ctaText: "Create Kitchen Estimate",
    ctaUrl: "/app?trade=kitchen",
    content: {
      intro: "Kitchen remodels are the highest-value home improvement projects, and clients expect detailed, professional estimates. Our kitchen remodel estimate template helps you create thorough proposals covering cabinets, countertops, appliances, plumbing, electrical, and finishing work. Show clients exactly what they're getting for their investment.",
      whatIsIncluded: [
        "Cabinet removal and installation",
        "Countertop template and installation",
        "Backsplash tile installation",
        "Plumbing (sink, dishwasher, ice maker)",
        "Electrical upgrades and lighting",
        "Appliance installation",
        "Flooring and paint",
      ],
      whyUseGenerator: "Kitchen remodels involve multiple trades and can easily run $50,000-$100,000 or more. Clients need detailed breakdowns to understand where their money is going. Our template organizes everything by category and phase, making it easy for clients to understand and for you to ensure nothing is missed.",
      howItWorks: [
        "Select kitchen remodel as your project type",
        "Specify cabinet type (stock, semi-custom, custom)",
        "Add countertop, appliance, and other selections",
        "Review and customize the detailed estimate",
      ],
      commonProjects: [
        { name: "Cabinet Refacing", priceRange: "$8,000 - $20,000" },
        { name: "Countertop Replacement", priceRange: "$3,000 - $12,000" },
        { name: "Full Kitchen Remodel", priceRange: "$45,000 - $100,000+" },
        { name: "Kitchen Island Addition", priceRange: "$8,000 - $25,000" },
      ],
    },
    faqs: [
      {
        question: "How do I estimate kitchen cabinet costs?",
        answer: "Cabinet costs vary dramatically based on quality. Stock cabinets run $100-300 per linear foot installed, semi-custom $200-500, and custom $500-1,500+. Our template helps you price based on linear footage and quality tier."
      },
      {
        question: "Should I include appliances in my kitchen estimate?",
        answer: "It depends on your scope. Some contractors include appliance installation but not the appliances themselves (client-provided). Others offer complete packages. Our template lets you handle either approach."
      },
    ],
    relatedPages: ["bathroom-remodel-estimate-template", "contractor-estimate-generator", "flooring-estimate-template"],
  },
  "roofing-estimate-template": {
    slug: "roofing-estimate-template",
    title: "Free Roofing Estimate Template",
    metaTitle: "Roofing Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free roofing estimate template for contractors. Professional templates for shingle replacement, metal roofing, flat roofs, and repairs. Square footage pricing included.",
    h1: "Free Roofing Estimate Template",
    heroSubtitle: "Create professional roofing estimates based on squares, pitch, and material type. Templates for asphalt shingles, metal roofing, flat roofs, and repairs.",
    priceRange: "$8,000 - $45,000+",
    ctaText: "Create Roofing Estimate",
    ctaUrl: "/app?trade=roofing",
    content: {
      intro: "Roofing estimates need to be accurate and detailed to win jobs and avoid costly surprises. Our roofing estimate template calculates costs based on roof size (squares), pitch complexity, material type, and your regional market. Include everything from tear-off to cleanup with professional documentation.",
      whatIsIncluded: [
        "Tear-off and disposal of existing roofing",
        "Underlayment and ice & water shield",
        "Shingles/metal panels with waste factor",
        "Flashing at walls, valleys, and penetrations",
        "Ridge caps and starter strips",
        "Ventilation (ridge vent, soffit vents)",
        "Gutter re-attachment or replacement",
      ],
      whyUseGenerator: "Roofing pricing varies significantly by roof complexity, pitch, and accessibility. A simple ranch roof is very different from a multi-story home with multiple dormers and valleys. Our template adjusts pricing based on these factors and ensures you include all necessary line items.",
      howItWorks: [
        "Enter roof size in squares (or let us calculate)",
        "Select roof pitch and complexity level",
        "Choose material type (asphalt, metal, flat)",
        "Generate detailed estimate with material list",
      ],
      commonProjects: [
        { name: "Asphalt Shingle Replacement", priceRange: "$8,000 - $20,000" },
        { name: "Metal Roof Installation", priceRange: "$18,000 - $45,000" },
        { name: "Flat Roof (TPO/EPDM)", priceRange: "$8,000 - $20,000" },
        { name: "Roof Repair", priceRange: "$500 - $3,000" },
      ],
    },
    faqs: [
      {
        question: "How do roofers calculate estimates?",
        answer: "Roofing is typically priced per 'square' (100 square feet). Costs include materials, labor, tear-off, and disposal. Factors like roof pitch, accessibility, and complexity affect labor costs significantly."
      },
      {
        question: "What waste factor should I use for roofing?",
        answer: "Standard waste factor is 10-15% for simple roofs. Complex roofs with many valleys, hips, and dormers may require 15-20% waste. Our template adjusts automatically based on complexity."
      },
    ],
    relatedPages: ["contractor-estimate-generator", "hvac-estimate-template", "electrical-estimate-template"],
  },
  "hvac-estimate-template": {
    slug: "hvac-estimate-template",
    title: "Free HVAC Estimate Template",
    metaTitle: "HVAC Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free HVAC estimate template for contractors. Professional templates for AC installation, furnace replacement, ductwork, and mini-splits. Equipment specs included.",
    h1: "Free HVAC Estimate Template",
    heroSubtitle: "Create detailed HVAC estimates with equipment specifications, efficiency ratings, and installation costs. Templates for AC, furnaces, heat pumps, and ductwork.",
    priceRange: "$3,000 - $20,000+",
    ctaText: "Create HVAC Estimate",
    ctaUrl: "/app?trade=hvac",
    content: {
      intro: "HVAC estimates require technical accuracy and clear equipment specifications. Our HVAC estimate template helps you create professional proposals that detail equipment models, efficiency ratings (SEER, AFUE), installation scope, and warranty terms. Help homeowners understand exactly what they're getting.",
      whatIsIncluded: [
        "Equipment specifications (model, tonnage, efficiency)",
        "Installation labor and materials",
        "Ductwork modifications if needed",
        "Electrical connections",
        "Thermostat installation",
        "Removal and disposal of old equipment",
        "Warranty documentation",
      ],
      whyUseGenerator: "HVAC equipment varies widely in price and efficiency. Homeowners need to understand the long-term value of higher-efficiency equipment. Our template includes energy savings calculations and clearly presents equipment specifications so clients can make informed decisions.",
      howItWorks: [
        "Select equipment type (AC, furnace, heat pump, etc.)",
        "Specify system size and efficiency level",
        "Add any ductwork or electrical requirements",
        "Generate estimate with equipment specs and warranty",
      ],
      commonProjects: [
        { name: "Central AC Replacement", priceRange: "$5,000 - $12,000" },
        { name: "Furnace Replacement", priceRange: "$3,500 - $8,000" },
        { name: "Mini-Split Installation", priceRange: "$3,000 - $8,000" },
        { name: "Complete HVAC System", priceRange: "$10,000 - $20,000" },
      ],
    },
    faqs: [
      {
        question: "How do I size HVAC equipment correctly?",
        answer: "Proper sizing requires a Manual J load calculation considering home size, insulation, windows, and climate. Oversized equipment cycles too frequently; undersized can't keep up. Our template includes guidance on sizing."
      },
      {
        question: "What SEER rating should I recommend?",
        answer: "Minimum SEER is 14-15 in most regions. Higher SEER (16-21+) costs more upfront but saves on energy bills. Present options with estimated annual energy costs to help clients decide."
      },
    ],
    relatedPages: ["electrical-estimate-template", "plumbing-estimate-template", "contractor-estimate-generator"],
  },
  "plumbing-estimate-template": {
    slug: "plumbing-estimate-template",
    title: "Free Plumbing Estimate Template",
    metaTitle: "Plumbing Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free plumbing estimate template for contractors. Professional templates for water heaters, repiping, fixture installation, and drain repairs. Labor rates included.",
    h1: "Free Plumbing Estimate Template",
    heroSubtitle: "Create professional plumbing estimates for water heater installation, repiping, fixture installation, and repairs. Detailed labor and material breakdowns.",
    priceRange: "$500 - $15,000+",
    ctaText: "Create Plumbing Estimate",
    ctaUrl: "/app?trade=plumbing",
    content: {
      intro: "Plumbing work ranges from simple repairs to complex whole-house repiping. Our plumbing estimate template helps you create detailed proposals that specify fixtures, materials (copper vs. PEX), and labor for any project. Build client trust with transparent, itemized estimates.",
      whatIsIncluded: [
        "Labor hours by task type",
        "Material specifications (pipe type, fixtures)",
        "Permit requirements when applicable",
        "Fixture brand and model numbers",
        "Warranty information",
        "Cleanup and disposal",
      ],
      whyUseGenerator: "Plumbing estimates need to account for accessibility, existing conditions, and potential surprises. Our template includes common line items and contingency guidance to ensure you're covered if conditions differ from expectations.",
      howItWorks: [
        "Select project type (water heater, repipe, fixtures, etc.)",
        "Specify materials and fixture selections",
        "Add labor hours based on complexity",
        "Generate detailed estimate with specifications",
      ],
      commonProjects: [
        { name: "Water Heater Replacement", priceRange: "$1,500 - $4,000" },
        { name: "Whole House Repipe", priceRange: "$8,000 - $18,000" },
        { name: "Bathroom Rough-In", priceRange: "$3,000 - $8,000" },
        { name: "Tankless Water Heater", priceRange: "$3,000 - $6,000" },
      ],
    },
    faqs: [
      {
        question: "Should I charge hourly or by the job for plumbing?",
        answer: "Service calls and repairs often work well with hourly rates ($85-150/hour). Larger defined projects like water heater installation or repiping are typically priced as flat-rate jobs for predictability."
      },
      {
        question: "How do I estimate repiping costs?",
        answer: "Repiping costs depend on home size, number of fixtures, accessibility, and pipe material choice (copper vs. PEX). PEX is typically 30-40% less than copper in labor costs due to faster installation."
      },
    ],
    relatedPages: ["hvac-estimate-template", "bathroom-remodel-estimate-template", "contractor-estimate-generator"],
  },
  "electrical-estimate-template": {
    slug: "electrical-estimate-template",
    title: "Free Electrical Estimate Template",
    metaTitle: "Electrical Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free electrical estimate template for contractors. Professional templates for panel upgrades, rewiring, lighting, and EV charger installation. Code compliance included.",
    h1: "Free Electrical Estimate Template",
    heroSubtitle: "Create detailed electrical estimates for panel upgrades, rewiring, lighting installation, and EV chargers. Include permit costs and code compliance requirements.",
    priceRange: "$300 - $15,000+",
    ctaText: "Create Electrical Estimate",
    ctaUrl: "/app?trade=electrical",
    content: {
      intro: "Electrical work requires precision in both execution and documentation. Our electrical estimate template helps you create professional proposals that detail circuit specifications, material requirements, permit costs, and code compliance. Show clients you're a professional they can trust with their home's electrical system.",
      whatIsIncluded: [
        "Wire gauge and circuit specifications",
        "Panel capacity and breaker requirements",
        "Fixture counts and specifications",
        "Permit fees and inspection scheduling",
        "Labor hours by task",
        "Code compliance documentation",
      ],
      whyUseGenerator: "Electrical work is highly regulated, and missing code requirements can be costly. Our template ensures you include proper specifications and helps you communicate technical details in terms clients understand.",
      howItWorks: [
        "Select project type (panel upgrade, rewiring, outlets, etc.)",
        "Specify circuit and amperage requirements",
        "Add fixtures, devices, and material counts",
        "Generate estimate with code compliance notes",
      ],
      commonProjects: [
        { name: "Electrical Panel Upgrade", priceRange: "$2,500 - $5,000" },
        { name: "Whole House Rewiring", priceRange: "$8,000 - $18,000" },
        { name: "EV Charger Installation", priceRange: "$800 - $2,500" },
        { name: "Recessed Lighting Package", priceRange: "$1,200 - $4,000" },
      ],
    },
    faqs: [
      {
        question: "Should electrical estimates include permit costs?",
        answer: "Yes, always include permit fees in your estimate—typically $75-300 depending on scope and jurisdiction. This prevents surprises and shows professionalism. Note when permits are required vs. optional."
      },
      {
        question: "How do I price electrical work?",
        answer: "Electrical work is typically priced by the circuit, outlet, or fixture plus a base labor charge. Panel work is usually a flat rate. Our template helps you build pricing based on industry standards and your local market."
      },
    ],
    relatedPages: ["hvac-estimate-template", "contractor-estimate-generator", "roofing-estimate-template"],
  },
  "flooring-estimate-template": {
    slug: "flooring-estimate-template",
    title: "Free Flooring Estimate Template",
    metaTitle: "Flooring Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free flooring estimate template for contractors. Professional templates for hardwood, tile, LVP, and carpet installation. Material and labor calculations included.",
    h1: "Free Flooring Estimate Template",
    heroSubtitle: "Create accurate flooring estimates with material calculations and waste factors. Templates for hardwood, tile, luxury vinyl, carpet, and refinishing.",
    priceRange: "$2,000 - $20,000+",
    ctaText: "Create Flooring Estimate",
    ctaUrl: "/app?trade=flooring",
    content: {
      intro: "Flooring estimates require precise measurements and accurate material calculations including waste factors. Our flooring estimate template helps you create professional proposals that detail square footage, material costs, transition strips, and installation labor. Never underbid a flooring job again.",
      whatIsIncluded: [
        "Square footage with waste factor",
        "Material specifications and pricing",
        "Underlayment requirements",
        "Transition strips and quarter-round",
        "Removal of existing flooring",
        "Subfloor prep if needed",
        "Installation labor",
      ],
      whyUseGenerator: "Flooring installation has tight margins, and underestimating materials or labor can wipe out your profit. Our template calculates proper waste factors (10-20% depending on pattern) and ensures you include all associated costs like transitions and trim.",
      howItWorks: [
        "Enter room dimensions or total square footage",
        "Select flooring type (hardwood, tile, LVP, carpet)",
        "Add waste factor based on layout complexity",
        "Generate estimate with material list and labor",
      ],
      commonProjects: [
        { name: "Hardwood Installation", priceRange: "$6 - $15 per sq ft installed" },
        { name: "Luxury Vinyl Plank (LVP)", priceRange: "$4 - $10 per sq ft installed" },
        { name: "Tile Flooring", priceRange: "$8 - $20 per sq ft installed" },
        { name: "Carpet Installation", priceRange: "$3 - $8 per sq ft installed" },
      ],
    },
    faqs: [
      {
        question: "What waste factor should I use for flooring?",
        answer: "Use 10% for standard rectangular rooms with straight layouts. Increase to 15% for diagonal patterns and 20% for complex rooms with many angles or herringbone patterns. Always round up material orders."
      },
      {
        question: "Should I include furniture moving in flooring estimates?",
        answer: "Specify whether furniture moving is included. Many contractors charge extra for furniture moving or require rooms to be empty. Being clear prevents disputes and ensures you're compensated for the work."
      },
    ],
    relatedPages: ["bathroom-remodel-estimate-template", "kitchen-remodel-estimate-template", "contractor-estimate-generator"],
  },
  "painting-estimate-template": {
    slug: "painting-estimate-template",
    title: "Free Painting Estimate Template",
    metaTitle: "Painting Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free painting estimate template for contractors. Professional templates for interior, exterior, and cabinet painting. Square footage pricing with prep work included.",
    h1: "Free Painting Estimate Template",
    heroSubtitle: "Create detailed painting estimates with prep work, primer, and finish coat specifications. Templates for interior rooms, exterior painting, and cabinet refinishing.",
    priceRange: "$500 - $15,000+",
    ctaText: "Create Painting Estimate",
    ctaUrl: "/app?trade=painting",
    content: {
      intro: "Painting estimates need to account for surface conditions, prep work, and quality expectations. Our painting estimate template helps you create professional proposals that detail prep, primer, finish coats, and paint specifications. Include everything from patching to final touch-ups.",
      whatIsIncluded: [
        "Surface preparation (patching, sanding, caulking)",
        "Primer requirements",
        "Number of finish coats",
        "Paint brand and sheen specifications",
        "Trim and door painting",
        "Ceiling painting if included",
        "Prep and cleanup",
      ],
      whyUseGenerator: "Painting margins depend on accurate estimation of surface area and prep time. Underestimating prep work on older homes can turn a profitable job into a loss. Our template guides you through comprehensive scoping.",
      howItWorks: [
        "Select project type (interior, exterior, cabinets)",
        "Enter room count or square footage",
        "Specify surface conditions and prep needs",
        "Generate estimate with material and labor",
      ],
      commonProjects: [
        { name: "Single Room Interior", priceRange: "$400 - $900" },
        { name: "Whole House Interior", priceRange: "$3,000 - $10,000" },
        { name: "Exterior House Painting", priceRange: "$4,000 - $15,000" },
        { name: "Cabinet Painting", priceRange: "$2,500 - $7,000" },
      ],
    },
    faqs: [
      {
        question: "How do painters calculate estimates?",
        answer: "Painting is typically priced per square foot of paintable surface or per room for interiors. Exterior work is usually priced by total square footage. Our template helps you calculate based on industry production rates."
      },
      {
        question: "Should prep work be itemized separately?",
        answer: "Yes, itemizing prep work helps clients understand the value and allows you to charge appropriately for difficult surfaces. It also protects you if additional prep is discovered during the project."
      },
    ],
    relatedPages: ["contractor-estimate-generator", "bathroom-remodel-estimate-template", "flooring-estimate-template"],
  },
  "drywall-estimate-template": {
    slug: "drywall-estimate-template",
    title: "Free Drywall Estimate Template",
    metaTitle: "Drywall Estimate Template | Free Contractor Template 2025",
    metaDescription: "Free drywall estimate template for contractors. Professional templates for new installation, repairs, and texturing. Finishing level specifications included.",
    h1: "Free Drywall Estimate Template",
    heroSubtitle: "Create professional drywall estimates with board counts, finishing levels, and texture specifications. Templates for new installation, repairs, and basement finishing.",
    priceRange: "$800 - $15,000+",
    ctaText: "Create Drywall Estimate",
    ctaUrl: "/app?trade=drywall",
    content: {
      intro: "Drywall estimates require calculating board counts, joint compound, and labor for hanging and finishing. Our drywall estimate template helps you create detailed proposals that specify finishing levels (0-5), texture type, and all materials. Prevent scope creep by being specific upfront.",
      whatIsIncluded: [
        "Drywall sheet count and size",
        "Finishing level specification (0-5)",
        "Texture type and application",
        "Corner bead and joint compound",
        "Labor for hanging, taping, finishing",
        "Sanding and cleanup",
      ],
      whyUseGenerator: "Drywall finishing quality varies significantly by level—and so does price. Our template helps you clearly communicate finishing expectations and price accordingly for the quality your clients want.",
      howItWorks: [
        "Enter wall and ceiling square footage",
        "Select drywall thickness",
        "Specify finishing level required",
        "Generate estimate with material and labor",
      ],
      commonProjects: [
        { name: "Room Addition Drywall", priceRange: "$1,500 - $4,000" },
        { name: "Basement Finishing", priceRange: "$5,000 - $15,000" },
        { name: "Garage Drywall", priceRange: "$2,000 - $5,000" },
        { name: "Drywall Repair", priceRange: "$200 - $1,000" },
      ],
    },
    faqs: [
      {
        question: "What are drywall finishing levels?",
        answer: "Levels range from 0 (no finishing) to 5 (perfect smooth walls for high-gloss paint). Most residential work is Level 4. Our template explains each level so clients can make informed choices about quality and cost."
      },
      {
        question: "How do I price drywall by the sheet vs. square foot?",
        answer: "Both methods work—square footage is easier for clients to understand. A standard 4x8 sheet covers 32 sq ft. Include waste (5-10%) and remember that 4x12 sheets reduce seams but cost more."
      },
    ],
    relatedPages: ["painting-estimate-template", "contractor-estimate-generator", "bathroom-remodel-estimate-template"],
  },
};

// Get all landing page slugs for sitemap and static generation
export const getLandingPageSlugs = () => Object.keys(landingPagesData);

// Get landing page data by slug
export const getLandingPageBySlug = (slug: string) => landingPagesData[slug];
