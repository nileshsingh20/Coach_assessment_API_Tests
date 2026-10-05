import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { seedAttempt } from '../../src/utils/seedAttempt';

test.describe('GET /candidates/{id}/results (requires results:read)', () => {
  test('returns a paginated list of the candidate\'s completed attempts', async ({
    allScopesClient,
    resultsReadClient,
  }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const { candidateId } = await seedAttempt(allScopesClient, assessmentId); // not yet completed — expect an empty page

    const res = await resultsReadClient!.getCandidateResults(candidateId);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('page');
    expect(body).toHaveProperty('pageSize');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('accepts assessmentId, since, page and pageSize filters', async ({
    allScopesClient,
    resultsReadClient,
  }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const { candidateId } = await seedAttempt(allScopesClient, assessmentId);

    const res = await resultsReadClient!.getCandidateResults(candidateId, {
      assessmentId,
      since: '2020-01-01T00:00:00Z',
      page: 1,
      pageSize: 5,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(5);
  });

  test('404s for an unknown candidate id', async ({ resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const res = await resultsReadClient!.getCandidateResults('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.getCandidateResults('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks results:read', async ({ allScopesClient, assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const { candidateId } = await seedAttempt(allScopesClient, assessmentId);

    const res = await assessmentsReadClient!.getCandidateResults(candidateId);
    expect(res.status()).toBe(403);
  });
});
