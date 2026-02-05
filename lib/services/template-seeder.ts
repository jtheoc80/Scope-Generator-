/**
 * Template seeder service - ensures active templates exist for mobile job types
 */

import { db } from '@/lib/services/db';
import { proposalTemplates, type TemplateJobOption } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Flag to track if seeding has been attempted this session
let seedingAttempted = false;

// Default templates for mobile job types
const defaultTemplates: Record<string, {
  tradeId: string;
  tradeName: string;
  jobTypeId: string;
  jobTypeName: string;
  baseScope: string[];
  options: TemplateJobOption[];
  basePriceLow: number;
  basePriceHigh: number;
  estimatedDaysLow: number;
  estimatedDaysHigh: number;
  warranty: string;
  exclusions: string[];
}> = {
  // Bathroom
  'bathroom-remodel': {
    tradeId: 'bathroom',
    tradeName: 'Bathroom',
    jobTypeId: 'bathroom-remodel',
    jobTypeName: 'Bathroom Remodel',
    baseScope: [
      'Complete assessment of existing bathroom layout and condition.',
      'Demolition of existing fixtures, flooring, and wall finishes as needed.',
      'Install new vanity cabinet with countertop and sink.',
      'Install new toilet with wax ring seal and supply line.',
      'Install new tub/shower system per plan specifications.',
      'Install tile flooring with proper waterproofing.',
      'Paint walls and ceiling with moisture-resistant paint.',
      'Install new light fixtures and exhaust fan.',
      'Final cleanup and walkthrough with homeowner.',
    ],
    options: [],
    basePriceLow: 12000,
    basePriceHigh: 25000,
    estimatedDaysLow: 7,
    estimatedDaysHigh: 14,
    warranty: '1-year labor warranty on all workmanship.',
    exclusions: ['Structural modifications', 'Plumbing rerouting beyond fixture locations'],
  },
  'shower-replacement': {
    tradeId: 'bathroom',
    tradeName: 'Bathroom',
    jobTypeId: 'shower-replacement',
    jobTypeName: 'Shower Replacement',
    baseScope: [
      'Remove existing shower/tub surround.',
      'Inspect and repair any water damage.',
      'Install new shower base or pan.',
      'Install waterproof membrane system.',
      'Install new shower walls (tile or prefab surround).',
      'Install new shower valve and fixtures.',
      'Install shower door or curtain rod.',
      'Caulk all seams and transitions.',
      'Final cleanup and debris removal.',
    ],
    options: [],
    basePriceLow: 4500,
    basePriceHigh: 9000,
    estimatedDaysLow: 3,
    estimatedDaysHigh: 5,
    warranty: '1-year labor warranty.',
    exclusions: ['Hidden water damage repair', 'Plumbing modifications'],
  },
  'tub-to-shower': {
    tradeId: 'bathroom',
    tradeName: 'Bathroom',
    jobTypeId: 'tub-to-shower',
    jobTypeName: 'Tub to Shower Conversion',
    baseScope: [
      'Demolish existing bathtub and surround.',
      'Dispose of all debris off-site.',
      'Inspect framing and plumbing for damage.',
      'Install new shower pan with proper slope.',
      'Install waterproof backer board on walls.',
      'Apply waterproof membrane to wet areas.',
      'Install new shower valve and trim.',
      'Install wall finish per selected system type.',
      'Install shower door and fixtures.',
      'Caulk all corners with mildew-resistant silicone.',
    ],
    options: [],
    basePriceLow: 8500,
    basePriceHigh: 12000,
    estimatedDaysLow: 5,
    estimatedDaysHigh: 8,
    warranty: '1-year labor warranty on all workmanship.',
    exclusions: ['Hidden water damage', 'Electrical upgrades beyond existing', 'Drain relocation may be required'],
  },
  'shower-remodel': {
    tradeId: 'bathroom',
    tradeName: 'Bathroom',
    jobTypeId: 'shower-remodel',
    jobTypeName: 'Shower Remodel',
    baseScope: [
      'Demolish existing shower surround and materials.',
      'Dispose of all debris off-site.',
      'Inspect framing and plumbing for damage.',
      'Install new shower base if required.',
      'Install waterproof backer board on walls.',
      'Apply waterproof membrane to wet areas.',
      'Install new shower valve and trim if included.',
      'Install wall finish per selected system type.',
      'Install shower door or curtain rod.',
      'Caulk all corners with mildew-resistant silicone.',
    ],
    options: [],
    basePriceLow: 6500,
    basePriceHigh: 10000,
    estimatedDaysLow: 4,
    estimatedDaysHigh: 7,
    warranty: '1-year labor warranty on all workmanship.',
    exclusions: ['Hidden water damage', 'Drain relocation may be required', 'Glass lead time may extend schedule'],
  },
  'walk-in-tub': {
    tradeId: 'bathroom',
    tradeName: 'Bathroom',
    jobTypeId: 'walk-in-tub',
    jobTypeName: 'Walk-In Tub Installation',
    baseScope: [
      'Protect floors and adjacent areas.',
      'Remove existing bathtub and surround.',
      'Dispose of all debris off-site.',
      'Inspect and repair subfloor as needed.',
      'Verify water supply lines and shutoffs.',
      'Modify drain alignment as needed for walk-in tub.',
      'Install walk-in tub unit; level and secure.',
      'Connect all plumbing and electrical components.',
      'Install tub filler and handheld shower if selected.',
      'Verify electrical capacity; install GFCI circuit if jets/heater selected.',
      'Install wall surround panels.',
      'Test door seal, leaks, and all functions.',
      'Final cleanup and homeowner walkthrough.',
    ],
    options: [],
    basePriceLow: 8000,
    basePriceHigh: 15000,
    estimatedDaysLow: 3,
    estimatedDaysHigh: 5,
    warranty: '2-year labor warranty. Manufacturer warranty on tub components.',
    exclusions: ['Subfloor repair beyond minor repairs', 'Panel upgrades', 'Water heater replacement'],
  },
  
  // Kitchen
  'kitchen-remodel': {
    tradeId: 'kitchen',
    tradeName: 'Kitchen',
    jobTypeId: 'kitchen-remodel',
    jobTypeName: 'Kitchen Remodel',
    baseScope: [
      'Complete demolition of existing cabinets and countertops.',
      'Remove existing flooring and backsplash.',
      'Install new base and wall cabinets.',
      'Install new countertops.',
      'Install new kitchen sink and faucet.',
      'Connect existing appliances.',
      'Install tile backsplash.',
      'Install new flooring.',
      'Paint walls and ceiling.',
      'Install under-cabinet lighting.',
      'Final cleanup and walkthrough.',
    ],
    options: [],
    basePriceLow: 25000,
    basePriceHigh: 55000,
    estimatedDaysLow: 10,
    estimatedDaysHigh: 21,
    warranty: '2-year labor warranty.',
    exclusions: ['Appliance costs', 'Structural modifications', 'Electrical panel upgrades'],
  },
  'cabinet-refacing': {
    tradeId: 'kitchen',
    tradeName: 'Kitchen',
    jobTypeId: 'cabinet-refacing',
    jobTypeName: 'Cabinet Refacing',
    baseScope: [
      'Remove all cabinet doors, drawer fronts, and hardware.',
      'Clean and prepare cabinet boxes.',
      'Apply new veneer or laminate to cabinet frames.',
      'Install new doors and drawer fronts.',
      'Install new hinges and drawer slides.',
      'Install new hardware (handles/knobs).',
      'Touch up and adjust all doors.',
      'Final cleanup.',
    ],
    options: [],
    basePriceLow: 8000,
    basePriceHigh: 15000,
    estimatedDaysLow: 3,
    estimatedDaysHigh: 5,
    warranty: '5-year warranty on refacing materials.',
    exclusions: ['Cabinet box replacement', 'Layout changes'],
  },
  'countertop-replacement': {
    tradeId: 'kitchen',
    tradeName: 'Kitchen',
    jobTypeId: 'countertop-replacement',
    jobTypeName: 'Countertop Replacement',
    baseScope: [
      'Disconnect and protect sink and cooktop.',
      'Remove existing countertops carefully.',
      'Inspect and level cabinet tops.',
      'Template and fabricate new countertops.',
      'Install new countertops with appropriate adhesive.',
      'Cut and install sink and cooktop openings.',
      'Reconnect sink and cooktop.',
      'Apply silicone sealant at backsplash.',
      'Final cleanup and inspection.',
    ],
    options: [],
    basePriceLow: 3500,
    basePriceHigh: 8000,
    estimatedDaysLow: 1,
    estimatedDaysHigh: 3,
    warranty: 'Manufacturer warranty on materials.',
    exclusions: ['Sink/faucet replacement', 'Backsplash work'],
  },
  
  // Exterior
  'roofing': {
    tradeId: 'roofing',
    tradeName: 'Roofing',
    jobTypeId: 'roofing',
    jobTypeName: 'Roof Replacement',
    baseScope: [
      'Set up safety equipment and protect landscaping.',
      'Remove existing roofing materials down to decking.',
      'Inspect and replace damaged decking as needed.',
      'Install ice and water shield in valleys and eaves.',
      'Install synthetic underlayment.',
      'Install new drip edge and flashing.',
      'Install new shingles per manufacturer specs.',
      'Install ridge vent and cap shingles.',
      'Flash all penetrations (vents, pipes, chimneys).',
      'Clean up all debris and dispose off-site.',
      'Final inspection and walkthrough.',
    ],
    options: [],
    basePriceLow: 8000,
    basePriceHigh: 18000,
    estimatedDaysLow: 2,
    estimatedDaysHigh: 4,
    warranty: 'Manufacturer shingle warranty. 5-year workmanship warranty.',
    exclusions: ['Structural repairs', 'Chimney rebuilding', 'Skylight replacement'],
  },
  'siding': {
    tradeId: 'siding',
    tradeName: 'Siding',
    jobTypeId: 'siding',
    jobTypeName: 'Siding Installation',
    baseScope: [
      'Remove existing siding and dispose.',
      'Inspect and repair sheathing as needed.',
      'Install house wrap/moisture barrier.',
      'Install starter strips and J-channels.',
      'Install new siding panels.',
      'Install corner posts and trim.',
      'Caulk all penetrations and seams.',
      'Clean up and final inspection.',
    ],
    options: [],
    basePriceLow: 10000,
    basePriceHigh: 25000,
    estimatedDaysLow: 3,
    estimatedDaysHigh: 7,
    warranty: 'Manufacturer warranty on materials. 2-year labor warranty.',
    exclusions: ['Structural repairs', 'Window replacement', 'Painting'],
  },
  'windows': {
    tradeId: 'windows',
    tradeName: 'Windows',
    jobTypeId: 'windows',
    jobTypeName: 'Window Replacement',
    baseScope: [
      'Remove existing windows carefully.',
      'Inspect and repair frame as needed.',
      'Apply weatherproofing membrane.',
      'Install new windows with proper shimming.',
      'Insulate gaps with low-expansion foam.',
      'Install interior and exterior trim.',
      'Caulk all exterior seams.',
      'Clean windows and remove debris.',
      'Test operation and verify locks.',
    ],
    options: [],
    basePriceLow: 5000,
    basePriceHigh: 15000,
    estimatedDaysLow: 1,
    estimatedDaysHigh: 3,
    warranty: 'Manufacturer warranty on windows. 1-year labor warranty.',
    exclusions: ['Structural modifications', 'Interior painting'],
  },
  'doors': {
    tradeId: 'doors',
    tradeName: 'Doors',
    jobTypeId: 'doors',
    jobTypeName: 'Door Installation',
    baseScope: [
      'Remove existing door and hardware.',
      'Inspect and repair frame as needed.',
      'Install new pre-hung door unit.',
      'Shim and level door in opening.',
      'Secure door frame with screws.',
      'Insulate gaps with foam.',
      'Install interior and exterior trim.',
      'Install new hardware (lockset, deadbolt).',
      'Adjust door for proper operation.',
      'Weatherstrip and threshold adjustment.',
    ],
    options: [],
    basePriceLow: 800,
    basePriceHigh: 3500,
    estimatedDaysLow: 1,
    estimatedDaysHigh: 1,
    warranty: '1-year labor warranty.',
    exclusions: ['Structural modifications', 'Painting'],
  },
  
  // Systems
  'hvac': {
    tradeId: 'hvac',
    tradeName: 'HVAC',
    jobTypeId: 'hvac',
    jobTypeName: 'HVAC Service & Repair',
    baseScope: [
      'Comprehensive system inspection.',
      'Check refrigerant levels and pressures.',
      'Inspect electrical connections.',
      'Clean condenser and evaporator coils.',
      'Check and clean drain lines.',
      'Replace air filters.',
      'Test thermostat operation.',
      'Check ductwork for leaks.',
      'Lubricate moving parts.',
      'Test system operation in all modes.',
      'Provide maintenance recommendations.',
    ],
    options: [],
    basePriceLow: 150,
    basePriceHigh: 500,
    estimatedDaysLow: 1,
    estimatedDaysHigh: 1,
    warranty: '90-day warranty on repairs.',
    exclusions: ['Refrigerant recharge', 'Major component replacement'],
  },
  'plumbing': {
    tradeId: 'plumbing',
    tradeName: 'Plumbing',
    jobTypeId: 'plumbing',
    jobTypeName: 'Plumbing Service & Repair',
    baseScope: [
      'Diagnose plumbing issue.',
      'Shut off water supply as needed.',
      'Perform necessary repairs.',
      'Replace worn parts and seals.',
      'Test for leaks.',
      'Restore water supply.',
      'Clean up work area.',
      'Provide maintenance recommendations.',
    ],
    options: [],
    basePriceLow: 150,
    basePriceHigh: 650,
    estimatedDaysLow: 1,
    estimatedDaysHigh: 1,
    warranty: '1-year warranty on parts and labor.',
    exclusions: ['Major repiping', 'Sewer line replacement'],
  },
  'electrical': {
    tradeId: 'electrical',
    tradeName: 'Electrical',
    jobTypeId: 'electrical',
    jobTypeName: 'Electrical Service & Repair',
    baseScope: [
      'Diagnose electrical issue.',
      'Turn off power at breaker.',
      'Perform necessary repairs.',
      'Replace outlets, switches, or fixtures as needed.',
      'Test all circuits.',
      'Restore power and verify operation.',
      'Clean up work area.',
      'Provide safety recommendations.',
    ],
    options: [],
    basePriceLow: 150,
    basePriceHigh: 500,
    estimatedDaysLow: 1,
    estimatedDaysHigh: 1,
    warranty: '1-year warranty on workmanship.',
    exclusions: ['Panel upgrades', 'Rewiring'],
  },
  
  // Other
  'flooring': {
    tradeId: 'flooring',
    tradeName: 'Flooring',
    jobTypeId: 'flooring',
    jobTypeName: 'Flooring Installation',
    baseScope: [
      'Remove existing flooring.',
      'Inspect and prepare subfloor.',
      'Level subfloor as needed.',
      'Install moisture barrier if required.',
      'Acclimate new flooring material.',
      'Install new flooring per manufacturer specs.',
      'Install transitions and trim.',
      'Clean and inspect finished floor.',
      'Move furniture back into place.',
    ],
    options: [],
    basePriceLow: 3000,
    basePriceHigh: 10000,
    estimatedDaysLow: 2,
    estimatedDaysHigh: 5,
    warranty: 'Manufacturer warranty on materials. 1-year labor warranty.',
    exclusions: ['Furniture moving (large items)', 'Subfloor replacement'],
  },
  'painting': {
    tradeId: 'painting',
    tradeName: 'Painting',
    jobTypeId: 'painting',
    jobTypeName: 'Interior/Exterior Painting',
    baseScope: [
      'Protect floors and furniture.',
      'Prepare surfaces (clean, sand, fill holes).',
      'Apply primer where needed.',
      'Caulk gaps and cracks.',
      'Apply two coats of paint.',
      'Cut in edges and trim.',
      'Remove all protection materials.',
      'Final touch-up and inspection.',
      'Clean up work area.',
    ],
    options: [],
    basePriceLow: 2000,
    basePriceHigh: 8000,
    estimatedDaysLow: 2,
    estimatedDaysHigh: 5,
    warranty: '2-year warranty on workmanship.',
    exclusions: ['Lead paint abatement', 'Wallpaper removal', 'Extensive repairs'],
  },
  'demo': {
    tradeId: 'general',
    tradeName: 'General',
    jobTypeId: 'demo',
    jobTypeName: 'General Demo/Estimate',
    baseScope: [
      'Site visit and assessment.',
      'Document existing conditions with photos.',
      'Measure and record dimensions.',
      'Discuss project goals with homeowner.',
      'Identify potential issues.',
      'Prepare detailed estimate.',
      'Review scope of work.',
      'Answer questions and provide recommendations.',
    ],
    options: [],
    basePriceLow: 0,
    basePriceHigh: 500,
    estimatedDaysLow: 1,
    estimatedDaysHigh: 1,
    warranty: 'N/A - Consultation/Estimate',
    exclusions: ['Actual work not included in estimate'],
  },
  
  // Exterior - Fence & Driveway
  'fence': {
    tradeId: 'fence',
    tradeName: 'Fence',
    jobTypeId: 'fence',
    jobTypeName: 'Fence Installation',
    baseScope: [
      'Survey property line and mark fence layout.',
      'Call 811 for utility locate before digging.',
      'Set corner and end posts in concrete footings.',
      'Install line posts at standard spacing.',
      'Attach rails to posts.',
      'Install fence boards/panels.',
      'Install gate hardware and hang gate(s).',
      'Final cleanup and debris removal.',
    ],
    options: [],
    basePriceLow: 3000,
    basePriceHigh: 8000,
    estimatedDaysLow: 2,
    estimatedDaysHigh: 5,
    warranty: '1-year warranty on workmanship. Manufacturer warranty on materials.',
    exclusions: ['Permit fees', 'Survey if required', 'Tree/stump removal', 'Grading'],
  },
  'driveway': {
    tradeId: 'driveway',
    tradeName: 'Driveway',
    jobTypeId: 'driveway',
    jobTypeName: 'Driveway Installation',
    baseScope: [
      'Site assessment and measurement.',
      'Remove existing driveway material if applicable.',
      'Grade and compact subbase.',
      'Install aggregate base layer.',
      'Install forms/edging as needed.',
      'Pour and finish concrete/asphalt.',
      'Apply sealer if included.',
      'Final cleanup and curing time guidance.',
    ],
    options: [],
    basePriceLow: 4000,
    basePriceHigh: 12000,
    estimatedDaysLow: 2,
    estimatedDaysHigh: 5,
    warranty: '1-year warranty on workmanship.',
    exclusions: ['Permit fees', 'Utility relocation', 'Extensive grading', 'Drainage systems'],
  },
};

