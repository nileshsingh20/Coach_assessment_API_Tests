import { test, expect } from '../../src/fixtures/test-fixtures';
import { uniqueEmail } from '../../src/utils/testData';

test.describe('GET /candidates (requires candidates:read)', () => {
  test('returns a paginated directory of candidates', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.listCandidates();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('looks up an exact candidate by email', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const email = uniqueEmail();
    await allScopesClient.upsertCandidate({ name: 'Lookup Me', email }); // setup, not under test

    const res = await candidatesReadClient!.listCandidates({ email });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].email).toBe(email);
  });

  test('returns an empty page for an email with no match', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.listCandidates({ email: uniqueEmail('no-match') });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data.length).toBe(0);
    expect(body.total).toBe(0);
  });

  test('looks up an exact candidate by externalId', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const email = uniqueEmail();
    const externalId = `CRM-${Date.now()}`;
    await allScopesClient.upsertCandidate({ name: 'External Lookup', email, externalId });

    const res = await candidatesReadClient!.listCandidates({ externalId });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.data.length).toBe(1);
    expect(body.data[0].externalId).toBe(externalId);
  });

  test('supports free-text search via q', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.listCandidates({ q: 'a' });
    expect(res.status()).toBe(200);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.listCandidates();
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks candidates:read', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const res = await candidatesWriteClient!.listCandidates();
    expect(res.status()).toBe(403);
  });
});
