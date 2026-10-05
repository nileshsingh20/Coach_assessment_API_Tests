import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { seedAttempt } from '../../src/utils/seedAttempt';

test.describe('POST /attempts/{id}/close (requires invitations:write)', () => {
  test('cancels the invitation and marks the attempt expired', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    const res = await invitationsWriteClient!.closeAttempt(seeded.attemptId);
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.closed).toBe(true);
    expect(body).toHaveProperty('expiresAt');

    const check = await allScopesClient.getAttempt(seeded.attemptId);
    const attempt = await check.json();
    expect(attempt.status).toBe('expired');
  });

  test('keeps progress already recorded (status becomes expired, not deleted)', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    await invitationsWriteClient!.closeAttempt(seeded.attemptId);

    const check = await allScopesClient.getAttempt(seeded.attemptId);
    expect(check.status()).toBe(200);
    const attempt = await check.json();
    expect(attempt.id).toBe(seeded.attemptId);
  });

  test('404s for an unknown id', async ({ invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const res = await invitationsWriteClient!.closeAttempt('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.closeAttempt('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks invitations:write', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    const res = await candidatesReadClient!.closeAttempt(seeded.attemptId);
    expect(res.status()).toBe(403);
  });
});
