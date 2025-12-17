/**
 * Construction Knowledge Base
 * 
 * Built-in domain knowledge for construction trades.
 * Automatically includes commonly required components, materials,
 * and labor items based on the job type.
 * 
 * This runs silently in the background - no user interaction needed.
 */

// ==========================================
// Types
// ==========================================

export interface RequiredComponent {
  item: string;
  category: 'material' | 'labor' | 'fixture' | 'accessory' | 'prep' | 'cleanup';
  /** When this component is required */
  condition?: 'always' | 'typically' | 'if_needed';
  /** Default to include in scope */
  defaultIncluded: boolean;
  /** Keywords that indicate this component is already covered */
  coveredByKeywords?: string[];
}

export interface JobTypeKnowledge {
  jobTypeId: string;
  tradeName: string;
  /** Components that are always/typically needed */
  requiredComponents: RequiredComponent[];
  /** Common scope items that should be included */
  defaultScope: string[];
  /** Items often forgotten but important */
  commonOversights: string[];
  /** Typical prep work needed */
  prepWork: string[];
  /** Standard cleanup/completion items */
  completionItems: string[];
}

// ==========================================
// Plumbing Knowledge
// ==========================================

const toiletInstallation: JobTypeKnowledge = {
  jobTypeId: 'toilet-install',
  tradeName: 'Plumbing',
  requiredComponents: [
    { item: 'Wax ring seal', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Toilet supply line/hose', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Closet bolts (Johnny bolts)', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Toilet shims (if needed for leveling)', category: 'material', condition: 'if_needed', defaultIncluded: true },
    { item: 'Caulk for base seal', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'New shut-off valve', category: 'material', condition: 'if_needed', defaultIncluded: false, coveredByKeywords: ['valve', 'shut-off', 'shutoff'] },
  ],
  defaultScope: [
    'Remove and dispose of existing toilet',
    'Inspect flange condition',
    'Install new wax ring seal',
    'Set and level new toilet',
    'Connect water supply line',
    'Test for leaks and proper flush',
    'Caulk base of toilet',
  ],
  commonOversights: [
    'Flange repair/replacement if damaged',
    'Shut-off valve replacement if corroded',
  ],
  prepWork: [
    'Turn off water supply',
    'Drain and remove existing toilet',
    'Clean flange area',
  ],
  completionItems: [
    'Test multiple flushes',
    'Check for leaks at base and supply',
    'Clean work area',
  ],
};

const faucetInstallation: JobTypeKnowledge = {
  jobTypeId: 'faucet-install',
  tradeName: 'Plumbing',
  requiredComponents: [
    { item: 'Supply lines (hot and cold)', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Plumbers putty or silicone', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Teflon tape', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'P-trap (if replacing)', category: 'material', condition: 'if_needed', defaultIncluded: false },
    { item: 'New shut-off valves', category: 'material', condition: 'if_needed', defaultIncluded: false },
  ],
  defaultScope: [
    'Disconnect and remove existing faucet',
    'Clean sink surface',
    'Install new faucet with mounting hardware',
    'Connect hot and cold supply lines',
    'Test for leaks',
    'Check drain operation',
  ],
  commonOversights: [
    'Drain stopper linkage adjustment',
    'Supply line length verification before install',
  ],
  prepWork: [
    'Turn off water supply',
    'Clear under-sink area',
  ],
  completionItems: [
    'Run water and check all connections',
    'Test hot/cold operation',
    'Clean up work area',
  ],
};

const waterHeaterInstall: JobTypeKnowledge = {
  jobTypeId: 'water-heater-install',
  tradeName: 'Plumbing',
  requiredComponents: [
    { item: 'Expansion tank', category: 'accessory', condition: 'typically', defaultIncluded: true },
    { item: 'Discharge pipe for T&P valve', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Flexible water connectors', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Gas flex connector (if gas)', category: 'material', condition: 'if_needed', defaultIncluded: true },
    { item: 'Drip pan', category: 'accessory', condition: 'typically', defaultIncluded: true },
    { item: 'Earthquake straps', category: 'accessory', condition: 'if_needed', defaultIncluded: false },
    { item: 'Permit fees', category: 'labor', condition: 'always', defaultIncluded: true },
  ],
  defaultScope: [
    'Drain and disconnect existing water heater',
    'Remove and dispose of old unit',
    'Install new water heater',
    'Connect water supply lines',
    'Connect gas line (if applicable)',
    'Install T&P discharge pipe to code',
    'Install expansion tank',
    'Test for leaks and proper operation',
    'Adjust temperature setting',
  ],
  commonOversights: [
    'Expansion tank (required by code in most areas)',
    'T&P discharge pipe routed properly',
    'Gas line inspection for leaks',
  ],
  prepWork: [
    'Turn off gas/electric and water',
    'Drain existing unit',
    'Clear access path',
  ],
  completionItems: [
    'Leak test all connections',
    'Verify proper ignition/heating',
    'Explain operation to homeowner',
    'Schedule inspection if required',
  ],
};

// ==========================================
// Bathroom Remodel Knowledge
// ==========================================

const showerInstall: JobTypeKnowledge = {
  jobTypeId: 'shower-install',
  tradeName: 'Bathroom',
  requiredComponents: [
    { item: 'Shower valve (rough-in)', category: 'fixture', condition: 'always', defaultIncluded: true },
    { item: 'Shower head and arm', category: 'fixture', condition: 'always', defaultIncluded: true },
    { item: 'Shower drain assembly', category: 'fixture', condition: 'always', defaultIncluded: true },
    { item: 'Waterproof membrane/liner', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Cement board/backer board', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Thinset mortar', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Grout', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Silicone caulk', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Shower door/curtain rod', category: 'accessory', condition: 'typically', defaultIncluded: false },
  ],
  defaultScope: [
    'Demo existing shower/tub surround',
    'Inspect and repair framing as needed',
    'Install cement board substrate',
    'Apply waterproof membrane',
    'Install shower pan/base',
    'Rough-in plumbing (valve and drain)',
    'Install wall tile',
    'Grout tile joints',
    'Install shower fixtures (valve trim, head, drain cover)',
    'Caulk all corners and transitions',
    'Test for leaks',
  ],
  commonOversights: [
    'Waterproofing behind cement board',
    'Proper slope to drain (1/4" per foot)',
    'Moisture barrier extending to proper height',
    'Blocking for grab bars (ADA consideration)',
  ],
  prepWork: [
    'Protect flooring and adjacent areas',
    'Turn off water supply',
    'Remove existing fixtures',
  ],
  completionItems: [
    'Flood test shower pan',
    'Check all fixtures for leaks',
    'Clean tile and glass',
    'Final walkthrough with homeowner',
  ],
};

const vanityInstall: JobTypeKnowledge = {
  jobTypeId: 'vanity-install',
  tradeName: 'Bathroom',
  requiredComponents: [
    { item: 'Faucet', category: 'fixture', condition: 'always', defaultIncluded: true },
    { item: 'P-trap assembly', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Supply lines', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Drain assembly with stopper', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Silicone adhesive', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Wall anchors/mounting hardware', category: 'material', condition: 'typically', defaultIncluded: true },
  ],
  defaultScope: [
    'Remove existing vanity and disconnect plumbing',
    'Repair wall/floor as needed',
    'Install new vanity cabinet',
    'Install countertop and sink',
    'Install faucet and drain assembly',
    'Connect water supply lines',
    'Connect drain/P-trap',
    'Caulk countertop to wall',
    'Test for leaks',
  ],
  commonOversights: [
    'Wall repair behind old vanity',
    'Shut-off valve replacement if old/corroded',
    'Mirror/medicine cabinet reinstallation',
  ],
  prepWork: [
    'Turn off water supply',
    'Remove items from vanity',
    'Protect flooring',
  ],
  completionItems: [
    'Test all plumbing connections',
    'Check drawer/door operation',
    'Clean and polish fixtures',
  ],
};

const bathroomRemodel: JobTypeKnowledge = {
  jobTypeId: 'bathroom-remodel',
  tradeName: 'Bathroom',
  requiredComponents: [
    { item: 'All plumbing trim and fixtures', category: 'fixture', condition: 'always', defaultIncluded: true },
    { item: 'Exhaust fan (if replacing)', category: 'fixture', condition: 'typically', defaultIncluded: false },
    { item: 'GFCI outlets', category: 'fixture', condition: 'always', defaultIncluded: true },
    { item: 'Waterproofing materials', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Cement board', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Tile and installation materials', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'Paint', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'Trim/molding', category: 'material', condition: 'typically', defaultIncluded: true },
  ],
  defaultScope: [
    'Demolition of existing fixtures and finishes',
    'Rough plumbing modifications',
    'Electrical updates (GFCI outlets, fan)',
    'Install cement board in wet areas',
    'Waterproof shower/tub area',
    'Install tile (floor and walls)',
    'Install vanity and countertop',
    'Install toilet',
    'Install shower/tub fixtures',
    'Paint walls and ceiling',
    'Install trim and accessories',
    'Final plumbing connections and testing',
  ],
  commonOversights: [
    'Permit and inspection fees',
    'Exhaust fan venting to exterior',
    'Proper waterproofing in wet areas',
    'GFCI protection for all outlets',
    'Blocking for accessories (towel bars, etc.)',
  ],
  prepWork: [
    'Protect adjacent areas',
    'Set up dust containment',
    'Disconnect utilities',
    'Arrange for dumpster/debris removal',
  ],
  completionItems: [
    'Final inspection',
    'Touch-up paint',
    'Install all accessories',
    'Deep clean',
    'Walkthrough with homeowner',
  ],
};

// ==========================================
// Kitchen Knowledge
// ==========================================

const kitchenRemodel: JobTypeKnowledge = {
  jobTypeId: 'kitchen-remodel',
  tradeName: 'Kitchen',
  requiredComponents: [
    { item: 'Cabinet hardware', category: 'accessory', condition: 'always', defaultIncluded: true },
    { item: 'Under-cabinet lighting', category: 'fixture', condition: 'typically', defaultIncluded: false },
    { item: 'GFCI outlets', category: 'fixture', condition: 'always', defaultIncluded: true },
    { item: 'Appliance connections', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Plumbing supply/drain for sink', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Garbage disposal connection', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'Dishwasher supply and drain', category: 'material', condition: 'typically', defaultIncluded: true },
  ],
  defaultScope: [
    'Demolition of existing cabinets and countertops',
    'Electrical updates and GFCI outlets',
    'Plumbing rough-in modifications',
    'Install new cabinets',
    'Install countertops',
    'Install sink and faucet',
    'Connect garbage disposal',
    'Install backsplash',
    'Connect appliances',
    'Install cabinet hardware',
    'Touch-up and paint',
  ],
  commonOversights: [
    'Appliance clearances and connections',
    'Dishwasher air gap or high loop',
    'Range hood venting',
    'GFCI protection',
  ],
  prepWork: [
    'Disconnect appliances',
    'Empty cabinets',
    'Set up temporary kitchen area',
    'Protect flooring',
  ],
  completionItems: [
    'Test all appliances',
    'Check plumbing connections',
    'Adjust cabinet doors/drawers',
    'Final cleaning',
  ],
};

// ==========================================
// Flooring Knowledge
// ==========================================

const flooringInstall: JobTypeKnowledge = {
  jobTypeId: 'flooring-install',
  tradeName: 'Flooring',
  requiredComponents: [
    { item: 'Underlayment/padding', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Transition strips', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Quarter round/shoe molding', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'Floor leveling compound', category: 'material', condition: 'if_needed', defaultIncluded: false },
    { item: 'Adhesive (if glue-down)', category: 'material', condition: 'if_needed', defaultIncluded: false },
    { item: 'Moisture barrier', category: 'material', condition: 'if_needed', defaultIncluded: false },
  ],
  defaultScope: [
    'Remove existing flooring',
    'Prepare subfloor (clean, level, repair)',
    'Install underlayment/moisture barrier',
    'Acclimate flooring material',
    'Install new flooring',
    'Install transition strips at doorways',
    'Install quarter round/shoe molding',
    'Final cleaning',
  ],
  commonOversights: [
    'Subfloor preparation and leveling',
    'Acclimation time for wood/laminate',
    'Transition strips at different floor heights',
    'Removal and reinstall of baseboards',
    'Toilet removal/reinstall for bathroom floors',
  ],
  prepWork: [
    'Remove furniture from area',
    'Remove existing flooring',
    'Check subfloor condition',
    'Check for moisture issues',
  ],
  completionItems: [
    'Install all transitions',
    'Reinstall baseboards/molding',
    'Clean floors',
    'Dispose of debris',
  ],
};

const tileFloorInstall: JobTypeKnowledge = {
  jobTypeId: 'tile-floor-install',
  tradeName: 'Flooring',
  requiredComponents: [
    { item: 'Cement board/Ditra underlayment', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'Thinset mortar', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Grout', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Grout sealer', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Tile spacers', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Transition strips', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Tile edge trim', category: 'material', condition: 'if_needed', defaultIncluded: false },
  ],
  defaultScope: [
    'Remove existing flooring',
    'Prepare and level subfloor',
    'Install cement board underlayment',
    'Layout tile pattern',
    'Install tile with thinset',
    'Grout tile joints',
    'Seal grout',
    'Install transition strips',
    'Caulk perimeter and wet areas',
  ],
  commonOversights: [
    'Proper subfloor preparation',
    'Waterproofing in wet areas',
    'Grout sealing (especially in bathrooms)',
    'Expansion joints at walls',
  ],
  prepWork: [
    'Remove furniture and fixtures',
    'Remove existing flooring',
    'Check/repair subfloor',
  ],
  completionItems: [
    'Seal grout after curing',
    'Clean tile surface',
    'Reinstall toilet/fixtures',
    'Final inspection',
  ],
};

// ==========================================
// Electrical Knowledge
// ==========================================

const electricalPanel: JobTypeKnowledge = {
  jobTypeId: 'electrical-panel',
  tradeName: 'Electrical',
  requiredComponents: [
    { item: 'New breakers as needed', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Grounding electrode', category: 'material', condition: 'if_needed', defaultIncluded: false },
    { item: 'Service entrance cable', category: 'material', condition: 'if_needed', defaultIncluded: false },
    { item: 'Permit fees', category: 'labor', condition: 'always', defaultIncluded: true },
  ],
  defaultScope: [
    'Coordinate utility disconnect',
    'Remove existing panel',
    'Install new panel',
    'Transfer circuits to new breakers',
    'Label all circuits',
    'Install proper grounding',
    'Final connections',
    'Utility reconnection',
    'Final inspection',
  ],
  commonOversights: [
    'Utility coordination fees/timing',
    'Grounding upgrades to code',
    'Arc-fault breakers where required',
    'Panel labeling',
  ],
  prepWork: [
    'Schedule utility disconnect',
    'Pull permits',
    'Notify homeowner of outage',
  ],
  completionItems: [
    'Label all circuits',
    'Provide panel schedule to homeowner',
    'Final inspection sign-off',
  ],
};

// ==========================================
// HVAC Knowledge
// ==========================================

const hvacInstall: JobTypeKnowledge = {
  jobTypeId: 'hvac-install',
  tradeName: 'HVAC',
  requiredComponents: [
    { item: 'Refrigerant line set', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Thermostat wire', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Condensate drain line', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Disconnect box', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Concrete pad for condenser', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'New thermostat', category: 'fixture', condition: 'typically', defaultIncluded: false },
    { item: 'Permit fees', category: 'labor', condition: 'always', defaultIncluded: true },
  ],
  defaultScope: [
    'Remove existing equipment',
    'Install indoor unit (furnace/air handler)',
    'Install outdoor condenser unit',
    'Run refrigerant lines',
    'Connect electrical',
    'Install condensate drain',
    'Connect thermostat',
    'Charge system with refrigerant',
    'Test heating and cooling',
    'Program thermostat',
  ],
  commonOversights: [
    'Ductwork modifications/sealing',
    'Condensate drain routing',
    'Electrical circuit upgrade if needed',
    'Equipment pad/mounting',
  ],
  prepWork: [
    'Pull permits',
    'Size system properly',
    'Clear equipment access',
  ],
  completionItems: [
    'System startup and testing',
    'Thermostat programming',
    'Filter replacement schedule',
    'Homeowner orientation',
    'Final inspection',
  ],
};

// ==========================================
// Roofing Knowledge
// ==========================================

const roofReplacement: JobTypeKnowledge = {
  jobTypeId: 'roof-replacement',
  tradeName: 'Roofing',
  requiredComponents: [
    { item: 'Ice and water shield', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Synthetic underlayment', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Drip edge', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Ridge vent', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'Flashing (step, valley, pipe)', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Roofing nails/fasteners', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Pipe boots/collars', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Permit fees', category: 'labor', condition: 'typically', defaultIncluded: true },
  ],
  defaultScope: [
    'Remove existing shingles and underlayment',
    'Inspect and repair decking as needed',
    'Install ice and water shield at eaves/valleys',
    'Install synthetic underlayment',
    'Install drip edge',
    'Install new shingles',
    'Install ridge vent and cap',
    'Flash all penetrations',
    'Clean up and haul debris',
  ],
  commonOversights: [
    'Decking replacement (plywood/OSB)',
    'Chimney flashing',
    'Skylight flashing',
    'Gutter removal/reinstall',
    'Satellite dish/antenna relocation',
  ],
  prepWork: [
    'Order dumpster',
    'Protect landscaping',
    'Pull permits',
    'Check weather forecast',
  ],
  completionItems: [
    'Final inspection',
    'Magnetic sweep for nails',
    'Gutter cleaning',
    'Provide warranty documentation',
  ],
};

// ==========================================
// Windows & Doors Knowledge
// ==========================================

const windowReplacement: JobTypeKnowledge = {
  jobTypeId: 'window-replacement',
  tradeName: 'Windows',
  requiredComponents: [
    { item: 'Flashing tape', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Low-expansion foam', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Exterior caulk', category: 'material', condition: 'always', defaultIncluded: true },
    { item: 'Interior trim/casing', category: 'material', condition: 'typically', defaultIncluded: true },
    { item: 'Exterior trim (if needed)', category: 'material', condition: 'if_needed', defaultIncluded: false },
    { item: 'Backer rod', category: 'material', condition: 'typically', defaultIncluded: true },
  ],
  defaultScope: [
    'Remove existing window',
    'Inspect and prepare opening',
    'Flash window opening',
    'Install new window',
    'Insulate around frame',
    'Install interior trim',
    'Caulk exterior',
    'Test operation',
  ],
  commonOversights: [
    'Proper flashing sequence',
    'Lead paint considerations (pre-1978 homes)',
    'Interior trim matching',
    'Screen replacement',
  ],
  prepWork: [
    'Clear interior access',
    'Protect flooring',
    'Remove window treatments',
  ],
  completionItems: [
    'Test operation and locks',
    'Clean glass',
    'Touch-up paint if needed',
    'Dispose of old window',
  ],
};

// ==========================================
// Knowledge Base Registry
// ==========================================

const knowledgeBase: Record<string, JobTypeKnowledge> = {
  // Plumbing
  'toilet-install': toiletInstallation,
  'toilet-replacement': toiletInstallation,
  'faucet-install': faucetInstallation,
  'faucet-replacement': faucetInstallation,
  'water-heater': waterHeaterInstall,
  'water-heater-install': waterHeaterInstall,
  'water-heater-replacement': waterHeaterInstall,
  
  // Bathroom
  'shower-install': showerInstall,
  'shower-remodel': showerInstall,
  'tub-to-shower': showerInstall,
  'vanity-install': vanityInstall,
  'vanity-replacement': vanityInstall,
  'bathroom-remodel': bathroomRemodel,
  'bath-remodel': bathroomRemodel,
  'full-bath-remodel': bathroomRemodel,
  
  // Kitchen
  'kitchen-remodel': kitchenRemodel,
  'kitchen-renovation': kitchenRemodel,
  
  // Flooring
  'flooring': flooringInstall,
  'flooring-install': flooringInstall,
  'hardwood-floor': flooringInstall,
  'laminate-floor': flooringInstall,
  'lvp-floor': flooringInstall,
  'vinyl-floor': flooringInstall,
  'tile-floor': tileFloorInstall,
  'tile-flooring': tileFloorInstall,
  
  // Electrical
  'electrical-panel': electricalPanel,
  'panel-upgrade': electricalPanel,
  
  // HVAC
  'hvac': hvacInstall,
  'hvac-install': hvacInstall,
  'ac-install': hvacInstall,
  'furnace-install': hvacInstall,
  
  // Roofing
  'roof': roofReplacement,
  'roof-replacement': roofReplacement,
  'roofing': roofReplacement,
  're-roof': roofReplacement,
  
  // Windows
  'window': windowReplacement,
  'window-replacement': windowReplacement,
  'windows': windowReplacement,
};

// ==========================================
// Public API
// ==========================================

/**
 * Get construction knowledge for a job type
 */
export function getJobKnowledge(jobTypeId: string): JobTypeKnowledge | null {
  // Try exact match first
  if (knowledgeBase[jobTypeId]) {
    return knowledgeBase[jobTypeId];
  }
  
  // Try normalized match (lowercase, remove spaces/hyphens)
  const normalized = jobTypeId.toLowerCase().replace(/[\s-_]/g, '-');
  if (knowledgeBase[normalized]) {
    return knowledgeBase[normalized];
  }
  
  // Try partial match
  for (const [key, knowledge] of Object.entries(knowledgeBase)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return knowledge;
    }
  }
  
  return null;
}

/**
 * Get required components for a job that should be auto-included
 */
export function getRequiredComponents(jobTypeId: string): RequiredComponent[] {
  const knowledge = getJobKnowledge(jobTypeId);
  if (!knowledge) return [];
  
  return knowledge.requiredComponents.filter(c => c.defaultIncluded);
}

/**
 * Get default scope items for a job type
 */
export function getDefaultScope(jobTypeId: string): string[] {
  const knowledge = getJobKnowledge(jobTypeId);
  if (!knowledge) return [];
  
  return knowledge.defaultScope;
}

/**
 * Check if scope is missing commonly required items
 */
export function getMissingComponents(
  jobTypeId: string,
  currentScope: string[]
): RequiredComponent[] {
  const knowledge = getJobKnowledge(jobTypeId);
  if (!knowledge) return [];
  
  const scopeLower = currentScope.map(s => s.toLowerCase()).join(' ');
  
  return knowledge.requiredComponents.filter(component => {
    // Check if already covered by keywords
    if (component.coveredByKeywords) {
      const isCovered = component.coveredByKeywords.some(kw => 
        scopeLower.includes(kw.toLowerCase())
      );
      if (isCovered) return false;
    }
    
    // Check if item text appears in scope
    const itemWords = component.item.toLowerCase().split(/\s+/);
    const isInScope = itemWords.some(word => 
      word.length > 3 && scopeLower.includes(word)
    );
    
    return !isInScope && component.defaultIncluded;
  });
}

/**
 * Get completion/prep items that should be included
 */
export function getCompletionItems(jobTypeId: string): {
  prep: string[];
  completion: string[];
} {
  const knowledge = getJobKnowledge(jobTypeId);
  if (!knowledge) return { prep: [], completion: [] };
  
  return {
    prep: knowledge.prepWork,
    completion: knowledge.completionItems,
  };
}

/**
 * Enhance scope with commonly missed items
 * Returns items to add (silently in background)
 */
export function enhanceScopeWithKnowledge(
  jobTypeId: string,
  currentScope: string[]
): string[] {
  const missing = getMissingComponents(jobTypeId, currentScope);
  return missing.map(c => c.item);
}

export const constructionKnowledge = {
  getJobKnowledge,
  getRequiredComponents,
  getDefaultScope,
  getMissingComponents,
  getCompletionItems,
  enhanceScopeWithKnowledge,
};

export default constructionKnowledge;
