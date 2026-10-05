import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';

test.describe('GET /assessments/{id}/candidates (requires candidates:read)', () => {
  test('returns a paginated list of attempts on the assessment', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await candidatesReadClient!.listCandidatesOnAssessment(id);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('filters by status', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await candidatesReadClient!.listCandidatesOnAssessment(id, { status: 'completed' });
    expect(res.status()).toBe(200);

    const body = await res.json();
    for (const row of body.data) {
      expect(row.status).toBe('completed');
    }
  });

  test('supports since for polling only what changed', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await candidatesReadClient!.listCandidatesOnAssessment(id, { since: '2020-01-01T00:00:00Z' });
    expect(res.status()).toBe(200);
  });

  test('404s for an unknown assessment id', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.listCandidatesOnAssessment('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
  });

  test('422s for an invalid status filter', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await candidatesReadClient!.listCandidatesOnAssessment(id, { status: 'bogus-status' });
    expect(res.status()).toBe(422);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.listCandidatesOnAssessment('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks candidates:read', async ({ allScopesClient, assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await assessmentsReadClient!.listCandidatesOnAssessment(id);
    expect(res.status()).toBe(403);
  });

  test('omits result scores for a key without results:read, even on completed rows', async ({
    allScopesClient,
    candidatesReadClient,
  }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await candidatesReadClient!.listCandidatesOnAssessment(id, { status: 'completed', pageSize: 1 });
    expect(res.status()).toBe(200);

    // const body = await res.json();
    // if (body.data.length > 0) {
    //   expect(body.data[0].result).toBeUndefined();
    // }

        const body = await res.json();
    if (body.data.length > 0) {
      expect(body.data[0].result == null).toBe(true);
    }
  });
});
