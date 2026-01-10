/**
 * Draft Persistence Module Unit Tests
 * 
 * Tests for serialization, deserialization, and schema version handling.
 * Run with: npx tsx lib/draft-persistence.test.ts
 */

import {
  DRAFT_SCHEMA_VERSION,
  getDraftStorageKey,
  createEmptyDraft,
  serializeDraft,
  deserializeDraft,
  draftHasContent,
  draftsAreEqual,
  formatRelativeTime,
  type ProposalDraft,
  type PersistedDraft,
} from './draft-persistence';

// ============ TEST UTILITIES ============

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    failed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message: string) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr === expectedStr) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${message}`);
    console.log(`   Expected: ${expectedStr}`);
    console.log(`   Got: ${actualStr}`);
    failed++;
  }
}

// ============ TEST DATA ============

const validDraft: ProposalDraft = {
  clientName: 'Test Client',
  address: '123 Test St, Austin, TX 78701',
  services: [
    {
      id: 'service-1',
      tradeId: 'bathroom',
      jobTypeId: 'full-remodel',
      jobSize: 2,
      homeArea: 'master-bathroom',
      footage: null,
      options: { 'custom-tile': true },
    },
  ],
  photos: [
    {
      id: 'photo-1',
      url: 'https://example.com/photo1.jpg',
      category: 'existing-conditions',
      caption: 'Before photo',
    },
  ],
  enhancedScopes: {
    'service-1': ['Enhanced scope item 1', 'Enhanced scope item 2'],
  },
};

const emptyDraft: ProposalDraft = {
  clientName: '',
  address: '',
  services: [
    {
      id: 'empty-service',
      tradeId: '',
      jobTypeId: '',
      jobSize: 2,
      homeArea: '',
      footage: null,
      options: {},
    },
  ],
  photos: [],
  enhancedScopes: {},
};

// ============ TESTS ============

function testGetDraftStorageKey() {
  console.log('\n--- Testing getDraftStorageKey ---');
  
  assertEqual(
    getDraftStorageKey('user-123'),
    'scopegen_proposal_draft_user-123',
    'Should generate key with user ID'
  );
  
  assertEqual(
    getDraftStorageKey(null),
    'scopegen_proposal_draft_anon',
    'Should generate key with "anon" for null userId'
  );
  
  assertEqual(
    getDraftStorageKey(''),
    'scopegen_proposal_draft_anon',
    'Should treat empty string as anonymous'
  );
}

function testCreateEmptyDraft() {
  console.log('\n--- Testing createEmptyDraft ---');
  
  const draft = createEmptyDraft();
  
  assertEqual(draft.clientName, '', 'Empty draft should have empty clientName');
  assertEqual(draft.address, '', 'Empty draft should have empty address');
  assert(draft.services.length === 1, 'Empty draft should have one service');
  assert(draft.services[0].id.length > 0, 'Service should have an ID');
  assertEqual(draft.services[0].tradeId, '', 'Service should have empty tradeId');
  assertEqual(draft.photos.length, 0, 'Empty draft should have no photos');
  assertEqual(Object.keys(draft.enhancedScopes).length, 0, 'Empty draft should have no enhanced scopes');
}

function testSerializeDeserialize() {
  console.log('\n--- Testing serialize/deserialize round-trip ---');
  
  const serialized = serializeDraft(validDraft);
  assert(typeof serialized === 'string', 'Serialized draft should be a string');
  
  const parsed = JSON.parse(serialized) as PersistedDraft;
  assertEqual(parsed.version, DRAFT_SCHEMA_VERSION, 'Should include current schema version');
  assert(typeof parsed.timestamp === 'number', 'Should include timestamp');
  assert(parsed.timestamp > 0, 'Timestamp should be positive');
  
  const result = deserializeDraft(serialized);
  assert(result.success, 'Deserialization should succeed');
  assertEqual(result.draft?.clientName, validDraft.clientName, 'ClientName should match');
  assertEqual(result.draft?.address, validDraft.address, 'Address should match');
  assertEqual(result.draft?.services.length, validDraft.services.length, 'Services count should match');
  assertEqual(result.draft?.photos.length, validDraft.photos.length, 'Photos count should match');
}

function testDeserializeInvalidInputs() {
  console.log('\n--- Testing deserialize with invalid inputs ---');
  
  // Null input
  const nullResult = deserializeDraft(null);
  assert(!nullResult.success, 'Should fail for null input');
  assertEqual(nullResult.error, 'No draft data', 'Should have correct error message');
  
  // Empty string
  const emptyResult = deserializeDraft('');
  assert(!emptyResult.success, 'Should fail for empty string');
  
  // Invalid JSON
  const invalidJsonResult = deserializeDraft('not valid json');
  assert(!invalidJsonResult.success, 'Should fail for invalid JSON');
  assert((invalidJsonResult.error ?? '').includes('Parse error'), 'Should have parse error');
  
  // Missing version
  const noVersionResult = deserializeDraft(JSON.stringify({
    timestamp: Date.now(),
    draft: validDraft,
  }));
  assert(!noVersionResult.success, 'Should fail without version');
  
  // Wrong version
  const wrongVersionResult = deserializeDraft(JSON.stringify({
    version: 999,
    timestamp: Date.now(),
    draft: validDraft,
  }));
  assert(!wrongVersionResult.success, 'Should fail with wrong version');
  assert((wrongVersionResult.error ?? '').includes('Schema version mismatch'), 'Should have version mismatch error');
  
  // Missing timestamp
  const noTimestampResult = deserializeDraft(JSON.stringify({
    version: DRAFT_SCHEMA_VERSION,
    draft: validDraft,
  }));
  assert(!noTimestampResult.success, 'Should fail without timestamp');
}

function testDeserializeInvalidDraftStructure() {
  console.log('\n--- Testing deserialize with invalid draft structure ---');
  
  // Missing clientName
  const noClientName = deserializeDraft(JSON.stringify({
    version: DRAFT_SCHEMA_VERSION,
    timestamp: Date.now(),
    draft: { ...validDraft, clientName: undefined },
  }));
  assert(!noClientName.success, 'Should fail without clientName');
  
  // Non-array services
  const badServices = deserializeDraft(JSON.stringify({
    version: DRAFT_SCHEMA_VERSION,
    timestamp: Date.now(),
    draft: { ...validDraft, services: 'not an array' },
  }));
  assert(!badServices.success, 'Should fail with non-array services');
  
  // Service missing id
  const serviceNoId = deserializeDraft(JSON.stringify({
    version: DRAFT_SCHEMA_VERSION,
    timestamp: Date.now(),
    draft: {
      ...validDraft,
      services: [{ tradeId: 'test', jobTypeId: 'test', jobSize: 2, homeArea: '', footage: null, options: {} }],
    },
  }));
  assert(!serviceNoId.success, 'Should fail when service missing id');
  
  // Invalid footage type
  const badFootage = deserializeDraft(JSON.stringify({
    version: DRAFT_SCHEMA_VERSION,
    timestamp: Date.now(),
    draft: {
      ...validDraft,
      services: [{
        id: 'test',
        tradeId: 'test',
        jobTypeId: 'test',
        jobSize: 2,
        homeArea: '',
        footage: 'not a number',
        options: {},
      }],
    },
  }));
  assert(!badFootage.success, 'Should fail with invalid footage type');
}

function testDraftHasContent() {
  console.log('\n--- Testing draftHasContent ---');
  
  assert(draftHasContent(validDraft) === true, 'Valid draft should have content');
  assert(draftHasContent(emptyDraft) === false, 'Empty draft should not have content');
  
  // Draft with only client name
  const onlyClientName = { ...emptyDraft, clientName: 'Test' };
  assert(draftHasContent(onlyClientName) === true, 'Draft with client name should have content');
  
  // Draft with only address
  const onlyAddress = { ...emptyDraft, address: '123 Test St' };
  assert(draftHasContent(onlyAddress) === true, 'Draft with address should have content');
  
  // Draft with only trade selected
  const onlyTrade: ProposalDraft = {
    ...emptyDraft,
    services: [{
      id: 'test',
      tradeId: 'bathroom',
      jobTypeId: '',
      jobSize: 2,
      homeArea: '',
      footage: null,
      options: {},
    }],
  };
  assert(draftHasContent(onlyTrade) === true, 'Draft with trade should have content');
  
  // Draft with only photos
  const onlyPhotos: ProposalDraft = {
    ...emptyDraft,
    photos: [{ id: 'p1', url: 'test.jpg' }],
  };
  assert(draftHasContent(onlyPhotos) === true, 'Draft with photos should have content');
  
  // Draft with only enhanced scopes
  const onlyScopes: ProposalDraft = {
    ...emptyDraft,
    enhancedScopes: { 'service-1': ['Item 1'] },
  };
  assert(draftHasContent(onlyScopes) === true, 'Draft with enhanced scopes should have content');
}

function testDraftsAreEqual() {
  console.log('\n--- Testing draftsAreEqual ---');
  
  assert(draftsAreEqual(validDraft, validDraft), 'Same draft should be equal');
  assert(draftsAreEqual(emptyDraft, emptyDraft), 'Same empty draft should be equal');
  
  // Deep copy should be equal
  const copy = JSON.parse(JSON.stringify(validDraft));
  assert(draftsAreEqual(validDraft, copy), 'Deep copy should be equal');
  
  // Different client name
  const diffClientName = { ...validDraft, clientName: 'Different' };
  assert(!draftsAreEqual(validDraft, diffClientName), 'Different clientName should not be equal');
  
  // Different services length
  const moreServices: ProposalDraft = {
    ...validDraft,
    services: [...validDraft.services, ...validDraft.services],
  };
  assert(!draftsAreEqual(validDraft, moreServices), 'Different services count should not be equal');
  
  // Different photos
  const morePhotos: ProposalDraft = {
    ...validDraft,
    photos: [...validDraft.photos, { id: 'p2', url: 'test2.jpg' }],
  };
  assert(!draftsAreEqual(validDraft, morePhotos), 'Different photos count should not be equal');
}

function testFormatRelativeTime() {
  console.log('\n--- Testing formatRelativeTime ---');
  
  const now = Date.now();
  
  assertEqual(formatRelativeTime(now), 'just now', 'Current time should be "just now"');
  assertEqual(formatRelativeTime(now - 5000), 'just now', '5 seconds ago should be "just now"');
  assertEqual(formatRelativeTime(now - 30000), '30s ago', '30 seconds ago should show seconds');
  assertEqual(formatRelativeTime(now - 120000), '2 min ago', '2 minutes ago should show minutes');
  assertEqual(formatRelativeTime(now - 3600000), '1h ago', '1 hour ago should show hours');
  assertEqual(formatRelativeTime(now - 7200000), '2h ago', '2 hours ago should show hours');
  
  // More than a day should show date (not testing exact format as it's locale-dependent)
  const oldTimestamp = now - 86400000 * 2; // 2 days ago
  const result = formatRelativeTime(oldTimestamp);
  assert(!result.includes('ago'), 'Old timestamps should show date, not relative time');
}

function testSchemaVersionHandling() {
  console.log('\n--- Testing schema version handling ---');
  
  // Current version should work
  const currentVersionData = JSON.stringify({
    version: DRAFT_SCHEMA_VERSION,
    timestamp: Date.now(),
    draft: validDraft,
  });
  const currentResult = deserializeDraft(currentVersionData);
  assert(currentResult.success === true, 'Current schema version should succeed');
  
  // Older versions should migrate gracefully (v1 -> v2, v2 -> v3)
  const oldVersionData = JSON.stringify({
    version: DRAFT_SCHEMA_VERSION - 1, // v2 - supported via migration
    timestamp: Date.now(),
    draft: validDraft,
  });
  const oldResult = deserializeDraft(oldVersionData);
  assert(oldResult.success === true, 'Older schema version should migrate and succeed');
  assert(oldResult.draft?.proposalId === null, 'Migrated draft should include proposalId=null');

  // v2 -> v3 migration should drop blob: photo URLs (not refresh-safe)
  const blobPhotoDraft: ProposalDraft = {
    ...validDraft,
    photos: [
      { id: "blob-1", url: "blob:https://example.com/abc" },
      { id: "ok-1", url: "https://example.com/photo.jpg" },
    ],
  };
  const blobVersionData = JSON.stringify({
    version: 2,
    timestamp: Date.now(),
    draft: blobPhotoDraft,
  });
  const blobResult = deserializeDraft(blobVersionData);
  assert(blobResult.success === true, "v2 draft with blob photos should migrate successfully");
  assertEqual(
    blobResult.draft?.photos.map((p) => p.id),
    ["ok-1"],
    "Migration should remove blob: photos"
  );
  
  // Future version should fail gracefully
  const futureVersionData = JSON.stringify({
    version: DRAFT_SCHEMA_VERSION + 1,
    timestamp: Date.now(),
    draft: validDraft,
  });
  const futureResult = deserializeDraft(futureVersionData);
  assert(futureResult.success === false, 'Future schema version should fail');
  assert((futureResult.error ?? '').includes('Schema version mismatch'), 'Should indicate version mismatch');
}

// ============ RUN ALL TESTS ============

function runAllTests() {
  console.log('='.repeat(50));
  console.log('Draft Persistence Module Unit Tests');
  console.log('='.repeat(50));
  
  testGetDraftStorageKey();
  testCreateEmptyDraft();
  testSerializeDeserialize();
  testDeserializeInvalidInputs();
  testDeserializeInvalidDraftStructure();
  testDraftHasContent();
  testDraftsAreEqual();
  testFormatRelativeTime();
  testSchemaVersionHandling();
  
  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(50));
  
  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