/**
 * Get the default template data for a given job type ID.
 * Returns null if no default template exists for the job type.
 */
export function getDefaultTemplateForJobType(jobTypeId: string): typeof defaultTemplates[string] | null {
  return defaultTemplates[jobTypeId] || null;
}

/**
 * Canonical list of active job type IDs.
 * This is the source of truth for all job types supported by the system.
 * UI components should use this to validate/filter job types.
 */
export const ACTIVE_JOB_TYPE_IDS = Object.keys(defaultTemplates) as readonly string[];

/**
 * Check if a job type ID is valid (exists in the active templates).
 * Use this to guard against invalid persisted or URL-provided job types.
 */
export function isValidJobTypeId(jobTypeId: string): boolean {
  return jobTypeId in defaultTemplates;
}

/**
 * Get all default template job type IDs
 */
export function getDefaultTemplateJobTypes(): string[] {
  return Object.keys(defaultTemplates);
}

/**
 * Ensures active templates exist in the database for all mobile job types.
 * This is called on-demand when a template is not found.
 */
export async function ensureActiveTemplates(): Promise<{ inserted: number; updated: number }> {
  // Only attempt seeding once per session to avoid repeated DB queries
  if (seedingAttempted) {
    return { inserted: 0, updated: 0 };
  }
  seedingAttempted = true;

  let inserted = 0;
  let updated = 0;

  try {
    for (const [jobTypeId, template] of Object.entries(defaultTemplates)) {
      // Check if template already exists
      const [existing] = await db
        .select()
        .from(proposalTemplates)
        .where(eq(proposalTemplates.jobTypeId, jobTypeId))
        .limit(1);

      if (existing) {
        // Update to ensure isActive is true if it was inactive
        if (!existing.isActive) {
          await db
            .update(proposalTemplates)
            .set({ isActive: true, updatedAt: new Date() })
            .where(eq(proposalTemplates.id, existing.id));
          updated++;
          console.log(`[template-seeder] Activated: ${jobTypeId}`);
        }
      } else {
        // Insert new template
        await db.insert(proposalTemplates).values({
          tradeId: template.tradeId,
          tradeName: template.tradeName,
          jobTypeId: template.jobTypeId,
          jobTypeName: template.jobTypeName,
          baseScope: template.baseScope,
          options: template.options,
          basePriceLow: template.basePriceLow,
          basePriceHigh: template.basePriceHigh,
          estimatedDaysLow: template.estimatedDaysLow,
          estimatedDaysHigh: template.estimatedDaysHigh,
          warranty: template.warranty,
          exclusions: template.exclusions,
          isDefault: true,
          isActive: true,
          createdBy: null, // System template
          usageCount: 0,
        });
        inserted++;
        console.log(`[template-seeder] Inserted: ${jobTypeId}`);
      }
    }

    if (inserted > 0 || updated > 0) {
      console.log(`[template-seeder] Complete: ${inserted} inserted, ${updated} activated`);
    }
  } catch (error) {
    console.error('[template-seeder] Error seeding templates:', error);
  }

  return { inserted, updated };
}

/**
 * Reset the seeding flag (useful for testing)
 */
export function resetSeedingFlag(): void {
  seedingAttempted = false;
}
