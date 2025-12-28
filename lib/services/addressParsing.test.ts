/**
 * Address Components Parsing Test Utility
 * 
 * This file provides test utilities for validating address_components parsing.
 * Run with: npx tsx lib/services/addressParsing.test.ts
 * 
 * The parseAddressComponents function extracts structured address fields from
 * Google Places API address_components array.
 */

// Type definitions for testing (mirrors Google Maps types)
interface MockAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

/**
 * Parse address_components from Google Places Place Details into structured fields.
 * This is a copy of the function from job-address.ts for testing purposes.
 */
function parseAddressComponents(
  addressComponents: MockAddressComponent[] | undefined
): {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  postalCodeSuffix?: string;
} | null {
  if (!addressComponents || addressComponents.length === 0) {
    return null;
  }
  
  let streetNumber = "";
  let route = "";
  let subpremise = "";
  let city = "";
  let state = "";
  let postalCode = "";
  let postalCodeSuffix = "";
  
  for (const component of addressComponents) {
    const types = component.types;
    const longName = component.long_name;
    const shortName = component.short_name;
    
    if (types.includes("street_number")) {
      streetNumber = longName;
    } else if (types.includes("route")) {
      route = longName;
    } else if (types.includes("subpremise")) {
      subpremise = longName;
    } else if (types.includes("locality")) {
      city = longName;
    } else if (types.includes("sublocality_level_1") && !city) {
      city = longName;
    } else if (types.includes("administrative_area_level_1")) {
      state = shortName;
    } else if (types.includes("postal_code")) {
      postalCode = longName;
    } else if (types.includes("postal_code_suffix")) {
      postalCodeSuffix = longName;
    }
  }
  
  const line1 = streetNumber && route 
    ? `${streetNumber} ${route}` 
    : route || streetNumber;
  
  if (!line1 || !city || !state || !postalCode) {
    return null;
  }
  
  return {
    line1,
    line2: subpremise || undefined,
    city,
    state,
    postalCode,
    postalCodeSuffix: postalCodeSuffix || undefined,
  };
}

// ============ TEST CASES ============

const testCases: Array<{
  name: string;
  input: MockAddressComponent[];
  expected: ReturnType<typeof parseAddressComponents>;
}> = [
  {
    name: "Standard US address",
    input: [
      { long_name: "123", short_name: "123", types: ["street_number"] },
      { long_name: "Main Street", short_name: "Main St", types: ["route"] },
      { long_name: "San Francisco", short_name: "SF", types: ["locality", "political"] },
      { long_name: "San Francisco County", short_name: "San Francisco County", types: ["administrative_area_level_2", "political"] },
      { long_name: "California", short_name: "CA", types: ["administrative_area_level_1", "political"] },
      { long_name: "United States", short_name: "US", types: ["country", "political"] },
      { long_name: "94102", short_name: "94102", types: ["postal_code"] },
    ],
    expected: {
      line1: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
    },
  },
  {
    name: "Address with unit/subpremise",
    input: [
      { long_name: "456", short_name: "456", types: ["street_number"] },
      { long_name: "Oak Avenue", short_name: "Oak Ave", types: ["route"] },
      { long_name: "Apt 2B", short_name: "Apt 2B", types: ["subpremise"] },
      { long_name: "Los Angeles", short_name: "LA", types: ["locality", "political"] },
      { long_name: "California", short_name: "CA", types: ["administrative_area_level_1", "political"] },
      { long_name: "90001", short_name: "90001", types: ["postal_code"] },
    ],
    expected: {
      line1: "456 Oak Avenue",
      line2: "Apt 2B",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
    },
  },
  {
    name: "Address with ZIP+4",
    input: [
      { long_name: "789", short_name: "789", types: ["street_number"] },
      { long_name: "Pine Road", short_name: "Pine Rd", types: ["route"] },
      { long_name: "Austin", short_name: "Austin", types: ["locality", "political"] },
      { long_name: "Texas", short_name: "TX", types: ["administrative_area_level_1", "political"] },
      { long_name: "78701", short_name: "78701", types: ["postal_code"] },
      { long_name: "1234", short_name: "1234", types: ["postal_code_suffix"] },
    ],
    expected: {
      line1: "789 Pine Road",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      postalCodeSuffix: "1234",
    },
  },
  {
    name: "NYC address with sublocality (borough)",
    input: [
      { long_name: "100", short_name: "100", types: ["street_number"] },
      { long_name: "Broadway", short_name: "Broadway", types: ["route"] },
      { long_name: "Manhattan", short_name: "Manhattan", types: ["sublocality_level_1", "political"] },
      { long_name: "New York County", short_name: "New York County", types: ["administrative_area_level_2", "political"] },
      { long_name: "New York", short_name: "NY", types: ["administrative_area_level_1", "political"] },
      { long_name: "10005", short_name: "10005", types: ["postal_code"] },
    ],
    expected: {
      line1: "100 Broadway",
      city: "Manhattan",
      state: "NY",
      postalCode: "10005",
    },
  },
  {
    name: "Missing street number (route only)",
    input: [
      { long_name: "Highway 101", short_name: "Hwy 101", types: ["route"] },
      { long_name: "Monterey", short_name: "Monterey", types: ["locality", "political"] },
      { long_name: "California", short_name: "CA", types: ["administrative_area_level_1", "political"] },
      { long_name: "93940", short_name: "93940", types: ["postal_code"] },
    ],
    expected: {
      line1: "Highway 101",
      city: "Monterey",
      state: "CA",
      postalCode: "93940",
    },
  },
  {
    name: "Empty input",
    input: [],
    expected: null,
  },
  {
    name: "Missing required fields (no postal code)",
    input: [
      { long_name: "123", short_name: "123", types: ["street_number"] },
      { long_name: "Main Street", short_name: "Main St", types: ["route"] },
      { long_name: "San Francisco", short_name: "SF", types: ["locality", "political"] },
      { long_name: "California", short_name: "CA", types: ["administrative_area_level_1", "political"] },
    ],
    expected: null,
  },
];

// ============ TEST RUNNER ============

function runTests() {
  console.log("Running address parsing tests...\n");
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = parseAddressComponents(testCase.input);
    const expectedStr = JSON.stringify(testCase.expected, null, 2);
    const resultStr = JSON.stringify(result, null, 2);
    
    if (expectedStr === resultStr) {
      console.log(`✅ PASS: ${testCase.name}`);
      passed++;
    } else {
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   Expected: ${expectedStr}`);
      console.log(`   Got: ${resultStr}`);
      failed++;
    }
  }
  
  console.log(`\n${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests if this file is executed directly
runTests();
