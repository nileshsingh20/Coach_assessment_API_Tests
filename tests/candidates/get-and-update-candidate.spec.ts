import { test, expect } from '../../src/fixtures/test-fixtures';
import { uniqueEmail , randomExternalId } from '../../src/utils/testData';

test.describe('GET /candidates/{id} (requires candidates:read)', () => {
  test('returns the candidate with their attempts', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const email = uniqueEmail();
    const created = await (await allScopesClient.upsertCandidate({ name: 'Fetch Me', email })).json(); // setup

    const res = await candidatesReadClient!.getCandidate(created.id);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(created.id);
    expect(body).toHaveProperty('attempts');
    expect(Array.isArray(body.attempts)).toBe(true);
  });

  test('404s for an unknown id', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.getCandidate('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.getCandidate('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks candidates:read', async ({ allScopesClient, candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const email = uniqueEmail();
    const created = await (await allScopesClient.upsertCandidate({ name: 'Scope Check', email })).json();

    const res = await candidatesWriteClient!.getCandidate(created.id);
    expect(res.status()).toBe(403);
  });
});

test.describe('PATCH /candidates/{id} (requires candidates:write)', () => {
  // test('updates name and externalId', async ({ candidatesWriteClient }) => {
  //   test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
  //   const email = uniqueEmail();
  //   const created = await (await candidatesWriteClient!.upsertCandidate({ name: 'Before Update', email })).json();

  //   const res = await candidatesWriteClient!.updateCandidate(created.id, {
  //     name: 'After Update',
  //     email,
  //     externalId: 'CRM-999',
  //   });
  //   expect(res.status()).toBe(200);

  //   const body = await res.json();
  //   expect(body.name).toBe('After Update');
  //   expect(body.externalId).toBe('CRM-999');
  // });

  // test('422s when the email does not match the candidate on record', async ({ candidatesWriteClient }) => {
  //   test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
  //   const email = uniqueEmail();
  //   const created = await (await candidatesWriteClient!.upsertCandidate({ name: 'Locked Email', email })).json();

  //   const res = await candidatesWriteClient!.updateCandidate(created.id, {
  //     name: 'Locked Email',
  //     email: uniqueEmail('different'),
  //   });
  //   expect(res.status()).toBe(422);
  // });

    test('updates name and externalId', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const email = uniqueEmail();
    const created = await (await candidatesWriteClient!.upsertCandidate({ name: 'Before Update', email })).json();
    const externalId = randomExternalId();

    const res = await candidatesWriteClient!.updateCandidate(created.id, {
      name: 'After Update',
      email,
      externalId,
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.name).toBe('After Update');
    expect(body.externalId).toBe(externalId);
  });

  test('rejects changing the email on an existing candidate', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const email = uniqueEmail();
    const created = await (await candidatesWriteClient!.upsertCandidate({ name: 'Locked Email', email })).json();

    const res = await candidatesWriteClient!.updateCandidate(created.id, {
      name: 'Locked Email',
      email: uniqueEmail('different'),
    });
    expect([409, 422]).toContain(res.status());
  });

  test('404s for an unknown id', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const res = await candidatesWriteClient!.updateCandidate('does-not-exist-000000000000', {
      name: 'X',
      email: uniqueEmail(),
    });
    expect(res.status()).toBe(404);
  });

  test('403s for a key that lacks candidates:write', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const email = uniqueEmail();
    const created = await (await allScopesClient.upsertCandidate({ name: 'Scope Check', email })).json();

    const res = await candidatesReadClient!.updateCandidate(created.id, { name: 'Scope Check', email });
    expect(res.status()).toBe(403);
  });
});
