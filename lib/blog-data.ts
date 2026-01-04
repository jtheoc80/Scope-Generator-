export interface BlogPostFAQ {
  question: string;
  answer: string;
}

export interface AuthorInfo {
  name: string;
  credentials: string;
  avatar?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: AuthorInfo;
  datePublished: string;
  dateModified: string;
  readTime: string;
  category: string;
  tags: string[];
  metaTitle: string;
  metaDescription: string;
  heroImage?: string;
  heroImageAlt?: string;
  ogImage?: string;
  canonical?: string;
  content: string[];
  faqs?: BlogPostFAQ[];
}

// Category hero image defaults
export const categoryHeroImages: Record<string, string> = {
  'Proposal Writing': '/images/blog/categories/proposal-writing-hero.jpg',
  'Business Tips': '/images/blog/categories/business-tips-hero.jpg',
  'Templates': '/images/blog/categories/templates-hero.jpg',
  'Pricing': '/images/blog/categories/pricing-hero.jpg',
};

export const blogPosts: Record<string, BlogPost> = {
  "how-to-write-bathroom-remodel-proposal": {
    slug: "how-to-write-bathroom-remodel-proposal",
    title: "How to Write a Bathroom Remodel Proposal That Actually Wins Jobs",
    excerpt: "Most bathroom proposals lose because they're vague about scope. Here's the line-by-line breakdown I use to close 40% of my bids—plus the exact template.",
    author: {
      name: "Mike Torres",
      credentials: "15-year remodeling contractor, GC license #847293",
    },
    datePublished: "December 5, 2025",
    dateModified: "January 3, 2026",
    readTime: "8 min read",
    category: "Proposal Writing",
    tags: ["bathroom remodel", "scope of work", "proposal template", "bid winning"],
    metaTitle: "How to Write a Bathroom Remodel Proposal | Contractor Guide 2026",
    metaDescription: "Line-by-line bathroom remodel proposal template from a 15-year contractor. Includes scope examples, pricing breakdown, and the exact format that wins jobs.",
    heroImage: "/images/blog/bathroom-remodel/hero.jpg",
    heroImageAlt: "Bathroom remodel in progress showing tile installation",
    content: [
      "Last month I lost a $28,000 bathroom job to a guy who charged $4,000 more than me. The homeowner told me later: \"His proposal just felt more professional.\" That stung—but it taught me everything I know about writing proposals that close.",
      
      "## The Real Reason Most Proposals Fail",
      
      "I've reviewed hundreds of contractor proposals over the years. The #1 problem? They're vague. \"Demo existing bathroom\" doesn't tell a homeowner anything. Demo what? Down to studs? What about the subfloor? The window trim?",
      
      "When your proposal is vague, homeowners assume two things: (1) you haven't thought it through, and (2) you're going to hit them with change orders later. Neither wins you the job.",
      
      "## The 7 Sections Every Bathroom Proposal Needs",
      
      "Here's my exact framework. I've used this on over 200 bathroom jobs ranging from $8K powder room refreshes to $65K master bath gut-renos.",
      
      "### 1. Project Summary (2-3 sentences)",
      
      "State exactly what you're doing in plain English. Example: \"Complete gut renovation of master bathroom including new tile shower with linear drain, freestanding soaking tub, double vanity, and heated floors. All new plumbing fixtures and electrical.\"",
      
      "### 2. Demolition Scope",
      
      "Be surgical here. List every single thing you're removing:",
      
      "- Remove existing vanity, countertop, and plumbing connections\n- Remove toilet and cap waste line\n- Remove tub/shower unit including drain assembly\n- Demo tile flooring down to subfloor (verify condition)\n- Remove drywall in wet areas to studs\n- Leave window frame in place (see exclusions)\n- Haul all debris—included in price, no extra dump fees",
      
      "That last line matters. I've seen guys lose jobs because homeowners assumed they'd have a dumpster in their driveway for a month.",
      
      "### 3. Rough-In Work (Plumbing & Electrical)",
      
      "This is where most proposals fall apart. You need to specify:",
      
      "**Plumbing:**\n- Install new 2\" drain for shower with linear drain conversion\n- Move water supply lines 18\" left for new vanity location\n- Rough-in for freestanding tub (deck-mount filler)\n- New angle stops at all fixtures",
      
      "**Electrical:**\n- Install dedicated 20A circuit for bathroom\n- Add GFCI protection at vanity (NEC 2023 compliant)\n- Rough-in for heated floor thermostat\n- Relocate existing exhaust fan to shower area",
      
      "### 4. Installation Scope (The Meat)",
      
      "This section should read like a recipe. Be specific:",
      
      "**Shower:**\n- Cement board substrate on all walls\n- Kerdi waterproofing membrane (10-year warranty)\n- 12×24 porcelain tile on walls—Client Selection from ABC Tile ($8/sf allowance)\n- 2×2 mosaic floor tile with linear drain\n- Frameless glass enclosure (by others—see exclusions)\n\n**Flooring:**\n- Schluter Ditra-Heat electric system (45 sf)\n- Programmable thermostat with floor sensor\n- Same 12×24 tile as shower walls\n\n**Fixtures:**\n- 60\" Kohler Underscore freestanding tub (Model K-1136-0)\n- Riobel deck-mount tub filler in brushed nickel\n- Kohler Cimarron toilet (comfort height, elongated)\n- 60\" double vanity—Client providing",
      
      "Notice I include model numbers where I know them. This prevents the \"I thought I was getting the nicer one\" conversation.",
      
      "### 5. Materials & Allowances",
      
      "Break this out clearly. Homeowners appreciate knowing where their money goes:",
      
      "**Included Materials:**\n- Cement board, Kerdi membrane, thin-set, grout\n- All plumbing rough-in materials (PEX, fittings, valves)\n- Electrical wire, boxes, GFCI receptacles\n- Ditra-Heat mat and thermostat\n\n**Client-Provided (installed by us):**\n- Vanity cabinet\n- Countertop (installed by fabricator)\n\n**Allowances:**\n- Tile: $2,400 ($8/sf × 300 sf)\n- Plumbing fixtures (faucets, showerhead): $1,200\n- Light fixtures: $600\n\nTotal allowance: $4,200. Overages billed at cost + 15%. Credits issued for underages.",
      
      "### 6. Timeline & Payment Schedule",
      
      "Give real dates, not \"4-6 weeks.\"",
      
      "**Schedule:**\n- Demo & rough-in: Jan 15-19 (5 days)\n- Inspections: Jan 22\n- Tile & waterproofing: Jan 23-Feb 2 (8 days including cure time)\n- Fixture install: Feb 5-9 (4 days)\n- Final punch & walkthrough: Feb 12",
      
      "**Payments:**\n- 30% at contract signing ($9,450)\n- 30% at rough-in inspection ($9,450)\n- 30% at tile completion ($9,450)\n- 10% at final walkthrough ($3,150)",
      
      "### 7. What's NOT Included",
      
      "This section saves you from scope creep and awkward conversations:",
      
      "**Exclusions:**\n- Permit fees (typically $350-500 in this county)\n- Frameless glass shower enclosure (recommend ABC Glass, ~$1,800)\n- Countertop fabrication and install\n- Painting (we prep only)\n- Mold remediation if discovered (will quote separately)\n- Window replacement\n- Any work outside bathroom footprint",
      
      "## A Real Pricing Example",
      
      "Here's how I'd price a typical master bath gut-reno in the Denver metro area (adjust 15-20% for coastal markets):",
      
      "| Category | Cost |\n|----------|------|\n| Demo & haul | $1,200 |\n| Plumbing rough-in | $2,800 |\n| Electrical rough-in | $1,400 |\n| Cement board & waterproofing | $1,600 |\n| Tile labor (walls + floor) | $4,200 |\n| Heated floor install | $1,100 |\n| Fixture installation | $1,800 |\n| Trim carpentry | $800 |\n| Materials (non-allowance) | $3,200 |\n| **Subtotal** | **$18,100** |\n| Overhead (12%) | $2,172 |\n| Profit (15%) | $3,041 |\n| **Contractor Total** | **$23,313** |\n| Allowances | $4,200 |\n| **Project Total** | **$27,513** |",
      
      "Round it to $27,500 or $28,000 depending on your market. This math is transparent—homeowners can see exactly how you got there.",
      
      "## The Mistakes I See Every Week",
      
      "After 15 years, these still kill proposals:",
      
      "- **\"Materials TBD\"** — Feels like you're hiding something. Even if you don't know exact selections, give ranges.\n- **No permit mention** — Homeowners Google and learn permits cost money. Address it upfront.\n- **Vague timelines** — \"4-6 weeks\" means nothing. If you can't commit to dates, explain why (permit lead times, material ordering).\n- **Missing warranty info** — I guarantee labor for 2 years, manufacturer warranties pass through. Say it.\n- **Handwritten on scrap paper** — I've literally seen this. In 2024. Use software or at least a typed PDF.",
      
      "## Using Tech to Speed This Up",
      
      "I used to spend 2-3 hours per proposal. Now I use [ScopeGen](/app) to get a professional draft in about 10 minutes. The AI knows what to include for each trade, and I customize from there.",
      
      "The ROI is simple: if it takes me 15 minutes instead of 2 hours, I can bid on 8x more jobs. Even if my close rate stays flat, that's a lot more work.",
      
      "## Quick Proposal Checklist",
      
      "Before you send any bathroom proposal, verify you've covered:",
      
      "- [ ] Project summary in plain English\n- [ ] Every demo item listed\n- [ ] Plumbing scope with fixture locations\n- [ ] Electrical with circuit/outlet details\n- [ ] All tile specified with allowance amounts\n- [ ] Fixture makes/models where known\n- [ ] Realistic timeline with dates\n- [ ] Payment schedule totaling 100%\n- [ ] Clear exclusions list\n- [ ] Your warranty terms\n- [ ] Contact info and license number",
      
      "Print this out and tape it to your wall. Seriously.",
      
      "## Bottom Line",
      
      "A bathroom proposal isn't paperwork—it's a sales tool. The more specific you are, the more professional you appear, and the more trust you build. Homeowners will pay more for a contractor they trust to do the job right.",
      
      "Start with this framework, customize it for your trade and market, and watch your close rate climb.",
    ],
    faqs: [
      {
        question: "How long should a bathroom remodel proposal be?",
        answer: "3-5 pages is the sweet spot. Long enough to be thorough, short enough that they'll actually read it. My proposals average 4 pages: 1 page project summary, 2 pages scope, 1 page pricing and terms."
      },
      {
        question: "Should I include photos of past work?",
        answer: "Absolutely—but be strategic. Include 3-4 photos of similar projects, not a 20-image portfolio dump. I create a separate \"Past Work\" PDF I offer to send if they want to see more."
      },
      {
        question: "How do I handle change orders in my proposal?",
        answer: "Address it upfront: 'Changes to scope require written change order signed by both parties. Change orders priced at cost plus 15% markup and may affect timeline.' This isn't aggressive—it's professional."
      },
      {
        question: "What if the homeowner wants me to match a lower bid?",
        answer: "I don't negotiate against unknown bids. Instead, I ask: 'Can I see their scope?' Usually the lower bid is missing things. If their scope matches mine and they're just cheaper, they probably need the work more than I do."
      },
      {
        question: "Should I present proposals in person or email them?",
        answer: "In person when possible—your close rate will be 2-3x higher. Walk them through each section. If they need time, leave a printed copy and follow up in 48 hours. Never just email and wait."
      }
    ]
  },

  "contractor-pricing-guide-2025": {
    slug: "contractor-pricing-guide-2025",
    title: "Contractor Pricing Guide 2025: How to Price Your Services Profitably",
    excerpt: "If you want a price that wins jobs and protects profit, you need your real job cost, a target profit margin, and a clean way to present the price so clients trust it.",
    author: "ScopeGen Team",
    date: "January 2, 2026",
    readTime: "12 min read",
    category: "Business Tips",
    metaTitle: "Contractor Pricing Guide 2025 (Updated): Markup, Margin, Break-Even + Trade Benchmarks",
    metaDescription: "Learn how to price contractor jobs profitably in 2025: markup vs margin, break-even rate, regional adjustments, pricing strategies, and trade benchmarks. Includes examples and templates.",
    heroImage: "/blog/contractor-pricing-guide-2025/hero.svg",
    ogImage: "/blog/contractor-pricing-guide-2025/og.svg",
    content: [
      "**If you want a price that wins jobs *and* protects profit, you need 3 things:** 1) your real job cost (labor + materials + overhead), 2) a target profit margin, 3) a clean way to present the price so clients trust it.",
      "This guide gives you a simple pricing system you can repeat on every job—whether you do bathrooms, roofing, HVAC, plumbing, or electrical.",
      "## Quick definitions (this mistake costs contractors a lot)",
      "Most pricing confusion starts with one mix-up: **markup vs margin**.",
      "### Markup vs margin (not the same)",
      "- **Markup** = what you add to cost to get price\n- **Margin** = profit as a % of the selling price",
      "**Example:** Job cost: $10,000 → Price: $15,000 → Profit: $5,000",
      "Markup = $5,000 ÷ $10,000 = **50%**. Margin = $5,000 ÷ $15,000 = **33%**.",
      "**Rule of thumb:** If you want a 30% margin, you usually need a markup higher than 30%.",
      "## Step 1: Know the true cost of a job (most people undercount)",
      "To price correctly, you need **direct costs** *and* **indirect costs**.",
      "### Direct costs (job-specific)",
      "- Materials and freight\n- Labor (including payroll taxes, burden, OT risk)\n- Subs\n- Permits / disposal / rentals",
      "### Indirect costs (overhead you must recover)",
      "- Vehicles, fuel, insurance, tools, maintenance\n- Office/admin, software, bookkeeping\n- Marketing (leads aren't free)\n- Unbillable time (estimates, driving, callbacks)",
      "**Pro tip:** If your price only covers materials + labor, overhead eats your profit.",
      "## Step 2: Calculate your break-even rate (your pricing floor)",
      "This is the number that prevents \"busy but broke.\"",
      "### Break-even hourly rate formula",
      "**Annual overhead ÷ realistic billable hours = overhead per billable hour**",
      "**Example:** Annual overhead: $60,000. Work hours: 2,000/year. Realistic billable hours after admin/drive/estimates: 1,400.",
      "$60,000 ÷ 1,400 = **$43/hr** (overhead recovery). That's *before* wages and profit.",
      "**Your floor price = labor wage + labor burden + overhead/hr + materials + subs.** Everything above that is profit (and contingency).",
      "## Step 3: Adjust for your market (region + job type)",
      "Pricing varies by cost of living and labor rates, permit complexity and inspections, material availability and delivery costs, competition and specialization level.",
      "### Simple regional adjustment starting points",
      "Use these as a starting dial, then refine with your own close rates:",
      "- **California**: +25–35%\n- **NY/NJ**: +20–30%\n- **Texas major metros**: +5–15%\n- **Florida**: +10–20%\n- **Midwest**: −5–10%\n- **Rural areas**: −10–20%",
      "If you consistently win 70%+ of bids, you're probably underpriced.",
      "## Step 4: Pick a pricing strategy that matches the job",
      "### 1) Cost-plus (best when you track costs well)",
      "Price = (labor + materials + subs) + markup. Works well for remodels with predictable scope.",
      "### 2) Fixed price (best for defined scopes)",
      "Client wants certainty. Your proposal must clearly define what's included/excluded.",
      "### 3) Value-based (best for premium work)",
      "If you sell speed (fast turnaround), cleanliness/protection of home, design help, strong warranty, or high-end finish quality…you can charge more **because you reduce risk for the homeowner.**",
      "## Step 5: Present pricing so clients trust it (and stop negotiating)",
      "Homeowners don't just buy price—they buy **clarity**.",
      "A proposal should include: scope (what you will do), materials/allowances (what's selected vs placeholder), timeline, payment schedule, warranty/standards, exclusions and change-order rules.",
      "### The \"Good / Better / Best\" structure wins",
      "Offer 3 options:",
      "- **Good:** functional, value materials\n- **Better:** upgraded materials/features (most chosen)\n- **Best:** premium finishes + add-ons + strongest warranty",
      "This increases close rate while protecting margin.",
      "## Common pricing mistakes (and the fix)",
      "### Mistake: Underpricing to win",
      "Fix: Set a minimum margin. If the job can't hit it, walk away.",
      "### Mistake: Forgetting callbacks",
      "Fix: Bake in **3–5%** for warranty/callback time (or include a clear service policy).",
      "### Mistake: Copying competitor pricing",
      "Fix: Your overhead and crew efficiency are different. Price off *your* numbers.",
      "### Mistake: Ignoring slow seasons",
      "Fix: Price for a 12-month business, not a \"good month.\"",
      "## Pricing by trade: practical 2025 benchmarks (starting points)",
      "These ranges vary widely by market and scope. Use them as sanity checks—not gospel.",
      "- **Bathroom remodel**: $200–$450 / sq ft\n- **Kitchen remodel**: $250–$500 / sq ft\n- **Roofing**: $350–$800 per square (100 sq ft)\n- **HVAC install**: $75–$150/hr + equipment\n- **Plumbing**: $85–$150/hr\n- **Electrical**: $75–$125/hr\n- **Interior painting**: $3–$7 / sq ft\n- **Flooring install**: $6–$15 / sq ft",
      "## Use technology to price faster and more accurately",
      "The contractors who grow fastest do two things: 1) **track job costing** (estimated vs actual), 2) **standardize proposals** so every estimate looks professional.",
      "If you want, you can use the ScopeGen calculator to sanity-check pricing and produce a clean proposal format in minutes.",
      "**Try the calculator →** [/calculator](/calculator)",
    ],
    faqs: [
      {
        question: "What net profit margin should contractors aim for?",
        answer: "Many healthy contractors target 8–15% net profit after all expenses (including owner pay). Your target depends on risk, warranty exposure, and how much admin burden you carry."
      },
      {
        question: "Should I charge hourly or by the job?",
        answer: "Hourly works when scope is uncertain (service/repair). Fixed price works when scope is defined (remodel/replace). Many contractors use both depending on job type."
      },
      {
        question: "How do I raise prices without losing customers?",
        answer: "Raise gradually (5–10%), improve your proposal clarity, and communicate value (warranty, process, materials, professionalism)."
      },
      {
        question: "How do I compete with lowball contractors?",
        answer: "Don't race to the bottom. Compete on trust: clear scope, strong warranty, clean communication, photos of work, and a professional proposal."
      }
    ]
  },

  "scope-of-work-template-examples": {
    slug: "scope-of-work-template-examples",
    title: "Scope of Work Templates That Prevent Change Order Fights",
    excerpt: "Every unclear scope line is a future argument. Here are the exact templates I've refined over 200+ jobs to eliminate \"I thought that was included\" disputes.",
    author: {
      name: "Sarah Chen",
      credentials: "Project Manager, 12 years residential remodeling",
    },
    datePublished: "December 1, 2025",
    dateModified: "January 3, 2026",
    readTime: "12 min read",
    category: "Templates",
    tags: ["scope of work", "contract template", "change orders", "project management"],
    metaTitle: "Scope of Work Templates for Contractors | Free Examples 2026",
    metaDescription: "Free scope of work templates that prevent disputes. Includes bathroom, kitchen, roofing, and painting examples with exact language to protect your jobs.",
    heroImage: "/images/blog/scope-templates/hero.jpg",
    heroImageAlt: "Contractor reviewing scope document with homeowner",
    content: [
      "The worst phone call I ever got was at 7am on a Saturday. Homeowner was furious because the painting crew \"didn't do the closets.\" I pulled up the scope: \"Paint all walls and ceilings in master bedroom.\" Technically correct. Practically? A disaster. We ate $400 to paint those closets and save the relationship.",
      
      "That's when I learned: if something can be interpreted two ways, a homeowner will interpret it the expensive way. Here's how I write scopes now.",
      
      "## The Scope of Work Rules I Live By",
      
      "**Rule 1: If it's obvious to you, write it down anyway.**",
      
      "\"Install toilet\" seems clear. But does that include:\n- The wax ring?\n- A new supply line?\n- Caulking the base?\n- Hauling away the old toilet?",
      
      "To you, yes. To a homeowner who's never hired a contractor? Maybe not.",
      
      "**Rule 2: Exclusions are as important as inclusions.**",
      
      "What you DON'T do matters. List it explicitly. \"Painting does not include: ceiling, trim, doors, or any surface requiring more than light sanding prep.\"",
      
      "**Rule 3: Specify brands, models, and allowances.**",
      
      "\"Install new faucet\" vs. \"Install Moen Align single-handle bathroom faucet in brushed nickel (Model 6192BN) or equivalent at same price point.\" Which one avoids the \"I wanted the $400 faucet\" conversation?",
      
      "**Rule 4: Quantities and measurements, always.**",
      
      "\"Tile shower walls\" vs. \"Tile 3 shower walls totaling 96 SF with 12×24 porcelain tile.\" The first one invites debate. The second is auditable.",
      
      "## Bathroom Remodel Scope Template",
      
      "Here's my actual template with annotations. Copy this and customize:",
      
      "### Section 1: Demolition",
      
      "```\nDEMOLITION SCOPE\n\nContractor will remove and dispose of:\n☐ Existing vanity cabinet and countertop\n☐ Existing toilet (cap flange, leave in place)\n☐ Existing tub/shower unit including:\n   - Surround walls\n   - Tub/pan\n   - Drain assembly\n   - Shower valve trim (leave valve in wall if reusable)\n☐ Existing flooring down to subfloor\n☐ Drywall behind vanity (if water damaged)\n☐ Drywall in tub/shower area to studs\n\nContractor will NOT remove:\n☐ Window or window trim\n☐ Drywall above 6' height unless water damaged\n☐ Existing light fixtures (unless replacing—see Electrical)\n☐ Medicine cabinet (unless specified)\n\nDebris disposal included in contract price. No additional dump fees.\n```",
      
      "### Section 2: Rough-In",
      
      "```\nPLUMBING ROUGH-IN\n\n☐ Install new PEX supply lines to:\n   - Shower valve (single-handle pressure balance)\n   - Vanity location (hot and cold)\n   - Toilet supply (cold only)\n☐ Install 2\" drain for shower with P-trap\n☐ Relocate toilet flange 4\" toward wall (current: 14\" from wall, new: 10\")\n☐ Install angle stops at all fixtures\n☐ Pressure test all connections\n\nNot included:\n- Moving drain locations more than 12\" from current position\n- Main line work outside bathroom\n- Water heater modifications\n\nELECTRICAL ROUGH-IN\n\n☐ Install (1) 20-amp dedicated circuit for bathroom\n☐ Install (2) GFCI outlets at vanity (NEC 2023 compliant)\n☐ Rough-in for (1) exhaust fan (wire and switch box)\n☐ Install (4) recessed light rough-ins (6\" LED housings)\n\nNot included:\n- Panel upgrades if capacity unavailable\n- Permit fees (owner responsibility)\n- Heated floor electrical (see options)\n```",
      
      "### Section 3: Installation",
      
      "```\nSHOWER INSTALLATION\n\n☐ Install cement board on all three shower walls\n☐ Waterproof with Kerdi membrane (manufacturer 10-yr warranty)\n☐ Install wall tile: [SPECIFY TILE OR ALLOWANCE]\n   Allowance: $8/SF × 72 SF = $576 for wall tile\n   Installed area: 3 walls, 8' high, 72 SF total\n☐ Install floor tile: 2×2 mosaic in color to match\n☐ Install linear drain (Quartz by ACO, 24\" brushed SS)\n☐ Install shower valve trim (provided by owner)\n☐ Install fixed showerhead and handheld combo\n☐ Apply grout and seal all tile surfaces\n\nFLOOR INSTALLATION\n\n☐ Install cement board underlayment (if subfloor in good condition)\n☐ Install tile: [SPECIFY TILE OR ALLOWANCE]\n   Allowance: $6/SF × 45 SF = $270 for floor tile\n☐ Install transition strip at door threshold\n☐ Grout and seal\n\nNote: Subfloor repairs priced separately if rot discovered.\n\nFIXTURE INSTALLATION\n\n☐ Install toilet: Kohler Cimarron K-3851-0\n   - Includes wax ring, supply line, caulk at base\n☐ Install vanity cabinet (provided by owner)\n☐ Install countertop (by countertop fabricator—not included)\n☐ Install vanity faucet (provided by owner)\n☐ Connect drain and P-trap for vanity\n☐ Install mirror (provided by owner, mounted with clips)\n☐ Install towel bar and TP holder (provided by owner)\n☐ Install exhaust fan: Panasonic FV-0511VQ1\n```",
      
      "### Section 4: Exclusions",
      
      "```\nEXCLUSIONS - NOT INCLUDED IN THIS CONTRACT\n\n☐ Permit fees (typically $400-600 in this jurisdiction)\n☐ Countertop fabrication and installation\n☐ Frameless glass shower enclosure\n☐ Painting (walls will have primer only)\n☐ Wallpaper removal\n☐ Window replacement or trim repair\n☐ Mold remediation if discovered (quoted separately)\n☐ Structural repairs if needed (quoted separately)\n☐ Work outside bathroom footprint\n☐ Final clean beyond construction debris removal\n\nOwner responsible for:\n☐ Final product selections within allowance by [DATE]\n☐ Access to water shutoff and electrical panel\n☐ Clearing bathroom of personal items before start\n```",
      
      "## Kitchen Remodel Scope Template",
      
      "Kitchens are more complex. Here's the structure I use:",
      
      "```\nKITCHEN REMODEL - SCOPE OF WORK\nProject: [Address]\nClient: [Name]\nDate: [Date]\nRevision: [#]\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n1. DEMOLITION\n\nRemove and dispose:\n• All existing base cabinets (keep uppers in place)\n• Countertops and backsplash\n• Kitchen sink and faucet\n• Dishwasher (disconnect and remove)\n• Garbage disposal\n• Existing flooring in kitchen area only (185 SF)\n\nProtection included:\n• Floor protection in adjacent rooms\n• Temporary dust barrier at kitchen openings\n• Appliance covers for refrigerator and range (staying in place)\n\n2. CABINET INSTALLATION\n\nInstall owner-provided cabinets (delivered to garage by [DATE]):\n• (14) base cabinets per plan\n• (12) wall cabinets per plan\n• (1) 36\" corner cabinet lazy susan\n• (2) drawer bases with soft-close\n• Crown molding on all wall cabinets\n• Toe kicks and fillers as needed\n\nLabor includes:\n• Shimming and leveling\n• Securing to studs\n• All hardware installation\n• Adjusting doors and drawers\n\nNot included:\n• Cabinet purchase\n• Design or layout changes after order placed\n• Additional cabinets not on original plan\n\n3. COUNTERTOP COORDINATION\n\nContractor will:\n• Template for countertop after cabinet install\n• Schedule fabricator (owner contract with ABC Stone)\n• Be present for countertop install\n• Cut and fit cooktop opening\n\nContractor will NOT:\n• Purchase or warranty countertop\n• Perform countertop installation (by fabricator)\n\n4. PLUMBING\n\n• Disconnect and reconnect kitchen sink\n• Install new sink (owner provided, undermount)\n• Install new faucet (owner provided)\n• Reconnect dishwasher drain and supply\n• Install new garbage disposal (InSinkErator Evolution)\n• Relocate gas line for range 18\" toward window\n• New angle stops under sink\n\nNot included:\n• Gas range hookup (by gas company)\n• Any work on main water line\n• Water filtration systems\n\n5. ELECTRICAL\n\n• Add (2) outlets in backsplash area per code\n• Install under-cabinet LED lighting (owner provided)\n• Relocate outlet for new refrigerator location\n• Install dedicated 20A circuit for microwave\n\nNot included:\n• Panel upgrade if required\n• Hardwired appliance connections (range, dishwasher by appliance installer)\n• Permit fees\n\n6. BACKSPLASH\n\n• Install tile backsplash from countertop to bottom of wall cabinets\n• Coverage: approximately 32 SF\n• Tile allowance: $12/SF ($384 total)\n• Includes corners, edges, and outlets\n\n7. FLOORING\n\n• Install LVP flooring in kitchen area only\n• Coverage: 185 SF\n• Product: owner-selected LVP, minimum 6mm thickness\n• Includes quarter round at cabinets\n• Transition at doorways to adjacent rooms\n\nNot included:\n• Flooring in adjacent rooms\n• Subfloor repair (priced if needed after demo)\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nALLOWANCES SUMMARY\n• Backsplash tile: $384\n• Plumbing fixtures (if not owner-provided): $0\n• Total allowance: $384\n\nOverages billed at cost + 15%\nCredits issued for any underage\n```",
      
      "## Common Scope Mistakes That Cause Problems",
      
      "After 12 years, I've seen every dispute. Here are the lines that cause fights:",
      
      "**\"Paint interior\"** → Which rooms? Walls only? Ceilings? Trim? Doors? Closets?\n\n**\"Install new flooring\"** → Material? What about transitions? Shoe molding? Moving furniture?\n\n**\"Demo bathroom\"** → To studs? Remove tile only? What about the window? Subfloor?\n\n**\"New fixtures\"** → Which fixtures? What brands? Who provides them?\n\n**\"Standard finishes\"** → Standard to whom? Be specific or use allowances.",
      
      "## Using Allowances Correctly",
      
      "Allowances let you price jobs before final selections. Here's how I structure them:",
      
      "```\nALLOWANCE: BATHROOM TILE\n\nBudget: $2,400 total\n- Wall tile: $8/SF × 200 SF = $1,600\n- Floor tile: $8/SF × 50 SF = $400  \n- Accent tile: $400\n\nThis allowance covers material cost only.\nLabor for installation is included in contract price.\n\nIf selections exceed allowance:\n- Overage billed at cost + 15% markup\n- Must be approved before ordering\n\nIf selections under allowance:\n- Credit issued on final invoice\n```",
      
      "The key: specify what's included in the allowance (material only? labor too?) and how overages are handled.",
      
      "## Your Quick Reference Checklist",
      
      "Before finalizing any scope, verify:",
      
      "- [ ] Every task has a specific action verb (install, remove, prep, paint)\n- [ ] All quantities are listed (SF, LF, each)\n- [ ] Materials specified by name/model OR allowance amount\n- [ ] \"Not included\" section covers obvious assumptions\n- [ ] Owner responsibilities are clear\n- [ ] Dates for selections/decisions if needed\n- [ ] Change order process is explained\n- [ ] Warranty terms stated",
      
      "## Auto-Generate Your Scope",
      
      "Writing detailed scopes by hand takes forever. I now use [ScopeGen](/scope-of-work-generator) to generate a first draft, then customize. It knows what to include for each trade so I don't forget line items.",
      
      "The AI won't write a perfect scope for your specific job, but it gets you 80% there in 2 minutes vs. 45 minutes from scratch. Then I add the job-specific details.",
      
      "## Final Thought",
      
      "A good scope isn't about protecting yourself legally (though it helps). It's about making sure you and the homeowner have the same mental picture of the finished project. Every hour you spend writing a clear scope saves 5 hours of mid-project discussions.",
      
      "Write it like someone's going to read it who's never renovated anything before. Because they probably haven't.",
    ],
    faqs: [
      {
        question: "What's the difference between a scope of work and a contract?",
        answer: "The scope of work describes WHAT you're doing. The contract includes legal terms: payment schedule, liability, dispute resolution, etc. Most contractors include scope as 'Exhibit A' attached to the contract. Never do work without both."
      },
      {
        question: "How detailed should my scope be?",
        answer: "Detailed enough that if you got sick and another contractor had to finish, they could do it from the scope alone. If you're wondering 'is this too much detail?'—it's probably not enough."
      },
      {
        question: "How do I handle scope changes mid-project?",
        answer: "Change order process: (1) Write it down with new/deleted items and price impact, (2) Get it signed before doing the work, (3) File with original contract. Never do verbal change orders. 'He said it would be an extra $500' doesn't hold up when it's time to collect."
      },
      {
        question: "Should allowances include my markup?",
        answer: "I specify: allowance is material cost. My labor markup is in the base price. Overages get cost + 15%. This is cleaner than trying to predict markup on unknown selections. Just be consistent and state it clearly."
      }
    ]
  },

  "win-more-contractor-bids": {
    slug: "win-more-contractor-bids",
    title: "5 Ways I Increased My Close Rate from 20% to 45% (Without Lowering Prices)",
    excerpt: "I was losing jobs to guys charging $3K more. Turns out it wasn't about price—it was about how I was showing up. Here's what I changed.",
    author: {
      name: "James Kowalski",
      credentials: "Remodeling contractor, 8 years | 2024 NARI Member",
    },
    datePublished: "November 28, 2025",
    dateModified: "January 3, 2026",
    readTime: "7 min read",
    category: "Business Tips",
    tags: ["sales", "close rate", "proposals", "customer service"],
    metaTitle: "How to Win More Contractor Bids | 5 Strategies That Work",
    metaDescription: "Contractor went from 20% to 45% close rate without lowering prices. Here are the 5 specific changes that made the difference, with real examples.",
    heroImage: "/images/blog/win-bids/hero.jpg",
    heroImageAlt: "Contractor presenting proposal to homeowners",
    content: [
      "Two years ago I was bidding 10 jobs a month and winning maybe 2. The math was brutal: all those free estimates, site visits, proposal writing—and 80% of the time I got ghosted or lost to someone else.",
      
      "I figured I was too expensive. So I started cutting prices. Guess what? Same close rate, less profit. Now I was doing 2 jobs at lower margins. Brilliant.",
      
      "Then I talked to a contractor friend who was closing 50%+ and charging MORE than me. He walked me through everything he did differently. Here's what I learned and implemented.",
      
      "## 1. Respond in Under 2 Hours (Not 2 Days)",
      
      "My friend said: \"The first contractor to respond seriously gets the job 60% of the time. Not the cheapest. The fastest.\"",
      
      "I thought about my own process. Homeowner fills out contact form on Saturday. I see it Monday morning. I call Tuesday. By then they've talked to 3 other contractors.",
      
      "**What I changed:**\n- Set up instant notifications on my phone for leads\n- Created a \"first response\" template I could send in 2 minutes\n- Started offering same-day or next-day site visits",
      
      "The template:\n```\nHi [Name],\n\nGot your message about the [project type]. I'd love to take a look and give you an accurate estimate.\n\nI have availability:\n- Tomorrow (Wed) after 2pm\n- Thursday morning before 11am\n\nWhich works better? Or let me know a time that fits your schedule.\n\n- James\nKowalski Remodeling\n(555) 123-4567\n```",
      
      "No sales pitch. No \"we're the best in town.\" Just: I got your message, here's when I can come, done.",
      
      "**Result:** My response-to-visit conversion jumped from 40% to 75%. Just by being fast and making it easy to schedule.",
      
      "## 2. Show Up Like You Want the Job",
      
      "My friend asked: \"What do you wear to estimates?\"",
      
      "I said: \"Whatever I'm working in. Jeans, work boots, company T-shirt.\"",
      
      "He said: \"You're meeting someone who's about to spend $30,000 with you. Would you show up to a bank loan meeting in dusty jeans?\"",
      
      "Fair point.",
      
      "**What I changed:**\n- Clean jeans and a collared shirt for estimates (keeps work clothes in the truck)\n- Truck is cleaned out weekly, no fast food trash\n- Printed materials: business card, capability sheet with past project photos, references list\n- Measuring tools organized, not thrown in a bucket",
      
      "Sounds small. But homeowners notice. They're trying to figure out if they can trust you in their house for 3 weeks. Looking professional matters.",
      
      "## 3. Stop Presenting Proposals by Email",
      
      "This was the biggest one. I used to do the site visit, go home, write the proposal for 2 hours, email it, and wait. And wait. And wait.",
      
      "My friend said: \"Email proposals close at maybe 15%. Presented proposals close at 40%+.\"",
      
      "I didn't believe him. So I tracked it for 3 months. He was right.",
      
      "**What I changed:**\n- After site visit, I tell them: \"I'll have a full proposal ready in 2-3 days. I'd like to walk you through it in person—takes about 20 minutes and you can ask questions. Same time work for you?\"\n- If they can't meet again, I offer a video call\n- I only email proposals as a last resort (and I call to walk through it even then)",
      
      "**Why in-person works:**\n- You can answer objections immediately\n- You read their body language\n- They're more invested (they scheduled time for this)\n- It's harder to ghost someone you've met twice",
      
      "**Result:** Same proposals, 2.5x the close rate. This alone took me from 20% to 35%.",
      
      "## 4. Offer Three Options, Not One",
      
      "I used to give one number. \"Here's your deck: $14,200.\" Yes or no.",
      
      "My friend showed me his proposals. Three columns every time.",
      
      "**Example for a deck:**",
      
      "| | Essential | Recommended | Premium |\n|---|---|---|---|\n| **Decking** | Pressure-treated | Trex Select | Trex Transcend |\n| **Railing** | Wood | Aluminum | Cable |\n| **Stairs** | Basic box | Wrap-around | Multi-level |\n| **Lighting** | None | Post caps | Full LED system |\n| **Price** | $11,800 | $18,400 | $27,600 |",
      
      "**What happens:**\n- Very few people pick \"Essential\"—it feels cheap\n- Most people pick \"Recommended\"—the middle\n- Some people pick \"Premium\"—and you just upsold by 50%",
      
      "**Without options:** Customer has two choices—your price or someone else's price.\n**With options:** Customer chooses between YOUR prices. You've shifted the decision from \"who do I hire\" to \"which version do I want.\"",
      
      "**Result:** Average job value increased 23%. Same number of jobs, more revenue.",
      
      "## 5. Follow Up Like It Matters (Because It Does)",
      
      "Here was my old follow-up process:",
      
      "Day 1: Send proposal\nDay 5: Wonder why they haven't called\nDay 10: Assume they went with someone else\nDay 30: See their project on Nextdoor, built by someone else",
      
      "My friend's process:",
      
      "Day 1: Present proposal, ask for timeline\nDay 3: Text: \"Hi [Name], wanted to check if you had any questions about the proposal. Happy to clarify anything.\"\nDay 7: Call: \"Hey, just following up on the deck project. Still planning to move forward this spring?\"\nDay 14: Text: \"Still here when you're ready. Let me know if anything changed or if you'd like to revisit the options.\"\n\nThen stop. Three touches is enough.",
      
      "**What I learned:**\n- Most people aren't ghosting you—they're busy\n- Following up shows you actually want the work\n- Even if they went with someone else, the follow-up makes them remember you next time",
      
      "**Result:** At least 5 jobs last year came from follow-ups where I thought I'd lost. \"Oh, yeah, we've been meaning to call you. Let's do it.\"",
      
      "## The Math",
      
      "Before these changes:\n- 10 leads/month\n- 7 site visits (70% conversion)\n- 2 jobs won (28% of visits)\n- Average job: $12,000\n- **Monthly revenue: $24,000**",
      
      "After these changes:\n- 10 leads/month\n- 9 site visits (90% conversion—faster response)\n- 4.5 jobs won (50% of visits)\n- Average job: $14,800 (options raised it)\n- **Monthly revenue: $66,600**",
      
      "**2.8x revenue increase. Same number of incoming leads. No advertising spend.**",
      
      "## Tools That Helped",
      
      "I'm not a tech guy, but these made a difference:",
      
      "- **[ScopeGen](/app):** Generates professional proposals in minutes instead of hours. Lets me turn proposals around faster and offer options easily\n- **Calendar scheduling link:** Customers pick their own site visit time, no back-and-forth\n- **Simple CRM (I use Jobber):** Reminds me to follow up so I don't have to remember\n- **Photos app organized by project:** Quick reference during estimates to show relevant past work",
      
      "## What Didn't Matter",
      
      "Things I thought were important that turned out not to be:\n\n- **Being the cheapest:** Never came up once I started presenting in person\n- **Having the longest warranty:** Nobody asked\n- **Fancy brochures:** A clean one-page capability sheet works fine\n- **Lowering price to close:** Just trained customers to negotiate",
      
      "## The Real Lesson",
      
      "Homeowners aren't price shopping as much as you think. They're trying to find someone who:\n\n1. Actually responds\n2. Shows up looking professional\n3. Explains clearly what they're getting\n4. Seems like they want the work\n\nMost contractors fail on multiple counts. Be the one who doesn't, and you'll close jobs at prices that make your business sustainable.",
    ],
    faqs: [
      {
        question: "What's a healthy close rate for contractors?",
        answer: "25-40% for residential remodeling, where homeowners are getting multiple bids. Higher for referral work (50%+), lower for low-intent leads from third-party sites (10-20%). If you're below 20%, look at your process, not your price."
      },
      {
        question: "How do I handle price objections without discounting?",
        answer: "Ask: 'What's driving that concern?' Usually it's not price—it's trust or perceived value. Explain what's included, show past work, offer references. If it's truly budget, offer a phased approach or different materials. But don't just drop price—it devalues your work."
      },
      {
        question: "Should I ever lower my price to close a job?",
        answer: "Very rarely. If you need the work to keep a crew busy, maybe. But negotiating teaches customers that your first price is inflated. Instead, offer to remove scope: 'I can hit $X if we drop the built-in bench.' That's fair. Arbitrary discounts aren't."
      },
      {
        question: "What if they're comparing me to a much cheaper bid?",
        answer: "Ask to see the other scope. 90% of the time, the cheap bid is missing items or using lower-spec materials. Walk them through the differences. If it's truly apples-to-apples and they're just cheaper, they might need the work more than you. Let them have it."
      },
      {
        question: "How many leads do I need to stay busy?",
        answer: "Depends on your close rate and job size. At 30% close rate with $15K average jobs, you need about 15 leads per month to hit $65K monthly revenue (about 4-5 jobs). Work backward from your revenue goal to figure out your lead needs."
      }
    ]
  },
};

export const blogSlugs = Object.keys(blogPosts);

// Helper to get author name string (for backward compatibility)
export function getAuthorName(post: BlogPost): string {
  return post.author.name;
}

// Helper to get related posts
export function getRelatedPosts(currentSlug: string, limit: number = 3): BlogPost[] {
  const currentPost = blogPosts[currentSlug];
  if (!currentPost) return [];

  const allPosts = Object.values(blogPosts);
  
  // Prioritize same category, then other posts
  const sameCategoryPosts = allPosts.filter(
    p => p.slug !== currentSlug && p.category === currentPost.category
  );
  const otherPosts = allPosts.filter(
    p => p.slug !== currentSlug && p.category !== currentPost.category
  );
  
  return [...sameCategoryPosts, ...otherPosts].slice(0, limit);
}
