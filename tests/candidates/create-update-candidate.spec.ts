import { test, expect } from '../../src/fixtures/test-fixtures';
import { uniqueEmail, randomExternalId } from '../../src/utils/testData';

test.describe('POST /candidates (requires candidates:write)', () => {
  test('creates a new candidate and returns 201', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const email = uniqueEmail();
    const res = await candidatesWriteClient!.upsertCandidate({ name: 'QA Test Candidate', email });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.email).toBe(email);
    expect(body.name).toBe('QA Test Candidate');
    expect(body).toHaveProperty('id');
  });

  test('updates the existing candidate on the same email and returns 200', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const email = uniqueEmail();
    await candidatesWriteClient!.upsertCandidate({ name: 'Original Name', email });

    const res = await candidatesWriteClient!.upsertCandidate({
      name: 'Updated Name',
      email,
      externalId: randomExternalId(),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.name).toBe('Updated Name');
    expect(body.email).toBe(email);
  });

  // test('stores custom directory fields', async ({ candidatesWriteClient }) => {
  //   test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
  //   const email = uniqueEmail();
  //   const res = await candidatesWriteClient!.upsertCandidate({
  //     name: 'Custom Fields',
  //     email,
  //     customFields: { source: 'automation-suite' },
  //   });
  //   expect(res.status()).toBe(201);

  //   const body = await res.json();
  //   expect(body.customFields).toEqual(expect.objectContaining({ source: 'automation-suite' }));
  // });

    test('stores custom directory fields', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const fieldKey = process.env.COACH_ASSESS_TEST_CUSTOM_FIELD_KEY;
    test.skip(!fieldKey, 'COACH_ASSESS_TEST_CUSTOM_FIELD_KEY not configured');
    const email = uniqueEmail();
    const res = await candidatesWriteClient!.upsertCandidate({
      name: 'Custom Fields',
      email,
      customFields: { [fieldKey!]: 'automation-suite' },
    });
    expect(res.status()).toBe(201);
    const body = await res.json();
    expect(body.customFields).toEqual(expect.objectContaining({ [fieldKey!]: 'automation-suite' }));
  });

  test('422s when email is missing', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const res = await candidatesWriteClient!.raw.post('/candidates', { data: { name: 'No Email' }, params: candidatesWriteClient!.cacheBustParams() });
    expect(res.status()).toBe(422);

    const body = await res.json();
    expect(body.error.code).toBe('validation_error');
    expect(Array.isArray(body.error.details)).toBe(true);
  });

  test('422s for a malformed email', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const res = await candidatesWriteClient!.upsertCandidate({ name: 'Bad Email', email: 'not-an-email' });
    expect(res.status()).toBe(422);
  });

  test('422s when name is missing', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const res = await candidatesWriteClient!.raw.post('/candidates', { data: { email: uniqueEmail() }, params: candidatesWriteClient!.cacheBustParams() });
    expect(res.status()).toBe(422);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.upsertCandidate({ name: 'X', email: uniqueEmail() });
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks candidates:write', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.upsertCandidate({ name: 'X', email: uniqueEmail() });
    expect(res.status()).toBe(403);
  });
});
