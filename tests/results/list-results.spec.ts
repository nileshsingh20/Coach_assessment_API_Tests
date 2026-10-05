import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('GET /results (requires results:read)', () => {
  test('returns a paginated list of completed attempts org-wide', async ({ resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const res = await resultsReadClient!.listResults();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('accepts assessmentId, candidateId, email, externalId and since filters', async ({ resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const res = await resultsReadClient!.listResults({
      since: '2020-01-01T00:00:00Z',
      email: 'no-one@example-test.com',
    });
    expect(res.status()).toBe(200);
  });

  test('respects page and pageSize', async ({ resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const res = await resultsReadClient!.listResults({ page: 1, pageSize: 3 });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(3);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.listResults();
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks results:read', async ({ assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const res = await assessmentsReadClient!.listResults();
    expect(res.status()).toBe(403);
  });
});
