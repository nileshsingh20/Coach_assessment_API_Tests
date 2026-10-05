import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';

test.describe('GET /assessments/{id} (requires assessments:read)', () => {
  test('returns the assessment, including its candidate fields', async ({
    allScopesClient,
    assessmentsReadClient,
  }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const id = await resolveAssessmentId(allScopesClient); 
    const res = await assessmentsReadClient!.getAssessment(id);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(id);
    expect(body).toHaveProperty('candidateFields');
    expect(body).toHaveProperty('modules');
    expect(body).toHaveProperty('counts');
  });

  test('404s for an unknown id', async ({ assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const res = await assessmentsReadClient!.getAssessment('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error.code).toBe('not_found');
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.getAssessment('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks assessments:read', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await candidatesReadClient!.getAssessment(id);
    expect(res.status()).toBe(403);
  });
});
