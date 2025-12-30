export interface Template {
  id: string;
  trade: string;
  jobTypes: JobType[];
}

/**
 * A section within the scope of work (for grouped display)
 */
export interface ScopeSection {
  title: string;
  items: string[];
}

export interface JobType {
  id: string;
  name: string;
  /** Legacy flat scope array - use scopeSections for grouped display */
  baseScope: string[];
  /** 
   * Optional: Grouped scope sections with headings.
   * When present, renderer should prefer this over baseScope for display.
   * baseScope should still be populated for backward compatibility.
   */
  scopeSections?: ScopeSection[];
  /** Optional: Items that are explicitly included (displayed in "Included" section) */
  included?: string[];
  /** Optional: Assumptions made for this scope (displayed in "Assumptions" section) */
  assumptions?: string[];
  /** Optional: Add-on items available for this job type */
  addons?: string[];
  options: JobOption[];
  basePriceRange: { low: number; high: number };
  estimatedDays?: { low: number; high: number };
  warranty?: string;
  exclusions?: string[];
}

export interface JobOption {
  id: string;
  label: string;
  type: "boolean" | "select";
  choices?: { value: string; label: string; priceModifier: number; scopeAddition?: string }[];
  priceModifier?: number;
  scopeAddition?: string;
}

export const templates: Template[] = [
  {
    id: "bathroom",
    trade: "Bathroom Remodel",
    jobTypes: [
      {
        id: "tub-to-shower",
        name: "Tub-to-Shower Conversion",
        basePriceRange: { low: 8500, high: 12000 },
        estimatedDays: { low: 5, high: 8 },
        warranty: "1-year labor warranty on all workmanship. Manufacturer warranties apply to all fixtures and materials.",
        exclusions: [
          "Repair of hidden water damage discovered after demolition",
          "Electrical upgrades beyond existing circuits",
          "Permits and inspection fees (if required)"
        ],
        baseScope: [
          "Demolish existing bathtub and surround down to studs.",
          "Dispose of all debris off-site in accordance with local regulations.",
          "Inspect framing and plumbing for water damage; report findings to homeowner.",
          "Install new shower pan/base with proper slope (minimum 1/4\" per foot).",
          "Install cement board backer on all shower walls per manufacturer specs.",
          "Apply waterproof membrane to all wet areas meeting TCNA standards.",
          "Install new shower valve, mixing valve, and trim kit.",
          "Tile shower walls to ceiling height using thin-set mortar method.",
          "Grout all tile joints with premium sanded grout; seal grout lines.",
          "Install shower head, arm, and escutcheon plate.",
          "Caulk all corners and transitions with mildew-resistant silicone.",
          "Final cleanup and debris removal; protect finished work."
        ],
        options: [
          {
            id: "niche",
            label: "Add Recessed Niche",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Frame and install recessed tiled niche (12x24) for soap/shampoo storage with matching tile."
          },
          {
            id: "glass-door",
            label: "Glass Door Style",
            type: "select",
            choices: [
              { value: "framed", label: "Framed Sliding Door", priceModifier: 800, scopeAddition: "Install framed sliding glass shower door with chrome hardware." },
              { value: "semi-frameless", label: "Semi-Frameless Pivot", priceModifier: 1200, scopeAddition: "Install semi-frameless pivot glass door with brushed nickel hardware." },
              { value: "frameless", label: "Frameless Fixed Panel", priceModifier: 1800, scopeAddition: "Install frameless fixed glass panel with stainless steel clips and hardware." }
            ]
          },
          {
            id: "bench",
            label: "Built-in Shower Bench",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Construct waterproof concrete bench seat (approx. 18\" x 30\") and tile to match walls."
          },
          {
            id: "linear-drain",
            label: "Linear Drain Upgrade",
            type: "boolean",
            priceModifier: 550,
            scopeAddition: "Install linear stainless steel drain system in lieu of standard center drain."
          },
          {
            id: "body-sprays",
            label: "Body Spray System",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install (3) wall-mounted body spray jets with dedicated valve control."
          }
        ]
      },
      {
        id: "full-gut",
        name: "Full Bathroom Gut & Remodel",
        basePriceRange: { low: 18000, high: 28000 },
        estimatedDays: { low: 10, high: 18 },
        warranty: "2-year labor warranty on all workmanship. Extended manufacturer warranties on fixtures.",
        exclusions: [
          "Structural repairs to floor joists or wall framing",
          "Mold remediation beyond surface treatment",
          "Relocation of main drain stack or supply risers"
        ],
        baseScope: [
          "Complete demolition of vanity, toilet, tub/shower, flooring, and wall finishes.",
          "Remove existing fixtures and dispose of all debris off-site.",
          "Inspect and document condition of plumbing, electrical, and framing.",
          "Update plumbing rough-in as required by local code.",
          "Install new electrical circuits for GFI outlets, exhaust fan, and lighting.",
          "Install moisture-resistant drywall on walls; cement board in wet areas.",
          "Install new vanity cabinet (36-48\" standard) with soft-close hardware.",
          "Install vanity countertop with undermount or vessel sink.",
          "Install new faucet and pop-up drain assembly.",
          "Install new toilet with wax ring seal and supply line.",
          "Install new bathtub or shower system per plan specifications.",
          "Tile floor with selected tile; install transitions at doorways.",
          "Tile wet areas with waterproof membrane system.",
          "Paint walls and ceiling with moisture-resistant paint (2 coats).",
          "Install new light fixtures, exhaust fan, and GFI outlets.",
          "Install new towel bars, paper holder, and accessories.",
          "Final cleanup, touch-up, and walkthrough with homeowner."
        ],
        options: [
          {
            id: "heated-floor",
            label: "Heated Floor System",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install electric radiant floor heating mat with programmable digital thermostat."
          },
          {
            id: "double-vanity",
            label: "Double Vanity Upgrade",
            type: "boolean",
            priceModifier: 2500,
            scopeAddition: "Install double-sink vanity (60-72\") with dual faucets and extended countertop."
          },
          {
            id: "freestanding-tub",
            label: "Freestanding Soaking Tub",
            type: "boolean",
            priceModifier: 3500,
            scopeAddition: "Install freestanding acrylic soaking tub with floor-mounted filler and drain."
          },
          {
            id: "tile-grade",
            label: "Tile Grade Selection",
            type: "select",
            choices: [
              { value: "standard", label: "Standard Ceramic", priceModifier: 0, scopeAddition: "Install standard ceramic tile (included in base price)." },
              { value: "porcelain", label: "Premium Porcelain", priceModifier: 1200, scopeAddition: "Upgrade to premium porcelain tile with enhanced durability." },
              { value: "natural-stone", label: "Natural Stone", priceModifier: 2800, scopeAddition: "Install natural stone tile (marble, travertine, or slate) with sealer." }
            ]
          },
          {
            id: "custom-shower",
            label: "Custom Tile Shower",
            type: "boolean",
            priceModifier: 4500,
            scopeAddition: "Build custom tile shower with curb, linear drain, and full-height tile walls."
          }
        ]
      },
      {
        id: "half-bath",
        name: "Half Bath / Powder Room Remodel",
        basePriceRange: { low: 6500, high: 9500 },
        estimatedDays: { low: 4, high: 6 },
        warranty: "1-year labor warranty on all workmanship.",
        exclusions: ["Plumbing relocation", "New window installation"],
        baseScope: [
          "Remove existing vanity, toilet, flooring, and wall finishes.",
          "Dispose of all demolition debris off-site.",
          "Repair/patch drywall as needed; install new drywall if required.",
          "Install new vanity cabinet (24-30\" width) with countertop and sink.",
          "Install new single-hole or widespread faucet.",
          "Install new toilet with all hardware and accessories.",
          "Install new luxury vinyl plank or tile flooring.",
          "Paint walls and ceiling (2 coats premium latex).",
          "Install new light fixture above vanity.",
          "Install mirror, towel ring, and toilet paper holder.",
          "Caulk all edges; final cleanup and inspection."
        ],
        options: [
          {
            id: "pedestal-sink",
            label: "Pedestal Sink (in lieu of vanity)",
            type: "boolean",
            priceModifier: -200,
            scopeAddition: "Install pedestal sink in place of vanity cabinet for classic aesthetic."
          },
          {
            id: "wallpaper-accent",
            label: "Wallpaper Accent Wall",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install designer wallpaper on accent wall with proper prep and adhesive."
          },
          {
            id: "wainscoting",
            label: "Wainscoting",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Install 36\" wainscoting panels with chair rail and paint to match."
          }
        ]
      },
      {
        id: "ada-accessibility",
        name: "ADA/Accessibility Bathroom Remodel",
        basePriceRange: { low: 12000, high: 22000 },
        estimatedDays: { low: 7, high: 12 },
        warranty: "2-year labor warranty on all workmanship.",
        exclusions: ["Structural modifications beyond doorway widening", "Bedroom modifications"],
        baseScope: [
          "Remove existing tub/shower, vanity, and toilet.",
          "Dispose of all demolition debris off-site.",
          "Widen doorway to 36\" clear opening if required.",
          "Install curbless/roll-in shower with proper slope to drain.",
          "Install non-slip tile flooring throughout bathroom.",
          "Install fold-down shower bench rated for 500 lbs.",
          "Install ADA-compliant grab bars at shower, toilet, and vanity.",
          "Install comfort-height toilet (17-19\" seat height).",
          "Install wall-mount or accessible vanity with knee clearance.",
          "Install lever-handle faucets throughout.",
          "Install handheld showerhead on adjustable slide bar.",
          "Install anti-scald pressure-balancing valve.",
          "Ensure proper lighting levels per ADA guidelines.",
          "Install accessible light switches and outlets at proper heights.",
          "Final inspection and walkthrough."
        ],
        options: [
          {
            id: "grab-bar-upgrade",
            label: "Designer Grab Bar Package",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Upgrade to designer grab bars with brushed nickel or oil-rubbed bronze finish."
          },
          {
            id: "heated-floor-ada",
            label: "Heated Floor System",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install electric radiant floor heating with programmable thermostat."
          },
          {
            id: "transfer-bench",
            label: "Built-in Transfer Bench",
            type: "boolean",
            priceModifier: 850,
            scopeAddition: "Build tiled transfer bench extending outside shower for easier entry."
          }
        ]
      },
      {
        id: "vanity-refresh",
        name: "Vanity & Faucet Replacement",
        basePriceRange: { low: 1800, high: 3500 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "1-year labor warranty.",
        exclusions: ["Plumbing relocation", "Wall repair beyond minor patching"],
        baseScope: [
          "Shut off water supply to vanity.",
          "Disconnect and remove existing vanity, countertop, and faucet.",
          "Dispose of old vanity off-site.",
          "Inspect plumbing connections; replace supply lines.",
          "Install new vanity cabinet; secure to wall studs.",
          "Install new countertop with sink cutout.",
          "Install new undermount or drop-in sink.",
          "Install new faucet and drain assembly.",
          "Connect P-trap and test for leaks.",
          "Apply caulk around countertop edges.",
          "Install new mirror above vanity.",
          "Clean up and test all fixtures."
        ],
        options: [
          {
            id: "vanity-size",
            label: "Vanity Width",
            type: "select",
            choices: [
              { value: "30", label: "30-inch Single", priceModifier: 0 },
              { value: "48", label: "48-inch Single", priceModifier: 400, scopeAddition: "Install 48-inch vanity with extended countertop." },
              { value: "60", label: "60-inch Double", priceModifier: 1200, scopeAddition: "Install 60-inch double vanity with dual sinks and faucets." }
            ]
          },
          {
            id: "add-lighting",
            label: "New Vanity Light Fixture",
            type: "boolean",
            priceModifier: 225,
            scopeAddition: "Remove old light and install new vanity light fixture above mirror."
          }
        ]
      }
    ]
  },
  {
    id: "kitchen",
    trade: "Kitchen Remodel",
    jobTypes: [
      {
        id: "full-kitchen-gut",
        name: "Full Kitchen Remodel – Gut & Replace",
        basePriceRange: { low: 45000, high: 85000 },
        estimatedDays: { low: 25, high: 45 },
        warranty: "2-year labor warranty on all workmanship. Manufacturer warranties apply to all fixtures and materials.",
        exclusions: [
          "Appliance costs (allowance may be included)",
          "Structural wall removal requiring engineering",
          "HVAC modifications or relocation",
          "Permit and inspection fees",
          "Mold or asbestos remediation"
        ],
        baseScope: [
          "Complete demolition of existing cabinets, countertops, flooring, backsplash, and soffits.",
          "Remove existing appliances and disconnect all utilities.",
          "Dispose of all demolition debris per local regulations.",
          "Inspect and document condition of plumbing, electrical, and framing.",
          "Update electrical circuits per plan; add outlets as required by code.",
          "Update plumbing rough-in for sink, dishwasher, and refrigerator.",
          "Install new drywall/patch walls as needed; texture to match.",
          "Prime and paint walls and ceiling (2 coats).",
          "Install new base and upper cabinets per layout plan.",
          "Install crown molding and decorative trim on cabinets.",
          "Template and fabricate new countertops.",
          "Install countertops with proper support and cutouts.",
          "Install undermount sink and faucet assembly.",
          "Install tile backsplash per design specifications.",
          "Install new flooring (hardwood, tile, or LVP) with transitions.",
          "Install new lighting fixtures: recessed cans and pendant lights.",
          "Connect and install all appliances (per allowance or owner-supplied).",
          "Install garbage disposal, dishwasher, and range hood ductwork.",
          "Final punch list, touch-up, and homeowner walkthrough."
        ],
        options: [
          {
            id: "cabinet-scope",
            label: "Cabinet Scope",
            type: "select",
            choices: [
              { value: "new-stock", label: "New Stock Cabinets", priceModifier: 0, scopeAddition: "Install new stock cabinet line with standard finishes and hardware." },
              { value: "new-semi-custom", label: "New Semi-Custom Cabinets", priceModifier: 4000, scopeAddition: "Install new semi-custom cabinets with choice of door style and finish." },
              { value: "new-custom", label: "New Custom Cabinets", priceModifier: 15000, scopeAddition: "Install fully custom cabinets built to specifications with premium finishes." },
              { value: "reface", label: "Reface Existing Cabinets", priceModifier: -8000, scopeAddition: "Reface existing cabinet boxes with new doors, drawer fronts, and veneer." },
              { value: "paint", label: "Paint Existing Cabinets", priceModifier: -10000, scopeAddition: "Prep, prime, and paint existing cabinet boxes, doors, and drawers." },
              { value: "doors-only", label: "Replace Cabinet Doors Only", priceModifier: -12000, scopeAddition: "Replace cabinet doors and drawer fronts only; retain existing boxes." },
              { value: "hardware-only", label: "Replace Cabinet Hardware Only", priceModifier: -14000, scopeAddition: "Replace cabinet hardware (pulls/knobs) only; retain existing doors and boxes." },
              { value: "island-cabinets", label: "Add Island Cabinets", priceModifier: 3500, scopeAddition: "Add island base cabinets with matching finish to perimeter cabinets." },
              { value: "pantry-cabinets", label: "Add Pantry Cabinets", priceModifier: 2500, scopeAddition: "Add tall pantry cabinet unit with pull-out shelving." }
            ]
          },
          {
            id: "crown-trim",
            label: "Add Crown / Trim / Light Rail",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install crown molding, light rail, and decorative trim on all cabinets."
          },
          {
            id: "countertop-type",
            label: "Countertop Type",
            type: "select",
            choices: [
              { value: "laminate", label: "Laminate", priceModifier: -2000, scopeAddition: "Install premium laminate countertops with built-up edges." },
              { value: "butcher-block", label: "Butcher Block", priceModifier: -1000, scopeAddition: "Install solid wood butcher block countertops with food-safe finish." },
              { value: "solid-surface", label: "Solid Surface (e.g., Corian)", priceModifier: -500, scopeAddition: "Install solid surface countertops with integrated sink option." },
              { value: "quartz", label: "Quartz", priceModifier: 0, scopeAddition: "Install engineered quartz countertops (color per selection)." },
              { value: "granite", label: "Granite", priceModifier: 800, scopeAddition: "Install granite slab countertops with polished edges and sealer." },
              { value: "marble", label: "Marble", priceModifier: 2500, scopeAddition: "Install marble slab countertops with honed or polished finish and sealer." },
              { value: "porcelain-sintered", label: "Porcelain / Sintered Stone", priceModifier: 1500, scopeAddition: "Install porcelain or sintered stone countertops with polished finish." },
              { value: "concrete", label: "Concrete", priceModifier: 1800, scopeAddition: "Install custom concrete countertops with sealed finish." },
              { value: "tile", label: "Tile Countertop", priceModifier: -1500, scopeAddition: "Install tile countertops with bullnose edges and grouted joints." },
              { value: "keep-existing", label: "Keep Existing Countertops", priceModifier: -3000, scopeAddition: "Retain and protect existing countertops; reconnect sink and faucet." }
            ]
          },
          {
            id: "plumbing-fixtures",
            label: "Plumbing Fixtures",
            type: "select",
            choices: [
              { value: "sink-only", label: "Replace Sink Only", priceModifier: 350, scopeAddition: "Install new undermount or drop-in sink; reconnect existing plumbing." },
              { value: "faucet-only", label: "Replace Faucet Only", priceModifier: 250, scopeAddition: "Install new kitchen faucet with supply lines." },
              { value: "sink-faucet", label: "Replace Sink & Faucet", priceModifier: 550, scopeAddition: "Install new sink and faucet assembly with all connections." },
              { value: "add-disposal", label: "Add Garbage Disposal", priceModifier: 400, scopeAddition: "Install new garbage disposal unit with electrical connection." },
              { value: "replace-disposal", label: "Replace Garbage Disposal", priceModifier: 275, scopeAddition: "Remove old disposal and install new unit." },
              { value: "relocate-sink-minor", label: "Relocate Sink (Minor)", priceModifier: 800, scopeAddition: "Relocate sink within 3 feet of existing location; extend drain and supply lines." },
              { value: "relocate-sink-major", label: "Relocate Sink (Major)", priceModifier: 2500, scopeAddition: "Relocate sink to new location; run new drain and supply lines through structure." },
              { value: "pot-filler", label: "Add Pot Filler", priceModifier: 850, scopeAddition: "Install wall-mounted pot filler faucet above range with shutoff valve." },
              { value: "no-plumbing", label: "No Plumbing Work", priceModifier: 0, scopeAddition: "No plumbing modifications included." }
            ]
          },
          {
            id: "electrical-lighting",
            label: "Electrical & Lighting",
            type: "select",
            choices: [
              { value: "light-fixtures", label: "Replace Existing Light Fixtures Only", priceModifier: 450, scopeAddition: "Remove and replace existing light fixtures with new units." },
              { value: "recessed", label: "Add Recessed Lighting", priceModifier: 1200, scopeAddition: "Install recessed LED lighting throughout kitchen ceiling." },
              { value: "under-cabinet", label: "Add / Replace Under-Cabinet Lighting", priceModifier: 650, scopeAddition: "Install hardwired LED strip lighting under upper cabinets with dimmer switch." },
              { value: "pendant", label: "Add / Replace Pendant Lights", priceModifier: 550, scopeAddition: "Install pendant light fixtures over island or sink area." },
              { value: "outlets", label: "Add / Relocate Outlets", priceModifier: 400, scopeAddition: "Add or relocate electrical outlets per code requirements." },
              { value: "switches-dimmers", label: "Upgrade Switches / Dimmers", priceModifier: 300, scopeAddition: "Upgrade light switches to dimmer switches throughout kitchen." },
              { value: "dedicated-circuits", label: "Dedicated Circuits for Appliances", priceModifier: 750, scopeAddition: "Install dedicated electrical circuits for major appliances." },
              { value: "no-electrical", label: "No Electrical Work", priceModifier: 0, scopeAddition: "No electrical modifications included." }
            ]
          }
        ]
      },
      {
        id: "full-kitchen-cosmetic",
        name: "Full Kitchen Remodel – Cosmetic Only",
        basePriceRange: { low: 15000, high: 30000 },
        estimatedDays: { low: 10, high: 18 },
        warranty: "1-year labor warranty on all workmanship. Manufacturer warranties apply to all fixtures and materials.",
        exclusions: [
          "Structural modifications",
          "Plumbing or electrical relocation",
          "Appliance costs",
          "Permit fees"
        ],
        baseScope: [
          "Protect flooring and existing appliances with drop cloths.",
          "Remove existing countertops and backsplash; dispose off-site.",
          "Remove cabinet doors, drawer fronts, and all hardware.",
          "Clean, sand, and prep all cabinet surfaces.",
          "Apply primer and two coats of cabinet-grade paint or stain.",
          "Install new soft-close hinges and drawer slides.",
          "Template and fabricate new countertops per specifications.",
          "Install new countertops with proper support and seaming.",
          "Cut and install new undermount or drop-in sink.",
          "Reconnect plumbing to sink and garbage disposal.",
          "Install new faucet assembly.",
          "Install tile backsplash per design specifications.",
          "Install new cabinet hardware (pulls/knobs).",
          "Reinstall all doors and drawer fronts; adjust alignment.",
          "Caulk countertop edges; seal natural stone if applicable.",
          "Final cleanup and quality inspection."
        ],
        options: [
          {
            id: "cabinet-scope",
            label: "Cabinet Scope",
            type: "select",
            choices: [
              { value: "new-stock", label: "New Stock Cabinets", priceModifier: 0, scopeAddition: "Install new stock cabinet line with standard finishes and hardware." },
              { value: "new-semi-custom", label: "New Semi-Custom Cabinets", priceModifier: 4000, scopeAddition: "Install new semi-custom cabinets with choice of door style and finish." },
              { value: "new-custom", label: "New Custom Cabinets", priceModifier: 15000, scopeAddition: "Install fully custom cabinets built to specifications with premium finishes." },
              { value: "reface", label: "Reface Existing Cabinets", priceModifier: -8000, scopeAddition: "Reface existing cabinet boxes with new doors, drawer fronts, and veneer." },
              { value: "paint", label: "Paint Existing Cabinets", priceModifier: -10000, scopeAddition: "Prep, prime, and paint existing cabinet boxes, doors, and drawers." },
              { value: "doors-only", label: "Replace Cabinet Doors Only", priceModifier: -12000, scopeAddition: "Replace cabinet doors and drawer fronts only; retain existing boxes." },
              { value: "hardware-only", label: "Replace Cabinet Hardware Only", priceModifier: -14000, scopeAddition: "Replace cabinet hardware (pulls/knobs) only; retain existing doors and boxes." },
              { value: "island-cabinets", label: "Add Island Cabinets", priceModifier: 3500, scopeAddition: "Add island base cabinets with matching finish to perimeter cabinets." },
              { value: "pantry-cabinets", label: "Add Pantry Cabinets", priceModifier: 2500, scopeAddition: "Add tall pantry cabinet unit with pull-out shelving." }
            ]
          },
          {
            id: "crown-trim",
            label: "Add Crown / Trim / Light Rail",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install crown molding, light rail, and decorative trim on all cabinets."
          },
          {
            id: "countertop-type",
            label: "Countertop Type",
            type: "select",
            choices: [
              { value: "laminate", label: "Laminate", priceModifier: -2000, scopeAddition: "Install premium laminate countertops with built-up edges." },
              { value: "butcher-block", label: "Butcher Block", priceModifier: -1000, scopeAddition: "Install solid wood butcher block countertops with food-safe finish." },
              { value: "solid-surface", label: "Solid Surface (e.g., Corian)", priceModifier: -500, scopeAddition: "Install solid surface countertops with integrated sink option." },
              { value: "quartz", label: "Quartz", priceModifier: 0, scopeAddition: "Install engineered quartz countertops (color per selection)." },
              { value: "granite", label: "Granite", priceModifier: 800, scopeAddition: "Install granite slab countertops with polished edges and sealer." },
              { value: "marble", label: "Marble", priceModifier: 2500, scopeAddition: "Install marble slab countertops with honed or polished finish and sealer." },
              { value: "porcelain-sintered", label: "Porcelain / Sintered Stone", priceModifier: 1500, scopeAddition: "Install porcelain or sintered stone countertops with polished finish." },
              { value: "concrete", label: "Concrete", priceModifier: 1800, scopeAddition: "Install custom concrete countertops with sealed finish." },
              { value: "tile", label: "Tile Countertop", priceModifier: -1500, scopeAddition: "Install tile countertops with bullnose edges and grouted joints." },
              { value: "keep-existing", label: "Keep Existing Countertops", priceModifier: -3000, scopeAddition: "Retain and protect existing countertops; reconnect sink and faucet." }
            ]
          },
          {
            id: "plumbing-fixtures",
            label: "Plumbing Fixtures",
            type: "select",
            choices: [
              { value: "sink-only", label: "Replace Sink Only", priceModifier: 350, scopeAddition: "Install new undermount or drop-in sink; reconnect existing plumbing." },
              { value: "faucet-only", label: "Replace Faucet Only", priceModifier: 250, scopeAddition: "Install new kitchen faucet with supply lines." },
              { value: "sink-faucet", label: "Replace Sink & Faucet", priceModifier: 550, scopeAddition: "Install new sink and faucet assembly with all connections." },
              { value: "add-disposal", label: "Add Garbage Disposal", priceModifier: 400, scopeAddition: "Install new garbage disposal unit with electrical connection." },
              { value: "replace-disposal", label: "Replace Garbage Disposal", priceModifier: 275, scopeAddition: "Remove old disposal and install new unit." },
              { value: "pot-filler", label: "Add Pot Filler", priceModifier: 850, scopeAddition: "Install wall-mounted pot filler faucet above range with shutoff valve." },
              { value: "no-plumbing", label: "No Plumbing Work", priceModifier: 0, scopeAddition: "No plumbing modifications included." }
            ]
          },
          {
            id: "electrical-lighting",
            label: "Electrical & Lighting",
            type: "select",
            choices: [
              { value: "light-fixtures", label: "Replace Existing Light Fixtures Only", priceModifier: 450, scopeAddition: "Remove and replace existing light fixtures with new units." },
              { value: "under-cabinet", label: "Add / Replace Under-Cabinet Lighting", priceModifier: 650, scopeAddition: "Install hardwired LED strip lighting under upper cabinets with dimmer switch." },
              { value: "pendant", label: "Add / Replace Pendant Lights", priceModifier: 550, scopeAddition: "Install pendant light fixtures over island or sink area." },
              { value: "switches-dimmers", label: "Upgrade Switches / Dimmers", priceModifier: 300, scopeAddition: "Upgrade light switches to dimmer switches throughout kitchen." },
              { value: "no-electrical", label: "No Electrical Work", priceModifier: 0, scopeAddition: "No electrical modifications included." }
            ]
          }
        ]
      },
      {
        id: "partial-kitchen",
        name: "Partial Kitchen Remodel",
        basePriceRange: { low: 8000, high: 18000 },
        estimatedDays: { low: 7, high: 14 },
        warranty: "1-year labor warranty on all workmanship.",
        exclusions: [
          "Structural modifications",
          "Major plumbing relocation",
          "Appliance costs",
          "Permit fees"
        ],
        baseScope: [
          "Protect flooring and appliances with drop cloths.",
          "Remove designated cabinets, countertops, or backsplash as specified.",
          "Dispose of demolition debris off-site.",
          "Repair and prep walls as needed.",
          "Install new cabinets in designated areas per plan.",
          "Template and fabricate new countertops for affected areas.",
          "Install new countertops with proper support.",
          "Reconnect plumbing to sink if affected.",
          "Install backsplash in affected areas.",
          "Install new hardware on all cabinets.",
          "Caulk all edges and transitions.",
          "Final cleanup and inspection."
        ],
        options: [
          {
            id: "cabinet-scope",
            label: "Cabinet Scope",
            type: "select",
            choices: [
              { value: "new-stock", label: "New Stock Cabinets", priceModifier: 0, scopeAddition: "Install new stock cabinet line with standard finishes and hardware." },
              { value: "new-semi-custom", label: "New Semi-Custom Cabinets", priceModifier: 4000, scopeAddition: "Install new semi-custom cabinets with choice of door style and finish." },
              { value: "new-custom", label: "New Custom Cabinets", priceModifier: 15000, scopeAddition: "Install fully custom cabinets built to specifications with premium finishes." },
              { value: "reface", label: "Reface Existing Cabinets", priceModifier: -8000, scopeAddition: "Reface existing cabinet boxes with new doors, drawer fronts, and veneer." },
              { value: "paint", label: "Paint Existing Cabinets", priceModifier: -10000, scopeAddition: "Prep, prime, and paint existing cabinet boxes, doors, and drawers." },
              { value: "doors-only", label: "Replace Cabinet Doors Only", priceModifier: -12000, scopeAddition: "Replace cabinet doors and drawer fronts only; retain existing boxes." },
              { value: "hardware-only", label: "Replace Cabinet Hardware Only", priceModifier: -14000, scopeAddition: "Replace cabinet hardware (pulls/knobs) only; retain existing doors and boxes." },
              { value: "island-cabinets", label: "Add Island Cabinets", priceModifier: 3500, scopeAddition: "Add island base cabinets with matching finish to perimeter cabinets." },
              { value: "pantry-cabinets", label: "Add Pantry Cabinets", priceModifier: 2500, scopeAddition: "Add tall pantry cabinet unit with pull-out shelving." }
            ]
          },
          {
            id: "crown-trim",
            label: "Add Crown / Trim / Light Rail",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install crown molding, light rail, and decorative trim on all cabinets."
          },
          {
            id: "countertop-type",
            label: "Countertop Type",
            type: "select",
            choices: [
              { value: "laminate", label: "Laminate", priceModifier: -2000, scopeAddition: "Install premium laminate countertops with built-up edges." },
              { value: "butcher-block", label: "Butcher Block", priceModifier: -1000, scopeAddition: "Install solid wood butcher block countertops with food-safe finish." },
              { value: "solid-surface", label: "Solid Surface (e.g., Corian)", priceModifier: -500, scopeAddition: "Install solid surface countertops with integrated sink option." },
              { value: "quartz", label: "Quartz", priceModifier: 0, scopeAddition: "Install engineered quartz countertops (color per selection)." },
              { value: "granite", label: "Granite", priceModifier: 800, scopeAddition: "Install granite slab countertops with polished edges and sealer." },
              { value: "marble", label: "Marble", priceModifier: 2500, scopeAddition: "Install marble slab countertops with honed or polished finish and sealer." },
              { value: "porcelain-sintered", label: "Porcelain / Sintered Stone", priceModifier: 1500, scopeAddition: "Install porcelain or sintered stone countertops with polished finish." },
              { value: "concrete", label: "Concrete", priceModifier: 1800, scopeAddition: "Install custom concrete countertops with sealed finish." },
              { value: "tile", label: "Tile Countertop", priceModifier: -1500, scopeAddition: "Install tile countertops with bullnose edges and grouted joints." },
              { value: "keep-existing", label: "Keep Existing Countertops", priceModifier: -3000, scopeAddition: "Retain and protect existing countertops; reconnect sink and faucet." }
            ]
          },
          {
            id: "plumbing-fixtures",
            label: "Plumbing Fixtures",
            type: "select",
            choices: [
              { value: "sink-only", label: "Replace Sink Only", priceModifier: 350, scopeAddition: "Install new undermount or drop-in sink; reconnect existing plumbing." },
              { value: "faucet-only", label: "Replace Faucet Only", priceModifier: 250, scopeAddition: "Install new kitchen faucet with supply lines." },
              { value: "sink-faucet", label: "Replace Sink & Faucet", priceModifier: 550, scopeAddition: "Install new sink and faucet assembly with all connections." },
              { value: "add-disposal", label: "Add Garbage Disposal", priceModifier: 400, scopeAddition: "Install new garbage disposal unit with electrical connection." },
              { value: "replace-disposal", label: "Replace Garbage Disposal", priceModifier: 275, scopeAddition: "Remove old disposal and install new unit." },
              { value: "no-plumbing", label: "No Plumbing Work", priceModifier: 0, scopeAddition: "No plumbing modifications included." }
            ]
          },
          {
            id: "electrical-lighting",
            label: "Electrical & Lighting",
            type: "select",
            choices: [
              { value: "light-fixtures", label: "Replace Existing Light Fixtures Only", priceModifier: 450, scopeAddition: "Remove and replace existing light fixtures with new units." },
              { value: "under-cabinet", label: "Add / Replace Under-Cabinet Lighting", priceModifier: 650, scopeAddition: "Install hardwired LED strip lighting under upper cabinets with dimmer switch." },
              { value: "pendant", label: "Add / Replace Pendant Lights", priceModifier: 550, scopeAddition: "Install pendant light fixtures over island or sink area." },
              { value: "outlets", label: "Add / Relocate Outlets", priceModifier: 400, scopeAddition: "Add or relocate electrical outlets per code requirements." },
              { value: "switches-dimmers", label: "Upgrade Switches / Dimmers", priceModifier: 300, scopeAddition: "Upgrade light switches to dimmer switches throughout kitchen." },
              { value: "no-electrical", label: "No Electrical Work", priceModifier: 0, scopeAddition: "No electrical modifications included." }
            ]
          }
        ]
      },
      {
        id: "cabinet-reface",
        name: "Cabinet Reface Only",
        basePriceRange: { low: 6000, high: 12000 },
        estimatedDays: { low: 4, high: 7 },
        warranty: "1-year labor warranty. Manufacturer warranty on materials.",
        exclusions: [
          "Countertop replacement",
          "Structural modifications to cabinets",
          "Plumbing or electrical work",
          "Appliance installation"
        ],
        baseScope: [
          "Protect countertops, flooring, and appliances with drop cloths.",
          "Remove all cabinet doors, drawer fronts, and hardware.",
          "Clean and prep cabinet box surfaces.",
          "Apply veneer or laminate to visible cabinet box surfaces.",
          "Install new cabinet doors with matching finish.",
          "Install new drawer fronts with matching finish.",
          "Install new soft-close hinges on all doors.",
          "Install new soft-close drawer slides.",
          "Install new cabinet hardware (pulls/knobs).",
          "Adjust all doors and drawers for proper alignment.",
          "Final cleanup and quality inspection."
        ],
        options: [
          {
            id: "crown-trim",
            label: "Add Crown / Trim / Light Rail",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install crown molding, light rail, and decorative trim on all cabinets."
          },
          {
            id: "door-style",
            label: "Door Style",
            type: "select",
            choices: [
              { value: "shaker", label: "Shaker Style", priceModifier: 0, scopeAddition: "Install shaker style cabinet doors." },
              { value: "raised-panel", label: "Raised Panel", priceModifier: 500, scopeAddition: "Install raised panel cabinet doors." },
              { value: "flat-panel", label: "Flat Panel / Slab", priceModifier: 300, scopeAddition: "Install flat panel slab cabinet doors." },
              { value: "glass-insert", label: "Glass Insert Doors", priceModifier: 800, scopeAddition: "Install cabinet doors with glass inserts on select upper cabinets." }
            ]
          },
          {
            id: "interior-upgrade",
            label: "Cabinet Interior Upgrade",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install shelf liner and upgrade interior finish on all cabinets."
          }
        ]
      },
      {
        id: "cabinet-paint",
        name: "Cabinet Paint Only",
        basePriceRange: { low: 3500, high: 7000 },
        estimatedDays: { low: 3, high: 5 },
        warranty: "1-year warranty on paint finish.",
        exclusions: [
          "Countertop replacement",
          "Structural repairs to cabinets",
          "Plumbing or electrical work",
          "Hardware replacement (unless selected)"
        ],
        baseScope: [
          "Protect countertops, flooring, and appliances with drop cloths.",
          "Remove all cabinet doors, drawer fronts, and hardware.",
          "Clean all surfaces with degreaser to remove oils and residue.",
          "Sand all cabinet surfaces for proper paint adhesion.",
          "Fill holes, dents, and imperfections with wood filler.",
          "Apply bonding primer to all surfaces.",
          "Apply two coats of cabinet-grade paint to all surfaces.",
          "Allow proper cure time between coats.",
          "Reinstall all doors and drawer fronts.",
          "Adjust all doors and drawers for proper alignment.",
          "Touch-up any imperfections.",
          "Final cleanup and inspection."
        ],
        options: [
          {
            id: "crown-trim",
            label: "Add Crown / Trim / Light Rail",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install crown molding, light rail, and decorative trim on all cabinets."
          },
          {
            id: "new-hardware",
            label: "New Cabinet Hardware",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Supply and install new cabinet hardware (pulls/knobs)."
          },
          {
            id: "soft-close",
            label: "Soft-Close Hinge Upgrade",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Replace existing hinges with soft-close hinges on all doors."
          },
          {
            id: "interior-paint",
            label: "Paint Cabinet Interiors",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Paint interior surfaces of all cabinets."
          }
        ]
      },
      {
        id: "countertop-replace",
        name: "Countertop Replacement Only",
        basePriceRange: { low: 3000, high: 8000 },
        estimatedDays: { low: 2, high: 3 },
        warranty: "1-year labor warranty. Manufacturer warranty on materials.",
        exclusions: [
          "Cabinet modifications",
          "Backsplash replacement",
          "Plumbing relocation",
          "Electrical work"
        ],
        baseScope: [
          "Protect flooring and cabinets with drop cloths.",
          "Disconnect plumbing to sink and disposal.",
          "Remove existing countertops and dispose off-site.",
          "Inspect cabinet tops for level and structural integrity.",
          "Template new countertops for fabrication.",
          "Install new countertops with proper support and leveling.",
          "Cut sink and faucet holes per template.",
          "Install undermount or drop-in sink.",
          "Reconnect plumbing to sink and disposal.",
          "Install new faucet if provided.",
          "Apply silicone caulk at wall and cabinet joints.",
          "Seal natural stone if applicable.",
          "Final cleanup and inspection."
        ],
        options: [
          {
            id: "countertop-type",
            label: "Countertop Type",
            type: "select",
            choices: [
              { value: "laminate", label: "Laminate", priceModifier: -2000, scopeAddition: "Install premium laminate countertops with built-up edges." },
              { value: "butcher-block", label: "Butcher Block", priceModifier: -1000, scopeAddition: "Install solid wood butcher block countertops with food-safe finish." },
              { value: "solid-surface", label: "Solid Surface (e.g., Corian)", priceModifier: -500, scopeAddition: "Install solid surface countertops with integrated sink option." },
              { value: "quartz", label: "Quartz", priceModifier: 0, scopeAddition: "Install engineered quartz countertops (color per selection)." },
              { value: "granite", label: "Granite", priceModifier: 800, scopeAddition: "Install granite slab countertops with polished edges and sealer." },
              { value: "marble", label: "Marble", priceModifier: 2500, scopeAddition: "Install marble slab countertops with honed or polished finish and sealer." },
              { value: "porcelain-sintered", label: "Porcelain / Sintered Stone", priceModifier: 1500, scopeAddition: "Install porcelain or sintered stone countertops with polished finish." },
              { value: "concrete", label: "Concrete", priceModifier: 1800, scopeAddition: "Install custom concrete countertops with sealed finish." },
              { value: "tile", label: "Tile Countertop", priceModifier: -1500, scopeAddition: "Install tile countertops with bullnose edges and grouted joints." }
            ]
          },
          {
            id: "edge-profile",
            label: "Edge Profile",
            type: "select",
            choices: [
              { value: "eased", label: "Eased Edge", priceModifier: 0, scopeAddition: "Standard eased edge profile." },
              { value: "beveled", label: "Beveled Edge", priceModifier: 150, scopeAddition: "Beveled edge profile on all exposed edges." },
              { value: "bullnose", label: "Bullnose Edge", priceModifier: 200, scopeAddition: "Full bullnose edge profile on all exposed edges." },
              { value: "ogee", label: "Ogee Edge", priceModifier: 300, scopeAddition: "Decorative ogee edge profile on all exposed edges." },
              { value: "waterfall", label: "Waterfall Edge", priceModifier: 1500, scopeAddition: "Waterfall edge extending countertop to floor on island end." }
            ]
          },
          {
            id: "plumbing-fixtures",
            label: "Plumbing Fixtures",
            type: "select",
            choices: [
              { value: "sink-only", label: "Replace Sink Only", priceModifier: 350, scopeAddition: "Install new undermount or drop-in sink; reconnect existing plumbing." },
              { value: "faucet-only", label: "Replace Faucet Only", priceModifier: 250, scopeAddition: "Install new kitchen faucet with supply lines." },
              { value: "sink-faucet", label: "Replace Sink & Faucet", priceModifier: 550, scopeAddition: "Install new sink and faucet assembly with all connections." },
              { value: "add-disposal", label: "Add Garbage Disposal", priceModifier: 400, scopeAddition: "Install new garbage disposal unit with electrical connection." },
              { value: "replace-disposal", label: "Replace Garbage Disposal", priceModifier: 275, scopeAddition: "Remove old disposal and install new unit." },
              { value: "no-plumbing", label: "No Plumbing Work", priceModifier: 0, scopeAddition: "Reconnect existing sink and faucet only." }
            ]
          }
        ]
      },
      {
        id: "backsplash-install",
        name: "Backsplash Install Only",
        basePriceRange: { low: 1200, high: 3000 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "1-year labor warranty.",
        exclusions: [
          "Countertop replacement",
          "Electrical outlet relocation",
          "Cabinet modifications"
        ],
        baseScope: [
          "Protect countertops and appliances with drop cloths.",
          "Remove existing backsplash material or prepare bare wall.",
          "Repair and smooth drywall as needed.",
          "Layout tile pattern; mark electrical outlet locations.",
          "Apply thin-set mortar and install tile per design.",
          "Cut tiles around outlets, switches, and edges using wet saw.",
          "Allow tile to set for 24 hours.",
          "Apply grout to all joints; clean excess from tile.",
          "Apply grout sealer after 48-hour cure.",
          "Reinstall outlet and switch covers.",
          "Apply silicone caulk at countertop and cabinet joints.",
          "Final cleanup and inspection."
        ],
        options: [
          {
            id: "tile-type",
            label: "Tile Type",
            type: "select",
            choices: [
              { value: "ceramic-subway", label: "Ceramic Subway Tile", priceModifier: 0, scopeAddition: "Install classic ceramic subway tile in selected color." },
              { value: "glass-subway", label: "Glass Subway Tile", priceModifier: 400, scopeAddition: "Install glass subway tile with enhanced light reflection." },
              { value: "mosaic", label: "Mosaic / Pattern Tile", priceModifier: 500, scopeAddition: "Install mosaic or patterned tile design." },
              { value: "natural-stone", label: "Natural Stone", priceModifier: 800, scopeAddition: "Install natural stone tile with appropriate sealer." },
              { value: "porcelain", label: "Porcelain Tile", priceModifier: 300, scopeAddition: "Install porcelain tile with enhanced durability." },
              { value: "peel-stick", label: "Peel & Stick Tile", priceModifier: -400, scopeAddition: "Install peel and stick tile for quick installation." }
            ]
          },
          {
            id: "height",
            label: "Backsplash Height",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (4 inches)", priceModifier: 0, scopeAddition: "Install 4-inch backsplash height." },
              { value: "countertop-to-cabinet", label: "Countertop to Upper Cabinets", priceModifier: 350, scopeAddition: "Extend backsplash from countertop to bottom of upper cabinets." },
              { value: "full-wall", label: "Full Wall Height", priceModifier: 600, scopeAddition: "Install backsplash tile to ceiling height." }
            ]
          },
          {
            id: "accent-strip",
            label: "Decorative Accent Strip",
            type: "boolean",
            priceModifier: 250,
            scopeAddition: "Install decorative accent strip or border within backsplash design."
          }
        ]
      },
      {
        id: "flooring-replace",
        name: "Flooring Replacement Only",
        basePriceRange: { low: 2500, high: 6000 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "1-year labor warranty. Manufacturer warranty on materials.",
        exclusions: [
          "Subfloor repair beyond minor patching",
          "Appliance disconnection/reconnection",
          "Cabinet removal",
          "Asbestos abatement"
        ],
        baseScope: [
          "Move appliances and furniture as needed for access.",
          "Remove existing flooring material and dispose off-site.",
          "Inspect subfloor for damage or unevenness.",
          "Repair minor subfloor issues as needed.",
          "Clean and prep subfloor surface.",
          "Install new flooring per manufacturer specifications.",
          "Install transitions at doorways and floor height changes.",
          "Install quarter-round or shoe molding at perimeter.",
          "Return appliances and furniture to position.",
          "Final cleanup and inspection."
        ],
        options: [
          {
            id: "flooring-type",
            label: "Flooring Type",
            type: "select",
            choices: [
              { value: "lvp", label: "Luxury Vinyl Plank (LVP)", priceModifier: 0, scopeAddition: "Install luxury vinyl plank flooring with click-lock system." },
              { value: "lvt", label: "Luxury Vinyl Tile (LVT)", priceModifier: 100, scopeAddition: "Install luxury vinyl tile flooring with adhesive or click-lock system." },
              { value: "ceramic-tile", label: "Ceramic Tile", priceModifier: 500, scopeAddition: "Install ceramic tile flooring with thin-set mortar and grout." },
              { value: "porcelain-tile", label: "Porcelain Tile", priceModifier: 800, scopeAddition: "Install porcelain tile flooring with thin-set mortar and grout." },
              { value: "hardwood", label: "Hardwood", priceModifier: 1500, scopeAddition: "Install solid or engineered hardwood flooring." },
              { value: "laminate", label: "Laminate", priceModifier: -300, scopeAddition: "Install laminate flooring with underlayment." }
            ]
          },
          {
            id: "subfloor-prep",
            label: "Subfloor Leveling",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Apply self-leveling compound to correct uneven subfloor areas."
          },
          {
            id: "heated-floor",
            label: "Electric Radiant Heat",
            type: "boolean",
            priceModifier: 1400,
            scopeAddition: "Install electric radiant heating mat under flooring with programmable thermostat."
          }
        ]
      },
      {
        id: "appliance-install",
        name: "Appliance Install Only",
        basePriceRange: { low: 250, high: 750 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "30-day warranty on installation (appliance warranty separate).",
        exclusions: [
          "Appliance purchase",
          "Electrical panel upgrades",
          "Gas line installation or modification",
          "Countertop or cabinet modifications"
        ],
        baseScope: [
          "Unpack and inspect new appliance for damage.",
          "Remove existing appliance and set aside or dispose.",
          "Clean installation area.",
          "Position new appliance and level.",
          "Connect water, gas, or electrical as applicable.",
          "Test all functions and cycles.",
          "Remove all packaging materials.",
          "Provide basic operation overview to homeowner."
        ],
        options: [
          {
            id: "appliance-type",
            label: "Appliance Type",
            type: "select",
            choices: [
              { value: "dishwasher", label: "Dishwasher", priceModifier: 0, scopeAddition: "Install dishwasher with water and electrical connections." },
              { value: "range-electric", label: "Range (Electric)", priceModifier: 0, scopeAddition: "Install electric range with proper electrical connection." },
              { value: "range-gas", label: "Range (Gas)", priceModifier: 100, scopeAddition: "Install gas range with proper gas connection and leak test." },
              { value: "refrigerator", label: "Refrigerator", priceModifier: 50, scopeAddition: "Install refrigerator with water line connection if applicable." },
              { value: "microwave-otr", label: "Over-the-Range Microwave", priceModifier: 150, scopeAddition: "Install over-the-range microwave with mounting bracket and electrical." },
              { value: "range-hood", label: "Range Hood", priceModifier: 100, scopeAddition: "Install range hood with electrical connection." },
              { value: "garbage-disposal", label: "Garbage Disposal", priceModifier: -100, scopeAddition: "Install garbage disposal with electrical connection." }
            ]
          },
          {
            id: "haul-away",
            label: "Haul Away Old Appliance",
            type: "boolean",
            priceModifier: 75,
            scopeAddition: "Remove and dispose of old appliance at recycling facility."
          },
          {
            id: "water-line",
            label: "Install New Water Line",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Install braided stainless steel water supply line for refrigerator or dishwasher."
          },
          {
            id: "anti-tip",
            label: "Anti-Tip Bracket Installation",
            type: "boolean",
            priceModifier: 50,
            scopeAddition: "Install anti-tip bracket for range per manufacturer and code requirements."
          }
        ]
      },
      {
        id: "island-addition",
        name: "Island Addition / Modification",
        basePriceRange: { low: 5000, high: 15000 },
        estimatedDays: { low: 3, high: 7 },
        warranty: "1-year labor warranty on all workmanship.",
        exclusions: [
          "Structural floor modifications",
          "Major electrical panel upgrades",
          "Major plumbing relocation",
          "Flooring under island"
        ],
        baseScope: [
          "Verify floor structure can support island weight.",
          "Mark island footprint per approved layout.",
          "Install island base cabinets and secure to floor.",
          "Level and shim cabinets as needed.",
          "Install cabinet backs and end panels.",
          "Template and fabricate island countertop.",
          "Install island countertop with proper support.",
          "Install toe kick and decorative trim.",
          "Install cabinet hardware.",
          "Caulk all joints and transitions.",
          "Final cleanup and inspection."
        ],
        options: [
          {
            id: "island-size",
            label: "Island Size",
            type: "select",
            choices: [
              { value: "small", label: "Small (3-4 ft)", priceModifier: 0, scopeAddition: "Build 3-4 foot kitchen island with base cabinets and countertop." },
              { value: "medium", label: "Medium (5-6 ft)", priceModifier: 2000, scopeAddition: "Build 5-6 foot kitchen island with base cabinets, countertop, and seating overhang." },
              { value: "large", label: "Large (7-8 ft)", priceModifier: 4000, scopeAddition: "Build 7-8 foot kitchen island with base cabinets, countertop, seating, and storage." },
              { value: "custom", label: "Custom Size", priceModifier: 5000, scopeAddition: "Build custom-sized kitchen island per specifications." }
            ]
          },
          {
            id: "countertop-type",
            label: "Countertop Type",
            type: "select",
            choices: [
              { value: "laminate", label: "Laminate", priceModifier: -2000, scopeAddition: "Install premium laminate countertop on island." },
              { value: "butcher-block", label: "Butcher Block", priceModifier: -1000, scopeAddition: "Install solid wood butcher block countertop on island." },
              { value: "quartz", label: "Quartz", priceModifier: 0, scopeAddition: "Install engineered quartz countertop on island." },
              { value: "granite", label: "Granite", priceModifier: 800, scopeAddition: "Install granite slab countertop on island with polished edges." },
              { value: "marble", label: "Marble", priceModifier: 2500, scopeAddition: "Install marble slab countertop on island." },
              { value: "waterfall", label: "Waterfall Edge", priceModifier: 3500, scopeAddition: "Install countertop with waterfall edge extending to floor." }
            ]
          },
          {
            id: "prep-sink",
            label: "Add Prep Sink",
            type: "boolean",
            priceModifier: 850,
            scopeAddition: "Install small prep sink in island with faucet and drain connection."
          },
          {
            id: "electrical",
            label: "Island Electrical",
            type: "select",
            choices: [
              { value: "none", label: "No Electrical", priceModifier: 0 },
              { value: "outlets", label: "Add Outlets", priceModifier: 400, scopeAddition: "Install electrical outlets in island for small appliances." },
              { value: "outlets-pendants", label: "Outlets + Pendant Lights", priceModifier: 950, scopeAddition: "Install electrical outlets and pendant lights above island." }
            ]
          },
          {
            id: "seating",
            label: "Seating Overhang",
            type: "boolean",
            priceModifier: 600,
            scopeAddition: "Extend countertop with seating overhang and install support brackets."
          }
        ]
      },
      {
        id: "pantry-buildout",
        name: "Pantry Build-Out / Modification",
        basePriceRange: { low: 3000, high: 8000 },
        estimatedDays: { low: 2, high: 5 },
        warranty: "1-year labor warranty on all workmanship.",
        exclusions: [
          "Structural wall modifications",
          "Major electrical work",
          "HVAC modifications",
          "Flooring changes"
        ],
        baseScope: [
          "Protect surrounding areas with drop cloths.",
          "Remove existing shelving or pantry components if present.",
          "Inspect wall structure and prep for installation.",
          "Install blocking and support as needed.",
          "Install pantry cabinet unit or shelving system.",
          "Level and secure all components.",
          "Install doors or drawers as specified.",
          "Install hardware (pulls/knobs).",
          "Caulk all joints and trim.",
          "Final cleanup and inspection."
        ],
        options: [
          {
            id: "pantry-type",
            label: "Pantry Type",
            type: "select",
            choices: [
              { value: "reach-in", label: "Reach-In Pantry Shelving", priceModifier: 0, scopeAddition: "Install adjustable wire or wood shelving in existing reach-in space." },
              { value: "tall-cabinet", label: "Tall Pantry Cabinet", priceModifier: 1500, scopeAddition: "Install tall pantry cabinet unit with adjustable shelves." },
              { value: "pull-out", label: "Pull-Out Pantry System", priceModifier: 2000, scopeAddition: "Install pull-out pantry system with full-extension drawers and soft-close." },
              { value: "walk-in", label: "Walk-In Pantry Build-Out", priceModifier: 3500, scopeAddition: "Build out walk-in pantry with custom shelving on multiple walls." }
            ]
          },
          {
            id: "door-type",
            label: "Door Type",
            type: "select",
            choices: [
              { value: "none", label: "Open (No Door)", priceModifier: 0 },
              { value: "swing", label: "Swing Door", priceModifier: 350, scopeAddition: "Install swing door with matching trim and hardware." },
              { value: "barn-door", label: "Barn Door", priceModifier: 650, scopeAddition: "Install sliding barn door with track hardware." },
              { value: "pocket-door", label: "Pocket Door", priceModifier: 850, scopeAddition: "Install pocket door with pocket frame and hardware." },
              { value: "bi-fold", label: "Bi-Fold Doors", priceModifier: 400, scopeAddition: "Install bi-fold doors with track and hardware." }
            ]
          },
          {
            id: "lighting",
            label: "Pantry Lighting",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install LED lighting inside pantry with door-activated switch."
          },
          {
            id: "countertop",
            label: "Add Countertop Work Surface",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install countertop work surface inside pantry."
          }
        ]
      }
    ]
  },
  {
    id: "painting",
    trade: "Painting",
    jobTypes: [
      {
        id: "interior-room",
        name: "Single Room Painting",
        basePriceRange: { low: 450, high: 850 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "1-year warranty against peeling, flaking, or blistering.",
        exclusions: ["Repair of water damage", "Wallpaper removal", "Lead paint abatement"],
        baseScope: [
          "Move furniture to center of room and cover with drop cloths.",
          "Mask floors, trim, outlets, and windows with tape and plastic.",
          "Patch minor holes, nail pops, and hairline cracks with spackling compound.",
          "Sand patches smooth and spot prime all repairs.",
          "Caulk gaps between trim and walls with paintable caulk.",
          "Apply two coats of premium interior latex paint (walls only).",
          "Cut-in all edges, corners, and around fixtures.",
          "Remove all masking materials; clean up paint drips.",
          "Return furniture to original positions.",
          "Final touch-up and walkthrough."
        ],
        options: [
          {
            id: "room-area",
            label: "Area of Home",
            type: "select",
            choices: [
              { value: "basement", label: "Basement", priceModifier: 0, scopeAddition: "Paint designated basement room." },
              { value: "mud-room", label: "Mud Room", priceModifier: 0, scopeAddition: "Paint mud room / entryway area." },
              { value: "master-bathroom", label: "Master Bathroom", priceModifier: 50, scopeAddition: "Paint master bathroom including moisture-resistant preparation for high-humidity area." },
              { value: "dining-room", label: "Dining Room", priceModifier: 0, scopeAddition: "Paint dining room." }
            ]
          },
          {
            id: "trim-doors",
            label: "Include Trim & Doors",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Sand, prime, and apply semi-gloss paint to all baseboards, door casings, and door slabs."
          },
          {
            id: "ceilings",
            label: "Include Ceiling",
            type: "boolean",
            priceModifier: 250,
            scopeAddition: "Apply two coats of flat ceiling paint to entire ceiling surface."
          },
          {
            id: "closets",
            label: "Include Closet(s)",
            type: "boolean",
            priceModifier: 200,
            scopeAddition: "Paint interior walls and ceiling of closet(s) in room."
          },
          {
            id: "accent-wall",
            label: "Accent Wall (different color)",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Apply contrasting color paint to designated accent wall."
          }
        ]
      },
      {
        id: "whole-house-interior",
        name: "Whole House Interior Painting",
        basePriceRange: { low: 3500, high: 7500 },
        estimatedDays: { low: 4, high: 8 },
        warranty: "2-year warranty against peeling, flaking, or blistering.",
        exclusions: ["Extensive drywall repair", "Popcorn ceiling removal", "Lead paint abatement"],
        baseScope: [
          "Protect all floors with drop cloths and plastic sheeting.",
          "Move furniture as needed; cover with protective materials.",
          "Mask all windows, doors, cabinets, and fixtures.",
          "Patch all holes, cracks, and nail pops throughout home.",
          "Sand patches and apply primer to repairs.",
          "Caulk all gaps between trim and walls.",
          "Apply two coats premium interior latex to all wall surfaces.",
          "Cut-in all edges and around all fixtures.",
          "Apply semi-gloss paint to all door frames and casings.",
          "Paint all interior doors (both sides if requested).",
          "Paint all baseboards throughout home.",
          "Touch-up all areas as needed.",
          "Remove all masking and protective materials.",
          "Final cleanup and walkthrough."
        ],
        options: [
          {
            id: "ceilings-all",
            label: "All Ceilings",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Apply two coats flat ceiling paint to all ceilings throughout home."
          },
          {
            id: "staircase",
            label: "Staircase & Railing",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Sand and paint stair rails, balusters, and newel posts."
          },
          {
            id: "cabinet-paint",
            label: "Kitchen Cabinet Painting",
            type: "boolean",
            priceModifier: 2500,
            scopeAddition: "Prep, prime, and paint kitchen cabinet boxes, doors, and drawers (add 3-4 days)."
          }
        ]
      },
      {
        id: "exterior-paint",
        name: "Exterior House Painting",
        basePriceRange: { low: 4500, high: 9500 },
        estimatedDays: { low: 4, high: 10 },
        warranty: "5-year warranty against peeling, flaking, or blistering.",
        exclusions: ["Carpentry repairs beyond minor patching", "Lead paint abatement", "Deck/fence staining"],
        baseScope: [
          "Power wash all exterior surfaces to remove dirt and mildew.",
          "Allow surfaces to dry completely before painting.",
          "Scrape and sand all loose or peeling paint.",
          "Caulk all gaps around windows, doors, and trim.",
          "Prime bare wood and repairs with exterior primer.",
          "Mask windows, doors, and fixtures with tape and plastic.",
          "Apply two coats premium exterior paint to siding/body.",
          "Apply contrasting color to trim, fascia, and soffits.",
          "Paint front door with accent color (if selected).",
          "Paint shutters and decorative elements.",
          "Remove all masking materials.",
          "Touch-up any missed areas or drips.",
          "Final cleanup and debris removal."
        ],
        options: [
          {
            id: "pressure-wash-only",
            label: "Pressure Wash Deck/Patio",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Pressure wash deck and/or patio surface as part of painting project."
          },
          {
            id: "gutter-paint",
            label: "Paint Gutters & Downspouts",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Prep and paint all gutters and downspouts to match trim color."
          },
          {
            id: "front-door-accent",
            label: "Accent Front Door",
            type: "boolean",
            priceModifier: 250,
            scopeAddition: "Sand, prime, and paint front door with premium accent color."
          }
        ]
      }
    ]
  },
  {
    id: "plumbing",
    trade: "Plumbing",
    jobTypes: [
      {
        id: "valve-repair",
        name: "Valve Repair & Replacement",
        basePriceRange: { low: 350, high: 650 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year warranty on parts and labor.",
        exclusions: ["Wall/ceiling repair after access", "Whole-house repiping"],
        baseScope: [
          "Shut off water supply to affected area.",
          "Drain lines to prevent water spillage.",
          "Remove defective valve mechanism.",
          "Install new quarter-turn ball valve or fixture stop.",
          "Replace supply lines with braided stainless steel hoses.",
          "Apply thread sealant to all threaded connections.",
          "Restore water supply and test for leaks.",
          "Verify proper valve operation.",
          "Clean up work area."
        ],
        options: [
          {
            id: "access-panel",
            label: "Install Access Panel",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Cut and frame opening for future access; install snap-in plastic access panel."
          },
          {
            id: "whole-house-check",
            label: "Whole House Plumbing Inspection",
            type: "boolean",
            priceModifier: 225,
            scopeAddition: "Perform visual inspection of all visible plumbing fixtures, water heater, and water lines."
          }
        ]
      },
      {
        id: "water-heater",
        name: "Water Heater Replacement (Tank)",
        basePriceRange: { low: 1400, high: 2200 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Tank warranty per manufacturer (6-12 years). 1-year labor warranty.",
        exclusions: ["Gas line modifications", "Electrical panel upgrades", "Permit fees"],
        baseScope: [
          "Disconnect and drain existing water heater.",
          "Disconnect gas/electric and water connections.",
          "Remove old unit and transport off-site for disposal.",
          "Install new 40/50 gallon tank water heater.",
          "Connect cold water inlet and hot water outlet.",
          "Install new flexible water heater connectors.",
          "Connect gas line or electrical per code (existing supply).",
          "Install new T&P relief valve and discharge pipe.",
          "Install expansion tank if required by local code.",
          "Fill tank and bleed air from lines.",
          "Light pilot/power on unit; verify operation.",
          "Check for leaks at all connections.",
          "Set temperature to recommended 120°F."
        ],
        options: [
          {
            id: "pan-drain",
            label: "New Drain Pan & Line",
            type: "boolean",
            priceModifier: 275,
            scopeAddition: "Install new aluminum safety pan and run drain line to floor drain or exterior."
          },
          {
            id: "upgrade-50gal",
            label: "Upgrade to 50 Gallon",
            type: "boolean",
            priceModifier: 200,
            scopeAddition: "Upgrade to 50-gallon tank capacity (from standard 40-gallon)."
          },
          {
            id: "recirculating-pump",
            label: "Hot Water Recirculating Pump",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install demand-type recirculating pump for instant hot water at fixtures."
          }
        ]
      },
      {
        id: "tankless-install",
        name: "Tankless Water Heater Installation",
        basePriceRange: { low: 3500, high: 5500 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "Unit warranty per manufacturer (10-15 years). 2-year labor warranty.",
        exclusions: ["Gas line upgrade if undersized", "Electrical panel upgrade"],
        baseScope: [
          "Remove existing tank water heater and dispose.",
          "Mount new tankless unit on wall or exterior per manufacturer specs.",
          "Run new gas line if required (up to 10 linear feet included).",
          "Install proper venting (category III stainless steel or PVC direct vent).",
          "Connect cold water inlet with isolation valve.",
          "Connect hot water outlet to existing distribution.",
          "Install condensate drain if condensing unit.",
          "Wire unit to power source (dedicated circuit if electric).",
          "Program unit settings and flow rates.",
          "Test operation at multiple fixtures.",
          "Verify gas pressure and combustion.",
          "Provide owner orientation on operation and maintenance."
        ],
        options: [
          {
            id: "outdoor-unit",
            label: "Outdoor Installation",
            type: "boolean",
            priceModifier: -500,
            scopeAddition: "Install outdoor-rated tankless unit (eliminates venting requirement)."
          },
          {
            id: "whole-house-filter",
            label: "Whole-House Water Filter",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Install sediment and scale filter upstream of tankless unit."
          }
        ]
      },
      {
        id: "repipe-whole-house",
        name: "Whole House Repipe (PEX)",
        basePriceRange: { low: 5500, high: 9500 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "25-year warranty on PEX piping. 2-year labor warranty.",
        exclusions: ["Drywall/ceiling repair (patching only)", "Fixture replacement", "Permits"],
        baseScope: [
          "Shut off main water supply to property.",
          "Cut access holes in walls/ceilings as needed for routing.",
          "Remove and dispose of existing galvanized/copper supply lines.",
          "Install new PEX manifold system at central location.",
          "Run new PEX lines to all fixtures using home-run method.",
          "Install shut-off valves at manifold for each fixture.",
          "Install new angle stops at each fixture location.",
          "Pressure test entire system to 80 PSI for 1 hour.",
          "Connect all fixtures and verify operation.",
          "Insulate exposed PEX lines in attic/crawl space.",
          "Patch access holes with drywall (ready for paint).",
          "Final leak check and system walkthrough."
        ],
        options: [
          {
            id: "drain-repipe",
            label: "Include Drain Line Replacement",
            type: "boolean",
            priceModifier: 3500,
            scopeAddition: "Replace all accessible drain lines with new ABS or PVC piping."
          },
          {
            id: "hose-bibs",
            label: "New Exterior Hose Bibs",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install (2) new frost-free hose bibs at front and rear of home."
          }
        ]
      },
      {
        id: "drain-cleaning",
        name: "Drain Cleaning & Clog Removal",
        basePriceRange: { low: 150, high: 450 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "30-day warranty on cleared drain.",
        exclusions: ["Pipe repair or replacement", "Septic system issues", "Main sewer line replacement"],
        baseScope: [
          "Diagnose source and location of clog.",
          "Select appropriate clearing method for clog type.",
          "Clear drain using snake/auger or hydro-jetting.",
          "Flush drain with water to verify flow.",
          "Clean accessible drain components.",
          "Test drain operation under normal use.",
          "Provide recommendations for prevention.",
          "Clean up work area."
        ],
        options: [
          {
            id: "camera-inspection",
            label: "Video Camera Inspection",
            type: "boolean",
            priceModifier: 225,
            scopeAddition: "Perform video camera inspection of drain line to identify issues and document condition."
          },
          {
            id: "multiple-drains",
            label: "Additional Drain (2-3 total)",
            type: "boolean",
            priceModifier: 125,
            scopeAddition: "Clear additional drain in same visit."
          }
        ]
      },
      {
        id: "fixture-install",
        name: "Plumbing Fixture Installation",
        basePriceRange: { low: 250, high: 550 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year labor warranty. Fixture warranty per manufacturer.",
        exclusions: ["Fixture cost (unless specified)", "Plumbing rough-in changes", "Wall repair"],
        baseScope: [
          "Shut off water supply to fixture location.",
          "Remove existing fixture and dispose.",
          "Clean and inspect existing connections.",
          "Install new fixture per manufacturer specs.",
          "Connect water supply lines with new stops if needed.",
          "Connect drain assembly.",
          "Apply appropriate sealants and caulk.",
          "Restore water and test for leaks.",
          "Test fixture operation.",
          "Clean up work area."
        ],
        options: [
          {
            id: "faucet-upgrade",
            label: "Premium Faucet Installation",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Install premium faucet with additional features (pull-down, touchless, etc.)."
          },
          {
            id: "supply-lines",
            label: "New Supply Lines",
            type: "boolean",
            priceModifier: 75,
            scopeAddition: "Replace supply lines with new braided stainless steel."
          }
        ]
      },
      {
        id: "sump-pump",
        name: "Sump Pump Installation/Replacement",
        basePriceRange: { low: 650, high: 1400 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Pump warranty per manufacturer. 1-year labor warranty.",
        exclusions: ["French drain installation", "Foundation waterproofing", "Pit excavation"],
        baseScope: [
          "Remove existing sump pump (if applicable).",
          "Inspect sump pit condition and clean debris.",
          "Install new submersible sump pump.",
          "Connect check valve to prevent backflow.",
          "Connect discharge pipe to existing outlet.",
          "Wire pump to dedicated or existing circuit.",
          "Test pump operation and float switch.",
          "Verify proper discharge and no leaks.",
          "Provide operation and maintenance instructions."
        ],
        options: [
          {
            id: "battery-backup",
            label: "Battery Backup System",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install battery backup sump pump system for power outage protection."
          },
          {
            id: "high-water-alarm",
            label: "High Water Alarm",
            type: "boolean",
            priceModifier: 75,
            scopeAddition: "Install audible high water alarm in sump pit."
          }
        ]
      },
      {
        id: "toilet-install",
        name: "Toilet Installation/Replacement",
        basePriceRange: { low: 350, high: 650 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year labor warranty. Toilet warranty per manufacturer.",
        exclusions: ["Toilet fixture cost (unless included)", "Flange repair if heavily corroded", "Subfloor repair"],
        baseScope: [
          "Shut off water supply at angle stop.",
          "Disconnect water supply line from existing toilet.",
          "Remove existing toilet and inspect flange condition.",
          "Clean existing flange and remove old wax/gasket.",
          "Install new wax ring or wax-free seal.",
          "Set new toilet on flange and secure with closet bolts.",
          "Level toilet and shim if necessary.",
          "Connect new water supply line.",
          "Turn on water and fill tank.",
          "Test flush operation and check for leaks.",
          "Caulk base of toilet to floor.",
          "Install new toilet seat.",
          "Clean up work area and remove old toilet."
        ],
        options: [
          {
            id: "toilet-style",
            label: "Toilet Style",
            type: "select",
            choices: [
              { value: "standard", label: "Standard Height (14-15\")", priceModifier: 0, scopeAddition: "Install standard height toilet." },
              { value: "comfort", label: "Comfort Height (17-19\")", priceModifier: 75, scopeAddition: "Install comfort/ADA height toilet (17-19\" seat height)." },
              { value: "elongated", label: "Elongated Bowl", priceModifier: 50, scopeAddition: "Install toilet with elongated bowl for added comfort." }
            ]
          },
          {
            id: "flange-repair",
            label: "Flange Repair/Replacement",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Remove damaged closet flange and install new PVC or stainless steel flange."
          },
          {
            id: "new-angle-stop",
            label: "Replace Angle Stop Valve",
            type: "boolean",
            priceModifier: 85,
            scopeAddition: "Replace existing angle stop with new quarter-turn valve."
          },
          {
            id: "bidet-seat",
            label: "Bidet Seat Installation",
            type: "boolean",
            priceModifier: 250,
            scopeAddition: "Install electric bidet seat with heated seat and water features (electrical outlet required)."
          }
        ]
      },
      {
        id: "tub-shower-conversion",
        name: "Tub to Shower Conversion",
        basePriceRange: { low: 4500, high: 8500 },
        estimatedDays: { low: 3, high: 6 },
        warranty: "2-year labor warranty on all plumbing work. Manufacturer warranty on fixtures.",
        exclusions: ["Tile work beyond immediate shower area", "Bathroom vanity work", "Electrical upgrades", "Permits"],
        baseScope: [
          "Shut off water supply to bathroom.",
          "Remove existing tub/shower unit and dispose off-site.",
          "Inspect drain and supply lines for condition.",
          "Modify drain location for shower pan (if needed).",
          "Install new P-trap and connect to existing drain.",
          "Install new shower pan/base with proper slope.",
          "Connect new shower drain to waste line.",
          "Install new shower valve and mixing controls.",
          "Connect hot and cold supply lines to valve.",
          "Install cement board backer on shower walls.",
          "Apply waterproof membrane to wet areas.",
          "Install shower head, arm, and escutcheon.",
          "Test all connections for leaks under pressure.",
          "Restore water supply and verify operation.",
          "Clean up work area."
        ],
        options: [
          {
            id: "toilet-replacement",
            label: "Replace Toilet (While Access is Open)",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Remove existing toilet, install new toilet with wax ring seal, supply line, and caulk base."
          },
          {
            id: "drain-relocation",
            label: "Drain Line Relocation",
            type: "boolean",
            priceModifier: 850,
            scopeAddition: "Relocate shower drain up to 24\" from existing location; includes concrete cutting if on slab."
          },
          {
            id: "valve-upgrade",
            label: "Thermostatic Valve Upgrade",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install thermostatic mixing valve with anti-scald protection."
          },
          {
            id: "handheld-shower",
            label: "Add Handheld Shower",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Install slide bar with handheld shower head in addition to fixed head."
          },
          {
            id: "body-sprays",
            label: "Body Spray System",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install (3) wall-mounted body spray jets with dedicated valve control."
          },
          {
            id: "linear-drain",
            label: "Linear Drain Upgrade",
            type: "boolean",
            priceModifier: 550,
            scopeAddition: "Install linear stainless steel drain system in lieu of standard center drain."
          }
        ]
      },
      {
        id: "shower-tub-valve",
        name: "Shower/Tub Valve Replacement",
        basePriceRange: { low: 450, high: 850 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year labor warranty. Valve warranty per manufacturer.",
        exclusions: ["Tile repair beyond access area", "Full shower renovation", "Moving valve location"],
        baseScope: [
          "Shut off water supply to shower/tub.",
          "Remove trim plate and handle to access valve.",
          "Cut access opening in wall if no rear access.",
          "Remove existing valve cartridge or entire valve body.",
          "Install new pressure-balanced valve or cartridge.",
          "Connect supply lines and solder/crimp connections.",
          "Test valve operation before closing wall.",
          "Install new trim kit (escutcheon, handle, spout).",
          "Patch access opening with drywall (ready for paint).",
          "Restore water and test operation.",
          "Verify no leaks at all connections.",
          "Clean up work area."
        ],
        options: [
          {
            id: "add-diverter",
            label: "Add Tub/Shower Diverter",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Install new diverter valve or spout to switch between tub and shower."
          },
          {
            id: "access-panel",
            label: "Install Access Panel",
            type: "boolean",
            priceModifier: 125,
            scopeAddition: "Install finished access panel for future valve maintenance."
          },
          {
            id: "toilet-replacement",
            label: "Replace Toilet (Add-On)",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "While on-site, remove old toilet and install new toilet with wax ring, supply line, and seat."
          }
        ]
      }
    ]
  },
  {
    id: "electrical",
    trade: "Electrical",
    jobTypes: [
      {
        id: "panel-upgrade",
        name: "Panel Upgrade & Service",
        basePriceRange: { low: 2500, high: 5500 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "Lifetime warranty on panel. 1-year labor warranty.",
        exclusions: ["Utility company fees for service change", "Permit fees", "Tree trimming for service clearance"],
        baseScope: [
          "Coordinate power shutdown with utility company.",
          "Disconnect and remove existing electrical panel.",
          "Install new 200-amp main breaker panel with copper bus bars.",
          "Install new main breaker and neutral/ground bus bars.",
          "Transfer all existing circuits to new arc-fault/GFCI breakers where required.",
          "Label all circuits clearly per NEC requirements.",
          "Install new grounding electrode system (ground rods and/or Ufer ground).",
          "Install proper bonding to gas, water, and CSST lines.",
          "Restore power and test all circuits for proper operation.",
          "Verify proper voltage and amperage at main and branch circuits.",
          "Provide load calculation documentation.",
          "Arrange for final inspection (permit fee separate)."
        ],
        options: [
          {
            id: "service-upgrade-type",
            label: "Current Service Size",
            type: "select",
            choices: [
              { value: "100a", label: "100A to 200A Upgrade", priceModifier: 0, scopeAddition: "Upgrade from 100-amp to 200-amp service." },
              { value: "60a", label: "60A to 200A Upgrade", priceModifier: 800, scopeAddition: "Upgrade from 60-amp to 200-amp service; includes new service entrance cable." },
              { value: "fuse-box", label: "Fuse Box to Breaker Panel", priceModifier: 600, scopeAddition: "Replace outdated fuse box with modern 200-amp breaker panel." }
            ]
          },
          {
            id: "meter-mast",
            label: "Replace Meter & Mast",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install new weatherhead, mast, meter base, and service entrance cable."
          },
          {
            id: "surge-protection",
            label: "Whole-House Surge Protection",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install whole-house surge protector at main panel."
          },
          {
            id: "burned-panel",
            label: "Burned/Damaged Panel Replacement",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Remove fire-damaged panel; assess and repair affected wiring connections."
          }
        ]
      },
      {
        id: "rewiring",
        name: "Whole-House or Partial Rewire",
        basePriceRange: { low: 8000, high: 25000 },
        estimatedDays: { low: 5, high: 14 },
        warranty: "2-year labor warranty on all wiring. Materials per manufacturer warranty.",
        exclusions: ["Drywall repair and painting", "Permit fees", "Insulation replacement"],
        baseScope: [
          "Conduct full electrical assessment and document existing conditions.",
          "Develop rewiring plan with circuit layout per NEC code requirements.",
          "De-energize and safely remove existing outdated wiring.",
          "Install new copper wiring (12 AWG and 14 AWG as appropriate).",
          "Install new electrical boxes at all outlet and switch locations.",
          "Run dedicated circuits for major appliances per code.",
          "Install arc-fault circuit interrupter (AFCI) breakers for bedroom circuits.",
          "Install ground-fault circuit interrupter (GFCI) protection in required areas.",
          "Install proper grounding throughout entire system.",
          "Label all circuits at panel per NEC requirements.",
          "Test all circuits for proper voltage, continuity, and grounding.",
          "Coordinate inspections with local authority."
        ],
        options: [
          {
            id: "rewire-type",
            label: "Rewiring Scope",
            type: "select",
            choices: [
              { value: "whole-house", label: "Whole-House Rewire", priceModifier: 0, scopeAddition: "Complete rewire of entire home including all branch circuits." },
              { value: "knob-tube", label: "Knob-and-Tube Replacement", priceModifier: 2500, scopeAddition: "Remove all knob-and-tube wiring and replace with modern NM cable." },
              { value: "aluminum", label: "Aluminum Wiring Remediation", priceModifier: 1800, scopeAddition: "Address aluminum wiring hazards using COPALUM or approved connectors throughout." }
            ]
          },
          {
            id: "partial-kitchen",
            label: "Kitchen Rewire Only",
            type: "boolean",
            priceModifier: -5000,
            scopeAddition: "Rewire kitchen area only with new dedicated circuits for all appliances."
          },
          {
            id: "partial-bath",
            label: "Bathroom Rewire Only",
            type: "boolean",
            priceModifier: -6500,
            scopeAddition: "Rewire bathroom(s) only with new GFCI circuits and exhaust fan wiring."
          },
          {
            id: "partial-addition",
            label: "Addition/New Room Wiring",
            type: "boolean",
            priceModifier: -4000,
            scopeAddition: "Wire new addition or converted space with proper circuit allocation."
          }
        ]
      },
      {
        id: "kitchen-bath-wiring",
        name: "Kitchen & Bath Remodel Wiring",
        basePriceRange: { low: 1800, high: 4500 },
        estimatedDays: { low: 1, high: 3 },
        warranty: "1-year labor warranty on all electrical work.",
        exclusions: ["Permit fees", "Fixture costs (unless specified)", "Drywall repair"],
        baseScope: [
          "Assess existing electrical capacity and circuit availability.",
          "Install new 20-amp small appliance circuits per NEC requirements.",
          "Install dedicated circuits for garbage disposal and dishwasher.",
          "Install GFCI outlets at all countertop locations within 6 feet of water.",
          "Install AFCI/GFCI combination protection where required by code.",
          "Wire new exhaust fan/vent hood circuit.",
          "Install proper grounding at all new outlets and fixtures.",
          "Test all circuits for proper operation and protection.",
          "Label new circuits at electrical panel.",
          "Coordinate with other trades for rough-in timing."
        ],
        options: [
          {
            id: "under-cabinet-lighting",
            label: "Under-Cabinet LED Lighting",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Install hardwired LED strip lighting under upper cabinets with dimmer switch."
          },
          {
            id: "recessed-cans",
            label: "Recessed Can Lights (6 lights)",
            type: "boolean",
            priceModifier: 850,
            scopeAddition: "Install (6) LED recessed can lights with dimmer switch control."
          },
          {
            id: "island-circuit",
            label: "Island Outlet Circuit",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install pop-up or flush-mount outlets in kitchen island with dedicated circuit."
          },
          {
            id: "pendant-wiring",
            label: "Pendant Light Wiring",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install electrical boxes and wiring for pendant lights over island or bar."
          },
          {
            id: "range-circuit",
            label: "Electric Range 50A Circuit",
            type: "boolean",
            priceModifier: 550,
            scopeAddition: "Install new 50-amp 240V circuit for electric range with proper outlet."
          }
        ]
      },
      {
        id: "addition-garage-shed",
        name: "Addition, Garage & Shed Wiring",
        basePriceRange: { low: 2500, high: 6500 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "1-year labor warranty. Materials per manufacturer warranty.",
        exclusions: ["Trenching for underground runs", "Permit fees", "Concrete cutting/patching"],
        baseScope: [
          "Assess main panel capacity for additional load.",
          "Install subpanel with appropriate amperage for space.",
          "Run feeder cable from main panel to subpanel location.",
          "Design and install lighting layout per space requirements.",
          "Install receptacle outlets per code spacing requirements.",
          "Install 240V outlet for shop equipment or heater if needed.",
          "Install weather-resistant outlets and covers for exposed locations.",
          "Ground subpanel per NEC code requirements.",
          "Label all circuits clearly.",
          "Test all circuits and verify proper operation."
        ],
        options: [
          {
            id: "subpanel-size",
            label: "Subpanel Size",
            type: "select",
            choices: [
              { value: "60a", label: "60-Amp Subpanel", priceModifier: 0, scopeAddition: "Install 60-amp subpanel suitable for basic lighting and outlets." },
              { value: "100a", label: "100-Amp Subpanel", priceModifier: 400, scopeAddition: "Install 100-amp subpanel for workshop with heavy equipment." },
              { value: "125a", label: "125-Amp Subpanel", priceModifier: 600, scopeAddition: "Install 125-amp subpanel for full addition with HVAC capability." }
            ]
          },
          {
            id: "underground-run",
            label: "Underground Conduit Run",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Run underground conduit (up to 50 feet) for detached structure power."
          },
          {
            id: "shop-outlets",
            label: "240V Shop Outlet Package",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install (2) 240V outlets for welders, compressors, or shop equipment."
          },
          {
            id: "motion-lights",
            label: "Motion-Sensor Exterior Lights",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install motion-activated LED lights at entry points of structure."
          }
        ]
      },
      {
        id: "ev-charger",
        name: "EV Charger Installation",
        basePriceRange: { low: 1200, high: 2800 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "Charger warranty per manufacturer. 1-year labor warranty.",
        exclusions: ["Charger unit cost (unless specified)", "Trenching for detached garage", "Permit fees"],
        baseScope: [
          "Perform load calculation to assess panel capacity.",
          "Install new dedicated 240V 50-amp circuit for Level 2 charger.",
          "Run conduit and appropriately sized wire to charger location.",
          "Install NEMA 14-50 outlet or hardwire charger directly per spec.",
          "Mount charging station per manufacturer specifications.",
          "Connect, test, and verify proper charger operation.",
          "Program charging schedules and smart features if applicable.",
          "Provide owner orientation on charger operation and features.",
          "Clean up work area and remove all debris.",
          "Provide documentation for any applicable rebates."
        ],
        options: [
          {
            id: "panel-upgrade-ev",
            label: "Panel Upgrade for EV",
            type: "boolean",
            priceModifier: 2200,
            scopeAddition: "Upgrade electrical panel to accommodate EV charger load if current capacity insufficient."
          },
          {
            id: "charger-supplied",
            label: "Include Tesla Wall Connector",
            type: "boolean",
            priceModifier: 500,
            scopeAddition: "Supply and install Tesla Wall Connector unit."
          },
          {
            id: "charger-universal",
            label: "Include Universal J1772 Charger",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Supply and install universal J1772 Level 2 charger (ChargePoint, Grizzl-E, or equivalent)."
          },
          {
            id: "extended-run",
            label: "Extended Wire Run (31-75 ft)",
            type: "boolean",
            priceModifier: 600,
            scopeAddition: "Extended conduit and wire run for distances 31-75 feet from panel."
          },
          {
            id: "load-management",
            label: "Smart Load Management",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install smart load management device to balance EV charging with household demand."
          }
        ]
      },
      {
        id: "outdoor-electrical",
        name: "Outdoor & Yard Electrical",
        basePriceRange: { low: 1200, high: 3500 },
        estimatedDays: { low: 1, high: 3 },
        warranty: "1-year labor warranty. Fixture warranties per manufacturer.",
        exclusions: ["Trenching (unless specified)", "Landscaping repair", "Permit fees"],
        baseScope: [
          "Assess electrical panel capacity for outdoor circuits.",
          "Plan layout for outdoor electrical needs.",
          "Install weather-rated outdoor junction boxes.",
          "Run appropriate wiring with outdoor-rated conduit protection.",
          "Install in-use weather-resistant outlet covers.",
          "Install GFCI protection for all outdoor circuits.",
          "Connect and test all fixtures and outlets.",
          "Verify proper grounding of outdoor circuits.",
          "Clean up work area and restore any disturbed areas."
        ],
        options: [
          {
            id: "landscape-lighting",
            label: "Low-Voltage Landscape Lighting",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install low-voltage landscape lighting system with transformer, timer, and up to 10 fixtures."
          },
          {
            id: "patio-outlets",
            label: "Patio/Deck Outlet Package",
            type: "boolean",
            priceModifier: 550,
            scopeAddition: "Install (2-3) weatherproof GFCI outlets on patio or deck area."
          },
          {
            id: "pool-spa",
            label: "Pool/Spa Electrical Hookup",
            type: "boolean",
            priceModifier: 1500,
            scopeAddition: "Install dedicated circuit for pool pump/spa with proper bonding and GFCI protection."
          },
          {
            id: "security-lights",
            label: "Security Lighting Package",
            type: "boolean",
            priceModifier: 850,
            scopeAddition: "Install (3-4) motion-sensor LED security lights at key exterior locations."
          },
          {
            id: "camera-wiring",
            label: "Security Camera Wiring",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Install power and/or low-voltage wiring for up to 4 security camera locations."
          }
        ]
      },
      {
        id: "generator",
        name: "Generator Installation",
        basePriceRange: { low: 850, high: 12000 },
        estimatedDays: { low: 1, high: 3 },
        warranty: "Generator warranty per manufacturer. 1-year labor warranty on installation.",
        exclusions: ["Generator unit cost (unless specified)", "Gas line installation", "Permit fees", "Concrete pad"],
        baseScope: [
          "Assess electrical system and household power requirements.",
          "Determine generator sizing based on critical loads.",
          "Install generator connection components per specifications.",
          "Ensure proper grounding of generator system.",
          "Test system operation and transfer functionality.",
          "Provide owner orientation on generator operation and maintenance.",
          "Clean up work area and remove all debris.",
          "Provide documentation for permit inspection."
        ],
        options: [
          {
            id: "generator-type",
            label: "Generator Type",
            type: "select",
            choices: [
              { value: "portable", label: "Portable Generator Setup", priceModifier: 0, scopeAddition: "Install inlet box, power cord, and manual interlock for portable generator connection." },
              { value: "standby-small", label: "Standby Generator (10-14kW)", priceModifier: 6000, scopeAddition: "Install standby generator with automatic transfer switch for essential circuits." },
              { value: "standby-whole", label: "Whole-House Standby (18-24kW)", priceModifier: 10000, scopeAddition: "Install whole-house standby generator with automatic transfer switch for full home backup." }
            ]
          },
          {
            id: "interlock-kit",
            label: "Manual Interlock Kit",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install generator interlock kit on existing panel for safe manual transfer."
          },
          {
            id: "inlet-box",
            label: "Outdoor Power Inlet Box",
            type: "boolean",
            priceModifier: 250,
            scopeAddition: "Install weatherproof power inlet box with appropriate amperage rating."
          },
          {
            id: "transfer-switch",
            label: "Automatic Transfer Switch",
            type: "boolean",
            priceModifier: 1500,
            scopeAddition: "Install automatic transfer switch for seamless generator activation during outage."
          },
          {
            id: "load-shedding",
            label: "Smart Load Shedding",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Install load management system to prioritize critical circuits during generator operation."
          }
        ]
      },
      {
        id: "recessed-lighting",
        name: "Recessed Lighting Installation",
        basePriceRange: { low: 800, high: 1600 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year labor warranty. LED warranty per manufacturer.",
        exclusions: ["Attic insulation replacement", "Major ceiling repair"],
        baseScope: [
          "Mark layout for (6) recessed light locations per plan.",
          "Cut ceiling openings using appropriate template.",
          "Install remodel (retrofit) housing cans.",
          "Run new electrical circuit from switch location.",
          "Install new dimmer switch at designated location.",
          "Wire all fixtures in series to switch.",
          "Install LED trim and bulbs (3000K or 4000K per selection).",
          "Test dimmer operation through full range.",
          "Patch any access holes as needed.",
          "Clean up all debris."
        ],
        options: [
          {
            id: "additional-lights",
            label: "Additional Lights (7-10 total)",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Install 4 additional recessed lights (10 total) for larger room coverage."
          },
          {
            id: "smart-dimmer",
            label: "Smart Dimmer Switch",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Install Wi-Fi enabled smart dimmer switch with app control."
          },
          {
            id: "second-zone",
            label: "Two-Zone Lighting",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Split lights into two zones with separate switches for flexible control."
          }
        ]
      }
    ]
  },
  {
    id: "flooring",
    trade: "Flooring",
    jobTypes: [
      {
        id: "lvp-install",
        name: "Luxury Vinyl Plank Installation",
        basePriceRange: { low: 2500, high: 4500 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "Manufacturer warranty applies (typically 15-25 years). 1-year labor warranty.",
        exclusions: ["Subfloor replacement", "Asbestos abatement", "Furniture moving (optional add)"],
        baseScope: [
          "Remove existing flooring material (carpet, vinyl, or laminate).",
          "Dispose of all debris off-site.",
          "Inspect subfloor for damage, levelness, and moisture.",
          "Repair minor subfloor issues; level low spots with compound.",
          "Acclimate LVP planks per manufacturer requirements.",
          "Install moisture barrier underlayment.",
          "Install LVP flooring using floating click-lock method.",
          "Stagger planks per manufacturer pattern requirements.",
          "Undercut door jambs and casings for seamless fit.",
          "Install transition strips at doorways and floor changes.",
          "Install new baseboards or quarter-round trim.",
          "Clean and inspect all installed flooring.",
          "Provide care and maintenance instructions."
        ],
        options: [
          {
            id: "remove-carpet",
            label: "Include Carpet Removal (additional rooms)",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Remove and dispose of existing carpet and padding in adjacent area."
          },
          {
            id: "furniture-move",
            label: "Furniture Moving Service",
            type: "boolean",
            priceModifier: 250,
            scopeAddition: "Move furniture out and back for flooring installation (standard room)."
          },
          {
            id: "premium-underlayment",
            label: "Premium Sound-Reducing Underlayment",
            type: "boolean",
            priceModifier: 300,
            scopeAddition: "Upgrade to premium cork underlayment for enhanced sound reduction."
          }
        ]
      },
      {
        id: "hardwood-install",
        name: "Hardwood Floor Installation",
        basePriceRange: { low: 6500, high: 12000 },
        estimatedDays: { low: 4, high: 8 },
        warranty: "Manufacturer finish warranty (10-25 years). 2-year labor warranty.",
        exclusions: ["Subfloor replacement", "Radiant heat installation", "Custom staining"],
        baseScope: [
          "Remove existing flooring and dispose off-site.",
          "Inspect subfloor; repair or replace damaged sections.",
          "Install 15-lb felt paper or approved moisture barrier.",
          "Acclimate hardwood planks for minimum 72 hours.",
          "Nail-down or staple hardwood planks per manufacturer specs.",
          "Maintain proper expansion gaps at walls.",
          "Face-nail and plug border rows.",
          "Undercut all door jambs for seamless transitions.",
          "Install reducer strips and transition pieces.",
          "Sand installed floor with 3-pass sanding system.",
          "Apply stain color (if prefinished, skip sanding/finishing).",
          "Apply 2 coats polyurethane finish with sanding between.",
          "Install new baseboards or shoe molding.",
          "Final cleanup and 24-hour cure time before use."
        ],
        options: [
          {
            id: "wood-species",
            label: "Wood Species",
            type: "select",
            choices: [
              { value: "oak", label: "Red Oak (Standard)", priceModifier: 0, scopeAddition: "Install red oak hardwood flooring." },
              { value: "white-oak", label: "White Oak", priceModifier: 800, scopeAddition: "Install white oak hardwood flooring." },
              { value: "maple", label: "Maple", priceModifier: 600, scopeAddition: "Install maple hardwood flooring." },
              { value: "walnut", label: "American Walnut", priceModifier: 2500, scopeAddition: "Install American walnut hardwood flooring." }
            ]
          },
          {
            id: "custom-stain",
            label: "Custom Stain Color",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Apply custom stain color (sample approval required) with water-pop technique."
          },
          {
            id: "gloss-level",
            label: "Satin/Matte Finish Upgrade",
            type: "boolean",
            priceModifier: 200,
            scopeAddition: "Apply satin or matte finish polyurethane in lieu of standard semi-gloss."
          }
        ]
      },
      {
        id: "tile-floor",
        name: "Tile Floor Installation",
        basePriceRange: { low: 3500, high: 6500 },
        estimatedDays: { low: 3, high: 5 },
        warranty: "1-year labor warranty. Tile warranty per manufacturer.",
        exclusions: ["Floor leveling beyond 1/4\"", "Radiant heat installation", "Decorative inlays"],
        baseScope: [
          "Remove existing flooring material and dispose off-site.",
          "Inspect subfloor for structural integrity and levelness.",
          "Install cement board underlayment if required.",
          "Apply crack isolation membrane if needed.",
          "Layout tile pattern; dry-fit for appearance approval.",
          "Install tile using thin-set mortar per TCNA standards.",
          "Maintain consistent grout joint spacing.",
          "Allow tile to set for 24 hours minimum.",
          "Apply grout to all joints; clean excess from tile surface.",
          "Apply grout sealer after 72-hour cure.",
          "Install transitions at doorways and floor height changes.",
          "Install baseboards or base tile.",
          "Final cleanup and inspection."
        ],
        options: [
          {
            id: "tile-size",
            label: "Tile Size",
            type: "select",
            choices: [
              { value: "standard", label: "12x12 or 12x24", priceModifier: 0 },
              { value: "large-format", label: "24x24 Large Format", priceModifier: 400, scopeAddition: "Install large format tile requiring leveling system." },
              { value: "plank", label: "Wood-Look Plank Tile", priceModifier: 600, scopeAddition: "Install wood-look porcelain plank tile with staggered pattern." }
            ]
          },
          {
            id: "heated-floor",
            label: "Electric Radiant Heat",
            type: "boolean",
            priceModifier: 1400,
            scopeAddition: "Install electric radiant heating mat under tile with programmable thermostat."
          },
          {
            id: "decorative-border",
            label: "Decorative Border/Inlay",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Install decorative tile border or accent inlay per design."
          }
        ]
      }
    ]
  },
  {
    id: "roofing",
    trade: "Roofing",
    jobTypes: [
      {
        id: "full-roof-asphalt",
        name: "Full Roof Replacement – Asphalt Shingle",
        basePriceRange: { low: 8500, high: 15000 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "Manufacturer shingle warranty (20-50 years). 5-year labor warranty.",
        exclusions: ["Structural repairs", "Skylight replacement", "Gutter replacement"],
        baseScope: [
          "Set up ground-level debris containment and protection.",
          "Remove all existing shingles, underlayment, and flashing.",
          "Inspect roof deck for damage; report findings to homeowner.",
          "Replace damaged or rotted decking (up to 2 sheets included).",
          "Install ice and water shield at eaves and valleys.",
          "Install synthetic underlayment over entire roof surface.",
          "Install drip edge at eaves and rakes.",
          "Install step flashing at walls and chimneys.",
          "Install new pipe boots and vent flashings.",
          "Install starter strip at eaves and rakes.",
          "Install architectural shingles per manufacturer specs.",
          "Install ridge vent for continuous attic ventilation.",
          "Install ridge cap shingles.",
          "Perform magnetic sweep of property for nails.",
          "Final cleanup and debris removal; haul to dump.",
          "Provide warranty documentation."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 800, scopeAddition: "Additional equipment and safety measures for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 1500, scopeAddition: "Additional equipment and safety measures for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 2500, scopeAddition: "Additional equipment, safety measures, and staging for 3+ story height." }
            ]
          },
          {
            id: "shingle-grade",
            label: "Shingle Grade",
            type: "select",
            choices: [
              { value: "architectural", label: "Architectural (30-year)", priceModifier: 0, scopeAddition: "Install 30-year architectural shingles." },
              { value: "designer", label: "Designer (50-year)", priceModifier: 2500, scopeAddition: "Install 50-year designer shingles with enhanced aesthetics." },
              { value: "impact-resistant", label: "Impact-Resistant Class 4", priceModifier: 3500, scopeAddition: "Install Class 4 impact-resistant shingles (insurance discount may apply)." }
            ]
          },
          {
            id: "chimney-reflash",
            label: "Chimney Reflashing",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Remove existing chimney flashing; install new step and counter flashing."
          },
          {
            id: "skylights-reflash",
            label: "Skylight Reflashing",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install new flashing kit around existing skylight(s)."
          },
          {
            id: "additional-decking",
            label: "Additional Decking Allowance",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Additional (4) sheets of OSB decking replacement if needed."
          }
        ]
      },
      {
        id: "full-roof-metal",
        name: "Full Roof Replacement – Metal",
        basePriceRange: { low: 15000, high: 30000 },
        estimatedDays: { low: 3, high: 6 },
        warranty: "Manufacturer warranty (40-50 years). 10-year labor warranty.",
        exclusions: ["Structural modifications", "Skylight replacement", "Gutter replacement"],
        baseScope: [
          "Set up ground-level debris containment and protection.",
          "Remove all existing roofing materials down to deck.",
          "Inspect roof deck for damage; report findings to homeowner.",
          "Replace damaged or rotted decking (up to 2 sheets included).",
          "Install synthetic underlayment over entire roof surface.",
          "Install drip edge at eaves and rakes.",
          "Install eave trim and gable trim.",
          "Install metal roofing panels per manufacturer specifications.",
          "Install ridge cap with proper ventilation.",
          "Install step flashing and counter flashing at walls and penetrations.",
          "Install pipe boots and vent flashings compatible with metal.",
          "Apply sealant at all seams and penetrations.",
          "Final cleanup and debris removal; haul to dump.",
          "Provide warranty documentation."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 1000, scopeAddition: "Additional equipment and safety measures for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 2000, scopeAddition: "Additional equipment and safety measures for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 3500, scopeAddition: "Additional equipment, safety measures, and staging for 3+ story height." }
            ]
          },
          {
            id: "metal-type",
            label: "Metal Type",
            type: "select",
            choices: [
              { value: "standing-seam", label: "Standing Seam", priceModifier: 0, scopeAddition: "Install standing seam metal roofing panels." },
              { value: "corrugated", label: "Corrugated", priceModifier: -2000, scopeAddition: "Install corrugated metal roofing panels." },
              { value: "stone-coated", label: "Stone-Coated Steel", priceModifier: 3000, scopeAddition: "Install stone-coated steel roofing for enhanced aesthetics." }
            ]
          },
          {
            id: "chimney-reflash",
            label: "Chimney Reflashing",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Remove existing chimney flashing; install new metal-compatible flashing."
          },
          {
            id: "skylights-reflash",
            label: "Skylight Reflashing",
            type: "boolean",
            priceModifier: 600,
            scopeAddition: "Install new metal-compatible flashing kit around existing skylight(s)."
          }
        ]
      },
      {
        id: "full-roof-tile-slate",
        name: "Full Roof Replacement – Tile / Slate",
        basePriceRange: { low: 25000, high: 50000 },
        estimatedDays: { low: 5, high: 10 },
        warranty: "Manufacturer warranty (50-100 years). 10-year labor warranty.",
        exclusions: ["Structural reinforcement", "Skylight replacement", "Gutter replacement"],
        baseScope: [
          "Set up ground-level debris containment and protection.",
          "Remove all existing roofing materials down to deck.",
          "Inspect roof deck and structure for ability to support tile/slate weight.",
          "Replace damaged or rotted decking as needed.",
          "Install ice and water shield at eaves, valleys, and penetrations.",
          "Install appropriate underlayment for tile/slate application.",
          "Install battens or lath system per tile/slate requirements.",
          "Install starter tiles at eaves.",
          "Install field tiles/slates with proper overlap and fastening.",
          "Cut and fit tiles/slates at valleys, hips, and ridges.",
          "Install ridge tiles with mortar or dry ridge system.",
          "Install flashing at walls, chimneys, and penetrations.",
          "Final cleanup and debris removal; haul to dump.",
          "Provide warranty documentation."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 1500, scopeAddition: "Additional equipment and safety measures for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 3000, scopeAddition: "Additional equipment and safety measures for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 5000, scopeAddition: "Additional equipment, safety measures, and staging for 3+ story height." }
            ]
          },
          {
            id: "tile-type",
            label: "Material Type",
            type: "select",
            choices: [
              { value: "concrete-tile", label: "Concrete Tile", priceModifier: 0, scopeAddition: "Install concrete roof tiles." },
              { value: "clay-tile", label: "Clay Tile", priceModifier: 5000, scopeAddition: "Install traditional clay roof tiles." },
              { value: "natural-slate", label: "Natural Slate", priceModifier: 15000, scopeAddition: "Install natural slate roofing." },
              { value: "synthetic-slate", label: "Synthetic Slate", priceModifier: 3000, scopeAddition: "Install synthetic slate roofing." }
            ]
          },
          {
            id: "structural-reinforcement",
            label: "Structural Reinforcement",
            type: "boolean",
            priceModifier: 4000,
            scopeAddition: "Reinforce roof structure to support additional weight of tile/slate."
          }
        ]
      },
      {
        id: "full-roof-flat",
        name: "Full Roof Replacement – Flat Roof (TPO/PVC/Mod Bit)",
        basePriceRange: { low: 8000, high: 18000 },
        estimatedDays: { low: 2, high: 5 },
        warranty: "Manufacturer warranty (15-25 years). 5-year labor warranty.",
        exclusions: ["Structural repairs", "Parapet wall repairs", "HVAC equipment relocation"],
        baseScope: [
          "Set up debris containment and protection for building.",
          "Remove existing roofing membrane and insulation.",
          "Inspect roof deck for damage; report findings to owner.",
          "Replace damaged decking or substrate as needed.",
          "Install new tapered insulation for proper drainage.",
          "Install cover board over insulation.",
          "Install roofing membrane per manufacturer specifications.",
          "Heat-weld or adhere all seams.",
          "Install edge metal and termination bars.",
          "Flash all penetrations, drains, and curbs.",
          "Install new drain covers and scuppers as needed.",
          "Final cleanup and debris removal.",
          "Provide warranty documentation."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 600, scopeAddition: "Additional equipment and safety measures for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 1200, scopeAddition: "Additional equipment and safety measures for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 2000, scopeAddition: "Additional equipment, safety measures, and staging for 3+ story height." }
            ]
          },
          {
            id: "membrane-type",
            label: "Membrane Type",
            type: "select",
            choices: [
              { value: "tpo", label: "TPO (Thermoplastic)", priceModifier: 0, scopeAddition: "Install TPO single-ply membrane roofing." },
              { value: "pvc", label: "PVC", priceModifier: 1500, scopeAddition: "Install PVC single-ply membrane roofing." },
              { value: "mod-bit", label: "Modified Bitumen", priceModifier: -500, scopeAddition: "Install modified bitumen roofing system." },
              { value: "epdm", label: "EPDM Rubber", priceModifier: -1000, scopeAddition: "Install EPDM rubber membrane roofing." }
            ]
          },
          {
            id: "walkway-pads",
            label: "Walkway Pads",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Install walkway pads for roof access and HVAC service areas."
          }
        ]
      },
      {
        id: "repair-leak-only",
        name: "Roof Repair – Leak Only",
        basePriceRange: { low: 350, high: 900 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "2-year warranty on repairs.",
        exclusions: ["Interior water damage repair", "Full roof replacement", "Mold remediation"],
        baseScope: [
          "Inspect roof to locate source of leak.",
          "Document findings with photos for homeowner.",
          "Remove damaged materials in affected area.",
          "Inspect underlayment and decking for damage.",
          "Replace damaged underlayment if needed.",
          "Install new roofing materials to match existing.",
          "Seal all exposed fasteners and penetrations.",
          "Apply additional sealant at vulnerable areas.",
          "Clean up all debris.",
          "Provide report of findings and repairs made."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 100, scopeAddition: "Additional equipment for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 200, scopeAddition: "Additional equipment for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 400, scopeAddition: "Additional equipment and staging for 3+ story height." }
            ]
          },
          {
            id: "interior-stain-check",
            label: "Interior Stain Documentation",
            type: "boolean",
            priceModifier: 75,
            scopeAddition: "Document interior ceiling stains with measurements for insurance purposes."
          }
        ]
      },
      {
        id: "repair-wind-hail",
        name: "Roof Repair – Wind / Hail Damage",
        basePriceRange: { low: 500, high: 2500 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "2-year warranty on repairs.",
        exclusions: ["Interior water damage repair", "Full roof replacement", "Insurance claim filing"],
        baseScope: [
          "Conduct thorough inspection of entire roof for storm damage.",
          "Document all damage with photos and measurements.",
          "Prepare detailed damage report for insurance purposes.",
          "Remove damaged or displaced shingles/materials.",
          "Inspect underlayment and decking for damage.",
          "Replace damaged underlayment and decking as needed.",
          "Install new roofing materials to match existing.",
          "Replace damaged flashing, vents, and accessories.",
          "Seal all repairs and vulnerable areas.",
          "Clean up all debris.",
          "Provide comprehensive repair report."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 150, scopeAddition: "Additional equipment for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 300, scopeAddition: "Additional equipment for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 500, scopeAddition: "Additional equipment and staging for 3+ story height." }
            ]
          },
          {
            id: "insurance-assist",
            label: "Insurance Claim Assistance",
            type: "boolean",
            priceModifier: 0,
            scopeAddition: "Assist homeowner with insurance claim documentation and adjuster meeting."
          },
          {
            id: "gutter-repair",
            label: "Gutter Repair",
            type: "boolean",
            priceModifier: 250,
            scopeAddition: "Repair storm-damaged gutters and downspouts."
          }
        ]
      },
      {
        id: "repair-general",
        name: "Roof Repair – General (Shingles / Flashing / Misc.)",
        basePriceRange: { low: 400, high: 1500 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "2-year warranty on repairs.",
        exclusions: ["Interior water damage repair", "Full roof replacement"],
        baseScope: [
          "Inspect roof to identify all areas needing repair.",
          "Document findings with photos for homeowner.",
          "Remove damaged or deteriorated roofing materials.",
          "Replace damaged shingles, tiles, or other materials.",
          "Repair or replace damaged flashing.",
          "Re-secure loose materials.",
          "Seal all exposed fasteners and joints.",
          "Apply sealant at vulnerable areas.",
          "Clean up all debris.",
          "Provide report of repairs made."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 125, scopeAddition: "Additional equipment for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 250, scopeAddition: "Additional equipment for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 450, scopeAddition: "Additional equipment and staging for 3+ story height." }
            ]
          },
          {
            id: "gutter-clean",
            label: "Gutter Cleaning",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Clean all gutters and downspouts while on roof."
          },
          {
            id: "vent-replacement",
            label: "Vent Replacement",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Replace damaged roof vents with new units."
          }
        ]
      },
      {
        id: "new-construction-roof",
        name: "New Construction – Roof Install",
        basePriceRange: { low: 10000, high: 25000 },
        estimatedDays: { low: 3, high: 7 },
        warranty: "Manufacturer warranty per materials. 5-year labor warranty.",
        exclusions: ["Framing and sheathing", "Permit fees", "Gutter installation"],
        baseScope: [
          "Coordinate with general contractor on scheduling.",
          "Verify roof deck is complete and ready for roofing.",
          "Install ice and water shield at eaves and valleys.",
          "Install synthetic underlayment over entire roof surface.",
          "Install drip edge at eaves and rakes.",
          "Install step flashing at walls.",
          "Install pipe boots and vent flashings.",
          "Install starter strip at eaves and rakes.",
          "Install roofing materials per specifications.",
          "Install ridge vent for attic ventilation.",
          "Install ridge cap.",
          "Flash all penetrations and transitions.",
          "Clean up all debris and perform nail sweep.",
          "Final inspection and punch list.",
          "Provide warranty documentation."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 1000, scopeAddition: "Additional equipment and safety measures for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 2000, scopeAddition: "Additional equipment and safety measures for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 3500, scopeAddition: "Additional equipment, safety measures, and staging for 3+ story height." }
            ]
          },
          {
            id: "roofing-material",
            label: "Roofing Material",
            type: "select",
            choices: [
              { value: "asphalt-shingle", label: "Asphalt Shingle", priceModifier: 0, scopeAddition: "Install architectural asphalt shingles." },
              { value: "metal", label: "Metal Roofing", priceModifier: 8000, scopeAddition: "Install standing seam metal roofing." },
              { value: "tile", label: "Tile Roofing", priceModifier: 15000, scopeAddition: "Install concrete or clay tile roofing." }
            ]
          },
          {
            id: "skylights",
            label: "Skylight Installation",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Install skylight(s) with proper flashing per plan."
          }
        ]
      },
      {
        id: "reroof-overlay",
        name: "Re-Roof (Overlay – Where Allowed)",
        basePriceRange: { low: 5500, high: 10000 },
        estimatedDays: { low: 1, high: 3 },
        warranty: "Manufacturer shingle warranty (reduced). 3-year labor warranty.",
        exclusions: ["Tear-off of existing roof", "Structural repairs", "Skylight replacement"],
        baseScope: [
          "Verify local code allows overlay installation.",
          "Inspect existing roof for suitability of overlay.",
          "Repair any loose or damaged shingles.",
          "Install drip edge at eaves and rakes.",
          "Install new synthetic underlayment if required by code.",
          "Install starter strip at eaves.",
          "Install new shingles over existing roof.",
          "Install new flashing at walls and penetrations.",
          "Install new pipe boots over existing.",
          "Install ridge vent if not present.",
          "Install ridge cap shingles.",
          "Clean up all debris.",
          "Provide warranty documentation."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 500, scopeAddition: "Additional equipment for 1.5 story height." },
              { value: "2-story", label: "2 Story", priceModifier: 1000, scopeAddition: "Additional equipment for 2 story height." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 1800, scopeAddition: "Additional equipment and staging for 3+ story height." }
            ]
          },
          {
            id: "shingle-grade",
            label: "Shingle Grade",
            type: "select",
            choices: [
              { value: "architectural", label: "Architectural (30-year)", priceModifier: 0, scopeAddition: "Install 30-year architectural shingles." },
              { value: "designer", label: "Designer (50-year)", priceModifier: 2000, scopeAddition: "Install 50-year designer shingles." }
            ]
          }
        ]
      },
      {
        id: "inspection-only",
        name: "Inspection Only (Report / Photos)",
        basePriceRange: { low: 150, high: 350 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "N/A – Inspection service only.",
        exclusions: ["Repairs", "Material costs", "Follow-up visits"],
        baseScope: [
          "Access roof safely using appropriate equipment.",
          "Conduct visual inspection of entire roof surface.",
          "Inspect all flashing, vents, and penetrations.",
          "Check for missing, damaged, or curling shingles.",
          "Inspect valleys, ridges, and hips.",
          "Check gutters and drainage.",
          "Document all findings with photographs.",
          "Assess overall roof condition and remaining life.",
          "Prepare detailed written inspection report.",
          "Provide recommendations for repairs or replacement.",
          "Deliver report to homeowner within 24-48 hours."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 25, scopeAddition: "Inspection of 1.5 story roof." },
              { value: "2-story", label: "2 Story", priceModifier: 50, scopeAddition: "Inspection of 2 story roof." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 100, scopeAddition: "Inspection of 3+ story roof with additional equipment." }
            ]
          },
          {
            id: "drone-inspection",
            label: "Drone Inspection",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Conduct drone inspection for hard-to-access areas with aerial photos."
          },
          {
            id: "thermal-imaging",
            label: "Thermal Imaging",
            type: "boolean",
            priceModifier: 200,
            scopeAddition: "Include thermal imaging to detect moisture intrusion."
          }
        ]
      },
      {
        id: "maintenance-tuneup",
        name: "Maintenance / Tune-Up (Sealants, Minor Repairs)",
        basePriceRange: { low: 250, high: 600 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year warranty on maintenance work.",
        exclusions: ["Major repairs", "Roof replacement", "Structural work"],
        baseScope: [
          "Inspect entire roof for maintenance needs.",
          "Clear debris from roof surface and valleys.",
          "Clean and inspect gutters and downspouts.",
          "Re-secure any loose shingles or materials.",
          "Apply sealant to exposed nail heads.",
          "Seal around all pipe boots and vents.",
          "Inspect and seal flashing at walls and chimneys.",
          "Check and seal skylight perimeters if present.",
          "Apply sealant to any small cracks or gaps.",
          "Document condition with photos.",
          "Provide maintenance report with recommendations."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 50, scopeAddition: "Maintenance for 1.5 story roof." },
              { value: "2-story", label: "2 Story", priceModifier: 100, scopeAddition: "Maintenance for 2 story roof." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 175, scopeAddition: "Maintenance for 3+ story roof with additional equipment." }
            ]
          },
          {
            id: "gutter-guards",
            label: "Gutter Guard Installation",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Install gutter guards to prevent debris buildup."
          },
          {
            id: "moss-treatment",
            label: "Moss/Algae Treatment",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Apply moss and algae treatment to affected areas."
          }
        ]
      },
      {
        id: "emergency-tarp",
        name: "Emergency Tarp / Temporary Dry-In",
        basePriceRange: { low: 400, high: 1200 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Temporary repair – no warranty on tarping.",
        exclusions: ["Permanent repairs", "Interior damage repair", "Insurance claims"],
        baseScope: [
          "Respond to emergency call as quickly as possible.",
          "Assess damage and document with photos.",
          "Clear debris from damaged area.",
          "Install heavy-duty tarp over damaged section.",
          "Secure tarp with battens, weights, or fasteners.",
          "Ensure tarp extends beyond damaged area adequately.",
          "Seal edges to prevent wind uplift.",
          "Verify temporary protection is weather-tight.",
          "Provide damage documentation for insurance.",
          "Schedule follow-up for permanent repair estimate."
        ],
        options: [
          {
            id: "height-stories",
            label: "Height / Stories",
            type: "select",
            choices: [
              { value: "1-story", label: "1 Story", priceModifier: 0 },
              { value: "1.5-story", label: "1.5 Story", priceModifier: 100, scopeAddition: "Emergency tarping for 1.5 story roof." },
              { value: "2-story", label: "2 Story", priceModifier: 200, scopeAddition: "Emergency tarping for 2 story roof." },
              { value: "3-plus-story", label: "3+ Story", priceModifier: 350, scopeAddition: "Emergency tarping for 3+ story roof with additional equipment." }
            ]
          },
          {
            id: "after-hours",
            label: "After-Hours Service",
            type: "boolean",
            priceModifier: 200,
            scopeAddition: "After-hours emergency response (evenings/weekends)."
          },
          {
            id: "large-area",
            label: "Large Area Coverage (>200 sq ft)",
            type: "boolean",
            priceModifier: 300,
            scopeAddition: "Additional tarping materials for coverage over 200 square feet."
          }
        ]
      }
    ]
  },
  {
    id: "deck",
    trade: "Deck & Patio",
    jobTypes: [
      {
        id: "deck-build",
        name: "New Deck Construction",
        basePriceRange: { low: 12000, high: 25000 },
        estimatedDays: { low: 5, high: 10 },
        warranty: "5-year structural warranty. 1-year warranty on finishes.",
        exclusions: ["Permit fees", "Hot tub installation", "Outdoor kitchen build"],
        baseScope: [
          "Obtain required permits (fee separate, if applicable).",
          "Lay out deck footprint per approved plans.",
          "Excavate and pour concrete footings per code.",
          "Install post anchors and support posts.",
          "Install ledger board with proper flashing.",
          "Install rim joists and floor joists per span tables.",
          "Install joist hangers and blocking as required.",
          "Install decking boards with proper spacing.",
          "Install fascia boards around perimeter.",
          "Build and install stair stringers and treads.",
          "Install code-compliant railing system with balusters.",
          "Install post caps and decorative trim.",
          "Apply sealer/stain (if wood) or clean composite.",
          "Final inspection and punch list.",
          "Site cleanup and debris removal."
        ],
        options: [
          {
            id: "decking-material",
            label: "Decking Material",
            type: "select",
            choices: [
              { value: "pt-lumber", label: "Pressure-Treated Lumber", priceModifier: 0, scopeAddition: "Build deck with pressure-treated lumber (requires regular sealing)." },
              { value: "cedar", label: "Cedar", priceModifier: 3500, scopeAddition: "Build deck with natural cedar decking and trim." },
              { value: "composite-standard", label: "Composite (Standard)", priceModifier: 5000, scopeAddition: "Build deck with standard composite decking (Trex Select or equivalent)." },
              { value: "composite-premium", label: "Composite (Premium)", priceModifier: 8500, scopeAddition: "Build deck with premium capped composite (Trex Transcend or equivalent)." }
            ]
          },
          {
            id: "railing-style",
            label: "Railing Style",
            type: "select",
            choices: [
              { value: "wood", label: "Wood Railing", priceModifier: 0, scopeAddition: "Install wood railing with 2x2 balusters." },
              { value: "aluminum", label: "Aluminum Balusters", priceModifier: 800, scopeAddition: "Install aluminum balusters with wood top rail." },
              { value: "cable", label: "Cable Railing", priceModifier: 2500, scopeAddition: "Install stainless steel cable railing system." },
              { value: "glass", label: "Glass Panel Railing", priceModifier: 4500, scopeAddition: "Install tempered glass panel railing system." }
            ]
          },
          {
            id: "built-in-bench",
            label: "Built-in Bench Seating",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Build integrated bench seating (8-12 linear feet) along deck perimeter."
          },
          {
            id: "deck-lighting",
            label: "Deck Lighting Package",
            type: "boolean",
            priceModifier: 1500,
            scopeAddition: "Install low-voltage LED lighting in stair risers, post caps, and under rails."
          }
        ]
      },
      {
        id: "deck-resurface",
        name: "Deck Resurfacing",
        basePriceRange: { low: 5500, high: 10000 },
        estimatedDays: { low: 3, high: 5 },
        warranty: "1-year labor warranty. Material warranty per manufacturer.",
        exclusions: ["Structural repairs to framing", "Railing replacement"],
        baseScope: [
          "Remove existing deck boards and dispose off-site.",
          "Inspect all framing, joists, and ledger for damage.",
          "Replace damaged or rotted joist sections (minor repairs included).",
          "Install new joist tape/flashing on top of joists.",
          "Install new decking boards with hidden fastener system.",
          "Maintain proper board spacing for drainage.",
          "Install new fascia to match decking.",
          "Replace stair treads with new decking material.",
          "Power wash railing system and repaint/stain if wood.",
          "Clean entire deck surface.",
          "Final inspection and walkthrough."
        ],
        options: [
          {
            id: "new-railing",
            label: "New Railing System",
            type: "boolean",
            priceModifier: 2500,
            scopeAddition: "Remove existing railing; install new composite or aluminum railing system."
          },
          {
            id: "add-stairs",
            label: "Add New Stair Section",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Build additional stair section (4-6 steps) with landing."
          }
        ]
      },
      {
        id: "paver-patio",
        name: "Paver Patio Installation",
        basePriceRange: { low: 8000, high: 16000 },
        estimatedDays: { low: 4, high: 7 },
        warranty: "5-year warranty on paver installation and leveling.",
        exclusions: ["Retaining walls over 2 feet", "Drainage systems beyond basic slope", "Outdoor structures"],
        baseScope: [
          "Lay out patio footprint with paint/stakes per plan.",
          "Excavate area to required depth (typically 8-10 inches).",
          "Grade subsoil for proper drainage slope.",
          "Install geotextile fabric if required by soil conditions.",
          "Spread and compact 6 inches of crushed gravel base.",
          "Install 1 inch sand setting bed and screed level.",
          "Install paver edge restraints around perimeter.",
          "Lay pavers in selected pattern.",
          "Cut pavers at edges using wet saw.",
          "Compact pavers with plate compactor.",
          "Spread polymeric sand into joints.",
          "Mist and activate polymeric sand per manufacturer.",
          "Clean and seal pavers (if sealer selected).",
          "Final cleanup and grade surrounding area.",
          "Provide care and maintenance instructions."
        ],
        options: [
          {
            id: "paver-style",
            label: "Paver Style",
            type: "select",
            choices: [
              { value: "standard", label: "Standard Concrete Pavers", priceModifier: 0, scopeAddition: "Install standard concrete pavers in selected color." },
              { value: "tumbled", label: "Tumbled/Antiqued Pavers", priceModifier: 1200, scopeAddition: "Install tumbled-finish pavers for rustic appearance." },
              { value: "natural-stone", label: "Natural Stone (Flagstone)", priceModifier: 4500, scopeAddition: "Install natural flagstone pavers with irregular pattern." },
              { value: "permeable", label: "Permeable Pavers", priceModifier: 2500, scopeAddition: "Install permeable paver system for stormwater management." }
            ]
          },
          {
            id: "fire-pit",
            label: "Built-in Fire Pit",
            type: "boolean",
            priceModifier: 2500,
            scopeAddition: "Build 42\" diameter fire pit with fire ring and cap stones."
          },
          {
            id: "seating-wall",
            label: "Seating Wall (10 LF)",
            type: "boolean",
            priceModifier: 2200,
            scopeAddition: "Build 10 linear feet of block seating wall with cap stones."
          },
          {
            id: "patio-sealer",
            label: "Paver Sealer Application",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Apply wet-look or matte sealer to all pavers for enhanced protection."
          }
        ]
      }
    ]
  },
  {
    id: "hvac",
    trade: "HVAC",
    jobTypes: [
      {
        id: "full-system-split",
        name: "Full System Replacement – Split (AC + Furnace)",
        basePriceRange: { low: 9500, high: 18000 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "10-year parts warranty with registration. 2-year labor warranty.",
        exclusions: ["Ductwork replacement", "Zoning systems", "Electrical panel upgrades", "Permits (if required by jurisdiction)"],
        // Legacy flat array (kept for backward compatibility)
        baseScope: [
          "Recover existing refrigerant per EPA Section 608 regulations.",
          "Disconnect and remove existing outdoor A/C condenser unit.",
          "Disconnect and remove existing indoor furnace.",
          "Dispose of old equipment per environmental regulations.",
          "Set new condenser unit on existing pad (or install new pad if required).",
          "Install new furnace in existing location.",
          "Install new evaporator coil matched to condenser tonnage.",
          "Replace refrigerant line set if required by distance or condition.",
          "Install new drain pan and condensate line with trap.",
          "Install new filter drier and service ports.",
          "Braze all refrigerant connections with silver solder.",
          "Pressure test system with nitrogen to 500 PSI.",
          "Evacuate system to 500 microns using vacuum pump.",
          "Charge system with factory-specified refrigerant (R-410A).",
          "Verify subcooling and superheat values per manufacturer specs.",
          "Connect gas line to furnace (if gas) and test for leaks.",
          "Connect and test existing or new thermostat.",
          "Verify airflow at all supply registers.",
          "Test heating and cooling modes for proper operation.",
          "Measure temperature differential (cooling: 16-22°F, heating: 40-70°F rise).",
          "Program and calibrate thermostat settings.",
          "Register warranty with manufacturer.",
          "Provide system orientation and filter replacement instructions to homeowner.",
          "Clean up work area and remove all debris."
        ],
        // New grouped sections for better readability
        scopeSections: [
          {
            title: "Removal & Demolition",
            items: [
              "Recover existing refrigerant per EPA Section 608 regulations.",
              "Disconnect and remove existing outdoor A/C condenser unit.",
              "Disconnect and remove existing indoor furnace.",
              "Dispose of old equipment per environmental regulations."
            ]
          },
          {
            title: "Outdoor Unit Installation",
            items: [
              "Set new condenser unit on existing pad (or install new pad if required).",
              "Install surge protector at outdoor disconnect (if selected)."
            ]
          },
          {
            title: "Indoor Unit Installation",
            items: [
              "Install new furnace in existing location.",
              "Install new evaporator coil matched to condenser tonnage.",
              "Install new drain pan and condensate line with trap."
            ]
          },
          {
            title: "Refrigerant System",
            items: [
              "Replace refrigerant line set if required by distance or condition.",
              "Install new filter drier and service ports.",
              "Braze all refrigerant connections with silver solder.",
              "Pressure test system with nitrogen to 500 PSI.",
              "Evacuate system to 500 microns using vacuum pump.",
              "Charge system with factory-specified refrigerant (R-410A).",
              "Verify subcooling and superheat values per manufacturer specs."
            ]
          },
          {
            title: "Electrical & Controls",
            items: [
              "Connect gas line to furnace (if gas) and test for leaks.",
              "Connect and test existing or new thermostat.",
              "Program and calibrate thermostat settings."
            ]
          },
          {
            title: "Commissioning & Testing",
            items: [
              "Verify airflow at all supply registers.",
              "Test heating and cooling modes for proper operation.",
              "Measure temperature differential (cooling: 16-22°F, heating: 40-70°F rise)."
            ]
          },
          {
            title: "Closeout & Handover",
            items: [
              "Register warranty with manufacturer.",
              "Provide system orientation and filter replacement instructions to homeowner.",
              "Clean up work area and remove all debris."
            ]
          }
        ],
        assumptions: [
          "Existing ductwork is in good condition and properly sized.",
          "Electrical service is adequate for new equipment.",
          "Gas supply line is properly sized (if gas furnace).",
          "Clear access to indoor and outdoor equipment locations.",
          "No structural modifications required for equipment placement."
        ],
        addons: [
          "Smart thermostat with room sensors and app setup",
          "UV-C germicidal light in air handler",
          "Complete duct cleaning service",
          "New composite condenser pad"
        ],
        options: [
          {
            id: "tonnage",
            label: "System Size (Tonnage)",
            type: "select",
            choices: [
              { value: "1.5-ton", label: "1.5 Ton", priceModifier: -1500, scopeAddition: "Install 1.5-ton system sized for approximately 600-900 sq ft." },
              { value: "2-ton", label: "2 Ton", priceModifier: -1000, scopeAddition: "Install 2-ton system sized for approximately 901-1200 sq ft." },
              { value: "2.5-ton", label: "2.5 Ton", priceModifier: -500, scopeAddition: "Install 2.5-ton system sized for approximately 1201-1500 sq ft." },
              { value: "3-ton", label: "3 Ton", priceModifier: 0, scopeAddition: "Install 3-ton system sized for approximately 1501-1800 sq ft." },
              { value: "3.5-ton", label: "3.5 Ton", priceModifier: 500, scopeAddition: "Install 3.5-ton system sized for approximately 1801-2100 sq ft." },
              { value: "4-ton", label: "4 Ton", priceModifier: 1000, scopeAddition: "Install 4-ton system sized for approximately 2101-2400 sq ft." },
              { value: "5-ton", label: "5 Ton", priceModifier: 2000, scopeAddition: "Install 5-ton system sized for approximately 2401-3000 sq ft." }
            ]
          },
          {
            id: "efficiency",
            label: "Efficiency Level",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (14-15 SEER / 80% AFUE)", priceModifier: 0, scopeAddition: "Install standard efficiency A/C (14-15 SEER) and 80% AFUE furnace." },
              { value: "high", label: "High Efficiency (16-17 SEER / 95% AFUE)", priceModifier: 2000, scopeAddition: "Install high-efficiency A/C (16-17 SEER) and 95% AFUE furnace with secondary heat exchanger." },
              { value: "ultra", label: "Ultra Efficiency (18+ SEER / 98% AFUE)", priceModifier: 4500, scopeAddition: "Install ultra-efficient variable-speed A/C (18+ SEER) and 98% AFUE modulating furnace." }
            ]
          },
          {
            id: "smart-thermostat",
            label: "Smart Thermostat (Ecobee/Nest)",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install premium smart thermostat with room sensors and app setup."
          },
          {
            id: "new-pad",
            label: "New Condenser Pad",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Install new composite condenser pad (replace cracked or undersized pad)."
          },
          {
            id: "surge-protector",
            label: "HVAC Surge Protector",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Install surge protector at outdoor disconnect for compressor protection."
          },
          {
            id: "uv-light",
            label: "UV Air Purifier",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Install UV-C germicidal light in air handler to reduce mold and bacteria."
          },
          {
            id: "duct-cleaning",
            label: "Complete Duct Cleaning",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Clean all supply and return ductwork using rotary brush and HEPA vacuum."
          }
        ]
      },
      {
        id: "ac-only",
        name: "AC Only Replacement",
        basePriceRange: { low: 4500, high: 9000 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Manufacturer warranty (5-10 years parts). 2-year labor warranty.",
        exclusions: ["Furnace replacement", "Ductwork modifications", "Indoor coil replacement (unless included)", "Electrical panel upgrade"],
        baseScope: [
          "Recover existing refrigerant per EPA Section 608 regulations.",
          "Disconnect and remove existing outdoor condenser unit.",
          "Dispose of old unit per environmental regulations.",
          "Set new condenser on existing pad (or new pad if required).",
          "Inspect and flush existing line set with nitrogen.",
          "Install new filter drier.",
          "Braze all connections with silver solder.",
          "Pressure test system with nitrogen to 500 PSI.",
          "Evacuate system to 500 microns using vacuum pump.",
          "Charge system with factory-specified refrigerant (R-410A).",
          "Verify subcooling and superheat values per manufacturer specs.",
          "Test operation and measure cooling delta-T (16-22°F).",
          "Verify proper amp draw on compressor.",
          "Register warranty with manufacturer.",
          "Clean up work area.",
          "Provide warranty documentation and filter schedule to homeowner."
        ],
        options: [
          {
            id: "tonnage",
            label: "System Size (Tonnage)",
            type: "select",
            choices: [
              { value: "1.5-ton", label: "1.5 Ton", priceModifier: -1000, scopeAddition: "Install 1.5-ton condenser sized for approximately 600-900 sq ft." },
              { value: "2-ton", label: "2 Ton", priceModifier: -600, scopeAddition: "Install 2-ton condenser sized for approximately 901-1200 sq ft." },
              { value: "2.5-ton", label: "2.5 Ton", priceModifier: -300, scopeAddition: "Install 2.5-ton condenser sized for approximately 1201-1500 sq ft." },
              { value: "3-ton", label: "3 Ton", priceModifier: 0, scopeAddition: "Install 3-ton condenser sized for approximately 1501-1800 sq ft." },
              { value: "3.5-ton", label: "3.5 Ton", priceModifier: 400, scopeAddition: "Install 3.5-ton condenser sized for approximately 1801-2100 sq ft." },
              { value: "4-ton", label: "4 Ton", priceModifier: 800, scopeAddition: "Install 4-ton condenser sized for approximately 2101-2400 sq ft." },
              { value: "5-ton", label: "5 Ton", priceModifier: 1500, scopeAddition: "Install 5-ton condenser sized for approximately 2401-3000 sq ft." }
            ]
          },
          {
            id: "efficiency",
            label: "Efficiency Level",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (14-15 SEER)", priceModifier: 0, scopeAddition: "Install 14-15 SEER efficiency condenser." },
              { value: "high", label: "High Efficiency (16-17 SEER)", priceModifier: 1200, scopeAddition: "Install 16-17 SEER high-efficiency condenser." },
              { value: "ultra", label: "Ultra Efficiency (18+ SEER)", priceModifier: 2800, scopeAddition: "Install 18+ SEER ultra-efficient condenser with variable speed compressor." }
            ]
          },
          {
            id: "evap-coil",
            label: "New Evaporator Coil",
            type: "boolean",
            priceModifier: 1200,
            scopeAddition: "Replace indoor evaporator coil to match new condenser for optimal efficiency."
          },
          {
            id: "smart-thermostat",
            label: "Smart Thermostat Upgrade",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install and configure Wi-Fi enabled smart thermostat with app setup."
          },
          {
            id: "new-pad",
            label: "New Condenser Pad",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Install new composite condenser pad (replace cracked or undersized pad)."
          },
          {
            id: "surge-protector",
            label: "A/C Surge Protector",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Install surge protector at outdoor disconnect for compressor protection."
          }
        ]
      },
      {
        id: "furnace-only",
        name: "Furnace Only Replacement",
        basePriceRange: { low: 3500, high: 7500 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Manufacturer warranty (limited lifetime heat exchanger, 10-year parts). 2-year labor warranty.",
        exclusions: ["A/C replacement", "Ductwork modifications", "Gas line installation", "Permits (if required)"],
        baseScope: [
          "Turn off gas supply and disconnect existing furnace.",
          "Disconnect and cap refrigerant lines (if applicable).",
          "Remove existing furnace and dispose properly.",
          "Install new furnace in existing location.",
          "Reconnect gas supply line and test for leaks with electronic detector.",
          "Reconnect existing evaporator coil (if A/C equipped).",
          "Install new drain pan and condensate line with trap (if high-efficiency).",
          "Connect flue/exhaust per code requirements.",
          "Connect and test thermostat wiring.",
          "Verify proper gas pressure at manifold.",
          "Test ignition sequence and safety controls.",
          "Measure temperature rise across heat exchanger.",
          "Verify proper combustion and draft.",
          "Test all heating stages.",
          "Register warranty with manufacturer.",
          "Clean up work area and provide operating instructions."
        ],
        options: [
          {
            id: "size",
            label: "Furnace Size (BTU)",
            type: "select",
            choices: [
              { value: "40k", label: "40,000 BTU", priceModifier: -500, scopeAddition: "Install 40,000 BTU furnace for smaller homes (800-1200 sq ft)." },
              { value: "60k", label: "60,000 BTU", priceModifier: -200, scopeAddition: "Install 60,000 BTU furnace for medium homes (1200-1600 sq ft)." },
              { value: "80k", label: "80,000 BTU", priceModifier: 0, scopeAddition: "Install 80,000 BTU furnace for average homes (1600-2200 sq ft)." },
              { value: "100k", label: "100,000 BTU", priceModifier: 400, scopeAddition: "Install 100,000 BTU furnace for larger homes (2200-2800 sq ft)." },
              { value: "120k", label: "120,000 BTU", priceModifier: 800, scopeAddition: "Install 120,000 BTU furnace for large homes (2800+ sq ft)." }
            ]
          },
          {
            id: "efficiency",
            label: "Efficiency Level",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (80% AFUE)", priceModifier: 0, scopeAddition: "Install 80% AFUE single-stage furnace with standard efficiency." },
              { value: "high", label: "High Efficiency (95% AFUE)", priceModifier: 1200, scopeAddition: "Install 95% AFUE high-efficiency furnace with secondary heat exchanger and PVC venting." },
              { value: "ultra", label: "Ultra Efficiency (98% AFUE)", priceModifier: 2500, scopeAddition: "Install 98% AFUE modulating furnace with variable-speed blower for maximum comfort and efficiency." }
            ]
          },
          {
            id: "smart-thermostat",
            label: "Smart Thermostat Upgrade",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install and configure Wi-Fi enabled smart thermostat with app setup."
          },
          {
            id: "humidifier",
            label: "Whole-House Humidifier",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Install bypass or powered humidifier with humidistat control."
          },
          {
            id: "co-detector",
            label: "Carbon Monoxide Detector",
            type: "boolean",
            priceModifier: 125,
            scopeAddition: "Install hardwired carbon monoxide detector near furnace area."
          }
        ]
      },
      {
        id: "heat-pump-system",
        name: "Heat Pump System Replacement",
        basePriceRange: { low: 8500, high: 16000 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "10-year parts warranty with registration. 2-year labor warranty.",
        exclusions: ["Ductwork replacement", "Electrical panel upgrade", "Backup heating installation", "Permits (if required)"],
        baseScope: [
          "Recover existing refrigerant per EPA Section 608 regulations.",
          "Disconnect and remove existing outdoor heat pump or A/C unit.",
          "Remove and dispose of existing indoor air handler.",
          "Set new heat pump condenser on existing or new pad.",
          "Install new air handler with matched coil.",
          "Install new refrigerant line set if required.",
          "Install new drain pan and condensate line with trap.",
          "Install new filter drier and service ports.",
          "Braze all connections with silver solder.",
          "Pressure test system with nitrogen to 500 PSI.",
          "Evacuate system to 500 microns using vacuum pump.",
          "Charge system with factory-specified refrigerant (R-410A).",
          "Verify subcooling and superheat in both heating and cooling modes.",
          "Test reversing valve operation.",
          "Verify defrost cycle operation.",
          "Connect and program thermostat for heat pump operation.",
          "Test electric backup heat strips (if applicable).",
          "Measure temperature differential in heating and cooling modes.",
          "Register warranty with manufacturer.",
          "Provide system orientation to homeowner.",
          "Clean up work area and remove all debris."
        ],
        options: [
          {
            id: "tonnage",
            label: "System Size (Tonnage)",
            type: "select",
            choices: [
              { value: "1.5-ton", label: "1.5 Ton", priceModifier: -1200, scopeAddition: "Install 1.5-ton heat pump sized for approximately 600-900 sq ft." },
              { value: "2-ton", label: "2 Ton", priceModifier: -800, scopeAddition: "Install 2-ton heat pump sized for approximately 901-1200 sq ft." },
              { value: "2.5-ton", label: "2.5 Ton", priceModifier: -400, scopeAddition: "Install 2.5-ton heat pump sized for approximately 1201-1500 sq ft." },
              { value: "3-ton", label: "3 Ton", priceModifier: 0, scopeAddition: "Install 3-ton heat pump sized for approximately 1501-1800 sq ft." },
              { value: "3.5-ton", label: "3.5 Ton", priceModifier: 500, scopeAddition: "Install 3.5-ton heat pump sized for approximately 1801-2100 sq ft." },
              { value: "4-ton", label: "4 Ton", priceModifier: 1000, scopeAddition: "Install 4-ton heat pump sized for approximately 2101-2400 sq ft." },
              { value: "5-ton", label: "5 Ton", priceModifier: 1800, scopeAddition: "Install 5-ton heat pump sized for approximately 2401-3000 sq ft." }
            ]
          },
          {
            id: "efficiency",
            label: "Efficiency Level",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (14-15 SEER / 8 HSPF)", priceModifier: 0, scopeAddition: "Install standard efficiency heat pump (14-15 SEER, 8 HSPF)." },
              { value: "high", label: "High Efficiency (16-17 SEER / 9 HSPF)", priceModifier: 1800, scopeAddition: "Install high-efficiency heat pump (16-17 SEER, 9 HSPF)." },
              { value: "ultra", label: "Ultra Efficiency (18+ SEER / 10+ HSPF)", priceModifier: 4000, scopeAddition: "Install ultra-efficient variable-speed heat pump (18+ SEER, 10+ HSPF) with inverter technology." }
            ]
          },
          {
            id: "backup-heat",
            label: "Electric Backup Heat Strips",
            type: "select",
            choices: [
              { value: "5kw", label: "5 kW Heat Kit", priceModifier: 350, scopeAddition: "Install 5 kW electric heat kit for backup heating." },
              { value: "10kw", label: "10 kW Heat Kit", priceModifier: 500, scopeAddition: "Install 10 kW electric heat kit for backup heating." },
              { value: "15kw", label: "15 kW Heat Kit", priceModifier: 700, scopeAddition: "Install 15 kW electric heat kit for backup heating." },
              { value: "20kw", label: "20 kW Heat Kit", priceModifier: 900, scopeAddition: "Install 20 kW electric heat kit for backup heating." }
            ]
          },
          {
            id: "smart-thermostat",
            label: "Smart Thermostat (Heat Pump Compatible)",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install heat pump compatible smart thermostat with dual-fuel support."
          },
          {
            id: "surge-protector",
            label: "Heat Pump Surge Protector",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Install surge protector at outdoor disconnect for compressor protection."
          }
        ]
      },
      {
        id: "mini-split-single",
        name: "Mini-Split Install – Single Zone",
        basePriceRange: { low: 3500, high: 6500 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "7-year compressor warranty. 5-year parts warranty. 2-year labor warranty.",
        exclusions: ["Electrical panel upgrade", "Major structural modifications", "Permits (if required)"],
        baseScope: [
          "Select and mark optimal locations for indoor and outdoor units.",
          "Install wall-mounted bracket for indoor air handler.",
          "Core 3\" hole through exterior wall for line set routing.",
          "Install wall sleeve and seal with weatherproof materials.",
          "Run refrigerant lines, drain line, and control wire between units.",
          "Install outdoor condenser on ground bracket or composite pad.",
          "Connect refrigerant lines with proper flare fittings and torque specs.",
          "Vacuum and leak test refrigerant system.",
          "Release factory charge or add refrigerant per line set length.",
          "Wire indoor unit to outdoor unit with control cable.",
          "Install new dedicated electrical circuit (if required).",
          "Connect electrical supply per code requirements.",
          "Test heating and cooling operation.",
          "Verify proper refrigerant charge via temperature method.",
          "Program remote control and demonstrate functions to owner.",
          "Install line set cover for exterior aesthetics.",
          "Clean up all work areas and remove debris.",
          "Provide warranty documentation and maintenance instructions."
        ],
        options: [
          {
            id: "tonnage",
            label: "System Size (BTU/Tonnage)",
            type: "select",
            choices: [
              { value: "9k", label: "9,000 BTU (3/4 Ton)", priceModifier: -800, scopeAddition: "Install 9,000 BTU mini-split for rooms up to 350 sq ft." },
              { value: "12k", label: "12,000 BTU (1 Ton)", priceModifier: -400, scopeAddition: "Install 12,000 BTU mini-split for rooms 350-550 sq ft." },
              { value: "18k", label: "18,000 BTU (1.5 Ton)", priceModifier: 0, scopeAddition: "Install 18,000 BTU mini-split for rooms 550-800 sq ft." },
              { value: "24k", label: "24,000 BTU (2 Ton)", priceModifier: 600, scopeAddition: "Install 24,000 BTU mini-split for rooms 800-1100 sq ft." },
              { value: "36k", label: "36,000 BTU (3 Ton)", priceModifier: 1200, scopeAddition: "Install 36,000 BTU mini-split for areas 1100-1500 sq ft." }
            ]
          },
          {
            id: "efficiency",
            label: "Efficiency Level",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (18 SEER)", priceModifier: 0, scopeAddition: "Install standard 18 SEER mini-split system." },
              { value: "high", label: "High Efficiency (22 SEER)", priceModifier: 800, scopeAddition: "Install high-efficiency 22 SEER mini-split system." },
              { value: "ultra", label: "Ultra Efficiency (25+ SEER)", priceModifier: 1500, scopeAddition: "Install ultra-efficient 25+ SEER mini-split with inverter technology." }
            ]
          },
          {
            id: "ceiling-cassette",
            label: "Ceiling Cassette (in lieu of wall unit)",
            type: "boolean",
            priceModifier: 900,
            scopeAddition: "Install ceiling-recessed cassette style unit for discreet appearance."
          },
          {
            id: "floor-mount",
            label: "Floor-Mounted Unit (in lieu of wall unit)",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Install floor-mounted console unit instead of wall-mounted head."
          },
          {
            id: "wifi-control",
            label: "Wi-Fi Control Adapter",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Install Wi-Fi adapter for smartphone control of mini-split system."
          },
          {
            id: "electrical-circuit",
            label: "New Dedicated Circuit",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install new dedicated 20A or 30A circuit from panel to unit location."
          }
        ]
      },
      {
        id: "mini-split-multi",
        name: "Mini-Split Install – Multi Zone",
        basePriceRange: { low: 7500, high: 15000 },
        estimatedDays: { low: 1, high: 3 },
        warranty: "7-year compressor warranty. 5-year parts warranty. 2-year labor warranty.",
        exclusions: ["Electrical panel upgrade", "Major structural modifications", "Permits (if required)"],
        baseScope: [
          "Evaluate and select optimal locations for each indoor unit and outdoor condenser.",
          "Install wall-mounted brackets for each indoor air handler.",
          "Core holes through exterior walls for each zone's line set routing.",
          "Install wall sleeves and seal with weatherproof materials.",
          "Run individual refrigerant lines, drain lines, and control wires for each zone.",
          "Install multi-zone outdoor condenser on ground bracket or composite pad.",
          "Connect all refrigerant lines to branch distribution box or direct to condenser.",
          "Use proper flare fittings with torque specs for all connections.",
          "Vacuum entire system and test for leaks.",
          "Charge system with proper refrigerant amount per total line set length.",
          "Wire each indoor unit to outdoor unit with control cables.",
          "Install new dedicated electrical circuit for outdoor unit.",
          "Connect electrical supply per code requirements.",
          "Test each zone independently for heating and cooling operation.",
          "Verify proper refrigerant charge and system balance.",
          "Program each zone's remote control and demonstrate to owner.",
          "Install line set covers for exterior aesthetics.",
          "Clean up all work areas and remove debris.",
          "Provide warranty documentation and maintenance instructions for each zone."
        ],
        options: [
          {
            id: "zone-count",
            label: "Number of Indoor Zones",
            type: "select",
            choices: [
              { value: "2-zone", label: "2 Zones", priceModifier: 0, scopeAddition: "Install 2-zone multi-split system with individual temperature control per zone." },
              { value: "3-zone", label: "3 Zones", priceModifier: 2500, scopeAddition: "Install 3-zone multi-split system with individual temperature control per zone." },
              { value: "4-zone", label: "4 Zones", priceModifier: 4500, scopeAddition: "Install 4-zone multi-split system with individual temperature control per zone." },
              { value: "5-zone", label: "5 Zones", priceModifier: 6500, scopeAddition: "Install 5-zone multi-split system with individual temperature control per zone." }
            ]
          },
          {
            id: "outdoor-capacity",
            label: "Outdoor Unit Capacity",
            type: "select",
            choices: [
              { value: "24k", label: "24,000 BTU (2 Ton)", priceModifier: -500, scopeAddition: "Install 24,000 BTU outdoor unit for smaller multi-zone applications." },
              { value: "36k", label: "36,000 BTU (3 Ton)", priceModifier: 0, scopeAddition: "Install 36,000 BTU outdoor unit for medium multi-zone applications." },
              { value: "48k", label: "48,000 BTU (4 Ton)", priceModifier: 1000, scopeAddition: "Install 48,000 BTU outdoor unit for larger multi-zone applications." },
              { value: "60k", label: "60,000 BTU (5 Ton)", priceModifier: 2000, scopeAddition: "Install 60,000 BTU outdoor unit for whole-house multi-zone applications." }
            ]
          },
          {
            id: "efficiency",
            label: "Efficiency Level",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (18 SEER)", priceModifier: 0, scopeAddition: "Install standard 18 SEER multi-zone system." },
              { value: "high", label: "High Efficiency (22 SEER)", priceModifier: 1200, scopeAddition: "Install high-efficiency 22 SEER multi-zone system." },
              { value: "ultra", label: "Ultra Efficiency (25+ SEER)", priceModifier: 2500, scopeAddition: "Install ultra-efficient 25+ SEER multi-zone system with inverter technology." }
            ]
          },
          {
            id: "ceiling-cassettes",
            label: "Ceiling Cassettes (per unit)",
            type: "boolean",
            priceModifier: 1800,
            scopeAddition: "Upgrade indoor units to ceiling-recessed cassettes for discreet appearance."
          },
          {
            id: "wifi-control",
            label: "Wi-Fi Control for All Zones",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install Wi-Fi adapters for smartphone control of all mini-split zones."
          },
          {
            id: "electrical-upgrade",
            label: "New 50A Dedicated Circuit",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Install new dedicated 50A circuit from panel to outdoor unit location."
          }
        ]
      },
      {
        id: "new-construction",
        name: "New Construction – Full HVAC Install",
        basePriceRange: { low: 15000, high: 35000 },
        estimatedDays: { low: 3, high: 7 },
        warranty: "10-year parts warranty with registration. 2-year labor warranty on entire system.",
        exclusions: ["Electrical panel (by electrician)", "Gas line to structure (by plumber)", "Insulation (by insulation contractor)", "Permits (general contractor responsibility)"],
        baseScope: [
          "Review building plans and perform Manual J load calculation.",
          "Design duct layout per Manual D specifications.",
          "Coordinate equipment location with general contractor.",
          "Set furnace or air handler in designated mechanical space.",
          "Install supply plenum and trunk line per design.",
          "Install return plenum and return air duct system.",
          "Run supply branch ducts to each room per plan.",
          "Install register boots at all supply locations.",
          "Install return air grilles and ductwork.",
          "Seal all duct connections with mastic and/or tape per code.",
          "Install outdoor condenser on pad at designated location.",
          "Run refrigerant line set between indoor and outdoor units.",
          "Braze all refrigerant connections with silver solder.",
          "Pressure test refrigerant system to 500 PSI.",
          "Vacuum system to 500 microns after pressure test.",
          "Charge system with factory-specified refrigerant.",
          "Connect gas line to furnace (if gas system) and test for leaks.",
          "Install thermostat at owner-specified location.",
          "Test heating and cooling operation.",
          "Balance airflow to all registers.",
          "Verify static pressure and system performance.",
          "Register warranty with manufacturer.",
          "Provide as-built drawings to general contractor.",
          "Provide system documentation to homeowner."
        ],
        options: [
          {
            id: "tonnage",
            label: "System Size (Tonnage)",
            type: "select",
            choices: [
              { value: "2-ton", label: "2 Ton", priceModifier: -3000, scopeAddition: "Install 2-ton system for homes approximately 1000-1400 sq ft." },
              { value: "2.5-ton", label: "2.5 Ton", priceModifier: -1500, scopeAddition: "Install 2.5-ton system for homes approximately 1400-1800 sq ft." },
              { value: "3-ton", label: "3 Ton", priceModifier: 0, scopeAddition: "Install 3-ton system for homes approximately 1800-2200 sq ft." },
              { value: "3.5-ton", label: "3.5 Ton", priceModifier: 1000, scopeAddition: "Install 3.5-ton system for homes approximately 2200-2600 sq ft." },
              { value: "4-ton", label: "4 Ton", priceModifier: 2000, scopeAddition: "Install 4-ton system for homes approximately 2600-3000 sq ft." },
              { value: "5-ton", label: "5 Ton", priceModifier: 3500, scopeAddition: "Install 5-ton system for homes approximately 3000-3600 sq ft." }
            ]
          },
          {
            id: "system-type",
            label: "System Type",
            type: "select",
            choices: [
              { value: "gas-split", label: "Gas Furnace + A/C Split", priceModifier: 0, scopeAddition: "Install gas furnace with matching A/C condenser (split system)." },
              { value: "heat-pump", label: "Heat Pump System", priceModifier: 1200, scopeAddition: "Install heat pump system for all-electric heating and cooling." },
              { value: "dual-fuel", label: "Dual Fuel (Heat Pump + Gas Backup)", priceModifier: 2500, scopeAddition: "Install dual-fuel system with heat pump primary and gas furnace backup." }
            ]
          },
          {
            id: "efficiency",
            label: "Efficiency Level",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (14 SEER / 80% AFUE)", priceModifier: 0, scopeAddition: "Install standard efficiency equipment (14 SEER A/C, 80% AFUE furnace)." },
              { value: "high", label: "High Efficiency (16 SEER / 95% AFUE)", priceModifier: 3500, scopeAddition: "Install high-efficiency equipment (16 SEER A/C, 95% AFUE furnace)." },
              { value: "ultra", label: "Ultra Efficiency (18+ SEER / 98% AFUE)", priceModifier: 7000, scopeAddition: "Install ultra-efficient equipment (18+ SEER A/C, 98% AFUE modulating furnace)." }
            ]
          },
          {
            id: "duct-type",
            label: "Duct Material",
            type: "select",
            choices: [
              { value: "flex", label: "Flex Duct", priceModifier: 0, scopeAddition: "Install R-6 insulated flex duct for all supply runs." },
              { value: "metal", label: "Sheet Metal Duct", priceModifier: 3500, scopeAddition: "Install sheet metal ductwork with external insulation wrap." },
              { value: "combo", label: "Metal Trunk / Flex Branches", priceModifier: 1500, scopeAddition: "Install sheet metal trunk lines with flex duct branch runs." }
            ]
          },
          {
            id: "zoning",
            label: "Zoning System",
            type: "boolean",
            priceModifier: 3500,
            scopeAddition: "Install 2-zone damper system with zone control panel and multiple thermostats."
          },
          {
            id: "smart-thermostat",
            label: "Smart Thermostat",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install premium smart thermostat with room sensors and app control."
          },
          {
            id: "air-quality",
            label: "Indoor Air Quality Package",
            type: "boolean",
            priceModifier: 1800,
            scopeAddition: "Install whole-house air cleaner, UV light, and bypass humidifier."
          }
        ]
      },
      {
        id: "ductwork-repair",
        name: "Ductwork Repair / Replacement Only",
        basePriceRange: { low: 1500, high: 8000 },
        estimatedDays: { low: 1, high: 3 },
        warranty: "5-year warranty on duct installation. 2-year labor warranty.",
        exclusions: ["HVAC equipment", "Thermostat replacement", "Insulation (unless specified)", "Permits (if required)"],
        baseScope: [
          "Inspect existing duct system for leaks, damage, and insulation condition.",
          "Photograph and document existing conditions.",
          "Disconnect and remove damaged or failed ductwork sections.",
          "Properly dispose of old duct materials.",
          "Install new ductwork per specifications.",
          "Connect all supply and return runs to plenums.",
          "Seal all connections with mastic and UL-listed tape.",
          "Secure ductwork with proper hangers and straps per code.",
          "Reinstall or install new registers and grilles.",
          "Test system for proper airflow at each register.",
          "Verify no air leaks with visual inspection.",
          "Clean up all work areas and remove debris.",
          "Provide before/after documentation to homeowner."
        ],
        options: [
          {
            id: "scope",
            label: "Repair Scope",
            type: "select",
            choices: [
              { value: "repair", label: "Repair Specific Sections", priceModifier: 0, scopeAddition: "Repair or replace damaged duct sections as identified." },
              { value: "partial", label: "Partial Duct Replacement (50%)", priceModifier: 2000, scopeAddition: "Replace approximately 50% of existing duct system." },
              { value: "full", label: "Complete Duct Replacement", priceModifier: 5000, scopeAddition: "Remove and replace entire duct system with new materials." }
            ]
          },
          {
            id: "material",
            label: "Duct Material",
            type: "select",
            choices: [
              { value: "flex", label: "Flex Duct (R-6 Insulated)", priceModifier: 0, scopeAddition: "Use R-6 insulated flex duct for all runs." },
              { value: "flex-r8", label: "Flex Duct (R-8 Insulated)", priceModifier: 400, scopeAddition: "Use R-8 insulated flex duct for improved efficiency." },
              { value: "metal", label: "Sheet Metal", priceModifier: 2500, scopeAddition: "Use sheet metal ductwork with external insulation." }
            ]
          },
          {
            id: "duct-sealing",
            label: "Aeroseal Duct Sealing",
            type: "boolean",
            priceModifier: 1500,
            scopeAddition: "Apply Aeroseal technology to seal all duct leaks from inside the system."
          },
          {
            id: "insulation-wrap",
            label: "Additional Duct Insulation",
            type: "boolean",
            priceModifier: 600,
            scopeAddition: "Wrap accessible ducts with additional R-8 insulation blanket."
          },
          {
            id: "return-upgrade",
            label: "Add Return Air Vent",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install additional return air vent to improve airflow balance."
          },
          {
            id: "registers",
            label: "New Registers & Grilles",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Replace all supply registers and return grilles with new units."
          }
        ]
      },
      {
        id: "iaq-upgrades",
        name: "Indoor Air Quality / Add-On Upgrades",
        basePriceRange: { low: 500, high: 4000 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Manufacturer warranty on equipment. 1-year labor warranty.",
        exclusions: ["HVAC equipment replacement", "Ductwork modifications", "Electrical panel upgrade"],
        baseScope: [
          "Evaluate existing HVAC system compatibility.",
          "Determine optimal location for IAQ equipment installation.",
          "Turn off HVAC system and disconnect power.",
          "Install selected air quality equipment per manufacturer specifications.",
          "Make necessary electrical connections.",
          "Connect to existing duct system or air handler as required.",
          "Test equipment operation and verify proper function.",
          "Demonstrate operation and maintenance to homeowner.",
          "Provide warranty documentation and maintenance schedule.",
          "Clean up work area."
        ],
        options: [
          {
            id: "uv-light",
            label: "UV-C Germicidal Light",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Install UV-C germicidal light in air handler to kill mold, bacteria, and viruses."
          },
          {
            id: "air-cleaner",
            label: "Whole-House Air Cleaner",
            type: "select",
            choices: [
              { value: "media", label: "Media Air Cleaner (MERV 11-13)", priceModifier: 450, scopeAddition: "Install 4\" or 5\" media air cleaner cabinet with MERV 11-13 filter." },
              { value: "electronic", label: "Electronic Air Cleaner", priceModifier: 900, scopeAddition: "Install electronic air cleaner for advanced particle removal." },
              { value: "hepa", label: "HEPA Bypass System", priceModifier: 1800, scopeAddition: "Install true HEPA bypass filtration system for medical-grade air cleaning." }
            ]
          },
          {
            id: "humidifier",
            label: "Whole-House Humidifier",
            type: "select",
            choices: [
              { value: "bypass", label: "Bypass Humidifier", priceModifier: 550, scopeAddition: "Install bypass humidifier with manual humidistat." },
              { value: "powered", label: "Powered Flow-Through Humidifier", priceModifier: 750, scopeAddition: "Install powered flow-through humidifier with automatic humidistat." },
              { value: "steam", label: "Steam Humidifier", priceModifier: 1500, scopeAddition: "Install steam humidifier for precise humidity control." }
            ]
          },
          {
            id: "dehumidifier",
            label: "Whole-House Dehumidifier",
            type: "boolean",
            priceModifier: 1800,
            scopeAddition: "Install whole-house dehumidifier integrated with HVAC system."
          },
          {
            id: "erv-hrv",
            label: "Energy/Heat Recovery Ventilator",
            type: "select",
            choices: [
              { value: "hrv", label: "Heat Recovery Ventilator (HRV)", priceModifier: 2200, scopeAddition: "Install HRV for balanced ventilation with heat recovery (cold climates)." },
              { value: "erv", label: "Energy Recovery Ventilator (ERV)", priceModifier: 2400, scopeAddition: "Install ERV for balanced ventilation with heat and moisture recovery (humid climates)." }
            ]
          },
          {
            id: "ionizer",
            label: "Bi-Polar Ionization System",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Install needlepoint bi-polar ionization system in ductwork."
          }
        ]
      },
      {
        id: "maintenance-tuneup",
        name: "Maintenance / Tune-Up",
        basePriceRange: { low: 99, high: 299 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "30-day warranty on repairs performed. No warranty on diagnostics only.",
        exclusions: ["Parts replacement (quoted separately)", "Refrigerant (if needed)", "Major repairs"],
        baseScope: [
          "Arrive on time and introduce scope of maintenance visit.",
          "Inspect and replace air filter (standard filter included).",
          "Inspect thermostat operation and calibration.",
          "Check electrical connections and tighten as needed.",
          "Measure voltage and amperage on all components.",
          "Inspect and clean condenser coil (exterior).",
          "Clear debris from around outdoor unit.",
          "Check refrigerant pressure and note any concerns.",
          "Inspect evaporator coil (if accessible).",
          "Test condensate drain and clear if clogged.",
          "Lubricate moving parts as needed.",
          "Test heating and cooling operation.",
          "Measure temperature differential (cooling or heating).",
          "Inspect ductwork for visible issues.",
          "Provide written report of findings and recommendations.",
          "Answer homeowner questions about system condition."
        ],
        options: [
          {
            id: "service-type",
            label: "Service Type",
            type: "select",
            choices: [
              { value: "cooling", label: "A/C Tune-Up Only", priceModifier: 0, scopeAddition: "Perform cooling system tune-up and inspection." },
              { value: "heating", label: "Heating Tune-Up Only", priceModifier: 0, scopeAddition: "Perform heating system tune-up and inspection." },
              { value: "both", label: "Complete HVAC Tune-Up", priceModifier: 75, scopeAddition: "Perform complete heating and cooling system tune-up." }
            ]
          },
          {
            id: "coil-cleaning",
            label: "Deep Condenser Coil Cleaning",
            type: "boolean",
            priceModifier: 125,
            scopeAddition: "Perform chemical cleaning of condenser coil for improved efficiency."
          },
          {
            id: "evap-coil-cleaning",
            label: "Evaporator Coil Cleaning",
            type: "boolean",
            priceModifier: 175,
            scopeAddition: "Perform foam cleaning of evaporator coil (if accessible)."
          },
          {
            id: "capacitor-check",
            label: "Capacitor Test & Report",
            type: "boolean",
            priceModifier: 0,
            scopeAddition: "Test run and start capacitors and provide readings in report."
          },
          {
            id: "refrigerant-check",
            label: "Full Refrigerant Analysis",
            type: "boolean",
            priceModifier: 50,
            scopeAddition: "Perform detailed refrigerant analysis with superheat/subcooling readings."
          },
          {
            id: "service-agreement",
            label: "Annual Service Agreement",
            type: "boolean",
            priceModifier: 149,
            scopeAddition: "Enroll in annual maintenance agreement for 2 visits per year with priority scheduling."
          }
        ]
      },
      {
        id: "service-diagnostic",
        name: "Service Call / Diagnostic Only",
        basePriceRange: { low: 89, high: 150 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Diagnostic fee applied toward repair if work is approved.",
        exclusions: ["Parts and materials", "Repairs (quoted separately)", "Refrigerant"],
        baseScope: [
          "Respond to service request within scheduled window.",
          "Discuss reported symptoms with homeowner.",
          "Perform visual inspection of entire HVAC system.",
          "Check thermostat operation and settings.",
          "Inspect electrical connections and components.",
          "Measure voltage and amperage where applicable.",
          "Check refrigerant pressures (if cooling issue).",
          "Inspect condensate drainage.",
          "Test ignition sequence (if heating issue).",
          "Use diagnostic tools to identify fault.",
          "Explain findings and diagnosis to homeowner.",
          "Provide written estimate for recommended repairs.",
          "Answer questions about repair options.",
          "Apply diagnostic fee to repair if work is approved."
        ],
        options: [
          {
            id: "urgency",
            label: "Service Urgency",
            type: "select",
            choices: [
              { value: "standard", label: "Standard (Next Available)", priceModifier: 0, scopeAddition: "Schedule service during next available appointment window." },
              { value: "priority", label: "Priority (Same Day)", priceModifier: 50, scopeAddition: "Priority same-day service (subject to availability)." },
              { value: "emergency", label: "Emergency (After Hours)", priceModifier: 150, scopeAddition: "Emergency after-hours service call (evenings/weekends)." }
            ]
          },
          {
            id: "system-type",
            label: "System Being Diagnosed",
            type: "select",
            choices: [
              { value: "cooling", label: "Cooling System (A/C)", priceModifier: 0, scopeAddition: "Diagnose air conditioning system issue." },
              { value: "heating", label: "Heating System (Furnace/Heat Pump)", priceModifier: 0, scopeAddition: "Diagnose heating system issue." },
              { value: "both", label: "Complete HVAC System", priceModifier: 25, scopeAddition: "Diagnose complete HVAC system for multiple issues." }
            ]
          },
          {
            id: "minor-repair",
            label: "Minor Repair Allowance",
            type: "boolean",
            priceModifier: 100,
            scopeAddition: "Include up to $100 in minor repairs (fuses, resets, cleaning) if needed during visit."
          },
          {
            id: "second-opinion",
            label: "Second Opinion Documentation",
            type: "boolean",
            priceModifier: 25,
            scopeAddition: "Provide detailed written report with photos for second opinion purposes."
          }
        ]
      }
    ]
  },
  {
    id: "landscaping",
    trade: "Landscaping",
    jobTypes: [
      {
        id: "full-yard-makeover",
        name: "Full Yard Makeover – Front & Back",
        basePriceRange: { low: 15000, high: 45000 },
        estimatedDays: { low: 10, high: 25 },
        warranty: "1-year warranty on all plantings (with proper care). 2-year warranty on hardscape and irrigation workmanship.",
        exclusions: [
          "Permit fees and HOA approval",
          "Tree removal over 24-inch diameter",
          "Structural retaining walls over 4 feet",
          "Underground utility relocation",
          "Fence installation"
        ],
        baseScope: [
          "Initial site consultation and design review with homeowner.",
          "Call 811 for utility location prior to any excavation.",
          "Remove existing plants, grass, and debris as specified in plan.",
          "Grade and level yard for proper drainage away from structure.",
          "Install landscape fabric in designated areas.",
          "Prepare planting beds with soil amendment and compost.",
          "Install all trees, shrubs, and perennials per landscape plan.",
          "Install hardscape elements per design specifications.",
          "Install irrigation system components as specified.",
          "Apply mulch to all planting beds (3-inch depth).",
          "Perform final grading and cleanup of all work areas.",
          "Provide plant care guide and irrigation schedule to homeowner."
        ],
        options: [
          {
            id: "yard-area",
            label: "Yard Area",
            type: "select",
            choices: [
              { value: "front", label: "Front Yard Only", priceModifier: -5000, scopeAddition: "Limit work to front yard area only." },
              { value: "back", label: "Back Yard Only", priceModifier: -4000, scopeAddition: "Limit work to back yard area only." },
              { value: "side", label: "Side Yard Only", priceModifier: -8000, scopeAddition: "Limit work to side yard area only." },
              { value: "entire", label: "Entire Property", priceModifier: 0, scopeAddition: "Complete landscape makeover for entire property." }
            ]
          },
          {
            id: "planting-scope",
            label: "Planting Scope",
            type: "select",
            choices: [
              { value: "new-beds", label: "New Planting Beds", priceModifier: 0, scopeAddition: "Create new planting beds with fresh plantings and mulch." },
              { value: "refresh", label: "Refresh Existing Beds", priceModifier: -500, scopeAddition: "Refresh existing beds with new mulch and select replacement plants." },
              { value: "shrubs", label: "Shrubs Only", priceModifier: 0, scopeAddition: "Install shrubs only per landscape plan." },
              { value: "perennials", label: "Perennials & Color", priceModifier: 500, scopeAddition: "Install perennials and seasonal color plantings." },
              { value: "annuals", label: "Annual Flowers", priceModifier: 300, scopeAddition: "Install annual flowers for seasonal color." },
              { value: "small-trees", label: "Small Trees (under 15 ft)", priceModifier: 800, scopeAddition: "Install small ornamental trees (under 15 feet mature height)." },
              { value: "large-trees", label: "Large Trees (over 15 ft)", priceModifier: 2000, scopeAddition: "Install large shade or specimen trees (over 15 feet mature height)." }
            ]
          },
          {
            id: "hardscape-scope",
            label: "Hardscape Scope",
            type: "select",
            choices: [
              { value: "paver-patio", label: "Paver Patio", priceModifier: 0, scopeAddition: "Install paver patio with compacted base and polymeric sand joints." },
              { value: "concrete-patio", label: "Concrete Patio", priceModifier: -500, scopeAddition: "Pour concrete patio with proper slope and control joints." },
              { value: "overlay", label: "Paver Overlay", priceModifier: -800, scopeAddition: "Install thin pavers over existing concrete surface." },
              { value: "walkway", label: "Paver Walkway", priceModifier: -1500, scopeAddition: "Install paver walkway with compacted base." },
              { value: "stepping-stones", label: "Stepping Stones", priceModifier: -2000, scopeAddition: "Install stepping stone path with groundcover between stones." },
              { value: "gravel-path", label: "Gravel Path", priceModifier: -2500, scopeAddition: "Install gravel path with steel edging and landscape fabric." },
              { value: "fire-pit", label: "Fire Pit Area", priceModifier: 2500, scopeAddition: "Install fire pit with paver surround and seating area." }
            ]
          },
          {
            id: "irrigation-scope",
            label: "Irrigation Scope",
            type: "select",
            choices: [
              { value: "new-full", label: "New Full System", priceModifier: 0, scopeAddition: "Install complete new irrigation system with full coverage." },
              { value: "new-partial", label: "New Partial System", priceModifier: -1500, scopeAddition: "Install irrigation for select zones only." },
              { value: "add-zones", label: "Add Zones to Existing", priceModifier: -2000, scopeAddition: "Add new zones to existing irrigation system." },
              { value: "drip", label: "Drip Irrigation Only", priceModifier: -2500, scopeAddition: "Install drip irrigation in planting beds only." },
              { value: "smart-controller", label: "Smart Controller Upgrade", priceModifier: 350, scopeAddition: "Install WiFi-enabled smart irrigation controller with weather adjustment." }
            ]
          },
          {
            id: "edging-type",
            label: "Edging Type",
            type: "select",
            choices: [
              { value: "steel", label: "Steel Edging", priceModifier: 450, scopeAddition: "Install steel landscape edging along all bed borders." },
              { value: "stone", label: "Natural Stone Edging", priceModifier: 600, scopeAddition: "Install natural stone edging along bed borders." },
              { value: "paver", label: "Paver Edging", priceModifier: 500, scopeAddition: "Install paver soldier course edging along beds." },
              { value: "plastic", label: "Plastic Edging", priceModifier: 150, scopeAddition: "Install plastic landscape edging along bed borders." },
              { value: "none", label: "No Edging", priceModifier: 0, scopeAddition: "No formal edging installed; natural bed edge maintained." }
            ]
          }
        ]
      },
      {
        id: "front-yard-refresh",
        name: "Front Yard Refresh Only",
        basePriceRange: { low: 5000, high: 15000 },
        estimatedDays: { low: 3, high: 7 },
        warranty: "1-year warranty on all plantings (with proper care). 1-year warranty on hardscape workmanship.",
        exclusions: [
          "Back yard work",
          "Major grading or drainage correction",
          "Tree removal",
          "Irrigation main line repair"
        ],
        baseScope: [
          "Initial consultation and design review for front yard.",
          "Remove dead or overgrown plants as specified.",
          "Edge all existing beds and define borders.",
          "Amend soil in planting areas with compost.",
          "Install new plants per approved design.",
          "Refresh mulch in all planting beds (3-inch depth).",
          "Adjust irrigation heads and timing as needed.",
          "Clean up all work areas and debris.",
          "Provide plant care guide to homeowner."
        ],
        options: [
          {
            id: "planting-scope",
            label: "Planting Scope",
            type: "select",
            choices: [
              { value: "new-beds", label: "New Planting Beds", priceModifier: 0, scopeAddition: "Create new planting beds with fresh plantings and mulch." },
              { value: "refresh", label: "Refresh Existing Beds", priceModifier: -500, scopeAddition: "Refresh existing beds with new mulch and select replacement plants." },
              { value: "shrubs", label: "Shrubs Only", priceModifier: 0, scopeAddition: "Install shrubs only per landscape plan." },
              { value: "perennials", label: "Perennials & Color", priceModifier: 500, scopeAddition: "Install perennials and seasonal color plantings." },
              { value: "annuals", label: "Annual Flowers", priceModifier: 300, scopeAddition: "Install annual flowers for seasonal color." },
              { value: "small-trees", label: "Small Trees (under 15 ft)", priceModifier: 800, scopeAddition: "Install small ornamental trees (under 15 feet mature height)." },
              { value: "large-trees", label: "Large Trees (over 15 ft)", priceModifier: 2000, scopeAddition: "Install large shade or specimen trees (over 15 feet mature height)." }
            ]
          },
          {
            id: "hardscape-scope",
            label: "Hardscape Scope",
            type: "select",
            choices: [
              { value: "paver-patio", label: "Paver Patio", priceModifier: 0, scopeAddition: "Install paver patio with compacted base and polymeric sand joints." },
              { value: "concrete-patio", label: "Concrete Patio", priceModifier: -500, scopeAddition: "Pour concrete patio with proper slope and control joints." },
              { value: "overlay", label: "Paver Overlay", priceModifier: -800, scopeAddition: "Install thin pavers over existing concrete surface." },
              { value: "walkway", label: "Paver Walkway", priceModifier: -1500, scopeAddition: "Install paver walkway with compacted base." },
              { value: "stepping-stones", label: "Stepping Stones", priceModifier: -2000, scopeAddition: "Install stepping stone path with groundcover between stones." },
              { value: "gravel-path", label: "Gravel Path", priceModifier: -2500, scopeAddition: "Install gravel path with steel edging and landscape fabric." },
              { value: "fire-pit", label: "Fire Pit Area", priceModifier: 2500, scopeAddition: "Install fire pit with paver surround and seating area." }
            ]
          },
          {
            id: "irrigation-scope",
            label: "Irrigation Scope",
            type: "select",
            choices: [
              { value: "new-full", label: "New Full System", priceModifier: 0, scopeAddition: "Install complete new irrigation system with full coverage." },
              { value: "new-partial", label: "New Partial System", priceModifier: -1500, scopeAddition: "Install irrigation for select zones only." },
              { value: "add-zones", label: "Add Zones to Existing", priceModifier: -2000, scopeAddition: "Add new zones to existing irrigation system." },
              { value: "drip", label: "Drip Irrigation Only", priceModifier: -2500, scopeAddition: "Install drip irrigation in planting beds only." },
              { value: "smart-controller", label: "Smart Controller Upgrade", priceModifier: 350, scopeAddition: "Install WiFi-enabled smart irrigation controller with weather adjustment." }
            ]
          },
          {
            id: "edging-type",
            label: "Edging Type",
            type: "select",
            choices: [
              { value: "steel", label: "Steel Edging", priceModifier: 450, scopeAddition: "Install steel landscape edging along all bed borders." },
              { value: "stone", label: "Natural Stone Edging", priceModifier: 600, scopeAddition: "Install natural stone edging along bed borders." },
              { value: "paver", label: "Paver Edging", priceModifier: 500, scopeAddition: "Install paver soldier course edging along beds." },
              { value: "plastic", label: "Plastic Edging", priceModifier: 150, scopeAddition: "Install plastic landscape edging along bed borders." },
              { value: "none", label: "No Edging", priceModifier: 0, scopeAddition: "No formal edging installed; natural bed edge maintained." }
            ]
          }
        ]
      },
      {
        id: "back-yard-refresh",
        name: "Back Yard Refresh Only",
        basePriceRange: { low: 6000, high: 18000 },
        estimatedDays: { low: 4, high: 10 },
        warranty: "1-year warranty on all plantings (with proper care). 1-year warranty on hardscape workmanship.",
        exclusions: [
          "Front yard work",
          "Pool or spa installation",
          "Major grading or retaining walls",
          "Fence installation"
        ],
        baseScope: [
          "Initial consultation and design review for back yard.",
          "Remove dead or overgrown plants as specified.",
          "Edge all existing beds and define borders.",
          "Amend soil in planting areas with compost.",
          "Install new plants per approved design.",
          "Install or refresh hardscape elements as specified.",
          "Refresh mulch in all planting beds (3-inch depth).",
          "Adjust irrigation heads and timing as needed.",
          "Clean up all work areas and debris.",
          "Provide plant care guide to homeowner."
        ],
        options: [
          {
            id: "planting-scope",
            label: "Planting Scope",
            type: "select",
            choices: [
              { value: "new-beds", label: "New Planting Beds", priceModifier: 0, scopeAddition: "Create new planting beds with fresh plantings and mulch." },
              { value: "refresh", label: "Refresh Existing Beds", priceModifier: -500, scopeAddition: "Refresh existing beds with new mulch and select replacement plants." },
              { value: "shrubs", label: "Shrubs Only", priceModifier: 0, scopeAddition: "Install shrubs only per landscape plan." },
              { value: "perennials", label: "Perennials & Color", priceModifier: 500, scopeAddition: "Install perennials and seasonal color plantings." },
              { value: "annuals", label: "Annual Flowers", priceModifier: 300, scopeAddition: "Install annual flowers for seasonal color." },
              { value: "small-trees", label: "Small Trees (under 15 ft)", priceModifier: 800, scopeAddition: "Install small ornamental trees (under 15 feet mature height)." },
              { value: "large-trees", label: "Large Trees (over 15 ft)", priceModifier: 2000, scopeAddition: "Install large shade or specimen trees (over 15 feet mature height)." }
            ]
          },
          {
            id: "hardscape-scope",
            label: "Hardscape Scope",
            type: "select",
            choices: [
              { value: "paver-patio", label: "Paver Patio", priceModifier: 0, scopeAddition: "Install paver patio with compacted base and polymeric sand joints." },
              { value: "concrete-patio", label: "Concrete Patio", priceModifier: -500, scopeAddition: "Pour concrete patio with proper slope and control joints." },
              { value: "overlay", label: "Paver Overlay", priceModifier: -800, scopeAddition: "Install thin pavers over existing concrete surface." },
              { value: "walkway", label: "Paver Walkway", priceModifier: -1500, scopeAddition: "Install paver walkway with compacted base." },
              { value: "stepping-stones", label: "Stepping Stones", priceModifier: -2000, scopeAddition: "Install stepping stone path with groundcover between stones." },
              { value: "gravel-path", label: "Gravel Path", priceModifier: -2500, scopeAddition: "Install gravel path with steel edging and landscape fabric." },
              { value: "fire-pit", label: "Fire Pit Area", priceModifier: 2500, scopeAddition: "Install fire pit with paver surround and seating area." }
            ]
          },
          {
            id: "irrigation-scope",
            label: "Irrigation Scope",
            type: "select",
            choices: [
              { value: "new-full", label: "New Full System", priceModifier: 0, scopeAddition: "Install complete new irrigation system with full coverage." },
              { value: "new-partial", label: "New Partial System", priceModifier: -1500, scopeAddition: "Install irrigation for select zones only." },
              { value: "add-zones", label: "Add Zones to Existing", priceModifier: -2000, scopeAddition: "Add new zones to existing irrigation system." },
              { value: "drip", label: "Drip Irrigation Only", priceModifier: -2500, scopeAddition: "Install drip irrigation in planting beds only." },
              { value: "smart-controller", label: "Smart Controller Upgrade", priceModifier: 350, scopeAddition: "Install WiFi-enabled smart irrigation controller with weather adjustment." }
            ]
          },
          {
            id: "edging-type",
            label: "Edging Type",
            type: "select",
            choices: [
              { value: "steel", label: "Steel Edging", priceModifier: 450, scopeAddition: "Install steel landscape edging along all bed borders." },
              { value: "stone", label: "Natural Stone Edging", priceModifier: 600, scopeAddition: "Install natural stone edging along bed borders." },
              { value: "paver", label: "Paver Edging", priceModifier: 500, scopeAddition: "Install paver soldier course edging along beds." },
              { value: "plastic", label: "Plastic Edging", priceModifier: 150, scopeAddition: "Install plastic landscape edging along bed borders." },
              { value: "none", label: "No Edging", priceModifier: 0, scopeAddition: "No formal edging installed; natural bed edge maintained." }
            ]
          }
        ]
      },
      {
        id: "new-construction",
        name: "New Construction Landscape Install",
        basePriceRange: { low: 12000, high: 35000 },
        estimatedDays: { low: 7, high: 15 },
        warranty: "1-year warranty on all plantings (with proper care). 2-year warranty on hardscape and irrigation workmanship.",
        exclusions: [
          "Builder cleanup or debris removal",
          "Fence installation",
          "Pool or water feature installation",
          "Exterior lighting beyond landscape lights"
        ],
        baseScope: [
          "Initial site consultation and design review.",
          "Coordinate with builder on final grade and drainage.",
          "Call 811 for utility location prior to excavation.",
          "Install complete irrigation system per design.",
          "Prepare and amend soil throughout planting areas.",
          "Install sod in lawn areas per specifications.",
          "Install all trees, shrubs, and perennials per plan.",
          "Install hardscape elements (patio, walkway) as specified.",
          "Apply mulch to all planting beds (3-inch depth).",
          "Program irrigation controller and test all zones.",
          "Final cleanup and debris removal from site.",
          "Provide complete plant care guide and warranty documentation."
        ],
        options: [
          {
            id: "yard-area",
            label: "Yard Area",
            type: "select",
            choices: [
              { value: "front", label: "Front Yard Only", priceModifier: -5000, scopeAddition: "Limit work to front yard area only." },
              { value: "back", label: "Back Yard Only", priceModifier: -4000, scopeAddition: "Limit work to back yard area only." },
              { value: "side", label: "Side Yard Only", priceModifier: -8000, scopeAddition: "Limit work to side yard area only." },
              { value: "entire", label: "Entire Property", priceModifier: 0, scopeAddition: "Complete landscape installation for entire property." }
            ]
          },
          {
            id: "planting-scope",
            label: "Planting Scope",
            type: "select",
            choices: [
              { value: "new-beds", label: "New Planting Beds", priceModifier: 0, scopeAddition: "Create new planting beds with fresh plantings and mulch." },
              { value: "refresh", label: "Refresh Existing Beds", priceModifier: -500, scopeAddition: "Refresh existing beds with new mulch and select replacement plants." },
              { value: "shrubs", label: "Shrubs Only", priceModifier: 0, scopeAddition: "Install shrubs only per landscape plan." },
              { value: "perennials", label: "Perennials & Color", priceModifier: 500, scopeAddition: "Install perennials and seasonal color plantings." },
              { value: "annuals", label: "Annual Flowers", priceModifier: 300, scopeAddition: "Install annual flowers for seasonal color." },
              { value: "small-trees", label: "Small Trees (under 15 ft)", priceModifier: 800, scopeAddition: "Install small ornamental trees (under 15 feet mature height)." },
              { value: "large-trees", label: "Large Trees (over 15 ft)", priceModifier: 2000, scopeAddition: "Install large shade or specimen trees (over 15 feet mature height)." }
            ]
          },
          {
            id: "hardscape-scope",
            label: "Hardscape Scope",
            type: "select",
            choices: [
              { value: "paver-patio", label: "Paver Patio", priceModifier: 0, scopeAddition: "Install paver patio with compacted base and polymeric sand joints." },
              { value: "concrete-patio", label: "Concrete Patio", priceModifier: -500, scopeAddition: "Pour concrete patio with proper slope and control joints." },
              { value: "overlay", label: "Paver Overlay", priceModifier: -800, scopeAddition: "Install thin pavers over existing concrete surface." },
              { value: "walkway", label: "Paver Walkway", priceModifier: -1500, scopeAddition: "Install paver walkway with compacted base." },
              { value: "stepping-stones", label: "Stepping Stones", priceModifier: -2000, scopeAddition: "Install stepping stone path with groundcover between stones." },
              { value: "gravel-path", label: "Gravel Path", priceModifier: -2500, scopeAddition: "Install gravel path with steel edging and landscape fabric." },
              { value: "fire-pit", label: "Fire Pit Area", priceModifier: 2500, scopeAddition: "Install fire pit with paver surround and seating area." }
            ]
          },
          {
            id: "irrigation-scope",
            label: "Irrigation Scope",
            type: "select",
            choices: [
              { value: "new-full", label: "New Full System", priceModifier: 0, scopeAddition: "Install complete new irrigation system with full coverage." },
              { value: "new-partial", label: "New Partial System", priceModifier: -1500, scopeAddition: "Install irrigation for select zones only." },
              { value: "add-zones", label: "Add Zones to Existing", priceModifier: -2000, scopeAddition: "Add new zones to existing irrigation system." },
              { value: "drip", label: "Drip Irrigation Only", priceModifier: -2500, scopeAddition: "Install drip irrigation in planting beds only." },
              { value: "smart-controller", label: "Smart Controller Upgrade", priceModifier: 350, scopeAddition: "Install WiFi-enabled smart irrigation controller with weather adjustment." }
            ]
          },
          {
            id: "edging-type",
            label: "Edging Type",
            type: "select",
            choices: [
              { value: "steel", label: "Steel Edging", priceModifier: 450, scopeAddition: "Install steel landscape edging along all bed borders." },
              { value: "stone", label: "Natural Stone Edging", priceModifier: 600, scopeAddition: "Install natural stone edging along bed borders." },
              { value: "paver", label: "Paver Edging", priceModifier: 500, scopeAddition: "Install paver soldier course edging along beds." },
              { value: "plastic", label: "Plastic Edging", priceModifier: 150, scopeAddition: "Install plastic landscape edging along bed borders." },
              { value: "none", label: "No Edging", priceModifier: 0, scopeAddition: "No formal edging installed; natural bed edge maintained." }
            ]
          }
        ]
      },
      {
        id: "sod-install",
        name: "Sod Installation Only",
        basePriceRange: { low: 2500, high: 6000 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "30-day establishment warranty (with proper watering schedule followed).",
        exclusions: [
          "Irrigation system installation or repair",
          "Major grading or drainage work",
          "Tree or stump removal",
          "Sprinkler head adjustment"
        ],
        baseScope: [
          "Remove existing lawn or dead grass areas.",
          "Grade and level soil for proper drainage.",
          "Add topsoil as needed for proper sod depth (2-3 inches).",
          "Apply starter fertilizer to prepared soil.",
          "Install fresh sod in brick-lay pattern for stability.",
          "Cut sod to fit around edges and obstacles.",
          "Roll sod to ensure root contact with soil.",
          "Water thoroughly immediately after installation.",
          "Provide detailed watering schedule for establishment.",
          "Clean up all debris and excess materials."
        ],
        options: [
          {
            id: "sod-type",
            label: "Sod Type",
            type: "select",
            choices: [
              { value: "fescue", label: "Tall Fescue", priceModifier: 0, scopeAddition: "Install tall fescue sod suited for partial shade and cool seasons." },
              { value: "bermuda", label: "Bermuda Grass", priceModifier: 200, scopeAddition: "Install Bermuda grass sod for full sun areas and warm climates." },
              { value: "zoysia", label: "Zoysia Grass", priceModifier: 800, scopeAddition: "Install Zoysia grass sod for dense, drought-tolerant lawn." },
              { value: "st-augustine", label: "St. Augustine", priceModifier: 600, scopeAddition: "Install St. Augustine sod for warm coastal climates." }
            ]
          },
          {
            id: "soil-amendment",
            label: "Soil Amendment Package",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Add compost and soil conditioner for improved root establishment and drainage."
          }
        ]
      },
      {
        id: "planting-beds",
        name: "Planting / Garden Beds Only",
        basePriceRange: { low: 1500, high: 8000 },
        estimatedDays: { low: 1, high: 5 },
        warranty: "1-year plant replacement warranty (with proper care and watering).",
        exclusions: [
          "Irrigation installation",
          "Hardscape construction",
          "Tree removal or large tree planting",
          "Lawn installation"
        ],
        baseScope: [
          "Review site conditions: sun exposure, soil type, and drainage.",
          "Remove existing plants as directed by homeowner.",
          "Define bed borders and install edging as specified.",
          "Amend soil in planting areas with compost and fertilizer.",
          "Install shrubs at proper spacing for mature size.",
          "Install perennials and groundcovers per design.",
          "Apply mulch to all planting beds (3-inch depth).",
          "Deep water all plants after installation.",
          "Clean up all work areas and debris.",
          "Provide plant identification and care guide."
        ],
        options: [
          {
            id: "planting-scope",
            label: "Planting Scope",
            type: "select",
            choices: [
              { value: "new-beds", label: "New Planting Beds", priceModifier: 0, scopeAddition: "Create new planting beds with fresh plantings and mulch." },
              { value: "refresh", label: "Refresh Existing Beds", priceModifier: -500, scopeAddition: "Refresh existing beds with new mulch and select replacement plants." },
              { value: "shrubs", label: "Shrubs Only", priceModifier: 0, scopeAddition: "Install shrubs only per landscape plan." },
              { value: "perennials", label: "Perennials & Color", priceModifier: 500, scopeAddition: "Install perennials and seasonal color plantings." },
              { value: "annuals", label: "Annual Flowers", priceModifier: 300, scopeAddition: "Install annual flowers for seasonal color." },
              { value: "small-trees", label: "Small Trees (under 15 ft)", priceModifier: 800, scopeAddition: "Install small ornamental trees (under 15 feet mature height)." },
              { value: "large-trees", label: "Large Trees (over 15 ft)", priceModifier: 2000, scopeAddition: "Install large shade or specimen trees (over 15 feet mature height)." }
            ]
          },
          {
            id: "edging-type",
            label: "Edging Type",
            type: "select",
            choices: [
              { value: "steel", label: "Steel Edging", priceModifier: 450, scopeAddition: "Install steel landscape edging along all bed borders." },
              { value: "stone", label: "Natural Stone Edging", priceModifier: 600, scopeAddition: "Install natural stone edging along bed borders." },
              { value: "paver", label: "Paver Edging", priceModifier: 500, scopeAddition: "Install paver soldier course edging along beds." },
              { value: "plastic", label: "Plastic Edging", priceModifier: 150, scopeAddition: "Install plastic landscape edging along bed borders." },
              { value: "none", label: "No Edging", priceModifier: 0, scopeAddition: "No formal edging installed; natural bed edge maintained." }
            ]
          },
          {
            id: "mulch-type",
            label: "Mulch Type",
            type: "select",
            choices: [
              { value: "hardwood", label: "Hardwood Mulch", priceModifier: 0, scopeAddition: "Apply double-shredded hardwood mulch to all beds." },
              { value: "pine", label: "Pine Bark Mulch", priceModifier: 50, scopeAddition: "Apply pine bark mulch to all beds." },
              { value: "cedar", label: "Cedar Mulch", priceModifier: 150, scopeAddition: "Apply cedar mulch to all beds for insect resistance." },
              { value: "rubber", label: "Rubber Mulch", priceModifier: 300, scopeAddition: "Apply rubber mulch to all beds for long-lasting coverage." }
            ]
          }
        ]
      },
      {
        id: "tree-work",
        name: "Tree Work – Planting / Removal / Trimming",
        basePriceRange: { low: 400, high: 3500 },
        estimatedDays: { low: 1, high: 3 },
        warranty: "1-year warranty on planted trees (with proper care). No warranty on removal or trimming.",
        exclusions: [
          "Trees over 50 feet tall",
          "Hazardous tree removal near power lines",
          "Stump grinding below grade level",
          "Permit fees for protected tree species"
        ],
        baseScope: [
          "Evaluate tree condition and discuss work scope with homeowner.",
          "Set up safety barriers and protect surrounding landscaping.",
          "Perform tree work as specified in service type.",
          "Chip and remove all branches and debris from site.",
          "Clean up all work areas thoroughly.",
          "Provide care instructions for planted trees."
        ],
        options: [
          {
            id: "tree-service",
            label: "Tree Service Type",
            type: "select",
            choices: [
              { value: "plant-small", label: "Plant Small Tree (under 8 ft)", priceModifier: 0, scopeAddition: "Plant small tree with proper root flare exposure, stake, and mulch ring." },
              { value: "plant-large", label: "Plant Large Tree (8-15 ft)", priceModifier: 500, scopeAddition: "Plant large tree with proper root flare, guy wires, and mulch ring." },
              { value: "removal", label: "Tree Removal", priceModifier: 800, scopeAddition: "Remove tree including trunk and major branches; leave stump at grade." },
              { value: "trim", label: "Tree Trimming / Pruning", priceModifier: 0, scopeAddition: "Trim and prune tree per ISA standards; remove deadwood and shape canopy." },
              { value: "stump-grinding", label: "Stump Grinding", priceModifier: 200, scopeAddition: "Grind stump to 6 inches below grade and backfill with soil." }
            ]
          }
        ]
      },
      {
        id: "hardscape-patio",
        name: "Hardscape – Patio / Walkway",
        basePriceRange: { low: 4000, high: 15000 },
        estimatedDays: { low: 3, high: 7 },
        warranty: "2-year warranty on workmanship. Paver manufacturer warranty applies to materials.",
        exclusions: [
          "Retaining walls over 2 feet",
          "Major drainage correction",
          "Covered structures or pergolas",
          "Electrical or gas line installation"
        ],
        baseScope: [
          "Call 811 for utility location prior to excavation.",
          "Lay out patio or walkway area with stakes and string.",
          "Excavate to proper depth for base material and pavers.",
          "Compact subgrade and install geotextile fabric.",
          "Install and compact crushed stone base (4-6 inches).",
          "Install and screed sand setting bed (1 inch).",
          "Install pavers in selected pattern with proper spacing.",
          "Cut pavers at edges with wet saw for clean fit.",
          "Install edge restraints to secure perimeter.",
          "Apply polymeric sand and compact pavers.",
          "Clean excess sand and seal if specified.",
          "Final cleanup and debris removal."
        ],
        options: [
          {
            id: "hardscape-type",
            label: "Hardscape Type",
            type: "select",
            choices: [
              { value: "paver-patio", label: "Paver Patio", priceModifier: 0, scopeAddition: "Install paver patio with compacted base and polymeric sand joints." },
              { value: "concrete-patio", label: "Concrete Patio", priceModifier: -1000, scopeAddition: "Pour concrete patio with proper slope, control joints, and broom finish." },
              { value: "overlay", label: "Paver Overlay on Concrete", priceModifier: -500, scopeAddition: "Install thin pavers over existing concrete surface with adhesive." },
              { value: "paver-walkway", label: "Paver Walkway", priceModifier: -2000, scopeAddition: "Install paver walkway (3-4 feet wide) with compacted base." },
              { value: "stepping-stones", label: "Stepping Stone Path", priceModifier: -2500, scopeAddition: "Install stepping stones in gravel or groundcover bed." },
              { value: "gravel-path", label: "Gravel Path", priceModifier: -3000, scopeAddition: "Install gravel path with steel edging and landscape fabric." }
            ]
          },
          {
            id: "fire-pit",
            label: "Add Fire Pit",
            type: "boolean",
            priceModifier: 2500,
            scopeAddition: "Install built-in fire pit with paver or stone surround and fire ring."
          },
          {
            id: "seating-wall",
            label: "Add Seating Wall",
            type: "boolean",
            priceModifier: 3000,
            scopeAddition: "Build low seating wall (18-20 inches) with matching block and cap stones."
          }
        ]
      },
      {
        id: "hardscape-retaining",
        name: "Hardscape – Retaining Wall",
        basePriceRange: { low: 3500, high: 12000 },
        estimatedDays: { low: 3, high: 6 },
        warranty: "2-year warranty on workmanship. Block manufacturer warranty applies to materials.",
        exclusions: [
          "Walls over 4 feet requiring engineering",
          "Permit fees",
          "Major excavation or fill material",
          "Drainage system beyond wall base"
        ],
        baseScope: [
          "Call 811 for utility location prior to excavation.",
          "Stake and mark wall location and grade.",
          "Excavate trench for base course below frost line.",
          "Compact subgrade and install crushed stone base.",
          "Set first course level and backfill with drainage gravel.",
          "Install subsequent courses with proper setback.",
          "Install geogrid reinforcement at specified intervals.",
          "Backfill behind wall with drainage gravel as wall rises.",
          "Install perforated drain pipe at base of wall.",
          "Install cap stones with adhesive.",
          "Backfill and compact soil behind wall.",
          "Final grading and cleanup."
        ],
        options: [
          {
            id: "wall-type",
            label: "Wall Type",
            type: "select",
            choices: [
              { value: "block", label: "Segmental Block Wall", priceModifier: 0, scopeAddition: "Build retaining wall using interlocking segmental block system." },
              { value: "timber", label: "Timber Wall", priceModifier: -500, scopeAddition: "Build retaining wall using pressure-treated landscape timbers." },
              { value: "stone", label: "Natural Stone Wall", priceModifier: 1500, scopeAddition: "Build retaining wall using natural stone (dry-stack or mortared)." }
            ]
          },
          {
            id: "wall-height",
            label: "Wall Height",
            type: "select",
            choices: [
              { value: "2ft", label: "Up to 2 Feet", priceModifier: 0, scopeAddition: "Build wall up to 2 feet in exposed height." },
              { value: "3ft", label: "Up to 3 Feet", priceModifier: 800, scopeAddition: "Build wall up to 3 feet in exposed height." },
              { value: "4ft", label: "Up to 4 Feet", priceModifier: 1800, scopeAddition: "Build wall up to 4 feet in exposed height (maximum without engineering)." },
              { value: "6ft", label: "Up to 6 Feet (Engineered)", priceModifier: 4000, scopeAddition: "Build engineered wall up to 6 feet (permit and engineering required)." }
            ]
          }
        ]
      },
      {
        id: "xeriscape",
        name: "Gravel / Rock / Xeriscape Conversion",
        basePriceRange: { low: 3000, high: 10000 },
        estimatedDays: { low: 2, high: 5 },
        warranty: "1-year warranty on installed plants. No warranty on rock or gravel materials.",
        exclusions: [
          "Irrigation removal or modification",
          "Major grading",
          "Fence or hardscape installation",
          "Tree removal"
        ],
        baseScope: [
          "Remove existing lawn, plants, and debris as specified.",
          "Grade area for proper drainage away from structures.",
          "Install professional-grade weed barrier fabric.",
          "Install steel or aluminum edging at all borders.",
          "Spread and level rock or gravel material (2-3 inch depth).",
          "Install drought-tolerant plants per design.",
          "Install decorative boulders or accent stones as specified.",
          "Clean up all work areas and debris.",
          "Provide care guide for drought-tolerant plants."
        ],
        options: [
          {
            id: "cover-type",
            label: "Ground Cover Type",
            type: "select",
            choices: [
              { value: "gravel", label: "Pea Gravel", priceModifier: 0, scopeAddition: "Install pea gravel ground cover in specified areas." },
              { value: "river-rock", label: "River Rock", priceModifier: 300, scopeAddition: "Install river rock ground cover (1-3 inch size)." },
              { value: "decomposed-granite", label: "Decomposed Granite", priceModifier: 200, scopeAddition: "Install decomposed granite ground cover (compacts for firmer surface)." },
              { value: "lava-rock", label: "Lava Rock", priceModifier: 250, scopeAddition: "Install lava rock ground cover for distinctive appearance." }
            ]
          },
          {
            id: "weed-barrier",
            label: "Premium Weed Barrier",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Upgrade to commercial-grade woven weed barrier with 20-year rating."
          },
          {
            id: "boulder-accents",
            label: "Boulder Accents",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Install decorative boulders (3-5 stones) as focal points in landscape."
          }
        ]
      },
      {
        id: "drainage",
        name: "Drainage Correction Only",
        basePriceRange: { low: 2000, high: 8000 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "2-year warranty on drainage workmanship.",
        exclusions: [
          "Foundation repair",
          "Sump pump electrical work",
          "Landscape restoration beyond trench repair",
          "Gutter or downspout work"
        ],
        baseScope: [
          "Evaluate property drainage patterns and identify problem areas.",
          "Call 811 for utility location prior to excavation.",
          "Excavate trenches with proper slope toward outlet.",
          "Install drainage solution per specifications.",
          "Backfill trenches and compact soil.",
          "Restore disturbed lawn areas with seed or sod.",
          "Test drainage system with water flow.",
          "Clean up all work areas and debris."
        ],
        options: [
          {
            id: "drainage-type",
            label: "Drainage Type",
            type: "select",
            choices: [
              { value: "french-drain", label: "French Drain", priceModifier: 0, scopeAddition: "Install French drain with perforated pipe, gravel, and filter fabric." },
              { value: "channel-drain", label: "Channel Drain", priceModifier: 500, scopeAddition: "Install surface channel drain with grate for patio or driveway drainage." },
              { value: "dry-creek", label: "Dry Creek Bed", priceModifier: 800, scopeAddition: "Install decorative dry creek bed with river rock and landscape fabric." },
              { value: "sump-pump", label: "Sump Pump Basin", priceModifier: 1200, scopeAddition: "Install sump pump basin with pump and discharge line (electrical by others)." },
              { value: "grading", label: "Regrading Only", priceModifier: -500, scopeAddition: "Regrade soil to correct drainage slope away from foundation." }
            ]
          }
        ]
      },
      {
        id: "irrigation-install",
        name: "Irrigation System Install / Upgrade",
        basePriceRange: { low: 3500, high: 9000 },
        estimatedDays: { low: 2, high: 5 },
        warranty: "2-year warranty on workmanship. Manufacturer warranty on components.",
        exclusions: [
          "Backflow preventer permit (if required)",
          "Water meter upgrade",
          "Trenching through concrete or asphalt",
          "Smart home integration beyond controller"
        ],
        baseScope: [
          "Design irrigation layout based on plant water needs and sun exposure.",
          "Call 811 for utility location prior to trenching.",
          "Connect to existing water supply with backflow preventer.",
          "Trench and install main line and lateral lines.",
          "Install zone valves in valve box(es).",
          "Install sprinkler heads and drip emitters per zone.",
          "Install irrigation controller at designated location.",
          "Program controller with appropriate watering schedule.",
          "Test all zones and adjust head coverage.",
          "Backfill trenches and restore lawn areas.",
          "Demonstrate system operation to homeowner."
        ],
        options: [
          {
            id: "irrigation-scope",
            label: "Irrigation Scope",
            type: "select",
            choices: [
              { value: "new-full", label: "New Full System", priceModifier: 0, scopeAddition: "Install complete new irrigation system with full property coverage." },
              { value: "new-partial", label: "New Partial System", priceModifier: -1500, scopeAddition: "Install irrigation for front yard or back yard only." },
              { value: "add-zones", label: "Add Zones to Existing", priceModifier: -2000, scopeAddition: "Add new zones to existing irrigation system." },
              { value: "drip-conversion", label: "Drip Conversion", priceModifier: -2500, scopeAddition: "Convert existing spray zones to drip irrigation for water savings." },
              { value: "controller-standard", label: "Controller Upgrade (Standard)", priceModifier: -2800, scopeAddition: "Replace existing controller with new standard multi-zone controller." },
              { value: "controller-smart", label: "Controller Upgrade (Smart)", priceModifier: -2500, scopeAddition: "Replace existing controller with WiFi-enabled smart controller." }
            ]
          }
        ]
      },
      {
        id: "irrigation-repair",
        name: "Irrigation Repair Only",
        basePriceRange: { low: 150, high: 600 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "90-day warranty on repairs.",
        exclusions: [
          "Major line breaks requiring excavation",
          "Backflow preventer replacement",
          "Full system winterization",
          "Well pump issues"
        ],
        baseScope: [
          "Diagnose irrigation system issue.",
          "Turn off water supply to system.",
          "Perform repair as specified.",
          "Test repaired zone for proper operation.",
          "Adjust head spray pattern and coverage as needed.",
          "Turn system back on and verify all zones.",
          "Clean up work area."
        ],
        options: [
          {
            id: "repair-type",
            label: "Repair Type",
            type: "select",
            choices: [
              { value: "heads", label: "Replace Sprinkler Heads", priceModifier: 0, scopeAddition: "Replace broken or clogged sprinkler heads (up to 5 heads)." },
              { value: "valves", label: "Repair Zone Valve", priceModifier: 75, scopeAddition: "Repair or replace malfunctioning zone valve." },
              { value: "pipes", label: "Repair Pipe Break", priceModifier: 100, scopeAddition: "Locate and repair pipe break with compression fitting." },
              { value: "controller", label: "Controller Troubleshoot", priceModifier: 50, scopeAddition: "Troubleshoot and repair controller programming or wiring issue." },
              { value: "winterize", label: "Winterization", priceModifier: 75, scopeAddition: "Blow out irrigation lines with compressed air for winter." }
            ]
          }
        ]
      },
      {
        id: "fence-new",
        name: "Fence Install – New",
        basePriceRange: { low: 4500, high: 12000 },
        estimatedDays: { low: 2, high: 5 },
        warranty: "1-year warranty on workmanship. Material warranties vary by fence type.",
        exclusions: [
          "Permit fees",
          "Survey if property lines disputed",
          "Rock drilling for post holes",
          "Gate automation or smart locks"
        ],
        baseScope: [
          "Call 811 for utility location prior to digging.",
          "Lay out fence line per property survey or agreement.",
          "Set corner and end posts in concrete footings (24-inch depth).",
          "Set line posts at proper spacing in concrete.",
          "Allow concrete to cure minimum 24 hours.",
          "Install horizontal rails between posts.",
          "Attach fence panels or pickets with exterior-grade fasteners.",
          "Install post caps on all posts.",
          "Build and hang gate(s) with appropriate hardware.",
          "Install gate latch and self-closing hinges.",
          "Clean up all debris and excess materials.",
          "Final walkthrough and gate adjustment."
        ],
        options: [
          {
            id: "fence-type",
            label: "Fence Type",
            type: "select",
            choices: [
              { value: "wood-standard", label: "Wood – Standard Privacy", priceModifier: 0, scopeAddition: "Install standard wood privacy fence with dog-ear pickets." },
              { value: "wood-board-on-board", label: "Wood – Board on Board", priceModifier: 800, scopeAddition: "Install board-on-board wood fence for full privacy from both sides." },
              { value: "horizontal-wood", label: "Wood – Horizontal Slat", priceModifier: 1200, scopeAddition: "Install modern horizontal slat wood fence." },
              { value: "wrought-iron", label: "Wrought Iron", priceModifier: 3000, scopeAddition: "Install ornamental wrought iron fence with decorative elements." },
              { value: "vinyl", label: "Vinyl Privacy", priceModifier: 1500, scopeAddition: "Install vinyl privacy fence panels (maintenance-free)." },
              { value: "chain-link", label: "Chain Link", priceModifier: -2000, scopeAddition: "Install galvanized chain link fence with top rail." },
              { value: "ranch", label: "Ranch / Split Rail", priceModifier: -1000, scopeAddition: "Install split rail or ranch-style fence (not privacy)." },
              { value: "composite", label: "Composite", priceModifier: 2500, scopeAddition: "Install composite fence panels (wood-look, low maintenance)." },
              { value: "masonry", label: "Masonry / Brick Columns", priceModifier: 5000, scopeAddition: "Install masonry columns with fence panels between." }
            ]
          },
          {
            id: "fence-height",
            label: "Fence Height",
            type: "select",
            choices: [
              { value: "4ft", label: "4 Feet", priceModifier: -500, scopeAddition: "Install 4-foot tall fence." },
              { value: "6ft", label: "6 Feet", priceModifier: 0, scopeAddition: "Install standard 6-foot tall fence." },
              { value: "8ft", label: "8 Feet", priceModifier: 1500, scopeAddition: "Install 8-foot tall fence for maximum privacy." }
            ]
          },
          {
            id: "gate-options",
            label: "Gate Options",
            type: "select",
            choices: [
              { value: "none", label: "No Gate", priceModifier: 0, scopeAddition: "No gate included in fence installation." },
              { value: "walk-gate", label: "Single Walk Gate", priceModifier: 350, scopeAddition: "Install single walk gate (3-4 feet wide) with latch and hinges." },
              { value: "double-gate", label: "Double Drive Gate", priceModifier: 750, scopeAddition: "Install double drive gate (6-8 feet wide) for vehicle access." },
              { value: "both", label: "Walk Gate + Double Gate", priceModifier: 1000, scopeAddition: "Install both walk gate and double drive gate." }
            ]
          },
          {
            id: "finish",
            label: "Finish Option",
            type: "select",
            choices: [
              { value: "none", label: "No Finish (Natural)", priceModifier: 0, scopeAddition: "Leave fence natural or as-manufactured." },
              { value: "stain-seal", label: "Stain & Seal", priceModifier: 800, scopeAddition: "Apply exterior stain and sealer to entire fence." },
              { value: "paint", label: "Paint", priceModifier: 1000, scopeAddition: "Prime and paint entire fence (2 coats)." }
            ]
          },
          {
            id: "decorative-top",
            label: "Decorative Top Rail",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Add decorative lattice or trim top to fence for enhanced appearance."
          }
        ]
      },
      {
        id: "fence-replace",
        name: "Fence Replacement",
        basePriceRange: { low: 4000, high: 10000 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "1-year warranty on workmanship. Material warranties vary by fence type.",
        exclusions: [
          "Permit fees",
          "Survey if property lines disputed",
          "Rock drilling for post holes",
          "Gate automation"
        ],
        baseScope: [
          "Remove existing fence panels, posts, and concrete footings.",
          "Dispose of all old fence materials off-site.",
          "Call 811 for utility location if new post locations needed.",
          "Set new posts in concrete footings at proper spacing.",
          "Allow concrete to cure minimum 24 hours.",
          "Install horizontal rails between posts.",
          "Attach fence panels or pickets with exterior-grade fasteners.",
          "Install post caps on all posts.",
          "Build and hang gate(s) with appropriate hardware.",
          "Clean up all debris and excess materials.",
          "Final walkthrough and adjustment."
        ],
        options: [
          {
            id: "fence-type",
            label: "Fence Type",
            type: "select",
            choices: [
              { value: "wood-standard", label: "Wood – Standard Privacy", priceModifier: 0, scopeAddition: "Install standard wood privacy fence with dog-ear pickets." },
              { value: "wood-board-on-board", label: "Wood – Board on Board", priceModifier: 800, scopeAddition: "Install board-on-board wood fence for full privacy from both sides." },
              { value: "horizontal-wood", label: "Wood – Horizontal Slat", priceModifier: 1200, scopeAddition: "Install modern horizontal slat wood fence." },
              { value: "wrought-iron", label: "Wrought Iron", priceModifier: 3000, scopeAddition: "Install ornamental wrought iron fence with decorative elements." },
              { value: "vinyl", label: "Vinyl Privacy", priceModifier: 1500, scopeAddition: "Install vinyl privacy fence panels (maintenance-free)." },
              { value: "chain-link", label: "Chain Link", priceModifier: -2000, scopeAddition: "Install galvanized chain link fence with top rail." },
              { value: "ranch", label: "Ranch / Split Rail", priceModifier: -1000, scopeAddition: "Install split rail or ranch-style fence (not privacy)." },
              { value: "composite", label: "Composite", priceModifier: 2500, scopeAddition: "Install composite fence panels (wood-look, low maintenance)." },
              { value: "masonry", label: "Masonry / Brick Columns", priceModifier: 5000, scopeAddition: "Install masonry columns with fence panels between." }
            ]
          },
          {
            id: "fence-height",
            label: "Fence Height",
            type: "select",
            choices: [
              { value: "4ft", label: "4 Feet", priceModifier: -500, scopeAddition: "Install 4-foot tall fence." },
              { value: "6ft", label: "6 Feet", priceModifier: 0, scopeAddition: "Install standard 6-foot tall fence." },
              { value: "8ft", label: "8 Feet", priceModifier: 1500, scopeAddition: "Install 8-foot tall fence for maximum privacy." }
            ]
          },
          {
            id: "removal-haul",
            label: "Old Fence Removal & Haul",
            type: "boolean",
            priceModifier: 0,
            scopeAddition: "Remove and haul away all existing fence materials (included in base price)."
          },
          {
            id: "gate-options",
            label: "Gate Options",
            type: "select",
            choices: [
              { value: "none", label: "No Gate", priceModifier: 0, scopeAddition: "No gate included in fence installation." },
              { value: "walk-gate", label: "Single Walk Gate", priceModifier: 350, scopeAddition: "Install single walk gate (3-4 feet wide) with latch and hinges." },
              { value: "double-gate", label: "Double Drive Gate", priceModifier: 750, scopeAddition: "Install double drive gate (6-8 feet wide) for vehicle access." },
              { value: "both", label: "Walk Gate + Double Gate", priceModifier: 1000, scopeAddition: "Install both walk gate and double drive gate." }
            ]
          },
          {
            id: "finish",
            label: "Finish Option",
            type: "select",
            choices: [
              { value: "none", label: "No Finish (Natural)", priceModifier: 0, scopeAddition: "Leave fence natural or as-manufactured." },
              { value: "stain-seal", label: "Stain & Seal", priceModifier: 800, scopeAddition: "Apply exterior stain and sealer to entire fence." },
              { value: "paint", label: "Paint", priceModifier: 1000, scopeAddition: "Prime and paint entire fence (2 coats)." }
            ]
          }
        ]
      },
      {
        id: "fence-repair",
        name: "Fence Repair Only",
        basePriceRange: { low: 300, high: 1500 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "90-day warranty on repairs.",
        exclusions: [
          "Full fence replacement",
          "Storm damage requiring insurance claim",
          "Gate automation",
          "Painting or staining entire fence"
        ],
        baseScope: [
          "Evaluate fence damage and determine repair scope.",
          "Remove damaged posts, panels, or sections as needed.",
          "Set replacement posts in concrete if required.",
          "Install replacement rails or pickets to match existing.",
          "Secure all components with exterior-grade fasteners.",
          "Adjust gate operation if affected.",
          "Clean up all debris.",
          "Apply finish to repaired sections if specified."
        ],
        options: [
          {
            id: "repair-scope",
            label: "Repair Scope",
            type: "select",
            choices: [
              { value: "posts-only", label: "Post Repair/Replace", priceModifier: 0, scopeAddition: "Replace damaged or rotted fence posts (up to 3 posts)." },
              { value: "panels-only", label: "Panel/Picket Repair", priceModifier: -100, scopeAddition: "Replace damaged fence panels or pickets (up to 2 sections)." },
              { value: "section", label: "Section Replacement", priceModifier: 200, scopeAddition: "Replace complete fence section including posts, rails, and pickets." },
              { value: "gate-repair", label: "Gate Repair", priceModifier: 50, scopeAddition: "Repair gate sag, latch, or hinge issues." }
            ]
          },
          {
            id: "finish",
            label: "Finish Option",
            type: "select",
            choices: [
              { value: "none", label: "No Finish", priceModifier: 0, scopeAddition: "Leave repairs unfinished to weather naturally." },
              { value: "stain-seal", label: "Stain & Seal Repairs", priceModifier: 150, scopeAddition: "Apply stain and sealer to repaired sections only." },
              { value: "paint", label: "Paint Repairs", priceModifier: 200, scopeAddition: "Prime and paint repaired sections to match existing." }
            ]
          }
        ]
      },
      {
        id: "gate-install",
        name: "Gate Install / Replacement",
        basePriceRange: { low: 500, high: 2500 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "1-year warranty on gate installation and hardware.",
        exclusions: [
          "Fence modification beyond gate opening",
          "Gate automation or electric openers",
          "Masonry or brick column work",
          "Permit fees"
        ],
        baseScope: [
          "Evaluate existing fence and gate opening.",
          "Remove old gate and hardware if replacing.",
          "Reinforce or replace gate posts if needed.",
          "Build or install new gate to fit opening.",
          "Install heavy-duty hinges rated for gate size.",
          "Install latch and any additional hardware.",
          "Adjust gate for proper swing and clearance.",
          "Test gate operation and make final adjustments."
        ],
        options: [
          {
            id: "gate-type",
            label: "Gate Type",
            type: "select",
            choices: [
              { value: "walk-gate", label: "Walk Gate (3-4 ft)", priceModifier: 0, scopeAddition: "Install single walk gate for pedestrian access." },
              { value: "double-drive", label: "Double Drive Gate (6-8 ft)", priceModifier: 600, scopeAddition: "Install double drive gate for vehicle or equipment access." },
              { value: "automatic", label: "Automatic Swing Gate", priceModifier: 1500, scopeAddition: "Install automatic swing gate with electric opener and remote." }
            ]
          },
          {
            id: "gate-material",
            label: "Gate Material",
            type: "select",
            choices: [
              { value: "match-existing", label: "Match Existing Fence", priceModifier: 0, scopeAddition: "Build gate to match existing fence material and style." },
              { value: "wood", label: "Wood", priceModifier: 0, scopeAddition: "Build wood gate with steel frame for durability." },
              { value: "iron", label: "Wrought Iron", priceModifier: 500, scopeAddition: "Install decorative wrought iron gate." },
              { value: "vinyl", label: "Vinyl", priceModifier: 200, scopeAddition: "Install vinyl gate to match vinyl fence." }
            ]
          }
        ]
      },
      {
        id: "yard-cleanup",
        name: "One-Time Yard Cleanup",
        basePriceRange: { low: 350, high: 1200 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "No warranty on cleanup services.",
        exclusions: [
          "Tree removal or major trimming",
          "Fence repair",
          "Irrigation work",
          "Ongoing maintenance"
        ],
        baseScope: [
          "Clear all leaves and debris from lawn and beds.",
          "Edge all bed borders and sidewalks.",
          "Prune overgrown shrubs (light trimming only).",
          "Remove dead plants and spent annuals.",
          "Weed all planting beds.",
          "Rake and level lawn areas.",
          "Blow off all hard surfaces.",
          "Haul away all debris (if included)."
        ],
        options: [
          {
            id: "cleanup-scope",
            label: "Cleanup Scope",
            type: "select",
            choices: [
              { value: "basic", label: "Basic Cleanup", priceModifier: 0, scopeAddition: "Basic cleanup: mow, edge, blow, and light weeding." },
              { value: "full", label: "Full Cleanup", priceModifier: 300, scopeAddition: "Full cleanup: mow, edge, blow, prune shrubs, weed all beds, and mulch touch-up." },
              { value: "heavy-brush", label: "Heavy Brush Clearing", priceModifier: 500, scopeAddition: "Heavy cleanup: clear overgrown brush, vines, and accumulated debris." }
            ]
          },
          {
            id: "debris-haul",
            label: "Debris Haul-Away",
            type: "boolean",
            priceModifier: 0,
            scopeAddition: "Haul away all debris from cleanup (included in base price)."
          }
        ]
      },
      {
        id: "maintenance",
        name: "Recurring Maintenance (Mowing / Beds)",
        basePriceRange: { low: 150, high: 400 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Satisfaction guaranteed on each visit.",
        exclusions: [
          "Major pruning or tree work",
          "Irrigation repairs",
          "Pest or disease treatment",
          "Seasonal plantings"
        ],
        baseScope: [
          "Mow lawn at appropriate height for grass type.",
          "Edge along sidewalks, driveways, and beds.",
          "String trim around obstacles and fence lines.",
          "Blow clippings off all hard surfaces.",
          "Spot-weed visible weeds in beds (service level dependent).",
          "Check for obvious issues and report to homeowner."
        ],
        options: [
          {
            id: "service-level",
            label: "Service Level",
            type: "select",
            choices: [
              { value: "basic-mowing", label: "Basic Mowing Only", priceModifier: 0, scopeAddition: "Mow, edge, string trim, and blow; beds not included." },
              { value: "mowing-beds", label: "Mowing + Bed Care", priceModifier: 100, scopeAddition: "Mow, edge, trim, blow, plus weed beds and refresh mulch as needed." },
              { value: "full-service", label: "Full Service", priceModifier: 200, scopeAddition: "Complete lawn and bed care: mow, edge, trim, blow, weed, prune shrubs, and seasonal fertilization." }
            ]
          }
        ]
      }
    ]
  },
  {
    id: "windows-doors",
    trade: "Windows & Doors",
    jobTypes: [
      {
        id: "window-replacement",
        name: "Window Replacement",
        basePriceRange: { low: 450, high: 1200 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Window warranty per manufacturer (20-lifetime). 2-year labor warranty.",
        exclusions: ["Structural modifications", "Siding repair beyond trim", "Interior casing replacement"],
        baseScope: [
          "Remove existing window sash and frame (insert method).",
          "Inspect rough opening for damage or rot.",
          "Clean and prep opening for new window.",
          "Dry-fit new window and check for level/plumb.",
          "Apply waterproof membrane at sill and jambs.",
          "Set window in opening; shim for level and plumb.",
          "Secure window with screws through frame.",
          "Insulate gap between window and framing.",
          "Apply exterior caulk at all joints.",
          "Install interior trim pieces.",
          "Clean glass and hardware.",
          "Test window operation and locks."
        ],
        options: [
          {
            id: "window-style",
            label: "Window Style",
            type: "select",
            choices: [
              { value: "double-hung", label: "Double-Hung", priceModifier: 0, scopeAddition: "Install double-hung window with tilt-in sashes." },
              { value: "casement", label: "Casement", priceModifier: 150, scopeAddition: "Install casement window with crank operator." },
              { value: "picture", label: "Picture/Fixed", priceModifier: -100, scopeAddition: "Install fixed picture window (non-operable)." }
            ]
          },
          {
            id: "triple-pane",
            label: "Triple-Pane Glass Upgrade",
            type: "boolean",
            priceModifier: 200,
            scopeAddition: "Upgrade to triple-pane glass for enhanced energy efficiency."
          },
          {
            id: "interior-trim",
            label: "New Interior Casing",
            type: "boolean",
            priceModifier: 125,
            scopeAddition: "Install new interior window casing and sill to match existing style."
          }
        ]
      },
      {
        id: "entry-door",
        name: "Entry Door Replacement",
        basePriceRange: { low: 1800, high: 4500 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "Door warranty per manufacturer. 2-year labor warranty.",
        exclusions: ["Sidelight replacement", "Transom installation", "Security system integration"],
        baseScope: [
          "Remove existing door, frame, and hardware.",
          "Inspect rough opening and repair any rot.",
          "Install new door frame with proper flashing.",
          "Set and shim door for level and plumb.",
          "Secure frame with screws through shims.",
          "Insulate gap around frame.",
          "Install weatherstripping at all contact points.",
          "Install new threshold with proper seal.",
          "Install new lockset, deadbolt, and hinges.",
          "Install door sweep at bottom.",
          "Apply exterior caulk at frame joints.",
          "Install interior and exterior trim.",
          "Adjust door for proper closure and latch.",
          "Test all locks and hardware."
        ],
        options: [
          {
            id: "door-material",
            label: "Door Material",
            type: "select",
            choices: [
              { value: "steel", label: "Steel (Insulated)", priceModifier: 0, scopeAddition: "Install insulated steel entry door." },
              { value: "fiberglass", label: "Fiberglass", priceModifier: 400, scopeAddition: "Install fiberglass entry door with wood-grain texture." },
              { value: "wood", label: "Solid Wood", priceModifier: 1200, scopeAddition: "Install solid wood entry door with weatherproof finish." }
            ]
          },
          {
            id: "smart-lock",
            label: "Smart Lock Installation",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Install smart deadbolt with keypad and smartphone connectivity."
          },
          {
            id: "glass-insert",
            label: "Decorative Glass Insert",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Install decorative glass insert panel in door."
          }
        ]
      },
      {
        id: "patio-door",
        name: "Sliding Patio Door Replacement",
        basePriceRange: { low: 2200, high: 4500 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "Door warranty per manufacturer. 2-year labor warranty.",
        exclusions: ["Structural header modifications", "Deck/patio repair", "Blinds/shades"],
        baseScope: [
          "Remove existing sliding door and frame.",
          "Inspect rough opening for damage.",
          "Clean and prep opening.",
          "Install new frame with proper flashing tape.",
          "Set and level door frame.",
          "Secure frame with appropriate fasteners.",
          "Insulate perimeter gap.",
          "Install exterior trim and caulk.",
          "Install interior casing.",
          "Adjust rollers for smooth operation.",
          "Install screen door.",
          "Test lock and handle operation.",
          "Clean glass panels."
        ],
        options: [
          {
            id: "door-size",
            label: "Door Size",
            type: "select",
            choices: [
              { value: "6ft", label: "6-Foot Standard", priceModifier: 0 },
              { value: "8ft", label: "8-Foot Wide", priceModifier: 600, scopeAddition: "Install wider 8-foot sliding door system." },
              { value: "12ft", label: "12-Foot (4-panel)", priceModifier: 1800, scopeAddition: "Install 12-foot 4-panel sliding door system." }
            ]
          },
          {
            id: "blinds-between-glass",
            label: "Blinds Between Glass",
            type: "boolean",
            priceModifier: 350,
            scopeAddition: "Upgrade to door with integrated blinds between glass panes."
          }
        ]
      }
    ]
  },
  {
    id: "drywall",
    trade: "Drywall & Texture",
    jobTypes: [
      {
        id: "drywall-repair",
        name: "Drywall Repair & Patching",
        basePriceRange: { low: 250, high: 650 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "1-year warranty on repairs.",
        exclusions: ["Mold remediation", "Plumbing/electrical repairs", "Large-scale replacement"],
        baseScope: [
          "Assess damage and determine repair method.",
          "Cut out damaged drywall to solid edges.",
          "Install backing support if needed.",
          "Cut and fit new drywall patch.",
          "Secure patch with drywall screws.",
          "Apply mesh tape at all seams.",
          "Apply three coats of joint compound with sanding between.",
          "Feather edges to blend with existing wall.",
          "Prime repaired area.",
          "Match existing wall texture (if applicable).",
          "Sand and prep for paint.",
          "Clean up all debris."
        ],
        options: [
          {
            id: "multiple-repairs",
            label: "Additional Repairs (2-4 locations)",
            type: "boolean",
            priceModifier: 200,
            scopeAddition: "Repair multiple small holes/damaged areas in same visit."
          },
          {
            id: "texture-match",
            label: "Texture Matching",
            type: "boolean",
            priceModifier: 150,
            scopeAddition: "Match existing wall texture (knockdown, orange peel, skip trowel)."
          },
          {
            id: "prime-paint",
            label: "Prime & Paint Repair Area",
            type: "boolean",
            priceModifier: 125,
            scopeAddition: "Apply primer and paint to repaired area to match existing wall color."
          }
        ]
      },
      {
        id: "drywall-install",
        name: "Drywall Installation (New Construction)",
        basePriceRange: { low: 2500, high: 5500 },
        estimatedDays: { low: 3, high: 6 },
        warranty: "1-year warranty on installation.",
        exclusions: ["Framing modifications", "Electrical/plumbing rough-in", "Painting"],
        baseScope: [
          "Measure and calculate drywall needs.",
          "Deliver drywall materials to work area.",
          "Mark stud and joist locations.",
          "Hang ceiling drywall first using lift.",
          "Hang wall drywall with proper stagger pattern.",
          "Cut around outlets, switches, and fixtures.",
          "Secure all panels with drywall screws.",
          "Apply paper tape at all flat seams.",
          "Apply corner bead at outside corners.",
          "Apply three coats of mud with sanding between.",
          "Sand smooth to Level 4 finish (Level 5 optional).",
          "Clean up all debris and dust.",
          "Inspect and touch up as needed."
        ],
        options: [
          {
            id: "drywall-type",
            label: "Drywall Type",
            type: "select",
            choices: [
              { value: "standard", label: "Standard 1/2\"", priceModifier: 0 },
              { value: "moisture", label: "Moisture-Resistant (Green Board)", priceModifier: 300, scopeAddition: "Use moisture-resistant drywall in applicable areas." },
              { value: "fire-rated", label: "Fire-Rated (Type X)", priceModifier: 250, scopeAddition: "Use Type X fire-rated drywall where required by code." }
            ]
          },
          {
            id: "level-5",
            label: "Level 5 Finish",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Apply skim coat for Level 5 finish (recommended for high-gloss paint)."
          }
        ]
      },
      {
        id: "popcorn-removal",
        name: "Popcorn Ceiling Removal",
        basePriceRange: { low: 1200, high: 2800 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "1-year warranty.",
        exclusions: ["Asbestos testing/abatement", "Painting", "Light fixture reinstallation"],
        baseScope: [
          "Test for asbestos (if not already tested).",
          "Move furniture and cover floors with plastic.",
          "Mask walls and protect surfaces.",
          "Wet ceiling sections to soften texture.",
          "Scrape popcorn texture using drywall knife.",
          "Remove all loose material.",
          "Skim coat ceiling to smooth imperfections.",
          "Apply second coat if needed for smooth finish.",
          "Sand ceiling smooth.",
          "Prime entire ceiling.",
          "Remove all protective materials.",
          "Clean up all debris.",
          "Final inspection for missed areas."
        ],
        options: [
          {
            id: "ceiling-texture",
            label: "New Texture Application",
            type: "select",
            choices: [
              { value: "smooth", label: "Smooth Finish", priceModifier: 0, scopeAddition: "Leave ceiling with smooth finish after removal." },
              { value: "knockdown", label: "Knockdown Texture", priceModifier: 350, scopeAddition: "Apply knockdown texture to ceiling after removal." },
              { value: "orange-peel", label: "Orange Peel Texture", priceModifier: 300, scopeAddition: "Apply orange peel texture to ceiling after removal." }
            ]
          },
          {
            id: "paint-ceiling",
            label: "Paint Ceiling",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Apply two coats of flat ceiling paint after texture work."
          }
        ]
      }
    ]
  },
  {
    id: "concrete",
    trade: "Concrete & Masonry",
    jobTypes: [
      {
        id: "concrete-slab",
        name: "Concrete Slab/Pad Pour",
        basePriceRange: { low: 2500, high: 6500 },
        estimatedDays: { low: 2, high: 4 },
        warranty: "5-year warranty against structural cracking.",
        exclusions: ["Excavation beyond 6\"", "Plumbing/electrical", "Permits"],
        baseScope: [
          "Lay out slab footprint per plan.",
          "Excavate area to 4-6 inch depth.",
          "Compact subgrade to proper density.",
          "Install 4 inches of compacted gravel base.",
          "Set forms to proper grade and level.",
          "Install vapor barrier if required.",
          "Place rebar or wire mesh reinforcement.",
          "Order and receive ready-mix concrete.",
          "Pour concrete and screed to level.",
          "Float surface to desired finish.",
          "Cut control joints at proper intervals.",
          "Apply curing compound.",
          "Remove forms after 24-48 hours.",
          "Backfill edges if needed.",
          "Clean up site and debris."
        ],
        options: [
          {
            id: "slab-thickness",
            label: "Slab Thickness",
            type: "select",
            choices: [
              { value: "4inch", label: "4-Inch Standard", priceModifier: 0 },
              { value: "6inch", label: "6-Inch Heavy Duty", priceModifier: 600, scopeAddition: "Pour 6-inch thick slab for heavier loads." }
            ]
          },
          {
            id: "broom-finish",
            label: "Broom Finish (Non-Slip)",
            type: "boolean",
            priceModifier: 0,
            scopeAddition: "Apply broom finish for non-slip texture."
          },
          {
            id: "stamped-border",
            label: "Stamped Border Design",
            type: "boolean",
            priceModifier: 800,
            scopeAddition: "Apply stamped concrete border pattern around slab perimeter."
          },
          {
            id: "integral-color",
            label: "Integral Color",
            type: "boolean",
            priceModifier: 450,
            scopeAddition: "Add integral color to concrete mix for consistent coloring."
          }
        ]
      },
      {
        id: "concrete-repair",
        name: "Concrete Crack/Spalling Repair",
        basePriceRange: { low: 350, high: 1200 },
        estimatedDays: { low: 1, high: 2 },
        warranty: "2-year warranty on repairs.",
        exclusions: ["Full slab replacement", "Foundation repair", "Structural issues"],
        baseScope: [
          "Assess crack or spalling damage.",
          "Clean crack or damaged area thoroughly.",
          "Chase crack with grinder to create V-groove.",
          "Apply bonding agent to prepared surface.",
          "Fill crack with flexible polyurethane sealant or epoxy.",
          "For spalling: apply concrete patch compound.",
          "Smooth and texture to match existing surface.",
          "Allow proper cure time per product specs.",
          "Apply concrete sealer to repaired area.",
          "Clean up work area."
        ],
        options: [
          {
            id: "sealer-application",
            label: "Full Surface Sealer",
            type: "boolean",
            priceModifier: 250,
            scopeAddition: "Apply penetrating sealer to entire concrete surface."
          },
          {
            id: "leveling",
            label: "Level Uneven Sections",
            type: "boolean",
            priceModifier: 400,
            scopeAddition: "Apply self-leveling compound to correct uneven areas."
          }
        ]
      },
      {
        id: "retaining-wall",
        name: "Block Retaining Wall",
        basePriceRange: { low: 3500, high: 8500 },
        estimatedDays: { low: 3, high: 6 },
        warranty: "5-year warranty on structural integrity.",
        exclusions: ["Engineering for walls over 4ft", "Major drainage systems", "Permits"],
        baseScope: [
          "Lay out wall footprint with stakes and string.",
          "Excavate trench to proper depth for base.",
          "Install geotextile fabric in trench.",
          "Spread and compact 6 inches of gravel base.",
          "Set first course of blocks level and aligned.",
          "Backfill behind first course with drainage gravel.",
          "Stack subsequent courses with proper setback.",
          "Install wall fabric at intervals per engineering.",
          "Backfill with drainage gravel as wall rises.",
          "Install drainage pipe behind wall.",
          "Install cap blocks with adhesive.",
          "Backfill and grade final soil.",
          "Clean wall face of debris.",
          "Final site cleanup."
        ],
        options: [
          {
            id: "wall-height",
            label: "Wall Height",
            type: "select",
            choices: [
              { value: "2ft", label: "Up to 2 Feet", priceModifier: 0 },
              { value: "3ft", label: "2-3 Feet", priceModifier: 1200, scopeAddition: "Build wall 2-3 feet high with additional reinforcement." },
              { value: "4ft", label: "3-4 Feet", priceModifier: 2500, scopeAddition: "Build wall 3-4 feet high with geogrid reinforcement." }
            ]
          },
          {
            id: "block-style",
            label: "Block Style",
            type: "select",
            choices: [
              { value: "standard", label: "Standard Textured", priceModifier: 0, scopeAddition: "Use standard split-face retaining wall block." },
              { value: "natural-stone", label: "Natural Stone Look", priceModifier: 800, scopeAddition: "Use premium natural stone-style blocks." }
            ]
          },
          {
            id: "built-in-steps",
            label: "Built-in Steps",
            type: "boolean",
            priceModifier: 650,
            scopeAddition: "Build integrated steps into retaining wall."
          }
        ]
      }
    ]
  },
  {
    id: "handyman",
    trade: "Handyman & General Repairs",
    jobTypes: [
      {
        id: "general-repairs",
        name: "General Home Repairs (Per Hour)",
        basePriceRange: { low: 150, high: 450 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "30-day warranty on repairs performed.",
        exclusions: ["Specialty trade work requiring license", "Permit work", "Structural modifications"],
        baseScope: [
          "Assess repair needs with homeowner.",
          "Gather tools and materials for tasks.",
          "Complete repair items as discussed.",
          "Test all repaired items for function.",
          "Clean up work area.",
          "Review completed work with homeowner.",
          "Provide recommendations for future maintenance."
        ],
        options: [
          {
            id: "time-block",
            label: "Time Block",
            type: "select",
            choices: [
              { value: "2hr", label: "2-Hour Block", priceModifier: 0, scopeAddition: "2-hour handyman service block." },
              { value: "4hr", label: "Half Day (4 hours)", priceModifier: 200, scopeAddition: "4-hour handyman service block." },
              { value: "8hr", label: "Full Day (8 hours)", priceModifier: 500, scopeAddition: "Full day handyman service (8 hours)." }
            ]
          },
          {
            id: "materials-included",
            label: "Basic Materials Included",
            type: "boolean",
            priceModifier: 75,
            scopeAddition: "Common materials (screws, anchors, caulk, etc.) included."
          }
        ]
      },
      {
        id: "door-hardware",
        name: "Door & Hardware Repairs",
        basePriceRange: { low: 150, high: 350 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year warranty on hardware repairs.",
        exclusions: ["Full door replacement", "Structural frame repair"],
        baseScope: [
          "Inspect door and identify issues.",
          "Tighten or replace loose hinges.",
          "Adjust strike plate for proper latch engagement.",
          "Shim and adjust door for proper fit.",
          "Repair or replace damaged weatherstripping.",
          "Lubricate hinges and lock mechanisms.",
          "Test door operation.",
          "Clean up work area."
        ],
        options: [
          {
            id: "new-lockset",
            label: "New Lockset Installation",
            type: "boolean",
            priceModifier: 125,
            scopeAddition: "Remove old lockset and install new (lockset cost separate)."
          },
          {
            id: "door-sweep",
            label: "New Door Sweep",
            type: "boolean",
            priceModifier: 45,
            scopeAddition: "Install new door sweep at bottom of door."
          },
          {
            id: "doorstop-repair",
            label: "Door Stop Replacement",
            type: "boolean",
            priceModifier: 35,
            scopeAddition: "Replace damaged or missing door stops."
          }
        ]
      },
      {
        id: "ceiling-fan",
        name: "Ceiling Fan Installation",
        basePriceRange: { low: 175, high: 350 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year labor warranty. Fan warranty per manufacturer.",
        exclusions: ["New circuit installation", "Structural ceiling modifications", "High/vaulted ceilings over 12ft"],
        baseScope: [
          "Turn off power at breaker.",
          "Remove existing light fixture or fan.",
          "Verify electrical box is fan-rated.",
          "Assemble new ceiling fan per manufacturer.",
          "Mount fan bracket to electrical box.",
          "Hang fan motor and secure.",
          "Connect wiring (hot, neutral, ground).",
          "Install fan blades.",
          "Install light kit (if applicable).",
          "Restore power and test all speeds.",
          "Test light function and pull chains.",
          "Balance fan if needed.",
          "Clean up packaging and debris."
        ],
        options: [
          {
            id: "remote-control",
            label: "Remote Control Kit",
            type: "boolean",
            priceModifier: 65,
            scopeAddition: "Install wireless remote control for fan and light."
          },
          {
            id: "new-box",
            label: "Fan-Rated Electrical Box",
            type: "boolean",
            priceModifier: 95,
            scopeAddition: "Replace existing box with fan-rated support brace and box."
          },
          {
            id: "downrod-extension",
            label: "Extended Downrod",
            type: "boolean",
            priceModifier: 45,
            scopeAddition: "Install extended downrod for high ceilings."
          }
        ]
      },
      {
        id: "shelving-install",
        name: "Shelving & Storage Installation",
        basePriceRange: { low: 200, high: 550 },
        estimatedDays: { low: 1, high: 1 },
        warranty: "1-year warranty on installation.",
        exclusions: ["Custom cabinetry", "Built-in furniture"],
        baseScope: [
          "Measure and mark shelf locations.",
          "Locate wall studs with stud finder.",
          "Level and install shelf brackets or tracks.",
          "Secure brackets with appropriate fasteners.",
          "Install shelving boards or components.",
          "Check level and adjust as needed.",
          "Test weight capacity.",
          "Clean up installation area."
        ],
        options: [
          {
            id: "shelf-type",
            label: "Shelving Type",
            type: "select",
            choices: [
              { value: "floating", label: "Floating Shelves (2-3)", priceModifier: 0, scopeAddition: "Install 2-3 floating shelves." },
              { value: "wire-closet", label: "Wire Closet System", priceModifier: 150, scopeAddition: "Install wire closet shelving system." },
              { value: "wood-closet", label: "Wood Closet System", priceModifier: 350, scopeAddition: "Install wood closet organization system." }
            ]
          },
          {
            id: "closet-rod",
            label: "Closet Rod Installation",
            type: "boolean",
            priceModifier: 45,
            scopeAddition: "Install closet rod with brackets."
          }
        ]
      }
    ]
  }
];

// Spanish translations for electrical job types
export const electricalJobTypesEs: Record<string, { name: string; baseScope: string[]; warranty?: string; exclusions?: string[]; options: Record<string, { label: string; scopeAddition?: string; choices?: { value: string; label: string; scopeAddition?: string }[] }> }> = {
  "panel-upgrade": {
    name: "Actualización de Panel y Servicio",
    warranty: "Garantía de por vida en el panel. Garantía de 1 año en mano de obra.",
    exclusions: ["Tarifas de la compañía eléctrica por cambio de servicio", "Tarifas de permisos", "Poda de árboles para despeje del servicio"],
    baseScope: [
      "Coordinar corte de energía con la compañía eléctrica.",
      "Desconectar y remover panel eléctrico existente.",
      "Instalar nuevo panel principal de 200 amperios con barras de cobre.",
      "Instalar nuevo interruptor principal y barras de neutro/tierra.",
      "Transferir todos los circuitos existentes a nuevos interruptores AFCI/GFCI donde sea requerido.",
      "Etiquetar todos los circuitos claramente según requisitos NEC.",
      "Instalar nuevo sistema de electrodo de tierra (varillas de tierra y/o tierra Ufer).",
      "Instalar unión adecuada a líneas de gas, agua y CSST.",
      "Restaurar energía y probar todos los circuitos para operación correcta.",
      "Verificar voltaje y amperaje correcto en circuitos principales y derivados.",
      "Proporcionar documentación de cálculo de carga.",
      "Coordinar inspección final (tarifa de permiso por separado)."
    ],
    options: {
      "service-upgrade-type": {
        label: "Tamaño de Servicio Actual",
        choices: [
          { value: "100a", label: "Actualización de 100A a 200A", scopeAddition: "Actualizar de servicio de 100 amperios a 200 amperios." },
          { value: "60a", label: "Actualización de 60A a 200A", scopeAddition: "Actualizar de servicio de 60 amperios a 200 amperios; incluye nuevo cable de entrada de servicio." },
          { value: "fuse-box", label: "Caja de Fusibles a Panel de Interruptores", scopeAddition: "Reemplazar caja de fusibles obsoleta con panel moderno de 200 amperios." }
        ]
      },
      "meter-mast": { label: "Reemplazar Medidor y Mástil", scopeAddition: "Instalar nuevo cabezal de intemperie, mástil, base del medidor y cable de entrada de servicio." },
      "surge-protection": { label: "Protección contra Sobretensiones para Toda la Casa", scopeAddition: "Instalar protector contra sobretensiones para toda la casa en el panel principal." },
      "burned-panel": { label: "Reemplazo de Panel Quemado/Dañado", scopeAddition: "Remover panel dañado por fuego; evaluar y reparar conexiones de cableado afectadas." }
    }
  },
  "rewiring": {
    name: "Recableado Total o Parcial de la Casa",
    warranty: "Garantía de 2 años en mano de obra para todo el cableado. Materiales según garantía del fabricante.",
    exclusions: ["Reparación de paneles de yeso y pintura", "Tarifas de permisos", "Reemplazo de aislamiento"],
    baseScope: [
      "Realizar evaluación eléctrica completa y documentar condiciones existentes.",
      "Desarrollar plan de recableado con diseño de circuitos según código NEC.",
      "Desenergizar y remover de manera segura el cableado obsoleto existente.",
      "Instalar nuevo cableado de cobre (12 AWG y 14 AWG según corresponda).",
      "Instalar nuevas cajas eléctricas en todas las ubicaciones de tomacorrientes e interruptores.",
      "Instalar circuitos dedicados para electrodomésticos principales según código.",
      "Instalar interruptores de falla de arco (AFCI) para circuitos de dormitorios.",
      "Instalar protección de interruptor de falla a tierra (GFCI) en áreas requeridas.",
      "Instalar conexión a tierra adecuada en todo el sistema.",
      "Etiquetar todos los circuitos en el panel según requisitos NEC.",
      "Probar todos los circuitos para voltaje, continuidad y conexión a tierra correctos.",
      "Coordinar inspecciones con la autoridad local."
    ],
    options: {
      "rewire-type": {
        label: "Alcance del Recableado",
        choices: [
          { value: "whole-house", label: "Recableado de Toda la Casa", scopeAddition: "Recableado completo de toda la casa incluyendo todos los circuitos derivados." },
          { value: "knob-tube", label: "Reemplazo de Knob-and-Tube", scopeAddition: "Remover todo el cableado knob-and-tube y reemplazar con cable NM moderno." },
          { value: "aluminum", label: "Remediación de Cableado de Aluminio", scopeAddition: "Abordar peligros del cableado de aluminio usando conectores COPALUM o aprobados en toda la casa." }
        ]
      },
      "partial-kitchen": { label: "Solo Recableado de Cocina", scopeAddition: "Recablear solo el área de la cocina con nuevos circuitos dedicados para todos los electrodomésticos." },
      "partial-bath": { label: "Solo Recableado de Baño", scopeAddition: "Recablear solo baño(s) con nuevos circuitos GFCI y cableado de extractor." },
      "partial-addition": { label: "Cableado de Adición/Cuarto Nuevo", scopeAddition: "Cablear nueva adición o espacio convertido con asignación de circuitos adecuada." }
    }
  },
  "kitchen-bath-wiring": {
    name: "Cableado para Remodelación de Cocina y Baño",
    warranty: "Garantía de 1 año en mano de obra para todo el trabajo eléctrico.",
    exclusions: ["Tarifas de permisos", "Costo de accesorios (a menos que se especifique)", "Reparación de paneles de yeso"],
    baseScope: [
      "Evaluar capacidad eléctrica existente y disponibilidad de circuitos.",
      "Instalar nuevos circuitos de 20 amperios para pequeños electrodomésticos según requisitos NEC.",
      "Instalar circuitos dedicados para triturador de basura y lavavajillas.",
      "Instalar tomacorrientes GFCI en todas las ubicaciones de encimera dentro de 6 pies del agua.",
      "Instalar protección combinada AFCI/GFCI donde sea requerido por código.",
      "Cablear nuevo circuito para extractor/campana.",
      "Instalar conexión a tierra adecuada en todos los nuevos tomacorrientes y accesorios.",
      "Probar todos los circuitos para operación y protección correctas.",
      "Etiquetar nuevos circuitos en el panel eléctrico.",
      "Coordinar con otros oficios para el momento del trabajo en bruto."
    ],
    options: {
      "under-cabinet-lighting": { label: "Iluminación LED Bajo Gabinete", scopeAddition: "Instalar iluminación LED de tira cableada bajo gabinetes superiores con interruptor atenuador." },
      "recessed-cans": { label: "Luces Empotradas (6 luces)", scopeAddition: "Instalar (6) luces LED empotradas con control de interruptor atenuador." },
      "island-circuit": { label: "Circuito de Tomacorriente de Isla", scopeAddition: "Instalar tomacorrientes emergentes o empotrados en isla de cocina con circuito dedicado." },
      "pendant-wiring": { label: "Cableado para Luces Colgantes", scopeAddition: "Instalar cajas eléctricas y cableado para luces colgantes sobre isla o barra." },
      "range-circuit": { label: "Circuito de 50A para Estufa Eléctrica", scopeAddition: "Instalar nuevo circuito de 50 amperios 240V para estufa eléctrica con tomacorriente adecuado." }
    }
  },
  "addition-garage-shed": {
    name: "Cableado de Adición, Garaje y Cobertizo",
    warranty: "Garantía de 1 año en mano de obra. Materiales según garantía del fabricante.",
    exclusions: ["Zanjeo para tendidos subterráneos", "Tarifas de permisos", "Corte/parcheo de concreto"],
    baseScope: [
      "Evaluar capacidad del panel principal para carga adicional.",
      "Instalar subpanel con amperaje apropiado para el espacio.",
      "Instalar cable alimentador desde panel principal a ubicación del subpanel.",
      "Diseñar e instalar distribución de iluminación según requisitos del espacio.",
      "Instalar tomacorrientes según requisitos de espaciado del código.",
      "Instalar tomacorriente de 240V para equipo de taller o calefactor si es necesario.",
      "Instalar tomacorrientes y cubiertas resistentes a la intemperie para ubicaciones expuestas.",
      "Conectar subpanel a tierra según requisitos del código NEC.",
      "Etiquetar todos los circuitos claramente.",
      "Probar todos los circuitos y verificar operación correcta."
    ],
    options: {
      "subpanel-size": {
        label: "Tamaño del Subpanel",
        choices: [
          { value: "60a", label: "Subpanel de 60 Amperios", scopeAddition: "Instalar subpanel de 60 amperios adecuado para iluminación y tomacorrientes básicos." },
          { value: "100a", label: "Subpanel de 100 Amperios", scopeAddition: "Instalar subpanel de 100 amperios para taller con equipo pesado." },
          { value: "125a", label: "Subpanel de 125 Amperios", scopeAddition: "Instalar subpanel de 125 amperios para adición completa con capacidad de HVAC." }
        ]
      },
      "underground-run": { label: "Conducto Subterráneo", scopeAddition: "Instalar conducto subterráneo (hasta 50 pies) para energía a estructura separada." },
      "shop-outlets": { label: "Paquete de Tomacorrientes de 240V para Taller", scopeAddition: "Instalar (2) tomacorrientes de 240V para soldadores, compresores o equipo de taller." },
      "motion-lights": { label: "Luces Exteriores con Sensor de Movimiento", scopeAddition: "Instalar luces LED activadas por movimiento en puntos de entrada de la estructura." }
    }
  },
  "ev-charger": {
    name: "Instalación de Cargador para Vehículo Eléctrico",
    warranty: "Garantía del cargador según fabricante. Garantía de 1 año en mano de obra.",
    exclusions: ["Costo de la unidad del cargador (a menos que se especifique)", "Zanjeo para garaje separado", "Tarifas de permisos"],
    baseScope: [
      "Realizar cálculo de carga para evaluar capacidad del panel.",
      "Instalar nuevo circuito dedicado de 240V 50 amperios para cargador Nivel 2.",
      "Instalar conducto y cable de tamaño apropiado hasta ubicación del cargador.",
      "Instalar tomacorriente NEMA 14-50 o conectar cargador directamente según especificación.",
      "Montar estación de carga según especificaciones del fabricante.",
      "Conectar, probar y verificar operación correcta del cargador.",
      "Programar horarios de carga y funciones inteligentes si aplica.",
      "Proporcionar orientación al propietario sobre operación y funciones del cargador.",
      "Limpiar área de trabajo y remover todos los escombros.",
      "Proporcionar documentación para cualquier reembolso aplicable."
    ],
    options: {
      "panel-upgrade-ev": { label: "Actualización de Panel para VE", scopeAddition: "Actualizar panel eléctrico para acomodar carga del cargador VE si la capacidad actual es insuficiente." },
      "charger-supplied": { label: "Incluir Tesla Wall Connector", scopeAddition: "Suministrar e instalar unidad Tesla Wall Connector." },
      "charger-universal": { label: "Incluir Cargador Universal J1772", scopeAddition: "Suministrar e instalar cargador universal J1772 Nivel 2 (ChargePoint, Grizzl-E o equivalente)." },
      "extended-run": { label: "Tendido de Cable Extendido (31-75 pies)", scopeAddition: "Conducto y tendido de cable extendido para distancias de 31-75 pies desde el panel." },
      "load-management": { label: "Gestión Inteligente de Carga", scopeAddition: "Instalar dispositivo de gestión inteligente de carga para equilibrar carga del VE con demanda del hogar." }
    }
  },
  "outdoor-electrical": {
    name: "Electricidad Exterior y de Jardín",
    warranty: "Garantía de 1 año en mano de obra. Garantías de accesorios según fabricante.",
    exclusions: ["Zanjeo (a menos que se especifique)", "Reparación de paisajismo", "Tarifas de permisos"],
    baseScope: [
      "Evaluar capacidad del panel eléctrico para circuitos exteriores.",
      "Planificar distribución para necesidades eléctricas exteriores.",
      "Instalar cajas de empalme exteriores con clasificación de intemperie.",
      "Instalar cableado apropiado con protección de conducto para exteriores.",
      "Instalar cubiertas de tomacorrientes resistentes a la intemperie tipo en uso.",
      "Instalar protección GFCI para todos los circuitos exteriores.",
      "Conectar y probar todos los accesorios y tomacorrientes.",
      "Verificar conexión a tierra adecuada de circuitos exteriores.",
      "Limpiar área de trabajo y restaurar cualquier área perturbada."
    ],
    options: {
      "landscape-lighting": { label: "Iluminación de Paisaje de Bajo Voltaje", scopeAddition: "Instalar sistema de iluminación de paisaje de bajo voltaje con transformador, temporizador y hasta 10 accesorios." },
      "patio-outlets": { label: "Paquete de Tomacorrientes para Patio/Terraza", scopeAddition: "Instalar (2-3) tomacorrientes GFCI a prueba de intemperie en área de patio o terraza." },
      "pool-spa": { label: "Conexión Eléctrica de Piscina/Spa", scopeAddition: "Instalar circuito dedicado para bomba de piscina/spa con unión y protección GFCI adecuadas." },
      "security-lights": { label: "Paquete de Iluminación de Seguridad", scopeAddition: "Instalar (3-4) luces LED de seguridad con sensor de movimiento en ubicaciones exteriores clave." },
      "camera-wiring": { label: "Cableado para Cámaras de Seguridad", scopeAddition: "Instalar cableado de energía y/o bajo voltaje para hasta 4 ubicaciones de cámaras de seguridad." }
    }
  },
  "generator": {
    name: "Instalación de Generador",
    warranty: "Garantía del generador según fabricante. Garantía de 1 año en mano de obra de instalación.",
    exclusions: ["Costo de la unidad del generador (a menos que se especifique)", "Instalación de línea de gas", "Tarifas de permisos", "Losa de concreto"],
    baseScope: [
      "Evaluar sistema eléctrico y requisitos de energía del hogar.",
      "Determinar tamaño del generador basado en cargas críticas.",
      "Instalar componentes de conexión del generador según especificaciones.",
      "Asegurar conexión a tierra adecuada del sistema del generador.",
      "Probar operación del sistema y funcionalidad de transferencia.",
      "Proporcionar orientación al propietario sobre operación y mantenimiento del generador.",
      "Limpiar área de trabajo y remover todos los escombros.",
      "Proporcionar documentación para inspección de permisos."
    ],
    options: {
      "generator-type": {
        label: "Tipo de Generador",
        choices: [
          { value: "portable", label: "Configuración de Generador Portátil", scopeAddition: "Instalar caja de entrada, cable de alimentación e interlock manual para conexión de generador portátil." },
          { value: "standby-small", label: "Generador de Respaldo (10-14kW)", scopeAddition: "Instalar generador de respaldo con interruptor de transferencia automática para circuitos esenciales." },
          { value: "standby-whole", label: "Generador de Respaldo para Toda la Casa (18-24kW)", scopeAddition: "Instalar generador de respaldo para toda la casa con interruptor de transferencia automática para respaldo completo del hogar." }
        ]
      },
      "interlock-kit": { label: "Kit de Interlock Manual", scopeAddition: "Instalar kit de interlock de generador en panel existente para transferencia manual segura." },
      "inlet-box": { label: "Caja de Entrada de Energía Exterior", scopeAddition: "Instalar caja de entrada de energía a prueba de intemperie con clasificación de amperaje apropiada." },
      "transfer-switch": { label: "Interruptor de Transferencia Automática", scopeAddition: "Instalar interruptor de transferencia automática para activación perfecta del generador durante cortes." },
      "load-shedding": { label: "Reducción Inteligente de Carga", scopeAddition: "Instalar sistema de gestión de carga para priorizar circuitos críticos durante operación del generador." }
    }
  },
  "recessed-lighting": {
    name: "Instalación de Iluminación Empotrada",
    warranty: "Garantía de 1 año en mano de obra. Garantía de LED según fabricante.",
    exclusions: ["Reemplazo de aislamiento de ático", "Reparación mayor de techo"],
    baseScope: [
      "Marcar distribución para (6) ubicaciones de luces empotradas según plan.",
      "Cortar aberturas en el techo usando plantilla apropiada.",
      "Instalar carcasas de remodelación (retrofit).",
      "Instalar nuevo circuito eléctrico desde ubicación del interruptor.",
      "Instalar nuevo interruptor atenuador en ubicación designada.",
      "Cablear todos los accesorios en serie al interruptor.",
      "Instalar molduras y bombillas LED (3000K o 4000K según selección).",
      "Probar operación del atenuador en todo el rango.",
      "Parchar cualquier agujero de acceso según sea necesario.",
      "Limpiar todos los escombros."
    ],
    options: {
      "additional-lights": { label: "Luces Adicionales (7-10 total)", scopeAddition: "Instalar 4 luces empotradas adicionales (10 total) para mayor cobertura de la habitación." },
      "smart-dimmer": { label: "Interruptor Atenuador Inteligente", scopeAddition: "Instalar interruptor atenuador inteligente con Wi-Fi y control por aplicación." },
      "second-zone": { label: "Iluminación de Dos Zonas", scopeAddition: "Dividir luces en dos zonas con interruptores separados para control flexible." }
    }
  }
};

// Helper function to get Spanish translation for electrical templates
export function getElectricalJobTypeEs(jobTypeId: string) {
  return electricalJobTypesEs[jobTypeId];
}

// Spanish translations for HVAC job types
export const hvacJobTypesEs: Record<string, { name: string; baseScope: string[]; warranty?: string; exclusions?: string[]; options: Record<string, { label: string; scopeAddition?: string; choices?: { value: string; label: string; scopeAddition?: string }[] }> }> = {
  "full-system-split": {
    name: "Reemplazo Completo de Sistema – Split (A/C + Calefactor)",
    warranty: "Garantía de 10 años en piezas con registro. Garantía de 2 años en mano de obra.",
    exclusions: ["Reemplazo de ductos", "Sistemas de zonificación", "Actualizaciones del panel eléctrico", "Permisos (si lo requiere la jurisdicción)"],
    baseScope: [
      "Recuperar refrigerante existente según regulaciones EPA Sección 608.",
      "Desconectar y remover unidad condensadora exterior existente.",
      "Desconectar y remover calefactor interior existente.",
      "Desechar equipos viejos según regulaciones ambientales.",
      "Colocar nueva unidad condensadora en base existente (o instalar nueva base si es necesario).",
      "Instalar nuevo calefactor en ubicación existente.",
      "Instalar nuevo serpentín evaporador compatible con tonelaje del condensador.",
      "Reemplazar línea de refrigerante si es requerido por distancia o condición.",
      "Instalar nueva bandeja de drenaje y línea de condensado con trampa.",
      "Instalar nuevo filtro secador y puertos de servicio.",
      "Soldar todas las conexiones de refrigerante con soldadura de plata.",
      "Probar presión del sistema con nitrógeno a 500 PSI.",
      "Evacuar sistema a 500 micrones usando bomba de vacío.",
      "Cargar sistema con refrigerante especificado por fábrica (R-410A).",
      "Verificar valores de subenfriamiento y sobrecalentamiento según especificaciones del fabricante.",
      "Conectar línea de gas al calefactor (si es de gas) y probar fugas.",
      "Conectar y probar termostato existente o nuevo.",
      "Verificar flujo de aire en todos los registros de suministro.",
      "Probar modos de calefacción y enfriamiento para operación correcta.",
      "Medir diferencial de temperatura (enfriamiento: 16-22°F, calefacción: 40-70°F de aumento).",
      "Programar y calibrar configuraciones del termostato.",
      "Registrar garantía con el fabricante.",
      "Proporcionar orientación del sistema e instrucciones de reemplazo de filtro al propietario.",
      "Limpiar área de trabajo y remover todos los escombros."
    ],
    options: {
      "tonnage": {
        label: "Tamaño del Sistema (Tonelaje)",
        choices: [
          { value: "1.5-ton", label: "1.5 Toneladas", scopeAddition: "Instalar sistema de 1.5 toneladas dimensionado para aproximadamente 600-900 pies cuadrados." },
          { value: "2-ton", label: "2 Toneladas", scopeAddition: "Instalar sistema de 2 toneladas dimensionado para aproximadamente 901-1200 pies cuadrados." },
          { value: "2.5-ton", label: "2.5 Toneladas", scopeAddition: "Instalar sistema de 2.5 toneladas dimensionado para aproximadamente 1201-1500 pies cuadrados." },
          { value: "3-ton", label: "3 Toneladas", scopeAddition: "Instalar sistema de 3 toneladas dimensionado para aproximadamente 1501-1800 pies cuadrados." },
          { value: "3.5-ton", label: "3.5 Toneladas", scopeAddition: "Instalar sistema de 3.5 toneladas dimensionado para aproximadamente 1801-2100 pies cuadrados." },
          { value: "4-ton", label: "4 Toneladas", scopeAddition: "Instalar sistema de 4 toneladas dimensionado para aproximadamente 2101-2400 pies cuadrados." },
          { value: "5-ton", label: "5 Toneladas", scopeAddition: "Instalar sistema de 5 toneladas dimensionado para aproximadamente 2401-3000 pies cuadrados." }
        ]
      },
      "efficiency": {
        label: "Nivel de Eficiencia",
        choices: [
          { value: "standard", label: "Estándar (14-15 SEER / 80% AFUE)", scopeAddition: "Instalar A/C de eficiencia estándar (14-15 SEER) y calefactor 80% AFUE." },
          { value: "high", label: "Alta Eficiencia (16-17 SEER / 95% AFUE)", scopeAddition: "Instalar A/C de alta eficiencia (16-17 SEER) y calefactor 95% AFUE con intercambiador de calor secundario." },
          { value: "ultra", label: "Ultra Eficiencia (18+ SEER / 98% AFUE)", scopeAddition: "Instalar A/C ultra eficiente de velocidad variable (18+ SEER) y calefactor modulante 98% AFUE." }
        ]
      },
      "smart-thermostat": { label: "Termostato Inteligente (Ecobee/Nest)", scopeAddition: "Instalar termostato inteligente premium con sensores de habitación y configuración de aplicación." },
      "new-pad": { label: "Nueva Base para Condensador", scopeAddition: "Instalar nueva base compuesta para condensador (reemplazar base agrietada o subdimensionada)." },
      "surge-protector": { label: "Protector de Sobretensión HVAC", scopeAddition: "Instalar protector de sobretensión en desconector exterior para protección del compresor." },
      "uv-light": { label: "Purificador de Aire UV", scopeAddition: "Instalar luz germicida UV-C en manejador de aire para reducir moho y bacterias." },
      "duct-cleaning": { label: "Limpieza Completa de Ductos", scopeAddition: "Limpiar todos los ductos de suministro y retorno usando cepillo rotativo y aspiradora HEPA." }
    }
  },
  "ac-only": {
    name: "Reemplazo Solo de A/C",
    warranty: "Garantía del fabricante (5-10 años en piezas). Garantía de 2 años en mano de obra.",
    exclusions: ["Reemplazo del calefactor", "Modificaciones de ductos", "Reemplazo del serpentín interior (a menos que se incluya)", "Actualización del panel eléctrico"],
    baseScope: [
      "Recuperar refrigerante existente según regulaciones EPA Sección 608.",
      "Desconectar y remover unidad condensadora exterior existente.",
      "Desechar unidad vieja según regulaciones ambientales.",
      "Colocar nuevo condensador en base existente (o nueva base si es necesario).",
      "Inspeccionar y limpiar línea de refrigerante existente con nitrógeno.",
      "Instalar nuevo filtro secador.",
      "Soldar todas las conexiones con soldadura de plata.",
      "Probar presión del sistema con nitrógeno a 500 PSI.",
      "Evacuar sistema a 500 micrones usando bomba de vacío.",
      "Cargar sistema con refrigerante especificado por fábrica (R-410A).",
      "Verificar valores de subenfriamiento y sobrecalentamiento según especificaciones del fabricante.",
      "Probar operación y medir delta-T de enfriamiento (16-22°F).",
      "Verificar amperaje correcto en el compresor.",
      "Registrar garantía con el fabricante.",
      "Limpiar área de trabajo.",
      "Proporcionar documentación de garantía y calendario de filtros al propietario."
    ],
    options: {
      "tonnage": {
        label: "Tamaño del Sistema (Tonelaje)",
        choices: [
          { value: "1.5-ton", label: "1.5 Toneladas", scopeAddition: "Instalar condensador de 1.5 toneladas dimensionado para aproximadamente 600-900 pies cuadrados." },
          { value: "2-ton", label: "2 Toneladas", scopeAddition: "Instalar condensador de 2 toneladas dimensionado para aproximadamente 901-1200 pies cuadrados." },
          { value: "2.5-ton", label: "2.5 Toneladas", scopeAddition: "Instalar condensador de 2.5 toneladas dimensionado para aproximadamente 1201-1500 pies cuadrados." },
          { value: "3-ton", label: "3 Toneladas", scopeAddition: "Instalar condensador de 3 toneladas dimensionado para aproximadamente 1501-1800 pies cuadrados." },
          { value: "3.5-ton", label: "3.5 Toneladas", scopeAddition: "Instalar condensador de 3.5 toneladas dimensionado para aproximadamente 1801-2100 pies cuadrados." },
          { value: "4-ton", label: "4 Toneladas", scopeAddition: "Instalar condensador de 4 toneladas dimensionado para aproximadamente 2101-2400 pies cuadrados." },
          { value: "5-ton", label: "5 Toneladas", scopeAddition: "Instalar condensador de 5 toneladas dimensionado para aproximadamente 2401-3000 pies cuadrados." }
        ]
      },
      "efficiency": {
        label: "Nivel de Eficiencia",
        choices: [
          { value: "standard", label: "Estándar (14-15 SEER)", scopeAddition: "Instalar condensador de eficiencia 14-15 SEER." },
          { value: "high", label: "Alta Eficiencia (16-17 SEER)", scopeAddition: "Instalar condensador de alta eficiencia 16-17 SEER." },
          { value: "ultra", label: "Ultra Eficiencia (18+ SEER)", scopeAddition: "Instalar condensador ultra eficiente 18+ SEER con compresor de velocidad variable." }
        ]
      },
      "evap-coil": { label: "Nuevo Serpentín Evaporador", scopeAddition: "Reemplazar serpentín evaporador interior para coincidir con nuevo condensador para eficiencia óptima." },
      "smart-thermostat": { label: "Actualización de Termostato Inteligente", scopeAddition: "Instalar y configurar termostato inteligente con Wi-Fi y configuración de aplicación." },
      "new-pad": { label: "Nueva Base para Condensador", scopeAddition: "Instalar nueva base compuesta para condensador (reemplazar base agrietada o subdimensionada)." },
      "surge-protector": { label: "Protector de Sobretensión A/C", scopeAddition: "Instalar protector de sobretensión en desconector exterior para protección del compresor." }
    }
  },
  "furnace-only": {
    name: "Reemplazo Solo de Calefactor",
    warranty: "Garantía del fabricante (garantía limitada de por vida en intercambiador de calor, 10 años en piezas). Garantía de 2 años en mano de obra.",
    exclusions: ["Reemplazo de A/C", "Modificaciones de ductos", "Instalación de línea de gas", "Permisos (si se requieren)"],
    baseScope: [
      "Cerrar suministro de gas y desconectar calefactor existente.",
      "Desconectar y tapar líneas de refrigerante (si aplica).",
      "Remover calefactor existente y desechar apropiadamente.",
      "Instalar nuevo calefactor en ubicación existente.",
      "Reconectar línea de suministro de gas y probar fugas con detector electrónico.",
      "Reconectar serpentín evaporador existente (si tiene A/C).",
      "Instalar nueva bandeja de drenaje y línea de condensado con trampa (si es alta eficiencia).",
      "Conectar chimenea/escape según requisitos del código.",
      "Conectar y probar cableado del termostato.",
      "Verificar presión de gas correcta en el colector.",
      "Probar secuencia de encendido y controles de seguridad.",
      "Medir aumento de temperatura a través del intercambiador de calor.",
      "Verificar combustión y tiro correctos.",
      "Probar todas las etapas de calefacción.",
      "Registrar garantía con el fabricante.",
      "Limpiar área de trabajo y proporcionar instrucciones de operación."
    ],
    options: {
      "size": {
        label: "Tamaño del Calefactor (BTU)",
        choices: [
          { value: "40k", label: "40,000 BTU", scopeAddition: "Instalar calefactor de 40,000 BTU para casas pequeñas (800-1200 pies cuadrados)." },
          { value: "60k", label: "60,000 BTU", scopeAddition: "Instalar calefactor de 60,000 BTU para casas medianas (1200-1600 pies cuadrados)." },
          { value: "80k", label: "80,000 BTU", scopeAddition: "Instalar calefactor de 80,000 BTU para casas promedio (1600-2200 pies cuadrados)." },
          { value: "100k", label: "100,000 BTU", scopeAddition: "Instalar calefactor de 100,000 BTU para casas grandes (2200-2800 pies cuadrados)." },
          { value: "120k", label: "120,000 BTU", scopeAddition: "Instalar calefactor de 120,000 BTU para casas muy grandes (2800+ pies cuadrados)." }
        ]
      },
      "efficiency": {
        label: "Nivel de Eficiencia",
        choices: [
          { value: "standard", label: "Estándar (80% AFUE)", scopeAddition: "Instalar calefactor de una etapa 80% AFUE con eficiencia estándar." },
          { value: "high", label: "Alta Eficiencia (95% AFUE)", scopeAddition: "Instalar calefactor de alta eficiencia 95% AFUE con intercambiador de calor secundario y ventilación PVC." },
          { value: "ultra", label: "Ultra Eficiencia (98% AFUE)", scopeAddition: "Instalar calefactor modulante 98% AFUE con soplador de velocidad variable para máximo confort y eficiencia." }
        ]
      },
      "smart-thermostat": { label: "Actualización de Termostato Inteligente", scopeAddition: "Instalar y configurar termostato inteligente con Wi-Fi y configuración de aplicación." },
      "humidifier": { label: "Humidificador de Toda la Casa", scopeAddition: "Instalar humidificador de derivación o motorizado con control de humidistato." },
      "co-detector": { label: "Detector de Monóxido de Carbono", scopeAddition: "Instalar detector de monóxido de carbono cableado cerca del área del calefactor." }
    }
  },
  "heat-pump-system": {
    name: "Reemplazo de Sistema de Bomba de Calor",
    warranty: "Garantía de 10 años en piezas con registro. Garantía de 2 años en mano de obra.",
    exclusions: ["Reemplazo de ductos", "Actualización del panel eléctrico", "Instalación de calefacción de respaldo", "Permisos (si se requieren)"],
    baseScope: [
      "Recuperar refrigerante existente según regulaciones EPA Sección 608.",
      "Desconectar y remover bomba de calor exterior o unidad de A/C existente.",
      "Remover y desechar manejador de aire interior existente.",
      "Colocar nueva bomba de calor condensadora en base existente o nueva.",
      "Instalar nuevo manejador de aire con serpentín compatible.",
      "Instalar nueva línea de refrigerante si es necesario.",
      "Instalar nueva bandeja de drenaje y línea de condensado con trampa.",
      "Instalar nuevo filtro secador y puertos de servicio.",
      "Soldar todas las conexiones con soldadura de plata.",
      "Probar presión del sistema con nitrógeno a 500 PSI.",
      "Evacuar sistema a 500 micrones usando bomba de vacío.",
      "Cargar sistema con refrigerante especificado por fábrica (R-410A).",
      "Verificar subenfriamiento y sobrecalentamiento en modos de calefacción y enfriamiento.",
      "Probar operación de válvula reversible.",
      "Verificar operación del ciclo de descongelación.",
      "Conectar y programar termostato para operación de bomba de calor.",
      "Probar resistencias eléctricas de respaldo (si aplica).",
      "Medir diferencial de temperatura en modos de calefacción y enfriamiento.",
      "Registrar garantía con el fabricante.",
      "Proporcionar orientación del sistema al propietario.",
      "Limpiar área de trabajo y remover todos los escombros."
    ],
    options: {
      "tonnage": {
        label: "Tamaño del Sistema (Tonelaje)",
        choices: [
          { value: "1.5-ton", label: "1.5 Toneladas", scopeAddition: "Instalar bomba de calor de 1.5 toneladas dimensionada para aproximadamente 600-900 pies cuadrados." },
          { value: "2-ton", label: "2 Toneladas", scopeAddition: "Instalar bomba de calor de 2 toneladas dimensionada para aproximadamente 901-1200 pies cuadrados." },
          { value: "2.5-ton", label: "2.5 Toneladas", scopeAddition: "Instalar bomba de calor de 2.5 toneladas dimensionada para aproximadamente 1201-1500 pies cuadrados." },
          { value: "3-ton", label: "3 Toneladas", scopeAddition: "Instalar bomba de calor de 3 toneladas dimensionada para aproximadamente 1501-1800 pies cuadrados." },
          { value: "3.5-ton", label: "3.5 Toneladas", scopeAddition: "Instalar bomba de calor de 3.5 toneladas dimensionada para aproximadamente 1801-2100 pies cuadrados." },
          { value: "4-ton", label: "4 Toneladas", scopeAddition: "Instalar bomba de calor de 4 toneladas dimensionada para aproximadamente 2101-2400 pies cuadrados." },
          { value: "5-ton", label: "5 Toneladas", scopeAddition: "Instalar bomba de calor de 5 toneladas dimensionada para aproximadamente 2401-3000 pies cuadrados." }
        ]
      },
      "efficiency": {
        label: "Nivel de Eficiencia",
        choices: [
          { value: "standard", label: "Estándar (14-15 SEER / 8 HSPF)", scopeAddition: "Instalar bomba de calor de eficiencia estándar (14-15 SEER, 8 HSPF)." },
          { value: "high", label: "Alta Eficiencia (16-17 SEER / 9 HSPF)", scopeAddition: "Instalar bomba de calor de alta eficiencia (16-17 SEER, 9 HSPF)." },
          { value: "ultra", label: "Ultra Eficiencia (18+ SEER / 10+ HSPF)", scopeAddition: "Instalar bomba de calor ultra eficiente de velocidad variable (18+ SEER, 10+ HSPF) con tecnología inversora." }
        ]
      },
      "backup-heat": {
        label: "Resistencias Eléctricas de Respaldo",
        choices: [
          { value: "5kw", label: "Kit de Calor 5 kW", scopeAddition: "Instalar kit de calor eléctrico de 5 kW para calefacción de respaldo." },
          { value: "10kw", label: "Kit de Calor 10 kW", scopeAddition: "Instalar kit de calor eléctrico de 10 kW para calefacción de respaldo." },
          { value: "15kw", label: "Kit de Calor 15 kW", scopeAddition: "Instalar kit de calor eléctrico de 15 kW para calefacción de respaldo." },
          { value: "20kw", label: "Kit de Calor 20 kW", scopeAddition: "Instalar kit de calor eléctrico de 20 kW para calefacción de respaldo." }
        ]
      },
      "smart-thermostat": { label: "Termostato Inteligente (Compatible con Bomba de Calor)", scopeAddition: "Instalar termostato inteligente compatible con bomba de calor con soporte dual-fuel." },
      "surge-protector": { label: "Protector de Sobretensión para Bomba de Calor", scopeAddition: "Instalar protector de sobretensión en desconector exterior para protección del compresor." }
    }
  },
  "mini-split-single": {
    name: "Instalación de Mini-Split – Zona Única",
    warranty: "Garantía de 7 años en compresor. Garantía de 5 años en piezas. Garantía de 2 años en mano de obra.",
    exclusions: ["Actualización del panel eléctrico", "Modificaciones estructurales mayores", "Permisos (si se requieren)"],
    baseScope: [
      "Seleccionar y marcar ubicaciones óptimas para unidades interior y exterior.",
      "Instalar soporte de pared para manejador de aire interior.",
      "Perforar agujero de 3\" a través de pared exterior para paso de líneas.",
      "Instalar manguito de pared y sellar con materiales impermeables.",
      "Pasar líneas de refrigerante, línea de drenaje y cable de control entre unidades.",
      "Instalar condensador exterior en soporte de suelo o base compuesta.",
      "Conectar líneas de refrigerante con accesorios de abocardado y especificaciones de torque correctas.",
      "Vaciar y probar fugas del sistema de refrigerante.",
      "Liberar carga de fábrica o agregar refrigerante según longitud de líneas.",
      "Cablear unidad interior a unidad exterior con cable de control.",
      "Instalar nuevo circuito eléctrico dedicado (si es necesario).",
      "Conectar suministro eléctrico según requisitos del código.",
      "Probar operación de calefacción y enfriamiento.",
      "Verificar carga de refrigerante correcta mediante método de temperatura.",
      "Programar control remoto y demostrar funciones al propietario.",
      "Instalar cubierta de líneas para estética exterior.",
      "Limpiar todas las áreas de trabajo y remover escombros.",
      "Proporcionar documentación de garantía e instrucciones de mantenimiento."
    ],
    options: {
      "tonnage": {
        label: "Tamaño del Sistema (BTU/Tonelaje)",
        choices: [
          { value: "9k", label: "9,000 BTU (3/4 Tonelada)", scopeAddition: "Instalar mini-split de 9,000 BTU para habitaciones hasta 350 pies cuadrados." },
          { value: "12k", label: "12,000 BTU (1 Tonelada)", scopeAddition: "Instalar mini-split de 12,000 BTU para habitaciones de 350-550 pies cuadrados." },
          { value: "18k", label: "18,000 BTU (1.5 Toneladas)", scopeAddition: "Instalar mini-split de 18,000 BTU para habitaciones de 550-800 pies cuadrados." },
          { value: "24k", label: "24,000 BTU (2 Toneladas)", scopeAddition: "Instalar mini-split de 24,000 BTU para habitaciones de 800-1100 pies cuadrados." },
          { value: "36k", label: "36,000 BTU (3 Toneladas)", scopeAddition: "Instalar mini-split de 36,000 BTU para áreas de 1100-1500 pies cuadrados." }
        ]
      },
      "efficiency": {
        label: "Nivel de Eficiencia",
        choices: [
          { value: "standard", label: "Estándar (18 SEER)", scopeAddition: "Instalar sistema mini-split estándar de 18 SEER." },
          { value: "high", label: "Alta Eficiencia (22 SEER)", scopeAddition: "Instalar sistema mini-split de alta eficiencia de 22 SEER." },
          { value: "ultra", label: "Ultra Eficiencia (25+ SEER)", scopeAddition: "Instalar mini-split ultra eficiente de 25+ SEER con tecnología inversora." }
        ]
      },
      "ceiling-cassette": { label: "Cassette de Techo (en lugar de unidad de pared)", scopeAddition: "Instalar unidad estilo cassette empotrada en techo para apariencia discreta." },
      "floor-mount": { label: "Unidad de Piso (en lugar de unidad de pared)", scopeAddition: "Instalar unidad de consola montada en piso en lugar de cabezal montado en pared." },
      "wifi-control": { label: "Adaptador de Control Wi-Fi", scopeAddition: "Instalar adaptador Wi-Fi para control por teléfono inteligente del sistema mini-split." },
      "electrical-circuit": { label: "Nuevo Circuito Dedicado", scopeAddition: "Instalar nuevo circuito dedicado de 20A o 30A desde el panel hasta ubicación de la unidad." }
    }
  },
  "mini-split-multi": {
    name: "Instalación de Mini-Split – Multi Zona",
    warranty: "Garantía de 7 años en compresor. Garantía de 5 años en piezas. Garantía de 2 años en mano de obra.",
    exclusions: ["Actualización del panel eléctrico", "Modificaciones estructurales mayores", "Permisos (si se requieren)"],
    baseScope: [
      "Evaluar y seleccionar ubicaciones óptimas para cada unidad interior y condensador exterior.",
      "Instalar soportes de pared para cada manejador de aire interior.",
      "Perforar agujeros a través de paredes exteriores para paso de líneas de cada zona.",
      "Instalar manguitos de pared y sellar con materiales impermeables.",
      "Pasar líneas de refrigerante, líneas de drenaje y cables de control individuales para cada zona.",
      "Instalar condensador multi-zona exterior en soporte de suelo o base compuesta.",
      "Conectar todas las líneas de refrigerante a caja de distribución de derivación o directamente al condensador.",
      "Usar accesorios de abocardado con especificaciones de torque para todas las conexiones.",
      "Vaciar todo el sistema y probar fugas.",
      "Cargar sistema con cantidad correcta de refrigerante según longitud total de líneas.",
      "Cablear cada unidad interior a unidad exterior con cables de control.",
      "Instalar nuevo circuito eléctrico dedicado para unidad exterior.",
      "Conectar suministro eléctrico según requisitos del código.",
      "Probar cada zona independientemente para operación de calefacción y enfriamiento.",
      "Verificar carga de refrigerante correcta y balance del sistema.",
      "Programar control remoto de cada zona y demostrar al propietario.",
      "Instalar cubiertas de líneas para estética exterior.",
      "Limpiar todas las áreas de trabajo y remover escombros.",
      "Proporcionar documentación de garantía e instrucciones de mantenimiento para cada zona."
    ],
    options: {
      "zone-count": {
        label: "Número de Zonas Interiores",
        choices: [
          { value: "2-zone", label: "2 Zonas", scopeAddition: "Instalar sistema multi-split de 2 zonas con control de temperatura individual por zona." },
          { value: "3-zone", label: "3 Zonas", scopeAddition: "Instalar sistema multi-split de 3 zonas con control de temperatura individual por zona." },
          { value: "4-zone", label: "4 Zonas", scopeAddition: "Instalar sistema multi-split de 4 zonas con control de temperatura individual por zona." },
          { value: "5-zone", label: "5 Zonas", scopeAddition: "Instalar sistema multi-split de 5 zonas con control de temperatura individual por zona." }
        ]
      },
      "outdoor-capacity": {
        label: "Capacidad de Unidad Exterior",
        choices: [
          { value: "24k", label: "24,000 BTU (2 Toneladas)", scopeAddition: "Instalar unidad exterior de 24,000 BTU para aplicaciones multi-zona pequeñas." },
          { value: "36k", label: "36,000 BTU (3 Toneladas)", scopeAddition: "Instalar unidad exterior de 36,000 BTU para aplicaciones multi-zona medianas." },
          { value: "48k", label: "48,000 BTU (4 Toneladas)", scopeAddition: "Instalar unidad exterior de 48,000 BTU para aplicaciones multi-zona grandes." },
          { value: "60k", label: "60,000 BTU (5 Toneladas)", scopeAddition: "Instalar unidad exterior de 60,000 BTU para aplicaciones multi-zona de toda la casa." }
        ]
      },
      "efficiency": {
        label: "Nivel de Eficiencia",
        choices: [
          { value: "standard", label: "Estándar (18 SEER)", scopeAddition: "Instalar sistema multi-zona estándar de 18 SEER." },
          { value: "high", label: "Alta Eficiencia (22 SEER)", scopeAddition: "Instalar sistema multi-zona de alta eficiencia de 22 SEER." },
          { value: "ultra", label: "Ultra Eficiencia (25+ SEER)", scopeAddition: "Instalar sistema multi-zona ultra eficiente de 25+ SEER con tecnología inversora." }
        ]
      },
      "ceiling-cassettes": { label: "Cassettes de Techo (por unidad)", scopeAddition: "Actualizar unidades interiores a cassettes empotrados en techo para apariencia discreta." },
      "wifi-control": { label: "Control Wi-Fi para Todas las Zonas", scopeAddition: "Instalar adaptadores Wi-Fi para control por teléfono inteligente de todas las zonas mini-split." },
      "electrical-upgrade": { label: "Nuevo Circuito Dedicado de 50A", scopeAddition: "Instalar nuevo circuito dedicado de 50A desde el panel hasta ubicación de unidad exterior." }
    }
  },
  "new-construction": {
    name: "Nueva Construcción – Instalación Completa de HVAC",
    warranty: "Garantía de 10 años en piezas con registro. Garantía de 2 años en mano de obra en todo el sistema.",
    exclusions: ["Panel eléctrico (por electricista)", "Línea de gas a la estructura (por plomero)", "Aislamiento (por contratista de aislamiento)", "Permisos (responsabilidad del contratista general)"],
    baseScope: [
      "Revisar planos de construcción y realizar cálculo de carga Manual J.",
      "Diseñar distribución de ductos según especificaciones Manual D.",
      "Coordinar ubicación de equipos con contratista general.",
      "Colocar calefactor o manejador de aire en espacio mecánico designado.",
      "Instalar plenum de suministro y línea troncal según diseño.",
      "Instalar plenum de retorno y sistema de ductos de retorno de aire.",
      "Pasar ductos de derivación de suministro a cada habitación según plano.",
      "Instalar botas de registro en todas las ubicaciones de suministro.",
      "Instalar rejillas de retorno de aire y ductos.",
      "Sellar todas las conexiones de ductos con masilla y/o cinta según código.",
      "Instalar condensador exterior en base en ubicación designada.",
      "Pasar línea de refrigerante entre unidades interior y exterior.",
      "Soldar todas las conexiones de refrigerante con soldadura de plata.",
      "Probar presión del sistema de refrigerante a 500 PSI.",
      "Vaciar sistema a 500 micrones después de prueba de presión.",
      "Cargar sistema con refrigerante especificado por fábrica.",
      "Conectar línea de gas al calefactor (si es sistema de gas) y probar fugas.",
      "Instalar termostato en ubicación especificada por propietario.",
      "Probar operación de calefacción y enfriamiento.",
      "Balancear flujo de aire en todos los registros.",
      "Verificar presión estática y rendimiento del sistema.",
      "Registrar garantía con el fabricante.",
      "Proporcionar planos as-built al contratista general.",
      "Proporcionar documentación del sistema al propietario."
    ],
    options: {
      "tonnage": {
        label: "Tamaño del Sistema (Tonelaje)",
        choices: [
          { value: "2-ton", label: "2 Toneladas", scopeAddition: "Instalar sistema de 2 toneladas para casas de aproximadamente 1000-1400 pies cuadrados." },
          { value: "2.5-ton", label: "2.5 Toneladas", scopeAddition: "Instalar sistema de 2.5 toneladas para casas de aproximadamente 1400-1800 pies cuadrados." },
          { value: "3-ton", label: "3 Toneladas", scopeAddition: "Instalar sistema de 3 toneladas para casas de aproximadamente 1800-2200 pies cuadrados." },
          { value: "3.5-ton", label: "3.5 Toneladas", scopeAddition: "Instalar sistema de 3.5 toneladas para casas de aproximadamente 2200-2600 pies cuadrados." },
          { value: "4-ton", label: "4 Toneladas", scopeAddition: "Instalar sistema de 4 toneladas para casas de aproximadamente 2600-3000 pies cuadrados." },
          { value: "5-ton", label: "5 Toneladas", scopeAddition: "Instalar sistema de 5 toneladas para casas de aproximadamente 3000-3600 pies cuadrados." }
        ]
      },
      "system-type": {
        label: "Tipo de Sistema",
        choices: [
          { value: "gas-split", label: "Calefactor de Gas + A/C Split", scopeAddition: "Instalar calefactor de gas con condensador A/C compatible (sistema split)." },
          { value: "heat-pump", label: "Sistema de Bomba de Calor", scopeAddition: "Instalar sistema de bomba de calor para calefacción y enfriamiento completamente eléctricos." },
          { value: "dual-fuel", label: "Dual Fuel (Bomba de Calor + Respaldo de Gas)", scopeAddition: "Instalar sistema dual-fuel con bomba de calor primaria y calefactor de gas de respaldo." }
        ]
      },
      "efficiency": {
        label: "Nivel de Eficiencia",
        choices: [
          { value: "standard", label: "Estándar (14 SEER / 80% AFUE)", scopeAddition: "Instalar equipo de eficiencia estándar (A/C 14 SEER, calefactor 80% AFUE)." },
          { value: "high", label: "Alta Eficiencia (16 SEER / 95% AFUE)", scopeAddition: "Instalar equipo de alta eficiencia (A/C 16 SEER, calefactor 95% AFUE)." },
          { value: "ultra", label: "Ultra Eficiencia (18+ SEER / 98% AFUE)", scopeAddition: "Instalar equipo ultra eficiente (A/C 18+ SEER, calefactor modulante 98% AFUE)." }
        ]
      },
      "duct-type": {
        label: "Material de Ductos",
        choices: [
          { value: "flex", label: "Ducto Flexible", scopeAddition: "Instalar ducto flexible aislado R-6 para todos los conductos de suministro." },
          { value: "metal", label: "Ducto de Lámina Metálica", scopeAddition: "Instalar ductos de lámina metálica con envoltura de aislamiento exterior." },
          { value: "combo", label: "Troncal Metálico / Derivaciones Flexibles", scopeAddition: "Instalar líneas troncales de lámina metálica con conductos de derivación flexibles." }
        ]
      },
      "zoning": { label: "Sistema de Zonificación", scopeAddition: "Instalar sistema de compuertas de 2 zonas con panel de control de zona y múltiples termostatos." },
      "smart-thermostat": { label: "Termostato Inteligente", scopeAddition: "Instalar termostato inteligente premium con sensores de habitación y control por aplicación." },
      "air-quality": { label: "Paquete de Calidad de Aire Interior", scopeAddition: "Instalar limpiador de aire de toda la casa, luz UV y humidificador de derivación." }
    }
  },
  "ductwork-repair": {
    name: "Reparación / Reemplazo de Ductos Solamente",
    warranty: "Garantía de 5 años en instalación de ductos. Garantía de 2 años en mano de obra.",
    exclusions: ["Equipo HVAC", "Reemplazo de termostato", "Aislamiento (a menos que se especifique)", "Permisos (si se requieren)"],
    baseScope: [
      "Inspeccionar sistema de ductos existente para fugas, daños y condición del aislamiento.",
      "Fotografiar y documentar condiciones existentes.",
      "Desconectar y remover secciones de ductos dañadas o fallidas.",
      "Desechar materiales de ductos viejos apropiadamente.",
      "Instalar nuevos ductos según especificaciones.",
      "Conectar todos los conductos de suministro y retorno a plenums.",
      "Sellar todas las conexiones con masilla y cinta listada UL.",
      "Asegurar ductos con soportes y correas apropiados según código.",
      "Reinstalar o instalar nuevos registros y rejillas.",
      "Probar sistema para flujo de aire correcto en cada registro.",
      "Verificar que no haya fugas de aire con inspección visual.",
      "Limpiar todas las áreas de trabajo y remover escombros.",
      "Proporcionar documentación antes/después al propietario."
    ],
    options: {
      "scope": {
        label: "Alcance de Reparación",
        choices: [
          { value: "repair", label: "Reparar Secciones Específicas", scopeAddition: "Reparar o reemplazar secciones de ductos dañadas según se identifiquen." },
          { value: "partial", label: "Reemplazo Parcial de Ductos (50%)", scopeAddition: "Reemplazar aproximadamente 50% del sistema de ductos existente." },
          { value: "full", label: "Reemplazo Completo de Ductos", scopeAddition: "Remover y reemplazar todo el sistema de ductos con materiales nuevos." }
        ]
      },
      "material": {
        label: "Material de Ductos",
        choices: [
          { value: "flex", label: "Ducto Flexible (Aislado R-6)", scopeAddition: "Usar ducto flexible aislado R-6 para todos los conductos." },
          { value: "flex-r8", label: "Ducto Flexible (Aislado R-8)", scopeAddition: "Usar ducto flexible aislado R-8 para eficiencia mejorada." },
          { value: "metal", label: "Lámina Metálica", scopeAddition: "Usar ductos de lámina metálica con aislamiento exterior." }
        ]
      },
      "duct-sealing": { label: "Sellado de Ductos Aeroseal", scopeAddition: "Aplicar tecnología Aeroseal para sellar todas las fugas de ductos desde el interior del sistema." },
      "insulation-wrap": { label: "Aislamiento Adicional de Ductos", scopeAddition: "Envolver ductos accesibles con manta de aislamiento R-8 adicional." },
      "return-upgrade": { label: "Agregar Rejilla de Retorno de Aire", scopeAddition: "Instalar rejilla de retorno de aire adicional para mejorar el balance del flujo de aire." },
      "registers": { label: "Nuevos Registros y Rejillas", scopeAddition: "Reemplazar todos los registros de suministro y rejillas de retorno con unidades nuevas." }
    }
  },
  "iaq-upgrades": {
    name: "Calidad de Aire Interior / Mejoras Adicionales",
    warranty: "Garantía del fabricante en equipo. Garantía de 1 año en mano de obra.",
    exclusions: ["Reemplazo de equipo HVAC", "Modificaciones de ductos", "Actualización del panel eléctrico"],
    baseScope: [
      "Evaluar compatibilidad del sistema HVAC existente.",
      "Determinar ubicación óptima para instalación de equipo IAQ.",
      "Apagar sistema HVAC y desconectar energía.",
      "Instalar equipo de calidad de aire seleccionado según especificaciones del fabricante.",
      "Realizar conexiones eléctricas necesarias.",
      "Conectar al sistema de ductos existente o manejador de aire según se requiera.",
      "Probar operación del equipo y verificar función correcta.",
      "Demostrar operación y mantenimiento al propietario.",
      "Proporcionar documentación de garantía y calendario de mantenimiento.",
      "Limpiar área de trabajo."
    ],
    options: {
      "uv-light": { label: "Luz Germicida UV-C", scopeAddition: "Instalar luz germicida UV-C en manejador de aire para matar moho, bacterias y virus." },
      "air-cleaner": {
        label: "Limpiador de Aire de Toda la Casa",
        choices: [
          { value: "media", label: "Limpiador de Aire de Medios (MERV 11-13)", scopeAddition: "Instalar gabinete de limpiador de aire de medios de 4\" o 5\" con filtro MERV 11-13." },
          { value: "electronic", label: "Limpiador de Aire Electrónico", scopeAddition: "Instalar limpiador de aire electrónico para eliminación avanzada de partículas." },
          { value: "hepa", label: "Sistema de Derivación HEPA", scopeAddition: "Instalar sistema de filtración de derivación HEPA verdadero para limpieza de aire de grado médico." }
        ]
      },
      "humidifier": {
        label: "Humidificador de Toda la Casa",
        choices: [
          { value: "bypass", label: "Humidificador de Derivación", scopeAddition: "Instalar humidificador de derivación con humidistato manual." },
          { value: "powered", label: "Humidificador de Flujo Motorizado", scopeAddition: "Instalar humidificador de flujo motorizado con humidistato automático." },
          { value: "steam", label: "Humidificador de Vapor", scopeAddition: "Instalar humidificador de vapor para control preciso de humedad." }
        ]
      },
      "dehumidifier": { label: "Deshumidificador de Toda la Casa", scopeAddition: "Instalar deshumidificador de toda la casa integrado con sistema HVAC." },
      "erv-hrv": {
        label: "Ventilador de Recuperación de Energía/Calor",
        choices: [
          { value: "hrv", label: "Ventilador de Recuperación de Calor (HRV)", scopeAddition: "Instalar HRV para ventilación balanceada con recuperación de calor (climas fríos)." },
          { value: "erv", label: "Ventilador de Recuperación de Energía (ERV)", scopeAddition: "Instalar ERV para ventilación balanceada con recuperación de calor y humedad (climas húmedos)." }
        ]
      },
      "ionizer": { label: "Sistema de Ionización Bi-Polar", scopeAddition: "Instalar sistema de ionización bi-polar de punta de aguja en ductos." }
    }
  },
  "maintenance-tuneup": {
    name: "Mantenimiento / Puesta a Punto",
    warranty: "Garantía de 30 días en reparaciones realizadas. Sin garantía solo en diagnósticos.",
    exclusions: ["Reemplazo de piezas (cotizado por separado)", "Refrigerante (si se necesita)", "Reparaciones mayores"],
    baseScope: [
      "Llegar a tiempo y presentar alcance de visita de mantenimiento.",
      "Inspeccionar y reemplazar filtro de aire (filtro estándar incluido).",
      "Inspeccionar operación y calibración del termostato.",
      "Revisar conexiones eléctricas y apretar según sea necesario.",
      "Medir voltaje y amperaje en todos los componentes.",
      "Inspeccionar y limpiar serpentín del condensador (exterior).",
      "Limpiar escombros alrededor de unidad exterior.",
      "Revisar presión de refrigerante y anotar cualquier preocupación.",
      "Inspeccionar serpentín evaporador (si es accesible).",
      "Probar drenaje de condensado y despejar si está obstruido.",
      "Lubricar partes móviles según sea necesario.",
      "Probar operación de calefacción y enfriamiento.",
      "Medir diferencial de temperatura (enfriamiento o calefacción).",
      "Inspeccionar ductos para problemas visibles.",
      "Proporcionar reporte escrito de hallazgos y recomendaciones.",
      "Responder preguntas del propietario sobre condición del sistema."
    ],
    options: {
      "service-type": {
        label: "Tipo de Servicio",
        choices: [
          { value: "cooling", label: "Puesta a Punto Solo de A/C", scopeAddition: "Realizar puesta a punto e inspección del sistema de enfriamiento." },
          { value: "heating", label: "Puesta a Punto Solo de Calefacción", scopeAddition: "Realizar puesta a punto e inspección del sistema de calefacción." },
          { value: "both", label: "Puesta a Punto Completa de HVAC", scopeAddition: "Realizar puesta a punto completa del sistema de calefacción y enfriamiento." }
        ]
      },
      "coil-cleaning": { label: "Limpieza Profunda de Serpentín del Condensador", scopeAddition: "Realizar limpieza química del serpentín del condensador para eficiencia mejorada." },
      "evap-coil-cleaning": { label: "Limpieza del Serpentín Evaporador", scopeAddition: "Realizar limpieza con espuma del serpentín evaporador (si es accesible)." },
      "capacitor-check": { label: "Prueba y Reporte de Capacitor", scopeAddition: "Probar capacitores de arranque y funcionamiento y proporcionar lecturas en reporte." },
      "refrigerant-check": { label: "Análisis Completo de Refrigerante", scopeAddition: "Realizar análisis detallado de refrigerante con lecturas de sobrecalentamiento/subenfriamiento." },
      "service-agreement": { label: "Acuerdo de Servicio Anual", scopeAddition: "Inscribirse en acuerdo de mantenimiento anual para 2 visitas por año con programación prioritaria." }
    }
  },
  "service-diagnostic": {
    name: "Llamada de Servicio / Solo Diagnóstico",
    warranty: "Tarifa de diagnóstico aplicada a reparación si se aprueba el trabajo.",
    exclusions: ["Piezas y materiales", "Reparaciones (cotizadas por separado)", "Refrigerante"],
    baseScope: [
      "Responder a solicitud de servicio dentro de ventana programada.",
      "Discutir síntomas reportados con propietario.",
      "Realizar inspección visual de todo el sistema HVAC.",
      "Revisar operación y configuraciones del termostato.",
      "Inspeccionar conexiones y componentes eléctricos.",
      "Medir voltaje y amperaje donde aplique.",
      "Revisar presiones de refrigerante (si es problema de enfriamiento).",
      "Inspeccionar drenaje de condensado.",
      "Probar secuencia de encendido (si es problema de calefacción).",
      "Usar herramientas de diagnóstico para identificar falla.",
      "Explicar hallazgos y diagnóstico al propietario.",
      "Proporcionar estimación escrita para reparaciones recomendadas.",
      "Responder preguntas sobre opciones de reparación.",
      "Aplicar tarifa de diagnóstico a reparación si se aprueba el trabajo."
    ],
    options: {
      "urgency": {
        label: "Urgencia del Servicio",
        choices: [
          { value: "standard", label: "Estándar (Próximo Disponible)", scopeAddition: "Programar servicio durante próxima ventana de cita disponible." },
          { value: "priority", label: "Prioritario (Mismo Día)", scopeAddition: "Servicio prioritario el mismo día (sujeto a disponibilidad)." },
          { value: "emergency", label: "Emergencia (Fuera de Horario)", scopeAddition: "Llamada de servicio de emergencia fuera de horario (noches/fines de semana)." }
        ]
      },
      "system-type": {
        label: "Sistema a Diagnosticar",
        choices: [
          { value: "cooling", label: "Sistema de Enfriamiento (A/C)", scopeAddition: "Diagnosticar problema del sistema de aire acondicionado." },
          { value: "heating", label: "Sistema de Calefacción (Calefactor/Bomba de Calor)", scopeAddition: "Diagnosticar problema del sistema de calefacción." },
          { value: "both", label: "Sistema HVAC Completo", scopeAddition: "Diagnosticar sistema HVAC completo para múltiples problemas." }
        ]
      },
      "minor-repair": { label: "Provisión para Reparación Menor", scopeAddition: "Incluir hasta $100 en reparaciones menores (fusibles, resets, limpieza) si se necesita durante visita." },
      "second-opinion": { label: "Documentación de Segunda Opinión", scopeAddition: "Proporcionar reporte escrito detallado con fotos para propósitos de segunda opinión." }
    }
  }
};

// Helper function to get Spanish translation for HVAC templates
export function getHvacJobTypeEs(jobTypeId: string) {
  return hvacJobTypesEs[jobTypeId];
}

// Spanish translations for Interior Painting job types
export const paintingJobTypesEs: Record<string, { name: string; baseScope: string[]; warranty?: string; exclusions?: string[]; options: Record<string, { label: string; scopeAddition?: string; choices?: { value: string; label: string; scopeAddition?: string }[] }> }> = {
  "interior-room": {
    name: "Pintura de Habitación Individual",
    warranty: "Garantía de 1 año contra descascarado, descamación o ampollas.",
    exclusions: ["Reparación de daños por agua", "Remoción de papel tapiz", "Abatimiento de pintura con plomo"],
    baseScope: [
      "Mover muebles al centro de la habitación y cubrir con lonas protectoras.",
      "Encintar pisos, molduras, tomacorrientes y ventanas con cinta y plástico.",
      "Reparar hoyos menores, clavos saltados y grietas finas con compuesto de resane.",
      "Lijar reparaciones hasta quedar lisas y aplicar imprimador en puntos reparados.",
      "Sellar espacios entre molduras y paredes con masilla pintable.",
      "Aplicar dos capas de pintura látex premium para interiores (solo paredes).",
      "Hacer cortes en todos los bordes, esquinas y alrededor de accesorios.",
      "Remover todos los materiales de enmascarar; limpiar goteos de pintura.",
      "Regresar muebles a sus posiciones originales.",
      "Retoque final y recorrido de inspección."
    ],
    options: {
      "room-area": {
        label: "Área de la Casa",
        choices: [
          { value: "basement", label: "Sótano", scopeAddition: "Pintar habitación designada del sótano." },
          { value: "mud-room", label: "Cuarto de Entrada", scopeAddition: "Pintar cuarto de entrada / área de vestíbulo." },
          { value: "master-bathroom", label: "Baño Principal", scopeAddition: "Pintar baño principal incluyendo preparación resistente a la humedad para área de alta humedad." },
          { value: "dining-room", label: "Comedor", scopeAddition: "Pintar comedor." }
        ]
      },
      "trim-doors": { label: "Incluir Molduras y Puertas", scopeAddition: "Lijar, imprimar y aplicar pintura semi-brillante a todos los zócalos, marcos de puertas y hojas de puertas." },
      "ceilings": { label: "Incluir Techo", scopeAddition: "Aplicar dos capas de pintura mate para techo en toda la superficie del techo." },
      "closets": { label: "Incluir Clóset(s)", scopeAddition: "Pintar paredes interiores y techo del clóset o clósets en la habitación." },
      "accent-wall": { label: "Pared de Acento (color diferente)", scopeAddition: "Aplicar pintura de color contrastante en pared de acento designada." }
    }
  },
  "whole-house-interior": {
    name: "Pintura Interior de Toda la Casa",
    warranty: "Garantía de 2 años contra descascarado, descamación o ampollas.",
    exclusions: ["Reparación extensa de paneles de yeso", "Remoción de techo de palomitas", "Abatimiento de pintura con plomo"],
    baseScope: [
      "Proteger todos los pisos con lonas y plástico protector.",
      "Mover muebles según sea necesario; cubrir con materiales protectores.",
      "Encintar todas las ventanas, puertas, gabinetes y accesorios.",
      "Reparar todos los hoyos, grietas y clavos saltados en toda la casa.",
      "Lijar reparaciones y aplicar imprimador a las reparaciones.",
      "Sellar todos los espacios entre molduras y paredes.",
      "Aplicar dos capas de látex premium para interiores en todas las superficies de pared.",
      "Hacer cortes en todos los bordes y alrededor de todos los accesorios.",
      "Aplicar pintura semi-brillante a todos los marcos y molduras de puertas.",
      "Pintar todas las puertas interiores (ambos lados si se solicita).",
      "Pintar todos los zócalos en toda la casa.",
      "Retocar todas las áreas según sea necesario.",
      "Remover todos los materiales de enmascarar y protección.",
      "Limpieza final y recorrido de inspección."
    ],
    options: {
      "ceilings-all": { label: "Todos los Techos", scopeAddition: "Aplicar dos capas de pintura mate para techo en todos los techos de la casa." },
      "staircase": { label: "Escalera y Barandal", scopeAddition: "Lijar y pintar barandales, balaustres y postes de escalera." },
      "cabinet-paint": { label: "Pintura de Gabinetes de Cocina", scopeAddition: "Preparar, imprimar y pintar cajas, puertas y cajones de gabinetes de cocina (agregar 3-4 días)." }
    }
  },
  "exterior-paint": {
    name: "Pintura Exterior de Casa",
    warranty: "Garantía de 5 años contra descascarado, descamación o ampollas.",
    exclusions: ["Reparaciones de carpintería más allá de parcheo menor", "Abatimiento de pintura con plomo", "Tinte de terraza/cerca"],
    baseScope: [
      "Lavar a presión todas las superficies exteriores para remover suciedad y moho.",
      "Permitir que las superficies sequen completamente antes de pintar.",
      "Raspar y lijar toda la pintura suelta o descascarada.",
      "Sellar todos los espacios alrededor de ventanas, puertas y molduras.",
      "Imprimar madera al descubierto y reparaciones con imprimador exterior.",
      "Encintar ventanas, puertas y accesorios con cinta y plástico.",
      "Aplicar dos capas de pintura exterior premium al revestimiento/cuerpo.",
      "Aplicar color contrastante a molduras, fascia y sofitos.",
      "Pintar puerta principal con color de acento (si se selecciona).",
      "Pintar contraventanas y elementos decorativos.",
      "Remover todos los materiales de enmascarar.",
      "Retocar cualquier área faltante o goteos.",
      "Limpieza final y remoción de escombros."
    ],
    options: {
      "pressure-wash-only": { label: "Lavar a Presión Terraza/Patio", scopeAddition: "Lavar a presión superficie de terraza y/o patio como parte del proyecto de pintura." },
      "gutter-paint": { label: "Pintar Canaletas y Bajantes", scopeAddition: "Preparar y pintar todas las canaletas y bajantes para combinar con color de molduras." },
      "front-door-accent": { label: "Puerta Principal de Acento", scopeAddition: "Lijar, imprimar y pintar puerta principal con color de acento premium." }
    }
  }
};

// Spanish translations for Landscaping job types
export const landscapingJobTypesEs: Record<string, { name: string; baseScope: string[]; warranty?: string; exclusions?: string[]; options: Record<string, { label: string; scopeAddition?: string; choices?: { value: string; label: string; scopeAddition?: string }[] }> }> = {
  "full-yard-makeover": {
    name: "Renovación Completa – Patio Delantero y Trasero",
    warranty: "Garantía de 1 año en todas las plantas (con cuidado adecuado). Garantía de 2 años en pavimento duro y mano de obra de riego.",
    exclusions: [
      "Tarifas de permisos y aprobación de HOA",
      "Remoción de árboles con diámetro mayor a 24 pulgadas",
      "Muros de contención estructurales mayores a 4 pies",
      "Reubicación de servicios subterráneos",
      "Instalación de cerca"
    ],
    baseScope: [
      "Consulta inicial en sitio y revisión de diseño con propietario.",
      "Llamar al 811 para ubicación de servicios previo a cualquier excavación.",
      "Remover plantas existentes, césped y escombros según especificaciones del plan.",
      "Nivelar y emparejar jardín para drenaje adecuado alejándose de la estructura.",
      "Instalar tela de paisajismo en áreas designadas.",
      "Preparar macizos de plantación con enmienda de suelo y composta.",
      "Instalar todos los árboles, arbustos y plantas perennes según plan de paisajismo.",
      "Instalar elementos de pavimento duro según especificaciones de diseño.",
      "Instalar componentes del sistema de riego según se especifica.",
      "Aplicar mantillo a todos los macizos de plantación (profundidad de 3 pulgadas).",
      "Realizar nivelación final y limpieza de todas las áreas de trabajo.",
      "Proporcionar guía de cuidado de plantas y programa de riego al propietario."
    ],
    options: {
      "yard-area": {
        label: "Área del Jardín",
        choices: [
          { value: "front", label: "Patio Delantero", scopeAddition: "Limitar trabajo solo al área del patio delantero." },
          { value: "back", label: "Patio Trasero", scopeAddition: "Limitar trabajo solo al área del patio trasero." },
          { value: "side", label: "Patio Lateral", scopeAddition: "Limitar trabajo solo al área del patio lateral." },
          { value: "entire", label: "Propiedad Completa", scopeAddition: "Renovación completa de paisajismo para toda la propiedad." }
        ]
      },
      "planting-scope": {
        label: "Alcance de Plantación",
        choices: [
          { value: "new-beds", label: "Macizos Nuevos", scopeAddition: "Crear nuevos macizos de plantación con plantas frescas y mantillo." },
          { value: "refresh", label: "Renovar Macizos Existentes", scopeAddition: "Renovar macizos existentes con nuevo mantillo y plantas de reemplazo selectas." },
          { value: "shrubs", label: "Solo Arbustos", scopeAddition: "Instalar arbustos solamente según plan de paisajismo." },
          { value: "perennials", label: "Perennes y Color", scopeAddition: "Instalar plantas perennes y plantaciones de color estacional." },
          { value: "annuals", label: "Flores Anuales", scopeAddition: "Instalar flores anuales para color estacional." },
          { value: "small-trees", label: "Árboles Pequeños (menos de 15 pies)", scopeAddition: "Instalar árboles ornamentales pequeños (menos de 15 pies de altura madura)." },
          { value: "large-trees", label: "Árboles Grandes (más de 15 pies)", scopeAddition: "Instalar árboles de sombra o especímenes grandes (más de 15 pies de altura madura)." }
        ]
      },
      "hardscape-scope": {
        label: "Alcance de Pavimento Duro",
        choices: [
          { value: "paver-patio", label: "Patio de Adoquines", scopeAddition: "Instalar patio de adoquines con base compactada y juntas de arena polimérica." },
          { value: "concrete-patio", label: "Patio de Concreto", scopeAddition: "Verter patio de concreto con pendiente adecuada y juntas de control." },
          { value: "overlay", label: "Recubrimiento de Adoquines", scopeAddition: "Instalar adoquines delgados sobre superficie de concreto existente." },
          { value: "walkway", label: "Sendero de Adoquines", scopeAddition: "Instalar sendero de adoquines con base compactada." },
          { value: "stepping-stones", label: "Piedras de Paso", scopeAddition: "Instalar camino de piedras de paso con cubresuelos entre piedras." },
          { value: "gravel-path", label: "Sendero de Grava", scopeAddition: "Instalar sendero de grava con bordillo de acero y tela de paisajismo." },
          { value: "fire-pit", label: "Área de Fogata", scopeAddition: "Instalar fogata con borde de adoquines y área de asientos." }
        ]
      },
      "irrigation-scope": {
        label: "Alcance de Riego",
        choices: [
          { value: "new-full", label: "Sistema Completo Nuevo", scopeAddition: "Instalar sistema de riego completamente nuevo con cobertura total." },
          { value: "new-partial", label: "Sistema Parcial Nuevo", scopeAddition: "Instalar riego solo para zonas selectas." },
          { value: "add-zones", label: "Agregar Zonas a Existente", scopeAddition: "Agregar nuevas zonas al sistema de riego existente." },
          { value: "drip", label: "Solo Riego por Goteo", scopeAddition: "Instalar riego por goteo solo en macizos de plantación." },
          { value: "smart-controller", label: "Mejora a Controlador Inteligente", scopeAddition: "Instalar controlador de riego inteligente con WiFi y ajuste climático." }
        ]
      },
      "edging-type": {
        label: "Tipo de Bordillo",
        choices: [
          { value: "steel", label: "Bordillo de Acero", scopeAddition: "Instalar bordillo de paisajismo de acero en todos los bordes de macizos." },
          { value: "stone", label: "Bordillo de Piedra Natural", scopeAddition: "Instalar bordillo de piedra natural en bordes de macizos." },
          { value: "paver", label: "Bordillo de Adoquines", scopeAddition: "Instalar curso de soldado de adoquines en macizos." },
          { value: "plastic", label: "Bordillo de Plástico", scopeAddition: "Instalar bordillo de paisajismo de plástico en bordes de macizos." },
          { value: "none", label: "Sin Bordillo", scopeAddition: "Sin bordillo formal instalado; borde natural de macizo mantenido." }
        ]
      }
    }
  },
  "front-yard-refresh": {
    name: "Renovación Solo Patio Delantero",
    warranty: "Garantía de 1 año en todas las plantas (con cuidado adecuado). Garantía de 1 año en mano de obra de pavimento duro.",
    exclusions: [
      "Trabajo en patio trasero",
      "Nivelación mayor o corrección de drenaje",
      "Remoción de árboles",
      "Reparación de línea principal de riego"
    ],
    baseScope: [
      "Consulta inicial y revisión de diseño para patio delantero.",
      "Remover plantas muertas o sobrecrecidas según se especifica.",
      "Bordear todos los macizos existentes y definir bordes.",
      "Enmendar suelo en áreas de plantación con composta.",
      "Instalar nuevas plantas según diseño aprobado.",
      "Renovar mantillo en todos los macizos de plantación (profundidad de 3 pulgadas).",
      "Ajustar cabezales de riego y tiempos según sea necesario.",
      "Limpiar todas las áreas de trabajo y escombros.",
      "Proporcionar guía de cuidado de plantas al propietario."
    ],
    options: {
      "planting-scope": {
        label: "Alcance de Plantación",
        choices: [
          { value: "new-beds", label: "Macizos Nuevos", scopeAddition: "Crear nuevos macizos de plantación con plantas frescas y mantillo." },
          { value: "refresh", label: "Renovar Macizos Existentes", scopeAddition: "Renovar macizos existentes con nuevo mantillo y plantas de reemplazo selectas." },
          { value: "shrubs", label: "Solo Arbustos", scopeAddition: "Instalar arbustos solamente según plan de paisajismo." },
          { value: "perennials", label: "Perennes y Color", scopeAddition: "Instalar plantas perennes y plantaciones de color estacional." },
          { value: "annuals", label: "Flores Anuales", scopeAddition: "Instalar flores anuales para color estacional." },
          { value: "small-trees", label: "Árboles Pequeños (menos de 15 pies)", scopeAddition: "Instalar árboles ornamentales pequeños (menos de 15 pies de altura madura)." },
          { value: "large-trees", label: "Árboles Grandes (más de 15 pies)", scopeAddition: "Instalar árboles de sombra o especímenes grandes (más de 15 pies de altura madura)." }
        ]
      },
      "hardscape-scope": {
        label: "Alcance de Pavimento Duro",
        choices: [
          { value: "paver-patio", label: "Patio de Adoquines", scopeAddition: "Instalar patio de adoquines con base compactada y juntas de arena polimérica." },
          { value: "concrete-patio", label: "Patio de Concreto", scopeAddition: "Verter patio de concreto con pendiente adecuada y juntas de control." },
          { value: "overlay", label: "Recubrimiento de Adoquines", scopeAddition: "Instalar adoquines delgados sobre superficie de concreto existente." },
          { value: "walkway", label: "Sendero de Adoquines", scopeAddition: "Instalar sendero de adoquines con base compactada." },
          { value: "stepping-stones", label: "Piedras de Paso", scopeAddition: "Instalar camino de piedras de paso con cubresuelos entre piedras." },
          { value: "gravel-path", label: "Sendero de Grava", scopeAddition: "Instalar sendero de grava con bordillo de acero y tela de paisajismo." },
          { value: "fire-pit", label: "Área de Fogata", scopeAddition: "Instalar fogata con borde de adoquines y área de asientos." }
        ]
      },
      "irrigation-scope": {
        label: "Alcance de Riego",
        choices: [
          { value: "new-full", label: "Sistema Completo Nuevo", scopeAddition: "Instalar sistema de riego completamente nuevo con cobertura total." },
          { value: "new-partial", label: "Sistema Parcial Nuevo", scopeAddition: "Instalar riego solo para zonas selectas." },
          { value: "add-zones", label: "Agregar Zonas a Existente", scopeAddition: "Agregar nuevas zonas al sistema de riego existente." },
          { value: "drip", label: "Solo Riego por Goteo", scopeAddition: "Instalar riego por goteo solo en macizos de plantación." },
          { value: "smart-controller", label: "Mejora a Controlador Inteligente", scopeAddition: "Instalar controlador de riego inteligente con WiFi y ajuste climático." }
        ]
      },
      "edging-type": {
        label: "Tipo de Bordillo",
        choices: [
          { value: "steel", label: "Bordillo de Acero", scopeAddition: "Instalar bordillo de paisajismo de acero en todos los bordes de macizos." },
          { value: "stone", label: "Bordillo de Piedra Natural", scopeAddition: "Instalar bordillo de piedra natural en bordes de macizos." },
          { value: "paver", label: "Bordillo de Adoquines", scopeAddition: "Instalar curso de soldado de adoquines en macizos." },
          { value: "plastic", label: "Bordillo de Plástico", scopeAddition: "Instalar bordillo de paisajismo de plástico en bordes de macizos." },
          { value: "none", label: "Sin Bordillo", scopeAddition: "Sin bordillo formal instalado; borde natural de macizo mantenido." }
        ]
      }
    }
  },
  "back-yard-refresh": {
    name: "Renovación Solo Patio Trasero",
    warranty: "Garantía de 1 año en todas las plantas (con cuidado adecuado). Garantía de 1 año en mano de obra de pavimento duro.",
    exclusions: [
      "Trabajo en patio delantero",
      "Instalación de piscina o spa",
      "Nivelación mayor o muros de contención",
      "Instalación de cerca"
    ],
    baseScope: [
      "Consulta inicial y revisión de diseño para patio trasero.",
      "Remover plantas muertas o sobrecrecidas según se especifica.",
      "Bordear todos los macizos existentes y definir bordes.",
      "Enmendar suelo en áreas de plantación con composta.",
      "Instalar nuevas plantas según diseño aprobado.",
      "Instalar o renovar elementos de pavimento duro según se especifica.",
      "Renovar mantillo en todos los macizos de plantación (profundidad de 3 pulgadas).",
      "Ajustar cabezales de riego y tiempos según sea necesario.",
      "Limpiar todas las áreas de trabajo y escombros.",
      "Proporcionar guía de cuidado de plantas al propietario."
    ],
    options: {
      "planting-scope": {
        label: "Alcance de Plantación",
        choices: [
          { value: "new-beds", label: "Macizos Nuevos", scopeAddition: "Crear nuevos macizos de plantación con plantas frescas y mantillo." },
          { value: "refresh", label: "Renovar Macizos Existentes", scopeAddition: "Renovar macizos existentes con nuevo mantillo y plantas de reemplazo selectas." },
          { value: "shrubs", label: "Solo Arbustos", scopeAddition: "Instalar arbustos solamente según plan de paisajismo." },
          { value: "perennials", label: "Perennes y Color", scopeAddition: "Instalar plantas perennes y plantaciones de color estacional." },
          { value: "annuals", label: "Flores Anuales", scopeAddition: "Instalar flores anuales para color estacional." },
          { value: "small-trees", label: "Árboles Pequeños (menos de 15 pies)", scopeAddition: "Instalar árboles ornamentales pequeños (menos de 15 pies de altura madura)." },
          { value: "large-trees", label: "Árboles Grandes (más de 15 pies)", scopeAddition: "Instalar árboles de sombra o especímenes grandes (más de 15 pies de altura madura)." }
        ]
      },
      "hardscape-scope": {
        label: "Alcance de Pavimento Duro",
        choices: [
          { value: "paver-patio", label: "Patio de Adoquines", scopeAddition: "Instalar patio de adoquines con base compactada y juntas de arena polimérica." },
          { value: "concrete-patio", label: "Patio de Concreto", scopeAddition: "Verter patio de concreto con pendiente adecuada y juntas de control." },
          { value: "overlay", label: "Recubrimiento de Adoquines", scopeAddition: "Instalar adoquines delgados sobre superficie de concreto existente." },
          { value: "walkway", label: "Sendero de Adoquines", scopeAddition: "Instalar sendero de adoquines con base compactada." },
          { value: "stepping-stones", label: "Piedras de Paso", scopeAddition: "Instalar camino de piedras de paso con cubresuelos entre piedras." },
          { value: "gravel-path", label: "Sendero de Grava", scopeAddition: "Instalar sendero de grava con bordillo de acero y tela de paisajismo." },
          { value: "fire-pit", label: "Área de Fogata", scopeAddition: "Instalar fogata con borde de adoquines y área de asientos." }
        ]
      },
      "irrigation-scope": {
        label: "Alcance de Riego",
        choices: [
          { value: "new-full", label: "Sistema Completo Nuevo", scopeAddition: "Instalar sistema de riego completamente nuevo con cobertura total." },
          { value: "new-partial", label: "Sistema Parcial Nuevo", scopeAddition: "Instalar riego solo para zonas selectas." },
          { value: "add-zones", label: "Agregar Zonas a Existente", scopeAddition: "Agregar nuevas zonas al sistema de riego existente." },
          { value: "drip", label: "Solo Riego por Goteo", scopeAddition: "Instalar riego por goteo solo en macizos de plantación." },
          { value: "smart-controller", label: "Mejora a Controlador Inteligente", scopeAddition: "Instalar controlador de riego inteligente con WiFi y ajuste climático." }
        ]
      },
      "edging-type": {
        label: "Tipo de Bordillo",
        choices: [
          { value: "steel", label: "Bordillo de Acero", scopeAddition: "Instalar bordillo de paisajismo de acero en todos los bordes de macizos." },
          { value: "stone", label: "Bordillo de Piedra Natural", scopeAddition: "Instalar bordillo de piedra natural en bordes de macizos." },
          { value: "paver", label: "Bordillo de Adoquines", scopeAddition: "Instalar curso de soldado de adoquines en macizos." },
          { value: "plastic", label: "Bordillo de Plástico", scopeAddition: "Instalar bordillo de paisajismo de plástico en bordes de macizos." },
          { value: "none", label: "Sin Bordillo", scopeAddition: "Sin bordillo formal instalado; borde natural de macizo mantenido." }
        ]
      }
    }
  },
  "new-construction": {
    name: "Instalación de Paisajismo Nueva Construcción",
    warranty: "Garantía de 1 año en todas las plantas (con cuidado adecuado). Garantía de 2 años en pavimento duro y mano de obra de riego.",
    exclusions: [
      "Limpieza del constructor o remoción de escombros",
      "Instalación de cerca",
      "Instalación de piscina o elemento de agua",
      "Iluminación exterior más allá de luces de paisajismo"
    ],
    baseScope: [
      "Consulta inicial en sitio y revisión de diseño.",
      "Coordinar con constructor sobre nivelación final y drenaje.",
      "Llamar al 811 para ubicación de servicios previo a excavación.",
      "Instalar sistema de riego completo según diseño.",
      "Preparar y enmendar suelo en todas las áreas de plantación.",
      "Instalar césped en áreas de pasto según especificaciones.",
      "Instalar todos los árboles, arbustos y plantas perennes según plan.",
      "Instalar elementos de pavimento duro (patio, sendero) según se especifica.",
      "Aplicar mantillo a todos los macizos de plantación (profundidad de 3 pulgadas).",
      "Programar controlador de riego y probar todas las zonas.",
      "Limpieza final y remoción de escombros del sitio.",
      "Proporcionar guía completa de cuidado de plantas y documentación de garantía."
    ],
    options: {
      "yard-area": {
        label: "Área del Jardín",
        choices: [
          { value: "front", label: "Patio Delantero", scopeAddition: "Limitar trabajo solo al área del patio delantero." },
          { value: "back", label: "Patio Trasero", scopeAddition: "Limitar trabajo solo al área del patio trasero." },
          { value: "side", label: "Patio Lateral", scopeAddition: "Limitar trabajo solo al área del patio lateral." },
          { value: "entire", label: "Propiedad Completa", scopeAddition: "Instalación completa de paisajismo para toda la propiedad." }
        ]
      },
      "planting-scope": {
        label: "Alcance de Plantación",
        choices: [
          { value: "new-beds", label: "Macizos Nuevos", scopeAddition: "Crear nuevos macizos de plantación con plantas frescas y mantillo." },
          { value: "refresh", label: "Renovar Macizos Existentes", scopeAddition: "Renovar macizos existentes con nuevo mantillo y plantas de reemplazo selectas." },
          { value: "shrubs", label: "Solo Arbustos", scopeAddition: "Instalar arbustos solamente según plan de paisajismo." },
          { value: "perennials", label: "Perennes y Color", scopeAddition: "Instalar plantas perennes y plantaciones de color estacional." },
          { value: "annuals", label: "Flores Anuales", scopeAddition: "Instalar flores anuales para color estacional." },
          { value: "small-trees", label: "Árboles Pequeños (menos de 15 pies)", scopeAddition: "Instalar árboles ornamentales pequeños (menos de 15 pies de altura madura)." },
          { value: "large-trees", label: "Árboles Grandes (más de 15 pies)", scopeAddition: "Instalar árboles de sombra o especímenes grandes (más de 15 pies de altura madura)." }
        ]
      },
      "hardscape-scope": {
        label: "Alcance de Pavimento Duro",
        choices: [
          { value: "paver-patio", label: "Patio de Adoquines", scopeAddition: "Instalar patio de adoquines con base compactada y juntas de arena polimérica." },
          { value: "concrete-patio", label: "Patio de Concreto", scopeAddition: "Verter patio de concreto con pendiente adecuada y juntas de control." },
          { value: "overlay", label: "Recubrimiento de Adoquines", scopeAddition: "Instalar adoquines delgados sobre superficie de concreto existente." },
          { value: "walkway", label: "Sendero de Adoquines", scopeAddition: "Instalar sendero de adoquines con base compactada." },
          { value: "stepping-stones", label: "Piedras de Paso", scopeAddition: "Instalar camino de piedras de paso con cubresuelos entre piedras." },
          { value: "gravel-path", label: "Sendero de Grava", scopeAddition: "Instalar sendero de grava con bordillo de acero y tela de paisajismo." },
          { value: "fire-pit", label: "Área de Fogata", scopeAddition: "Instalar fogata con borde de adoquines y área de asientos." }
        ]
      },
      "irrigation-scope": {
        label: "Alcance de Riego",
        choices: [
          { value: "new-full", label: "Sistema Completo Nuevo", scopeAddition: "Instalar sistema de riego completamente nuevo con cobertura total." },
          { value: "new-partial", label: "Sistema Parcial Nuevo", scopeAddition: "Instalar riego solo para zonas selectas." },
          { value: "add-zones", label: "Agregar Zonas a Existente", scopeAddition: "Agregar nuevas zonas al sistema de riego existente." },
          { value: "drip", label: "Solo Riego por Goteo", scopeAddition: "Instalar riego por goteo solo en macizos de plantación." },
          { value: "smart-controller", label: "Mejora a Controlador Inteligente", scopeAddition: "Instalar controlador de riego inteligente con WiFi y ajuste climático." }
        ]
      },
      "edging-type": {
        label: "Tipo de Bordillo",
        choices: [
          { value: "steel", label: "Bordillo de Acero", scopeAddition: "Instalar bordillo de paisajismo de acero en todos los bordes de macizos." },
          { value: "stone", label: "Bordillo de Piedra Natural", scopeAddition: "Instalar bordillo de piedra natural en bordes de macizos." },
          { value: "paver", label: "Bordillo de Adoquines", scopeAddition: "Instalar curso de soldado de adoquines en macizos." },
          { value: "plastic", label: "Bordillo de Plástico", scopeAddition: "Instalar bordillo de paisajismo de plástico en bordes de macizos." },
          { value: "none", label: "Sin Bordillo", scopeAddition: "Sin bordillo formal instalado; borde natural de macizo mantenido." }
        ]
      }
    }
  },
  "sod-install": {
    name: "Instalación Solo de Césped",
    warranty: "Garantía de establecimiento de 30 días (con programa de riego adecuado seguido).",
    exclusions: [
      "Instalación o reparación de sistema de riego",
      "Nivelación mayor o trabajo de drenaje",
      "Remoción de árboles o tocones",
      "Ajuste de cabezales de aspersores"
    ],
    baseScope: [
      "Remover césped existente o áreas de pasto muerto.",
      "Nivelar y emparejar suelo para drenaje adecuado.",
      "Agregar tierra vegetal según sea necesario para profundidad adecuada de césped (2-3 pulgadas).",
      "Aplicar fertilizante inicial al suelo preparado.",
      "Instalar césped fresco en patrón de ladrillo para estabilidad.",
      "Cortar césped para ajustar alrededor de bordes y obstáculos.",
      "Rodillar césped para asegurar contacto de raíces con suelo.",
      "Regar abundantemente inmediatamente después de instalación.",
      "Proporcionar programa detallado de riego para establecimiento.",
      "Limpiar todos los escombros y materiales sobrantes."
    ],
    options: {
      "sod-type": {
        label: "Tipo de Césped",
        choices: [
          { value: "fescue", label: "Fescue Alto", scopeAddition: "Instalar césped fescue alto adecuado para sombra parcial y temporadas frescas." },
          { value: "bermuda", label: "Pasto Bermuda", scopeAddition: "Instalar césped Bermuda para áreas de pleno sol y climas cálidos." },
          { value: "zoysia", label: "Pasto Zoysia", scopeAddition: "Instalar césped Zoysia para césped denso y tolerante a la sequía." },
          { value: "st-augustine", label: "San Agustín", scopeAddition: "Instalar césped San Agustín para climas costeros cálidos." }
        ]
      },
      "soil-amendment": { label: "Paquete de Enmienda de Suelo", scopeAddition: "Agregar composta y acondicionador de suelo para mejorar establecimiento de raíces y drenaje." }
    }
  },
  "planting-beds": {
    name: "Solo Plantación / Macizos de Flores",
    warranty: "Garantía de reemplazo de plantas de 1 año (con cuidado y riego adecuados).",
    exclusions: [
      "Instalación de riego",
      "Construcción de pavimento duro",
      "Remoción de árboles o plantación de árboles grandes",
      "Instalación de césped"
    ],
    baseScope: [
      "Revisar condiciones del sitio: exposición solar, tipo de suelo y drenaje.",
      "Remover plantas existentes según indicaciones del propietario.",
      "Definir bordes de macizos e instalar bordillo según se especifica.",
      "Enmendar suelo en áreas de plantación con composta y fertilizante.",
      "Instalar arbustos con espaciado adecuado para tamaño maduro.",
      "Instalar plantas perennes y cubresuelos según diseño.",
      "Aplicar mantillo a todos los macizos de plantación (profundidad de 3 pulgadas).",
      "Riego profundo de todas las plantas después de instalación.",
      "Limpiar todas las áreas de trabajo y escombros.",
      "Proporcionar identificación de plantas y guía de cuidado."
    ],
    options: {
      "planting-scope": {
        label: "Alcance de Plantación",
        choices: [
          { value: "new-beds", label: "Macizos Nuevos", scopeAddition: "Crear nuevos macizos de plantación con plantas frescas y mantillo." },
          { value: "refresh", label: "Renovar Macizos Existentes", scopeAddition: "Renovar macizos existentes con nuevo mantillo y plantas de reemplazo selectas." },
          { value: "shrubs", label: "Solo Arbustos", scopeAddition: "Instalar arbustos solamente según plan de paisajismo." },
          { value: "perennials", label: "Perennes y Color", scopeAddition: "Instalar plantas perennes y plantaciones de color estacional." },
          { value: "annuals", label: "Flores Anuales", scopeAddition: "Instalar flores anuales para color estacional." },
          { value: "small-trees", label: "Árboles Pequeños (menos de 15 pies)", scopeAddition: "Instalar árboles ornamentales pequeños (menos de 15 pies de altura madura)." },
          { value: "large-trees", label: "Árboles Grandes (más de 15 pies)", scopeAddition: "Instalar árboles de sombra o especímenes grandes (más de 15 pies de altura madura)." }
        ]
      },
      "edging-type": {
        label: "Tipo de Bordillo",
        choices: [
          { value: "steel", label: "Bordillo de Acero", scopeAddition: "Instalar bordillo de paisajismo de acero en todos los bordes de macizos." },
          { value: "stone", label: "Bordillo de Piedra Natural", scopeAddition: "Instalar bordillo de piedra natural en bordes de macizos." },
          { value: "paver", label: "Bordillo de Adoquines", scopeAddition: "Instalar curso de soldado de adoquines en macizos." },
          { value: "plastic", label: "Bordillo de Plástico", scopeAddition: "Instalar bordillo de paisajismo de plástico en bordes de macizos." },
          { value: "none", label: "Sin Bordillo", scopeAddition: "Sin bordillo formal instalado; borde natural de macizo mantenido." }
        ]
      },
      "mulch-type": {
        label: "Tipo de Mantillo",
        choices: [
          { value: "hardwood", label: "Mantillo de Madera Dura", scopeAddition: "Aplicar mantillo de madera dura doble triturado a todos los macizos." },
          { value: "pine", label: "Mantillo de Corteza de Pino", scopeAddition: "Aplicar mantillo de corteza de pino a todos los macizos." },
          { value: "cedar", label: "Mantillo de Cedro", scopeAddition: "Aplicar mantillo de cedro a todos los macizos para resistencia a insectos." },
          { value: "rubber", label: "Mantillo de Caucho", scopeAddition: "Aplicar mantillo de caucho a todos los macizos para cobertura duradera." }
        ]
      }
    }
  },
  "tree-work": {
    name: "Trabajo de Árboles – Plantación / Remoción / Poda",
    warranty: "Garantía de 1 año en árboles plantados (con cuidado adecuado). Sin garantía en remoción o poda.",
    exclusions: [
      "Árboles de más de 50 pies de altura",
      "Remoción de árboles peligrosos cerca de líneas eléctricas",
      "Trituración de tocones debajo del nivel del suelo",
      "Tarifas de permisos para especies de árboles protegidas"
    ],
    baseScope: [
      "Evaluar condición del árbol y discutir alcance del trabajo con propietario.",
      "Instalar barreras de seguridad y proteger paisajismo circundante.",
      "Realizar trabajo de árbol según se especifica en tipo de servicio.",
      "Triturar y remover todas las ramas y escombros del sitio.",
      "Limpiar a fondo todas las áreas de trabajo.",
      "Proporcionar instrucciones de cuidado para árboles plantados."
    ],
    options: {
      "tree-service": {
        label: "Tipo de Servicio de Árbol",
        choices: [
          { value: "plant-small", label: "Plantar Árbol Pequeño (menos de 8 pies)", scopeAddition: "Plantar árbol pequeño con exposición adecuada de raíz, estaca y anillo de mantillo." },
          { value: "plant-large", label: "Plantar Árbol Grande (8-15 pies)", scopeAddition: "Plantar árbol grande con exposición adecuada de raíz, cables guía y anillo de mantillo." },
          { value: "removal", label: "Remoción de Árbol", scopeAddition: "Remover árbol incluyendo tronco y ramas principales; dejar tocón a nivel del suelo." },
          { value: "trim", label: "Poda / Recorte de Árbol", scopeAddition: "Recortar y podar árbol según estándares ISA; remover madera muerta y dar forma a copa." },
          { value: "stump-grinding", label: "Trituración de Tocón", scopeAddition: "Triturar tocón a 6 pulgadas debajo del nivel y rellenar con tierra." }
        ]
      }
    }
  },
  "hardscape-patio": {
    name: "Pavimento Duro – Patio / Sendero",
    warranty: "Garantía de 2 años en mano de obra. Garantía del fabricante de adoquines aplica a materiales.",
    exclusions: [
      "Muros de contención de más de 2 pies",
      "Corrección mayor de drenaje",
      "Estructuras cubiertas o pérgolas",
      "Instalación de líneas eléctricas o de gas"
    ],
    baseScope: [
      "Llamar al 811 para ubicación de servicios previo a excavación.",
      "Trazar área de patio o sendero con estacas y cuerda.",
      "Excavar a profundidad adecuada para material base y adoquines.",
      "Compactar subrasante e instalar tela geotextil.",
      "Instalar y compactar base de piedra triturada (4-6 pulgadas).",
      "Instalar y nivelar cama de arena de asiento (1 pulgada).",
      "Instalar adoquines en patrón seleccionado con espaciado adecuado.",
      "Cortar adoquines en bordes con sierra húmeda para ajuste limpio.",
      "Instalar restricciones de borde para asegurar perímetro.",
      "Aplicar arena polimérica y compactar adoquines.",
      "Limpiar arena sobrante y sellar si se especifica.",
      "Limpieza final y remoción de escombros."
    ],
    options: {
      "hardscape-type": {
        label: "Tipo de Pavimento Duro",
        choices: [
          { value: "paver-patio", label: "Patio de Adoquines", scopeAddition: "Instalar patio de adoquines con base compactada y juntas de arena polimérica." },
          { value: "concrete-patio", label: "Patio de Concreto", scopeAddition: "Verter patio de concreto con pendiente adecuada, juntas de control y acabado de escoba." },
          { value: "overlay", label: "Recubrimiento de Adoquines sobre Concreto", scopeAddition: "Instalar adoquines delgados sobre superficie de concreto existente con adhesivo." },
          { value: "paver-walkway", label: "Sendero de Adoquines", scopeAddition: "Instalar sendero de adoquines (3-4 pies de ancho) con base compactada." },
          { value: "stepping-stones", label: "Camino de Piedras de Paso", scopeAddition: "Instalar piedras de paso en cama de grava o cubresuelos." },
          { value: "gravel-path", label: "Sendero de Grava", scopeAddition: "Instalar sendero de grava con bordillo de acero y tela de paisajismo." }
        ]
      },
      "fire-pit": { label: "Agregar Fogata", scopeAddition: "Instalar fogata empotrada con borde de adoquines o piedra y anillo de fuego." },
      "seating-wall": { label: "Agregar Muro de Asiento", scopeAddition: "Construir muro de asiento bajo (18-20 pulgadas) con bloque y piedras de coronamiento a juego." }
    }
  },
  "hardscape-retaining": {
    name: "Pavimento Duro – Muro de Contención",
    warranty: "Garantía de 2 años en mano de obra. Garantía del fabricante de bloques aplica a materiales.",
    exclusions: [
      "Muros de más de 4 pies que requieren ingeniería",
      "Tarifas de permisos",
      "Excavación mayor o material de relleno",
      "Sistema de drenaje más allá de base del muro"
    ],
    baseScope: [
      "Llamar al 811 para ubicación de servicios previo a excavación.",
      "Estacar y marcar ubicación del muro y nivel.",
      "Excavar zanja para curso base debajo de línea de helada.",
      "Compactar subrasante e instalar base de piedra triturada.",
      "Colocar primer curso nivelado y rellenar con grava de drenaje.",
      "Instalar cursos subsiguientes con retroceso adecuado.",
      "Instalar refuerzo de geomalla en intervalos especificados.",
      "Rellenar detrás del muro con grava de drenaje mientras el muro sube.",
      "Instalar tubería de drenaje perforada en base del muro.",
      "Instalar piedras de coronamiento con adhesivo.",
      "Rellenar y compactar suelo detrás del muro.",
      "Nivelación final y limpieza."
    ],
    options: {
      "wall-type": {
        label: "Tipo de Muro",
        choices: [
          { value: "block", label: "Muro de Bloque Segmental", scopeAddition: "Construir muro de contención usando sistema de bloque segmental entrelazado." },
          { value: "timber", label: "Muro de Madera", scopeAddition: "Construir muro de contención usando maderos de paisajismo tratados a presión." },
          { value: "stone", label: "Muro de Piedra Natural", scopeAddition: "Construir muro de contención usando piedra natural (apilado seco o con mortero)." }
        ]
      },
      "wall-height": {
        label: "Altura del Muro",
        choices: [
          { value: "2ft", label: "Hasta 2 Pies", scopeAddition: "Construir muro hasta 2 pies de altura expuesta." },
          { value: "3ft", label: "Hasta 3 Pies", scopeAddition: "Construir muro hasta 3 pies de altura expuesta." },
          { value: "4ft", label: "Hasta 4 Pies", scopeAddition: "Construir muro hasta 4 pies de altura expuesta (máximo sin ingeniería)." },
          { value: "6ft", label: "Hasta 6 Pies (Ingenierado)", scopeAddition: "Construir muro ingenierado hasta 6 pies (permiso e ingeniería requeridos)." }
        ]
      }
    }
  },
  "xeriscape": {
    name: "Conversión a Grava / Piedra / Xeriscape",
    warranty: "Garantía de 1 año en plantas instaladas. Sin garantía en materiales de roca o grava.",
    exclusions: [
      "Remoción o modificación de riego",
      "Nivelación mayor",
      "Instalación de cerca o pavimento duro",
      "Remoción de árboles"
    ],
    baseScope: [
      "Remover césped existente, plantas y escombros según se especifica.",
      "Nivelar área para drenaje adecuado alejándose de estructuras.",
      "Instalar tela barrera de malezas de grado profesional.",
      "Instalar bordillo de acero o aluminio en todos los bordes.",
      "Esparcir y nivelar material de roca o grava (profundidad de 2-3 pulgadas).",
      "Instalar plantas tolerantes a la sequía según diseño.",
      "Instalar rocas decorativas o piedras de acento según se especifica.",
      "Limpiar todas las áreas de trabajo y escombros.",
      "Proporcionar guía de cuidado para plantas tolerantes a la sequía."
    ],
    options: {
      "cover-type": {
        label: "Tipo de Cubierta de Suelo",
        choices: [
          { value: "gravel", label: "Grava de Guisante", scopeAddition: "Instalar cubierta de grava de guisante en áreas especificadas." },
          { value: "river-rock", label: "Piedra de Río", scopeAddition: "Instalar cubierta de piedra de río (tamaño de 1-3 pulgadas)." },
          { value: "decomposed-granite", label: "Granito Descompuesto", scopeAddition: "Instalar cubierta de granito descompuesto (compacta para superficie más firme)." },
          { value: "lava-rock", label: "Roca Volcánica", scopeAddition: "Instalar cubierta de roca volcánica para apariencia distintiva." }
        ]
      },
      "weed-barrier": { label: "Barrera de Malezas Premium", scopeAddition: "Mejorar a barrera de malezas tejida de grado comercial con calificación de 20 años." },
      "boulder-accents": { label: "Acentos de Rocas", scopeAddition: "Instalar rocas decorativas (3-5 piedras) como puntos focales en paisajismo." }
    }
  },
  "drainage": {
    name: "Solo Corrección de Drenaje",
    warranty: "Garantía de 2 años en mano de obra de drenaje.",
    exclusions: [
      "Reparación de cimentación",
      "Trabajo eléctrico de bomba de sumidero",
      "Restauración de paisajismo más allá de reparación de zanjas",
      "Trabajo de canaletas o bajantes"
    ],
    baseScope: [
      "Evaluar patrones de drenaje de la propiedad e identificar áreas problemáticas.",
      "Llamar al 811 para ubicación de servicios previo a excavación.",
      "Excavar zanjas con pendiente adecuada hacia salida.",
      "Instalar solución de drenaje según especificaciones.",
      "Rellenar zanjas y compactar suelo.",
      "Restaurar áreas de césped perturbadas con semilla o césped.",
      "Probar sistema de drenaje con flujo de agua.",
      "Limpiar todas las áreas de trabajo y escombros."
    ],
    options: {
      "drainage-type": {
        label: "Tipo de Drenaje",
        choices: [
          { value: "french-drain", label: "Drenaje Francés", scopeAddition: "Instalar drenaje francés con tubo perforado, grava y tela filtrante." },
          { value: "channel-drain", label: "Drenaje de Canal", scopeAddition: "Instalar drenaje de canal superficial con rejilla para drenaje de patio o entrada." },
          { value: "dry-creek", label: "Arroyo Seco", scopeAddition: "Instalar lecho de arroyo seco decorativo con piedra de río y tela de paisajismo." },
          { value: "sump-pump", label: "Foso de Bomba de Sumidero", scopeAddition: "Instalar foso de bomba de sumidero con bomba y línea de descarga (eléctrico por otros)." },
          { value: "grading", label: "Solo Renivelación", scopeAddition: "Renivelar suelo para corregir pendiente de drenaje alejándose de cimentación." }
        ]
      }
    }
  },
  "irrigation-install": {
    name: "Instalación / Mejora Sistema de Riego",
    warranty: "Garantía de 2 años en mano de obra. Garantía del fabricante en componentes.",
    exclusions: [
      "Permiso de prevención de reflujo (si se requiere)",
      "Mejora de medidor de agua",
      "Zanjas a través de concreto o asfalto",
      "Integración de hogar inteligente más allá del controlador"
    ],
    baseScope: [
      "Diseñar disposición de riego basada en necesidades de agua de plantas y exposición solar.",
      "Llamar al 811 para ubicación de servicios previo a zanjas.",
      "Conectar a suministro de agua existente con prevención de reflujo.",
      "Hacer zanjas e instalar línea principal y líneas laterales.",
      "Instalar válvulas de zona en caja(s) de válvulas.",
      "Instalar cabezales de aspersores y emisores de goteo por zona.",
      "Instalar controlador de riego en ubicación designada.",
      "Programar controlador con programa de riego apropiado.",
      "Probar todas las zonas y ajustar cobertura de cabezales.",
      "Rellenar zanjas y restaurar áreas de césped.",
      "Demostrar operación del sistema al propietario."
    ],
    options: {
      "irrigation-scope": {
        label: "Alcance de Riego",
        choices: [
          { value: "new-full", label: "Sistema Completo Nuevo", scopeAddition: "Instalar sistema de riego completamente nuevo con cobertura total de propiedad." },
          { value: "new-partial", label: "Sistema Parcial Nuevo", scopeAddition: "Instalar riego solo para patio delantero o trasero." },
          { value: "add-zones", label: "Agregar Zonas a Existente", scopeAddition: "Agregar nuevas zonas al sistema de riego existente." },
          { value: "drip-conversion", label: "Conversión a Goteo", scopeAddition: "Convertir zonas de aspersión existentes a riego por goteo para ahorro de agua." },
          { value: "controller-standard", label: "Mejora de Controlador (Estándar)", scopeAddition: "Reemplazar controlador existente con nuevo controlador multi-zona estándar." },
          { value: "controller-smart", label: "Mejora de Controlador (Inteligente)", scopeAddition: "Reemplazar controlador existente con controlador inteligente con WiFi." }
        ]
      }
    }
  },
  "irrigation-repair": {
    name: "Solo Reparación de Riego",
    warranty: "Garantía de 90 días en reparaciones.",
    exclusions: [
      "Roturas de línea principales que requieren excavación",
      "Reemplazo de prevención de reflujo",
      "Invernización completa del sistema",
      "Problemas de bomba de pozo"
    ],
    baseScope: [
      "Diagnosticar problema del sistema de riego.",
      "Cerrar suministro de agua al sistema.",
      "Realizar reparación según se especifica.",
      "Probar zona reparada para operación adecuada.",
      "Ajustar patrón de rociado y cobertura de cabezal según sea necesario.",
      "Encender sistema y verificar todas las zonas.",
      "Limpiar área de trabajo."
    ],
    options: {
      "repair-type": {
        label: "Tipo de Reparación",
        choices: [
          { value: "heads", label: "Reemplazar Cabezales de Aspersor", scopeAddition: "Reemplazar cabezales de aspersor rotos o tapados (hasta 5 cabezales)." },
          { value: "valves", label: "Reparar Válvula de Zona", scopeAddition: "Reparar o reemplazar válvula de zona con mal funcionamiento." },
          { value: "pipes", label: "Reparar Rotura de Tubo", scopeAddition: "Localizar y reparar rotura de tubo con acoplamiento de compresión." },
          { value: "controller", label: "Diagnóstico de Controlador", scopeAddition: "Diagnosticar y reparar problema de programación o cableado del controlador." },
          { value: "winterize", label: "Invernización", scopeAddition: "Soplar líneas de riego con aire comprimido para invierno." }
        ]
      }
    }
  },
  "fence-new": {
    name: "Instalación de Cerca – Nueva",
    warranty: "Garantía de 1 año en mano de obra. Garantías de materiales varían según tipo de cerca.",
    exclusions: [
      "Tarifas de permisos",
      "Levantamiento topográfico si hay disputa de límites de propiedad",
      "Perforación de roca para agujeros de postes",
      "Automatización de portón o cerraduras inteligentes"
    ],
    baseScope: [
      "Llamar al 811 para ubicación de servicios previo a excavación.",
      "Trazar línea de cerca según levantamiento de propiedad o acuerdo.",
      "Colocar postes de esquina y extremo en cimentaciones de concreto (profundidad de 24 pulgadas).",
      "Colocar postes de línea a espaciado adecuado en concreto.",
      "Permitir curado de concreto mínimo 24 horas.",
      "Instalar rieles horizontales entre postes.",
      "Fijar paneles o tablones de cerca con sujetadores de grado exterior.",
      "Instalar tapas de poste en todos los postes.",
      "Construir y colgar portón(es) con herrajes apropiados.",
      "Instalar pestillo de portón y bisagras de cierre automático.",
      "Limpiar todos los escombros y materiales sobrantes.",
      "Recorrido final y ajuste de portón."
    ],
    options: {
      "fence-type": {
        label: "Tipo de Cerca",
        choices: [
          { value: "wood-standard", label: "Madera – Privacidad Estándar", scopeAddition: "Instalar cerca de privacidad de madera estándar con tablones de oreja de perro." },
          { value: "wood-board-on-board", label: "Madera – Tablón sobre Tablón", scopeAddition: "Instalar cerca de madera tablón sobre tablón para privacidad total de ambos lados." },
          { value: "horizontal-wood", label: "Madera – Listón Horizontal", scopeAddition: "Instalar cerca moderna de listón horizontal de madera." },
          { value: "wrought-iron", label: "Hierro Forjado", scopeAddition: "Instalar cerca ornamental de hierro forjado con elementos decorativos." },
          { value: "vinyl", label: "Vinilo Privacidad", scopeAddition: "Instalar paneles de cerca de privacidad de vinilo (libre de mantenimiento)." },
          { value: "chain-link", label: "Malla Ciclón", scopeAddition: "Instalar cerca de malla ciclón galvanizada con riel superior." },
          { value: "ranch", label: "Rancho / Riel Dividido", scopeAddition: "Instalar cerca estilo rancho o riel dividido (no privacidad)." },
          { value: "composite", label: "Compuesto", scopeAddition: "Instalar paneles de cerca de compuesto (apariencia de madera, bajo mantenimiento)." },
          { value: "masonry", label: "Mampostería / Columnas de Ladrillo", scopeAddition: "Instalar columnas de mampostería con paneles de cerca entre ellas." }
        ]
      },
      "fence-height": {
        label: "Altura de Cerca",
        choices: [
          { value: "4ft", label: "4 Pies", scopeAddition: "Instalar cerca de 4 pies de altura." },
          { value: "6ft", label: "6 Pies", scopeAddition: "Instalar cerca estándar de 6 pies de altura." },
          { value: "8ft", label: "8 Pies", scopeAddition: "Instalar cerca de 8 pies de altura para máxima privacidad." }
        ]
      },
      "gate-options": {
        label: "Opciones de Portón",
        choices: [
          { value: "none", label: "Sin Portón", scopeAddition: "Sin portón incluido en instalación de cerca." },
          { value: "walk-gate", label: "Portón Peatonal Individual", scopeAddition: "Instalar portón peatonal individual (3-4 pies de ancho) con pestillo y bisagras." },
          { value: "double-gate", label: "Portón Doble Vehicular", scopeAddition: "Instalar portón doble vehicular (6-8 pies de ancho) para acceso de vehículos." },
          { value: "both", label: "Portón Peatonal + Portón Doble", scopeAddition: "Instalar tanto portón peatonal como portón doble vehicular." }
        ]
      },
      "finish": {
        label: "Opción de Acabado",
        choices: [
          { value: "none", label: "Sin Acabado (Natural)", scopeAddition: "Dejar cerca natural o como se fabricó." },
          { value: "stain-seal", label: "Tinte y Sellador", scopeAddition: "Aplicar tinte y sellador exterior a toda la cerca." },
          { value: "paint", label: "Pintura", scopeAddition: "Imprimar y pintar toda la cerca (2 capas)." }
        ]
      },
      "decorative-top": { label: "Riel Superior Decorativo", scopeAddition: "Agregar celosía decorativa o moldura superior a la cerca para apariencia mejorada." }
    }
  },
  "fence-replace": {
    name: "Reemplazo de Cerca",
    warranty: "Garantía de 1 año en mano de obra. Garantías de materiales varían según tipo de cerca.",
    exclusions: [
      "Tarifas de permisos",
      "Levantamiento topográfico si hay disputa de límites de propiedad",
      "Perforación de roca para agujeros de postes",
      "Automatización de portón"
    ],
    baseScope: [
      "Remover paneles de cerca existentes, postes y cimentaciones de concreto.",
      "Desechar todos los materiales de cerca viejos fuera del sitio.",
      "Llamar al 811 para ubicación de servicios si se necesitan nuevas ubicaciones de postes.",
      "Colocar nuevos postes en cimentaciones de concreto a espaciado adecuado.",
      "Permitir curado de concreto mínimo 24 horas.",
      "Instalar rieles horizontales entre postes.",
      "Fijar paneles o tablones de cerca con sujetadores de grado exterior.",
      "Instalar tapas de poste en todos los postes.",
      "Construir y colgar portón(es) con herrajes apropiados.",
      "Limpiar todos los escombros y materiales sobrantes.",
      "Recorrido final y ajuste."
    ],
    options: {
      "fence-type": {
        label: "Tipo de Cerca",
        choices: [
          { value: "wood-standard", label: "Madera – Privacidad Estándar", scopeAddition: "Instalar cerca de privacidad de madera estándar con tablones de oreja de perro." },
          { value: "wood-board-on-board", label: "Madera – Tablón sobre Tablón", scopeAddition: "Instalar cerca de madera tablón sobre tablón para privacidad total de ambos lados." },
          { value: "horizontal-wood", label: "Madera – Listón Horizontal", scopeAddition: "Instalar cerca moderna de listón horizontal de madera." },
          { value: "wrought-iron", label: "Hierro Forjado", scopeAddition: "Instalar cerca ornamental de hierro forjado con elementos decorativos." },
          { value: "vinyl", label: "Vinilo Privacidad", scopeAddition: "Instalar paneles de cerca de privacidad de vinilo (libre de mantenimiento)." },
          { value: "chain-link", label: "Malla Ciclón", scopeAddition: "Instalar cerca de malla ciclón galvanizada con riel superior." },
          { value: "ranch", label: "Rancho / Riel Dividido", scopeAddition: "Instalar cerca estilo rancho o riel dividido (no privacidad)." },
          { value: "composite", label: "Compuesto", scopeAddition: "Instalar paneles de cerca de compuesto (apariencia de madera, bajo mantenimiento)." },
          { value: "masonry", label: "Mampostería / Columnas de Ladrillo", scopeAddition: "Instalar columnas de mampostería con paneles de cerca entre ellas." }
        ]
      },
      "fence-height": {
        label: "Altura de Cerca",
        choices: [
          { value: "4ft", label: "4 Pies", scopeAddition: "Instalar cerca de 4 pies de altura." },
          { value: "6ft", label: "6 Pies", scopeAddition: "Instalar cerca estándar de 6 pies de altura." },
          { value: "8ft", label: "8 Pies", scopeAddition: "Instalar cerca de 8 pies de altura para máxima privacidad." }
        ]
      },
      "removal-haul": { label: "Remoción y Acarreo de Cerca Vieja", scopeAddition: "Remover y acarrear todos los materiales de cerca existentes (incluido en precio base)." },
      "gate-options": {
        label: "Opciones de Portón",
        choices: [
          { value: "none", label: "Sin Portón", scopeAddition: "Sin portón incluido en instalación de cerca." },
          { value: "walk-gate", label: "Portón Peatonal Individual", scopeAddition: "Instalar portón peatonal individual (3-4 pies de ancho) con pestillo y bisagras." },
          { value: "double-gate", label: "Portón Doble Vehicular", scopeAddition: "Instalar portón doble vehicular (6-8 pies de ancho) para acceso de vehículos." },
          { value: "both", label: "Portón Peatonal + Portón Doble", scopeAddition: "Instalar tanto portón peatonal como portón doble vehicular." }
        ]
      },
      "finish": {
        label: "Opción de Acabado",
        choices: [
          { value: "none", label: "Sin Acabado (Natural)", scopeAddition: "Dejar cerca natural o como se fabricó." },
          { value: "stain-seal", label: "Tinte y Sellador", scopeAddition: "Aplicar tinte y sellador exterior a toda la cerca." },
          { value: "paint", label: "Pintura", scopeAddition: "Imprimar y pintar toda la cerca (2 capas)." }
        ]
      }
    }
  },
  "fence-repair": {
    name: "Solo Reparación de Cerca",
    warranty: "Garantía de 90 días en reparaciones.",
    exclusions: [
      "Reemplazo completo de cerca",
      "Daño por tormenta que requiere reclamo de seguro",
      "Automatización de portón",
      "Pintura o tinte de cerca completa"
    ],
    baseScope: [
      "Evaluar daño de cerca y determinar alcance de reparación.",
      "Remover postes, paneles o secciones dañadas según sea necesario.",
      "Colocar postes de reemplazo en concreto si se requiere.",
      "Instalar rieles o tablones de reemplazo para coincidir con existentes.",
      "Asegurar todos los componentes con sujetadores de grado exterior.",
      "Ajustar operación de portón si está afectado.",
      "Limpiar todos los escombros.",
      "Aplicar acabado a secciones reparadas si se especifica."
    ],
    options: {
      "repair-scope": {
        label: "Alcance de Reparación",
        choices: [
          { value: "posts-only", label: "Reparación/Reemplazo de Postes", scopeAddition: "Reemplazar postes de cerca dañados o podridos (hasta 3 postes)." },
          { value: "panels-only", label: "Reparación de Panel/Tablón", scopeAddition: "Reemplazar paneles o tablones de cerca dañados (hasta 2 secciones)." },
          { value: "section", label: "Reemplazo de Sección", scopeAddition: "Reemplazar sección completa de cerca incluyendo postes, rieles y tablones." },
          { value: "gate-repair", label: "Reparación de Portón", scopeAddition: "Reparar problemas de caída de portón, pestillo o bisagras." }
        ]
      },
      "finish": {
        label: "Opción de Acabado",
        choices: [
          { value: "none", label: "Sin Acabado", scopeAddition: "Dejar reparaciones sin acabado para envejecer naturalmente." },
          { value: "stain-seal", label: "Tinte y Sellador en Reparaciones", scopeAddition: "Aplicar tinte y sellador solo a secciones reparadas." },
          { value: "paint", label: "Pintar Reparaciones", scopeAddition: "Imprimar y pintar secciones reparadas para coincidir con existente." }
        ]
      }
    }
  },
  "gate-install": {
    name: "Instalación / Reemplazo de Portón",
    warranty: "Garantía de 1 año en instalación de portón y herrajes.",
    exclusions: [
      "Modificación de cerca más allá de abertura de portón",
      "Automatización de portón o abridores eléctricos",
      "Trabajo de columnas de mampostería o ladrillo",
      "Tarifas de permisos"
    ],
    baseScope: [
      "Evaluar cerca existente y abertura de portón.",
      "Remover portón viejo y herrajes si se reemplaza.",
      "Reforzar o reemplazar postes de portón si es necesario.",
      "Construir o instalar nuevo portón para ajustar a abertura.",
      "Instalar bisagras de servicio pesado clasificadas para tamaño de portón.",
      "Instalar pestillo y cualquier herraje adicional.",
      "Ajustar portón para giro y despeje adecuados.",
      "Probar operación de portón y hacer ajustes finales."
    ],
    options: {
      "gate-type": {
        label: "Tipo de Portón",
        choices: [
          { value: "walk-gate", label: "Portón Peatonal (3-4 pies)", scopeAddition: "Instalar portón peatonal individual para acceso peatonal." },
          { value: "double-drive", label: "Portón Doble Vehicular (6-8 pies)", scopeAddition: "Instalar portón doble vehicular para acceso de vehículos o equipos." },
          { value: "automatic", label: "Portón Automático de Giro", scopeAddition: "Instalar portón automático de giro con abridor eléctrico y control remoto." }
        ]
      },
      "gate-material": {
        label: "Material de Portón",
        choices: [
          { value: "match-existing", label: "Coincidir con Cerca Existente", scopeAddition: "Construir portón para coincidir con material y estilo de cerca existente." },
          { value: "wood", label: "Madera", scopeAddition: "Construir portón de madera con marco de acero para durabilidad." },
          { value: "iron", label: "Hierro Forjado", scopeAddition: "Instalar portón decorativo de hierro forjado." },
          { value: "vinyl", label: "Vinilo", scopeAddition: "Instalar portón de vinilo para coincidir con cerca de vinilo." }
        ]
      }
    }
  },
  "yard-cleanup": {
    name: "Limpieza de Jardín (Una Vez)",
    warranty: "Sin garantía en servicios de limpieza.",
    exclusions: [
      "Remoción de árboles o poda mayor",
      "Reparación de cerca",
      "Trabajo de riego",
      "Mantenimiento continuo"
    ],
    baseScope: [
      "Limpiar todas las hojas y escombros del césped y macizos.",
      "Bordear todos los bordes de macizos y aceras.",
      "Podar arbustos sobrecrecidos (solo recorte ligero).",
      "Remover plantas muertas y anuales gastadas.",
      "Desmalezar todos los macizos de plantación.",
      "Rastrillar y nivelar áreas de césped.",
      "Soplar todas las superficies duras.",
      "Acarrear todos los escombros (si está incluido)."
    ],
    options: {
      "cleanup-scope": {
        label: "Alcance de Limpieza",
        choices: [
          { value: "basic", label: "Limpieza Básica", scopeAddition: "Limpieza básica: cortar, bordear, soplar y desmalezado ligero." },
          { value: "full", label: "Limpieza Completa", scopeAddition: "Limpieza completa: cortar, bordear, soplar, podar arbustos, desmalezar todos los macizos y retoque de mantillo." },
          { value: "heavy-brush", label: "Limpieza de Maleza Pesada", scopeAddition: "Limpieza pesada: limpiar maleza sobrecrecida, enredaderas y escombros acumulados." }
        ]
      },
      "debris-haul": { label: "Acarreo de Escombros", scopeAddition: "Acarrear todos los escombros de la limpieza (incluido en precio base)." }
    }
  },
  "maintenance": {
    name: "Mantenimiento Recurrente (Corte / Macizos)",
    warranty: "Satisfacción garantizada en cada visita.",
    exclusions: [
      "Poda mayor o trabajo de árboles",
      "Reparaciones de riego",
      "Tratamiento de plagas o enfermedades",
      "Plantaciones estacionales"
    ],
    baseScope: [
      "Cortar césped a altura apropiada para tipo de pasto.",
      "Bordear a lo largo de aceras, entradas y macizos.",
      "Recortar con hilo alrededor de obstáculos y líneas de cerca.",
      "Soplar recortes de todas las superficies duras.",
      "Desmalezar malezas visibles en macizos (dependiente del nivel de servicio).",
      "Verificar problemas obvios y reportar al propietario."
    ],
    options: {
      "service-level": {
        label: "Nivel de Servicio",
        choices: [
          { value: "basic-mowing", label: "Solo Corte Básico", scopeAddition: "Cortar, bordear, recortar con hilo y soplar; macizos no incluidos." },
          { value: "mowing-beds", label: "Corte + Cuidado de Macizos", scopeAddition: "Cortar, bordear, recortar, soplar, más desmalezar macizos y renovar mantillo según sea necesario." },
          { value: "full-service", label: "Servicio Completo", scopeAddition: "Cuidado completo de césped y macizos: cortar, bordear, recortar, soplar, desmalezar, podar arbustos y fertilización estacional." }
        ]
      }
    }
  }
};

// Type for Spanish translation structure
type SpanishTranslation = {
  name: string;
  baseScope: string[];
  warranty?: string;
  exclusions?: string[];
  options: Record<string, { 
    label: string; 
    scopeAddition?: string; 
    choices?: { value: string; label: string; scopeAddition?: string }[] 
  }>;
};

// Registry of Spanish translations by trade ID
const spanishTranslationsRegistry: Record<string, Record<string, SpanishTranslation>> = {
  "electrical": electricalJobTypesEs,
  "hvac": hvacJobTypesEs,
  "painting": paintingJobTypesEs,
  "landscaping": landscapingJobTypesEs,
};

/**
 * Get a localized version of a job type based on language.
 * When language is "es" (Spanish), overlays Spanish translations onto the job type.
 * Returns the original job type for English or if no translation exists.
 * 
 * @param jobType - The original English job type
 * @param tradeId - The trade category ID (e.g., "electrical", "hvac")
 * @param language - The target language ("en" or "es")
 * @returns A localized version of the job type
 */
export function getLocalizedJobType(jobType: JobType, tradeId: string, language: "en" | "es"): JobType {
  if (language === "en") {
    return jobType;
  }

  // Get Spanish translations for this trade
  const tradeTranslations = spanishTranslationsRegistry[tradeId];
  if (!tradeTranslations) {
    return jobType; // No Spanish translations for this trade
  }

  const translation = tradeTranslations[jobType.id];
  if (!translation) {
    return jobType; // No translation for this specific job type
  }

  // Overlay Spanish translations onto the job type
  const localizedOptions: JobOption[] = jobType.options.map(option => {
    const optionTranslation = translation.options[option.id];
    if (!optionTranslation) {
      return option; // No translation for this option
    }

    // Apply translated label and scopeAddition
    const localizedOption: JobOption = {
      ...option,
      label: optionTranslation.label,
      scopeAddition: optionTranslation.scopeAddition || option.scopeAddition,
    };

    // Apply translated choices if available
    if (option.choices && optionTranslation.choices) {
      localizedOption.choices = option.choices.map(choice => {
        const choiceTranslation = optionTranslation.choices?.find(c => c.value === choice.value);
        if (choiceTranslation) {
          return {
            ...choice,
            label: choiceTranslation.label,
            scopeAddition: choiceTranslation.scopeAddition || choice.scopeAddition,
          };
        }
        return choice;
      });
    }

    return localizedOption;
  });

  return {
    ...jobType,
    name: translation.name,
    baseScope: translation.baseScope,
    warranty: translation.warranty || jobType.warranty,
    exclusions: translation.exclusions || jobType.exclusions,
    options: localizedOptions,
  };
}

/**
 * Get all job types for a trade, localized to the specified language.
 * 
 * @param trade - The trade template
 * @param language - The target language ("en" or "es")
 * @returns Array of localized job types
 */
export function getLocalizedJobTypes(trade: Template, language: "en" | "es"): JobType[] {
  return trade.jobTypes.map(jobType => getLocalizedJobType(jobType, trade.id, language));
}

/**
 * Register Spanish translations for a new trade.
 * Call this function to add support for additional trades.
 * 
 * @param tradeId - The trade category ID
 * @param translations - The Spanish translations for this trade's job types
 */
export function registerSpanishTranslations(tradeId: string, translations: Record<string, SpanishTranslation>) {
  spanishTranslationsRegistry[tradeId] = translations;
}
