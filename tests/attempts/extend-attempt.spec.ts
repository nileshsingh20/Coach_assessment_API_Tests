import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { seedAttempt } from '../../src/utils/seedAttempt';
import { futureIsoDate } from '../../src/utils/testData';

test.describe('POST /attempts/{id}/extend (requires invitations:write)', () => {
  test('pushes the closing date later', async ({ allScopesClient, invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    const newExpiry = futureIsoDate(45);
    const res = await invitationsWriteClient!.extendAttempt(seeded.attemptId, { expiresAt: newExpiry });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.extended).toBe(true);
    expect(new Date(body.expiresAt).toISOString().slice(0, 10)).toBe(new Date(newExpiry).toISOString().slice(0, 10));
  });

  test('accepts notifyCandidate without changing the response shape', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    const res = await invitationsWriteClient!.extendAttempt(seeded.attemptId, {
      expiresAt: futureIsoDate(20),
      notifyCandidate: true,
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.extended).toBe(true);
  });

  test('422s without expiresAt', async ({ allScopesClient, invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    const res = await invitationsWriteClient!.raw.post(`/attempts/${seeded.attemptId}/extend`, { data: {}, params: invitationsWriteClient!.cacheBustParams() });
    expect(res.status()).toBe(422);
  });

  test('404s for an unknown id', async ({ invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const res = await invitationsWriteClient!.extendAttempt('does-not-exist-000000000000', {
      expiresAt: futureIsoDate(10),
    });
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.extendAttempt('any-id', { expiresAt: futureIsoDate(10) });
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks invitations:write', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    const res = await candidatesReadClient!.extendAttempt(seeded.attemptId, { expiresAt: futureIsoDate(10) });
    expect(res.status()).toBe(403);
  });
});
