'use client';
import { useEffect } from "react";
import Layout from "@/components/layout";
import { Link } from "wouter";
import { ArrowRight, CheckCircle2, Clock, FileText, Download, Shield, AlertTriangle } from "lucide-react";

interface TemplateData {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  painIntro: string;
  exampleScope: string[];
  checklist: string[];
  estimateRange: string;
  timeframe: string;
}

const templateData: Record<string, TemplateData> = {
  "bathroom-remodel-proposal-template": {
    slug: "bathroom",
    title: "Bathroom Remodel Proposal Template | Free Scope of Work Generator | ScopeGen",
    metaDescription: "Free bathroom remodel proposal template with scope of work, pricing, and timeline. Generate professional bathroom renovation estimates in 60 seconds.",
    h1: "Bathroom Remodel Proposal Template",
    painIntro: "Writing a bathroom remodel proposal from scratch takes hours. You need to list every demolition task, fixture, tile selection, plumbing update, and finish detail—then price it accurately so you don't lose money. Most contractors either underbid (losing profit) or overbid (losing the job). A professional template solves both problems.",
    exampleScope: [
      "Demolish and remove existing tub, vanity, toilet, and flooring",
      "Rough-in plumbing for new shower valve and drain location",
      "Install cement board backer on shower walls",
      "Tile shower walls with 12x24 porcelain tile in running bond pattern",
      "Install acrylic shower pan with linear drain",
      "Set new 36\" vanity with quartz countertop and undermount sink",
      "Install new elongated toilet (Kohler or equivalent)",
      "Install LVP flooring throughout bathroom",
      "Paint walls and ceiling with moisture-resistant paint",
      "Install new light fixtures, exhaust fan, and GFCI outlets"
    ],
    checklist: [
      "Client name and job site address",
      "Detailed scope of work with materials specified",
      "Itemized pricing (labor + materials)",
      "Project timeline with start and completion dates",
      "Payment schedule (deposit, progress, final)",
      "Warranty terms (typically 1-2 years on workmanship)",
      "Exclusions list (what's NOT included)",
      "Permit requirements noted",
      "Change order policy",
      "Signature lines for contractor and homeowner"
    ],
    estimateRange: "$8,500 - $28,000",
    timeframe: "5-10 business days"
  },
  "roofing-proposal-template": {
    slug: "roofing",
    title: "Roofing Proposal Template | Free Estimate Generator for Roofers | ScopeGen",
    metaDescription: "Free roofing proposal template with tear-off, materials, and warranty details. Generate professional roofing estimates and quotes in 60 seconds.",
    h1: "Roofing Proposal Template",
    painIntro: "A roofing proposal needs to cover tear-off, decking inspection, underlayment, shingle specs, flashing, ventilation, and cleanup—plus warranty details that protect you legally. Miss one item and you're eating the cost. Homeowners compare multiple bids, so your proposal also needs to look professional and build trust fast.",
    exampleScope: [
      "Remove existing shingles, underlayment, and flashing down to decking",
      "Inspect roof decking; replace damaged sections as needed (up to 2 sheets included)",
      "Install synthetic underlayment over entire roof surface",
      "Install ice and water shield in valleys and at eaves (first 3 feet)",
      "Install new drip edge at eaves and rakes",
      "Install GAF Timberline HDZ architectural shingles (30-year warranty)",
      "Flash all penetrations: vents, pipes, skylights",
      "Install new ridge cap shingles",
      "Replace existing roof vents with new matching vents",
      "Complete cleanup with magnetic nail sweep; haul away all debris"
    ],
    checklist: [
      "Property address and roof measurements (squares)",
      "Shingle brand, style, and color selection",
      "Underlayment and ice barrier specifications",
      "Decking repair allowance and overage pricing",
      "Flashing and ventilation details",
      "Manufacturer warranty terms",
      "Workmanship warranty (separate from materials)",
      "Permit and inspection requirements",
      "Payment terms and schedule",
      "Start date and estimated completion"
    ],
    estimateRange: "$8,000 - $25,000",
    timeframe: "2-5 business days"
  },
  "hvac-proposal-template": {
    slug: "hvac",
    title: "HVAC Proposal Template | Free AC & Furnace Estimate Generator | ScopeGen",
    metaDescription: "Free HVAC proposal template for AC installation, furnace replacement, and system upgrades. Generate professional HVAC estimates in 60 seconds.",
    h1: "HVAC Proposal Template",
    painIntro: "HVAC proposals are technical—you need equipment specs, SEER ratings, tonnage calculations, ductwork details, and warranty info. Homeowners rarely understand the difference between a $4,000 and $12,000 system, so your proposal needs to explain value clearly. A good template makes you look like the expert you are.",
    exampleScope: [
      "Remove and dispose of existing AC condenser and evaporator coil",
      "Install new 3-ton, 16 SEER Carrier AC condenser unit",
      "Install matching evaporator coil in existing plenum",
      "Replace refrigerant line set with new insulated lines",
      "Install new condensate drain line with safety float switch",
      "Install new programmable thermostat (Honeywell or equivalent)",
      "Verify proper airflow and refrigerant charge",
      "Test system operation in cooling and heating modes",
      "Register equipment warranty with manufacturer",
      "Clean up work area and haul away old equipment"
    ],
    checklist: [
      "Existing system assessment and issues",
      "New equipment brand, model, and specifications",
      "SEER rating and efficiency details",
      "Tonnage and sizing calculations",
      "Ductwork modifications (if any)",
      "Thermostat type and features",
      "Electrical requirements",
      "Manufacturer warranty details",
      "Labor warranty terms",
      "Rebate eligibility (utility/manufacturer)"
    ],
    estimateRange: "$4,500 - $15,000",
    timeframe: "1-2 business days"
  },
  "plumbing-scope-of-work": {
    slug: "plumbing",
    title: "Plumbing Scope of Work Template | Free Plumber Proposal Generator | ScopeGen",
    metaDescription: "Free plumbing scope of work template for water heaters, repipes, and fixture installations. Generate professional plumbing proposals in 60 seconds.",
    h1: "Plumbing Scope of Work Template",
    painIntro: "Plumbing proposals need precision—pipe materials, fixture brands, valve locations, permit requirements, and warranty terms. A vague scope leads to disputes when the homeowner expects something you didn't quote. Protect your profit and reputation with a detailed scope of work that leaves nothing to interpretation.",
    exampleScope: [
      "Disconnect and remove existing 40-gallon gas water heater",
      "Install new 50-gallon Rheem gas water heater with expansion tank",
      "Replace water supply lines with new braided stainless connectors",
      "Install new gas flex line with proper shut-off valve",
      "Upgrade T&P relief valve discharge to code-compliant termination",
      "Install seismic strapping per local code requirements",
      "Test all connections for leaks; verify proper operation",
      "Set thermostat to 120°F and verify hot water at fixtures",
      "Dispose of old water heater at appropriate facility",
      "Obtain permit and schedule required inspection"
    ],
    checklist: [
      "Job site address and access notes",
      "Existing plumbing condition and issues",
      "Fixture or equipment brand and model",
      "Pipe material specifications (PEX, copper, etc.)",
      "Permit requirements and inspection",
      "Shut-off valve locations",
      "Code compliance notes",
      "Warranty terms (parts and labor)",
      "Payment schedule",
      "Emergency contact information"
    ],
    estimateRange: "$1,200 - $15,000",
    timeframe: "1-3 business days"
  }
};

