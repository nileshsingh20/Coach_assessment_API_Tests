import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('GET /me', () => {
  test('the all-scopes key reports every scope', async ({ allScopesClient }) => {
    const res = await allScopesClient.me();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('key');
    expect(body).toHaveProperty('organisation');
    expect(body.key.scopes).toEqual(
      expect.arrayContaining([
        'assessments:read',
        'candidates:read',
        'candidates:write',
        'invitations:write',
        'results:read',
      ]),
    );
  });

  test('401s with an invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.me();
    expect(res.status()).toBe(401);
    const body = await res.json();
    expect(['invalid_api_key', 'key_revoked', 'key_expired']).toContain(body.error.code);
  });

  

  test('the assessments:read key genuinely holds only that scope', async ({ assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const res = await assessmentsReadClient!.me();
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.key.scopes).toEqual(['assessments:read']);
  });

  test('the candidates:read key genuinely holds only that scope', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.me();
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.key.scopes).toEqual(['candidates:read']);
  });

  test('the candidates:write key genuinely holds only that scope', async ({ candidatesWriteClient }) => {
    test.skip(!candidatesWriteClient, 'COACH_ASSESS_API_KEY_CANDIDATES_WRITE not configured');
    const res = await candidatesWriteClient!.me();
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.key.scopes).toEqual(['candidates:write']);
  });

  test('the invitations:write key genuinely holds only that scope', async ({ invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const res = await invitationsWriteClient!.me();
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.key.scopes).toEqual(['invitations:write']);
  });

  test('the results:read key genuinely holds only that scope', async ({ resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const res = await resultsReadClient!.me();
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.key.scopes).toEqual(['results:read']);
  });
});
