import { z } from "zod";

export const tradeKeySchema = z.enum([
  "bathroom",
  "roofing",
  "hvac",
  "kitchen",
  "landscaping",
]);

export type TradeKey = z.infer<typeof tradeKeySchema>;

export const tradeDefinitionSchema = z.object({
  key: tradeKeySchema,
  name: z.string().min(1),
  heroTitle: z.string().min(1),
  heroSubtitle: z.string().min(1),
  whatsIncluded: z.array(z.string().min(1)).min(1),
  addOns: z.array(z.string().min(1)).default([]),
  cta: z.object({
    label: z.string().min(1),
  }),
});

export type TradeDefinition = z.infer<typeof tradeDefinitionSchema>;

export const tradeDefinitionsSchema = z.record(tradeKeySchema, tradeDefinitionSchema);

export const tradeDefinitions: Record<TradeKey, TradeDefinition> = {
  bathroom: {
    key: "bathroom",
    name: "Bathroom",
    heroTitle: "Bathroom proposals that win the job",
    heroSubtitle:
      "Start from a battle-tested bathroom remodel scope, customize a few options, and send a clean, professional proposal in minutes.",
    whatsIncluded: [
      "Trade + job type selection built for bathroom remodel workflows",
      "Prebuilt scope language (demo, waterproofing, tile, fixtures)",
      "Options like niches, benches, glass doors, and premium upgrades",
      "Estimated price range + timeline based on your selections",
      "Draft-first flow: generate now, add client details later",
    ],
    addOns: [
      "Custom tile patterns and premium grout/sealer",
      "Water damage discovery allowance / contingency line",
      "Fixture upgrade package (valves, trims, accessories)",
    ],
    cta: { label: "Create Bathroom Proposal" },
  },
  roofing: {
    key: "roofing",
    name: "Roofing",
    heroTitle: "Roofing scopes with clear assumptions & exclusions",
    heroSubtitle:
      "Generate roofing proposals that outline tear-off, underlayment, flashing, ventilation, cleanup, and warranties — without rewriting the same scope every time.",
    whatsIncluded: [
      "Project-type templates for common roofing jobs",
      "Scope language covering tear-off, install, flashing, ventilation, cleanup",
      "Exclusions and warranty boilerplate you can keep consistent",
      "Price range + estimated duration in the preview",
      "Export/email-ready proposal format",
    ],
    addOns: [
      "Sheathing replacement allowance (per sheet)",
      "Gutter + downspout add-on line items",
      "Upgraded underlayment / ice & water shield package",
    ],
    cta: { label: "Create Roofing Proposal" },
  },
  hvac: {
    key: "hvac",
    name: "HVAC",
    heroTitle: "HVAC proposals that feel engineered, not generic",
    heroSubtitle:
      "Build HVAC proposals with clear equipment scope, labor scope, and optional upgrades — then send a polished document your customers understand.",
    whatsIncluded: [
      "HVAC trade templates for service, repair, and replacement projects",
      "Option toggles for common upgrades (thermostats, IAQ, etc.)",
      "Draft save + restore so you never lose work",
      "Accurate formatting for scope, pricing range, and timeline",
      "Easy sharing/export once client details are added",
    ],
    addOns: [
      "Smart thermostat / zoning upgrades",
      "Duct sealing / ductwork repair line items",
      "Indoor air quality package (filtration / UV / humidification)",
    ],
    cta: { label: "Create HVAC Proposal" },
  },
  kitchen: {
    key: "kitchen",
    name: "Kitchen",
    heroTitle: "Kitchen remodel proposals with fewer omissions",
    heroSubtitle:
      "Use kitchen-specific scope language and options so your proposal stays complete and consistent — from demo to finishes.",
    whatsIncluded: [
      "Kitchen job templates (common remodel patterns)",
      "Scope structure for demo, cabinets, counters, fixtures, finishes",
      "Optional upgrades as toggles so the scope stays accurate",
      "Price range and timeline preview",
      "Professional proposal layout ready to send",
    ],
    addOns: [
      "Appliance installation package",
      "Cabinet hardware and soft-close upgrade",
      "Backsplash tile upgrade (pattern / material)",
    ],
    cta: { label: "Create Kitchen Proposal" },
  },
  landscaping: {
    key: "landscaping",
    name: "Landscaping",
    heroTitle: "Landscaping proposals with clean line items",
    heroSubtitle:
      "Turn landscaping scope into a client-ready proposal fast — with clear scope language for design, prep, install, and cleanup.",
    whatsIncluded: [
      "Templates for common landscaping project types",
      "Scope language for site prep, grading, planting, hardscape, and cleanup",
      "Optional add-ons you can toggle without rewriting the scope",
      "Draft-first workflow and autosave support",
      "Shareable proposal preview with price range + duration",
    ],
    addOns: [
      "Irrigation system add-on / zone upgrades",
      "Landscape lighting package",
      "Premium plant material allowance",
    ],
    cta: { label: "Create Landscaping Proposal" },
  },
};

// Runtime validation (useful for tests and to catch regressions early)
tradeDefinitionsSchema.parse(tradeDefinitions);

export function getTradeDefinition(trade: string): TradeDefinition | null {
  const parsed = tradeKeySchema.safeParse(trade);
  if (!parsed.success) return null;
  return tradeDefinitions[parsed.data];
}