interface SEOTemplatePageProps {
  templateSlug: string;
}

export default function SEOTemplatePage({ templateSlug }: SEOTemplatePageProps) {
  const data = templateData[templateSlug];

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
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Template not found</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <article className="bg-white">
        <header className="bg-primary text-white py-16 sm:py-24">
          <div className="max-w-[90vw] xl:max-w-[80vw] mx-auto px-4 sm:px-8">
            <div className="max-w-4xl">
              <div className="flex items-center gap-2 text-secondary text-sm font-medium mb-4">
                <FileText className="w-4 h-4" />
                <span>FREE TEMPLATE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6">
                {data.h1}
              </h1>
              <p className="text-xl sm:text-2xl text-primary-foreground/80 mb-8 leading-relaxed">
                Generate this proposal in 60 seconds with ScopeGen. No more copy-pasting from Word docs.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link 
                  href="/app"
                  className="inline-flex items-center justify-center h-14 px-8 rounded-md bg-secondary text-slate-900 font-bold text-lg hover:bg-white transition-all"
                  data-testid="button-generate-now"
                >
                  Generate This Proposal
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <a 
                  href="#example"
                  className="inline-flex items-center justify-center h-14 px-8 rounded-md border border-white/30 text-white font-medium hover:bg-white/10 transition-all"
                >
                  See Example Scope
                </a>
              </div>
            </div>
          </div>
        </header>

        <section className="py-16 sm:py-20 border-b border-slate-100">
          <div className="max-w-[90vw] xl:max-w-[80vw] mx-auto px-4 sm:px-8">
            <div className="max-w-4xl">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-4">
                    The Problem with DIY Proposals
                  </h2>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {data.painIntro}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="example" className="py-16 sm:py-20 bg-slate-50">
          <div className="max-w-[90vw] xl:max-w-[80vw] mx-auto px-4 sm:px-8">
            <div className="max-w-4xl">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-2">
                Example Scope of Work
              </h2>
              <p className="text-slate-600 mb-8">
                Here's what a professional {data.h1.toLowerCase().replace(' template', '')} looks like:
              </p>
              
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-primary p-4 text-white">
                  <div className="text-sm font-medium text-primary-foreground/70">SCOPE OF WORK</div>
                  <div className="font-bold">{data.h1.replace(' Template', '')}</div>
                </div>
                <div className="p-6 sm:p-8">
                  <ul className="space-y-3">
                    {data.exampleScope.map((item, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-slate-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="mt-8 pt-6 border-t border-slate-200 grid sm:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Typical Price Range</div>
                      <div className="text-2xl font-bold text-slate-900">{data.estimateRange}</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-500 mb-1">Typical Timeline</div>
                      <div className="text-2xl font-bold text-slate-900">{data.timeframe}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link 
                  href="/app"
                  className="inline-flex items-center justify-center h-12 px-6 rounded-md bg-secondary text-slate-900 font-bold hover:bg-secondary/90 transition-all"
                  data-testid="button-generate-scope"
                >
                  Generate This Scope in 60 Seconds
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="max-w-[90vw] xl:max-w-[80vw] mx-auto px-4 sm:px-8">
            <div className="max-w-4xl">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-slate-900 mb-2">
                Proposal Checklist
              </h2>
              <p className="text-slate-600 mb-8">
                Every professional proposal should include these elements:
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {data.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-slate-50 rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      {i + 1}
                    </div>
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 bg-primary text-white">
          <div className="max-w-[90vw] xl:max-w-[80vw] mx-auto px-4 sm:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-heading font-bold mb-4">
              Stop Writing Proposals From Scratch
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              ScopeGen generates this entire proposal—scope, pricing, timeline, and warranty—in about 60 seconds. Built specifically for contractors.
            </p>
            <div className="flex flex-wrap justify-center gap-6 mb-10">
              <div className="flex items-center gap-2 text-primary-foreground/70">
                <Clock className="w-5 h-5 text-secondary" />
                <span>60-Second Proposals</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/70">
                <Download className="w-5 h-5 text-secondary" />
                <span>PDF Download</span>
              </div>
              <div className="flex items-center gap-2 text-primary-foreground/70">
                <Shield className="w-5 h-5 text-secondary" />
                <span>E-Signature Included</span>
              </div>
            </div>
            <Link 
              href="/app"
              className="inline-flex items-center justify-center h-14 lg:h-16 px-10 lg:px-14 rounded-md bg-secondary text-slate-900 font-bold text-lg lg:text-xl hover:bg-white transition-all"
              data-testid="button-generate-cta"
            >
              Generate This Proposal Free
              <ArrowRight className="ml-2 w-5 h-5 lg:w-6 lg:h-6" />
            </Link>
            <p className="mt-4 text-primary-foreground/60 text-sm">Free preview • No credit card required</p>
          </div>
        </section>
      </article>
    </Layout>
  );
}

export const templateSlugs = Object.keys(templateData);
