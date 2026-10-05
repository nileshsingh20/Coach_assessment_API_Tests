import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { seedAttempt } from '../../src/utils/seedAttempt';

test.describe('GET /attempts/{id} (requires candidates:read)', () => {
  test('returns the attempt with status, progress and window fields', async ({
    allScopesClient,
    candidatesReadClient,
  }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const { attemptId } = await seedAttempt(allScopesClient, assessmentId); // setup

    const res = await candidatesReadClient!.getAttempt(attemptId);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.id).toBe(attemptId);
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('progressPct');
    expect(body).toHaveProperty('assessmentId');
    expect(body).toHaveProperty('candidateId');
  });

  test('404s for an unknown id', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.getAttempt('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.getAttempt('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks candidates:read', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const { attemptId } = await seedAttempt(allScopesClient, assessmentId);

    const res = await invitationsWriteClient!.getAttempt(attemptId);
    expect(res.status()).toBe(403);
  });
});
