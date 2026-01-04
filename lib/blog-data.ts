export interface BlogPostFAQ {
  question: string;
  answer: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  metaTitle: string;
  metaDescription: string;
  content: string[];
  faqs?: BlogPostFAQ[];
  heroImage?: string;
  ogImage?: string;
}

export const blogPosts: Record<string, BlogPost> = {
  "how-to-write-bathroom-remodel-proposal": {
    slug: "how-to-write-bathroom-remodel-proposal",
    title: "How to Write a Bathroom Remodel Proposal That Wins Jobs",
    excerpt: "Learn the essential elements every bathroom remodeling proposal needs to close more deals and set proper client expectations.",
    author: "ScopeGen Team",
    date: "December 5, 2025",
    readTime: "6 min read",
    category: "Proposal Writing",
    metaTitle: "How to Write a Bathroom Remodel Proposal | Complete Guide 2025",
    metaDescription: "Step-by-step guide to writing professional bathroom remodeling proposals. Includes scope of work examples, pricing tips, and free templates for contractors.",
    content: [
      "A well-written bathroom remodel proposal is the difference between winning the job and losing to a competitor. In this guide, we'll walk through everything you need to create professional proposals that convert.",
      "## Why Your Proposal Matters",
      "Your proposal is often the first impression a potential client has of your professionalism. A clear, detailed proposal builds trust and sets expectations—reducing the chance of disputes later.",
      "## Essential Elements of a Bathroom Remodel Proposal",
      "Every winning proposal should include these key sections:",
      "- **Project Overview**: Brief description of the work to be performed\n- **Detailed Scope of Work**: Line-by-line breakdown of all tasks\n- **Materials List**: Specific products, brands, and quantities\n- **Labor Breakdown**: Hours and rates for each phase\n- **Timeline**: Start date, milestones, and completion date\n- **Payment Terms**: Deposit, progress payments, and final payment\n- **Warranty Information**: What's covered and for how long",
      "## Writing a Clear Scope of Work",
      "The scope of work is where most proposals fail. Be specific about what's included AND what's excluded. For a bathroom remodel, consider breaking it down by phase:",
      "### Demolition Phase",
      "Describe exactly what will be removed: existing fixtures, flooring, drywall, etc. Specify how debris will be disposed of.",
      "### Rough-In Phase",
      "Detail plumbing and electrical work. If you're moving fixtures, explain the new locations and any code requirements.",
      "### Installation Phase",
      "List every fixture and finish with brand names and model numbers when possible. This prevents disputes about quality expectations.",
      "### Finishing Phase",
      "Paint colors, grout color, trim work, and final touches should all be specified.",
      "## Pricing Your Proposal",
      "Include a detailed breakdown of costs. Homeowners appreciate transparency, and it protects you from scope creep.",
      "A typical bathroom remodel cost breakdown might look like:",
      "- **Materials (40-50%)**: Fixtures, tile, vanity, etc.\n- **Labor (35-45%)**: Installation, plumbing, electrical\n- **Overhead (10-15%)**: Permits, disposal, insurance\n- **Profit (10-20%)**: Your business margin",
      "## Common Mistakes to Avoid",
      "- Being too vague about materials or scope\n- Forgetting to include permit costs\n- Not specifying payment milestones\n- Missing exclusions (what you won't do)\n- No warranty information",
      "## Using Proposal Software",
      "Modern contractors use proposal software like [ScopeGen](/app) to create professional proposals in minutes instead of hours. These tools ensure you don't miss important details and present a polished image to clients.",
      "## Conclusion",
      "A professional bathroom remodel proposal should be detailed, transparent, and easy to understand. Take the time to get it right—it's the foundation of a successful project and happy clients.",
    ],
    faqs: [
      {
        question: "How long should a bathroom remodel proposal be?",
        answer: "A comprehensive bathroom remodel proposal typically runs 3-5 pages. It should be detailed enough to cover all aspects of the project but concise enough that clients will actually read it. Focus on clarity over length."
      },
      {
        question: "Should I include photos in my proposal?",
        answer: "Yes, including photos of your previous work, material samples, or inspiration images can help clients visualize the final result. This builds confidence and can help justify your pricing."
      },
      {
        question: "How do I handle change orders in a bathroom remodel?",
        answer: "Include a change order clause in your proposal that explains how additional work will be priced and approved. This protects both you and the homeowner from misunderstandings during the project."
      },
      {
        question: "What's the best way to present my proposal?",
        answer: "Present your proposal in person when possible, walking the client through each section. If meeting in person isn't possible, use a video call to review it together. This gives you the opportunity to answer questions and build rapport."
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
    title: "Scope of Work Template Examples for Contractors",
    excerpt: "Free scope of work templates and examples for bathroom, kitchen, roofing, painting, and other contractor trades.",
    author: "ScopeGen Team",
    date: "December 1, 2025",
    readTime: "10 min read",
    category: "Templates",
    metaTitle: "Scope of Work Template Examples | Free Contractor Templates 2025",
    metaDescription: "Free scope of work templates for contractors. Download examples for bathroom, kitchen, roofing, HVAC, plumbing, electrical, and painting projects.",
    content: [
      "A good scope of work protects both you and your client. It clearly defines what work will be performed, what materials will be used, and what's NOT included. Here are templates and examples for common contractor trades.",
      "## What Makes a Good Scope of Work?",
      "An effective scope of work should:",
      "- **Be specific**: Don't say 'paint bathroom' when you can say 'apply two coats of Sherwin-Williams Duration semi-gloss to walls and ceiling'\n- **Include quantities**: '200 sq ft of tile' is better than 'tile floor'\n- **Specify brands/products**: This prevents disputes about quality expectations\n- **List exclusions**: What you WON'T do is as important as what you will do\n- **Set milestones**: Break large projects into phases with clear completion criteria",
      "## Bathroom Remodel Scope of Work Example",
      "Here's a template for a typical bathroom remodel:",
      "### Demolition",
      "- Remove existing vanity, toilet, and tub/shower\n- Demo flooring down to subfloor\n- Remove wall tile in shower area\n- Disconnect and cap plumbing\n- Haul debris to dumpster (included)",
      "### Plumbing",
      "- Install new supply lines to vanity location\n- Install drain for new vessel sink\n- Relocate toilet flange 6\" to the left\n- Install new shower valve (Moen Posi-Temp)\n- Test all connections, no leaks",
      "### Electrical",
      "- Install new GFCI outlet at vanity\n- Add recessed lighting (4x 6\" cans)\n- Install bathroom exhaust fan (Panasonic WhisperFit)",
      "### Installation",
      "- Install cement board in wet areas\n- Waterproof shower with Kerdi system\n- Install 12x24 porcelain tile on shower walls (Client selection from ABC Tile)\n- Install mosaic tile shower floor\n- Install 60\" freestanding tub (provided by owner)\n- Install floating vanity with vessel sink\n- Install toilet (Kohler Cimarron)",
      "### Finishing",
      "- Install trim and baseboards\n- Two coats paint on walls (Benjamin Moore)\n- Install mirrors and accessories\n- Final cleanup",
      "### EXCLUSIONS",
      "- Structural modifications\n- Permits (owner responsibility)\n- Wallpaper removal\n- Mold remediation if discovered",
      "## Kitchen Remodel Scope Template",
      "Kitchen projects are complex—your scope needs to be thorough:",
      "- Cabinet removal and disposal\n- Cabinet installation (specify brand, style, configuration)\n- Countertop template and installation\n- Backsplash tile installation\n- Plumbing reconnection (sink, dishwasher, ice maker)\n- Electrical updates (specify circuits)\n- Appliance installation (list which ones)\n- Paint and trim work",
      "## Using Software for Scope Creation",
      "Writing detailed scopes by hand is time-consuming. Tools like [ScopeGen](/app) generate professional scopes automatically based on your project details, ensuring you never forget important line items.",
      "## Download Templates",
      "Visit our [proposal generator](/app) to create customized scope of work documents for your specific trade and project type.",
    ],
    faqs: [
      {
        question: "What's the difference between a scope of work and a contract?",
        answer: "A scope of work is the detailed description of what work will be performed. A contract includes the scope plus legal terms like payment schedule, warranties, dispute resolution, and signatures. The scope is typically an exhibit or attachment to the contract."
      },
      {
        question: "How detailed should my scope of work be?",
        answer: "As detailed as necessary to prevent misunderstandings. For a $50,000 kitchen remodel, you might have 3-5 pages of scope. For a simple toilet replacement, a few bullet points may suffice. When in doubt, more detail is better."
      },
      {
        question: "Should I include allowances in my scope?",
        answer: "Yes, if the client hasn't selected specific materials. An allowance states a dollar amount budgeted for an item (e.g., '$2,000 allowance for bathroom tile'). If they choose something more expensive, they pay the difference."
      }
    ]
  },
  "win-more-contractor-bids": {
    slug: "win-more-contractor-bids",
    title: "5 Ways to Win More Contractor Bids (Without Lowering Your Price)",
    excerpt: "Learn proven strategies to win more contracting jobs without sacrificing your profit margins.",
    author: "ScopeGen Team",
    date: "November 28, 2025",
    readTime: "5 min read",
    category: "Business Tips",
    metaTitle: "How to Win More Contractor Bids | 5 Proven Strategies",
    metaDescription: "Win more contracting jobs without cutting prices. Learn 5 proven strategies that help contractors close more deals while maintaining healthy profit margins.",
    content: [
      "Every contractor knows the frustration of losing bids—especially when you lose to a lower price. But here's the truth: the cheapest bid doesn't always win, and you shouldn't want it to. Here are five strategies to win more jobs at your price.",
      "## 1. Respond Faster Than Your Competition",
      "Speed matters. The first contractor to respond often has a significant advantage. Studies show that responding within 1 hour increases your chances of winning by 60% compared to waiting 24 hours.",
      "Use tools like [proposal software](/app) to generate professional proposals in minutes, not hours.",
      "## 2. Present More Professionally",
      "Your proposal is a reflection of your work quality. A messy, handwritten estimate on scrap paper doesn't inspire confidence—even if your work is excellent.",
      "Invest in professional presentation:",
      "- Use branded proposal templates\n- Include your license and insurance information\n- Add photos of similar completed projects\n- Provide clear, itemized pricing",
      "## 3. Build Rapport Before Price",
      "Before discussing price, focus on understanding the client's needs and concerns. Ask questions, listen actively, and show genuine interest in their project.",
      "When clients feel heard and understood, price becomes less of the deciding factor.",
      "## 4. Offer Tiered Options",
      "Instead of one take-it-or-leave-it price, offer good-better-best options. This gives clients control and often leads to them choosing a higher-priced option.",
      "For example:\n- **Good**: Basic renovation with standard materials\n- **Better**: Mid-range with upgraded fixtures\n- **Best**: Premium materials and finishes",
      "## 5. Follow Up Systematically",
      "Many contractors lose jobs simply because they never followed up. Create a follow-up system:",
      "- Day 1: Send proposal\n- Day 3: Follow up email or call\n- Day 7: Second follow up\n- Day 14: Final follow up",
      "Be persistent but professional. The squeaky wheel gets the grease.",
      "## Conclusion",
      "Winning more bids isn't about being the cheapest—it's about being the most professional, responsive, and trustworthy option. Implement these strategies and watch your close rate improve.",
    ],
    faqs: [
      {
        question: "What close rate should contractors aim for?",
        answer: "A healthy close rate for residential contractors is typically 25-40%. If you're closing more than 50%, you might be pricing too low. If you're below 20%, focus on qualifying leads better and improving your presentation."
      },
      {
        question: "How do I handle price objections?",
        answer: "Don't immediately discount. Instead, ask questions to understand the concern. Often it's not really about price—it's about perceived value or trust. Explain what makes your service worth the investment and offer alternatives if budget is truly the issue."
      }
    ]
  },
};

export const blogSlugs = Object.keys(blogPosts);
