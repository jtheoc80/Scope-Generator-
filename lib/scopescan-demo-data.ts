/**
 * ScopeScan Demo Data
 * 
 * Sample data for the demo mode - allows users to see ScopeScan 
 * output without authentication or uploading their own photos.
 */

export type DemoScopeItem = {
  name: string;
  description: string;
  price: number;
};

export type DemoProject = {
  id: string;
  name: string;
  type: string;
  imageSrc: string;
  imageAlt: string;
  summary: string;
  scopeItems: DemoScopeItem[];
  packages: {
    GOOD: { total: number; label: string };
    BETTER: { total: number; label: string };
    BEST: { total: number; label: string };
  };
  location: string;
  generatedAt: string;
};

/**
 * Sample demo projects with realistic AI-generated scope output
 */
export const demoProjects: DemoProject[] = [
  {
    id: "demo-bathroom-1",
    name: "Master Bathroom Remodel",
    type: "Bathroom Remodel",
    imageSrc: "/images/scopescan/projects/bathroom-real.jpg",
    imageAlt: "Master bathroom remodel project",
    summary: "Complete master bathroom renovation including demolition of existing fixtures, installation of new tile flooring, updated vanity with quartz countertop, walk-in shower conversion, and modern lighting fixtures.",
    scopeItems: [
      { name: "Demolition & Removal", description: "Remove existing bathtub, vanity, toilet, and flooring. Dispose of debris.", price: 1200 },
      { name: "Plumbing Rough-In", description: "Relocate drain for walk-in shower, update supply lines, install new shut-off valves.", price: 1800 },
      { name: "Walk-In Shower Installation", description: "Custom tile shower with linear drain, glass door, and built-in niche.", price: 4500 },
      { name: "Tile Flooring", description: "Install 12x24 porcelain tile flooring with heated floor mat system.", price: 2200 },
      { name: "Vanity & Countertop", description: "60\" double vanity with soft-close drawers and quartz countertop.", price: 2800 },
      { name: "Toilet Installation", description: "Install new elongated comfort-height toilet with soft-close seat.", price: 650 },
      { name: "Lighting & Electrical", description: "Install vanity lighting, recessed shower light, exhaust fan upgrade.", price: 950 },
      { name: "Paint & Finishing", description: "Prime and paint walls and ceiling with moisture-resistant paint.", price: 800 },
      { name: "Hardware & Accessories", description: "Install towel bars, toilet paper holder, robe hooks, and mirror.", price: 450 },
      { name: "Final Inspection & Cleanup", description: "Complete final inspection, clean all surfaces, and dispose of remaining debris.", price: 350 },
    ],
    packages: {
      GOOD: { total: 12800, label: "Standard materials" },
      BETTER: { total: 15700, label: "Mid-grade materials" },
      BEST: { total: 19200, label: "Premium materials" },
    },
    location: "Sample Address, Any Town",
    generatedAt: "December 2024",
  },
  {
    id: "demo-kitchen-1",
    name: "Kitchen Renovation",
    type: "Kitchen Remodel",
    imageSrc: "/images/scopescan/projects/kitchen-real.jpg",
    imageAlt: "Kitchen renovation project",
    summary: "Kitchen upgrade including cabinet refacing, new countertops, backsplash installation, appliance updates, and improved lighting throughout the space.",
    scopeItems: [
      { name: "Cabinet Refacing", description: "Reface existing cabinet boxes with new doors, drawer fronts, and hardware.", price: 6500 },
      { name: "Countertop Installation", description: "Install quartz countertops with undermount sink cutout.", price: 4200 },
      { name: "Backsplash Tile", description: "Install subway tile backsplash from countertop to upper cabinets.", price: 1800 },
      { name: "Sink & Faucet", description: "Install stainless steel undermount sink with pull-down faucet.", price: 950 },
      { name: "Disposal & Plumbing", description: "Install garbage disposal and connect plumbing.", price: 450 },
      { name: "Under-Cabinet Lighting", description: "Install LED under-cabinet lighting with dimmer switch.", price: 650 },
      { name: "Pendant Lights", description: "Install 3 pendant lights over kitchen island.", price: 550 },
      { name: "Outlet Updates", description: "Add GFCI outlets for island and update existing outlets.", price: 480 },
      { name: "Paint & Touch-Up", description: "Paint walls and ceiling, touch up trim work.", price: 750 },
      { name: "Hardware Installation", description: "Install new cabinet knobs and pulls throughout.", price: 280 },
      { name: "Final Cleanup", description: "Clean all surfaces and remove construction debris.", price: 250 },
    ],
    packages: {
      GOOD: { total: 14500, label: "Standard finishes" },
      BETTER: { total: 17860, label: "Upgraded finishes" },
      BEST: { total: 22400, label: "Premium finishes" },
    },
    location: "Sample Address, Any Town",
    generatedAt: "December 2024",
  },
  {
    id: "demo-electrical-1",
    name: "Electrical Panel Upgrade",
    type: "Electrical",
    imageSrc: "/images/scopescan/projects/electrical-real.jpg",
    imageAlt: "Electrical panel upgrade project",
    summary: "Complete electrical panel upgrade from 100A to 200A service including new breaker panel, meter base, grounding system, and dedicated circuits for modern appliance loads.",
    scopeItems: [
      { name: "Permit & Inspection", description: "Pull electrical permit and coordinate utility disconnect/reconnect.", price: 450 },
      { name: "Disconnect Existing Panel", description: "Safely de-energize and remove existing 100A panel and meter base.", price: 600 },
      { name: "Install 200A Panel", description: "Mount and wire new 200A main breaker panel with 40-space load center.", price: 2800 },
      { name: "Meter Base Upgrade", description: "Install new 200A meter base and coordinate with utility for reconnection.", price: 950 },
      { name: "Grounding System", description: "Install new ground rods and bonding per NEC code requirements.", price: 650 },
      { name: "Circuit Transfer", description: "Transfer all existing circuits to new panel, label and map each circuit.", price: 1200 },
      { name: "Dedicated Circuits (2)", description: "Add two new 20A dedicated circuits for kitchen appliances.", price: 850 },
      { name: "AFCI/GFCI Protection", description: "Install AFCI and GFCI breakers where required by current code.", price: 480 },
      { name: "Final Testing & Cleanup", description: "Test all circuits, verify proper grounding, clean work area.", price: 350 },
    ],
    packages: {
      GOOD: { total: 7200, label: "Standard panel" },
      BETTER: { total: 8330, label: "With surge protection" },
      BEST: { total: 10500, label: "Smart panel + whole-home surge" },
    },
    location: "Sample Address, Any Town",
    generatedAt: "December 2024",
  },
];

/**
 * Get a specific demo project by ID
 */
export function getDemoProject(id: string): DemoProject | undefined {
  return demoProjects.find((p) => p.id === id);
}

/**
 * Get all demo project thumbnails for the gallery
 */
export function getDemoThumbnails() {
  return demoProjects.map((p) => ({
    id: p.id,
    name: p.name,
    type: p.type,
    imageSrc: p.imageSrc,
    imageAlt: p.imageAlt,
  }));
}
