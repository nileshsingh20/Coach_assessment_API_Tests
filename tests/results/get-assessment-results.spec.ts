import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';

test.describe('GET /assessments/{id}/results (requires results:read)', () => {
  test('returns a paginated list of completed attempts on the assessment', async ({
    allScopesClient,
    resultsReadClient,
  }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await resultsReadClient!.getAssessmentResults(id);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('supports since for polling only new submissions', async ({ allScopesClient, resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await resultsReadClient!.getAssessmentResults(id, { since: '2020-01-01T00:00:00Z' });
    expect(res.status()).toBe(200);
  });

  test('404s for an unknown assessment id', async ({ resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const res = await resultsReadClient!.getAssessmentResults('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.getAssessmentResults('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks results:read', async ({ allScopesClient, assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await assessmentsReadClient!.getAssessmentResults(id);
    expect(res.status()).toBe(403);
  });
});
