import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { seedAttempt } from '../../src/utils/seedAttempt';

test.describe('GET /attempts/{id}/result (requires results:read)', () => {
  test('202s while the candidate has not finished', async ({ allScopesClient, resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const { attemptId } = await seedAttempt(allScopesClient, assessmentId);
    const res = await resultsReadClient!.getFullResult(attemptId);
    expect(res.status()).toBe(202);

    const body = await res.json();
    expect(body.attemptId).toBe(attemptId);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('attemptStatus');
  });

  test('404s for an unknown attempt id', async ({ resultsReadClient }) => {
    test.skip(!resultsReadClient, 'COACH_ASSESS_API_KEY_RESULTS_READ not configured');
    const res = await resultsReadClient!.getFullResult('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.getFullResult('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks results:read', async ({ allScopesClient, assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const { attemptId } = await seedAttempt(allScopesClient, assessmentId);

    const res = await assessmentsReadClient!.getFullResult(attemptId);
    expect(res.status()).toBe(403);
  });
});
