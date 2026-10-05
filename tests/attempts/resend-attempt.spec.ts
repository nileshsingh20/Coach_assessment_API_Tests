import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { seedAttempt } from '../../src/utils/seedAttempt';
import { futureIsoDate } from '../../src/utils/testData';

test.describe('POST /attempts/{id}/resend (requires invitations:write)', () => {
  test('with delivery=none, expires the old link and returns a fresh one', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId, { delivery: 'none' });

    const res = await invitationsWriteClient!.resendAttempt(seeded.attemptId, { delivery: 'none' });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.resent).toBe(true);
    expect(body.url).toMatch(/^https?:\/\//);
    expect(body.url).not.toBe(seeded.url);
  });

  test('with a future sendAt, reports the resend as scheduled', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId, { delivery: 'none' });

    const res = await invitationsWriteClient!.resendAttempt(seeded.attemptId, {
      delivery: 'email',
      sendAt: futureIsoDate(1),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.scheduled).toBe(true);
  });

  test('404s for an unknown id', async ({ invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const res = await invitationsWriteClient!.resendAttempt('does-not-exist-000000000000');
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.resendAttempt('any-id');
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks invitations:write', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    const res = await candidatesReadClient!.resendAttempt(seeded.attemptId, { delivery: 'none' });
    expect(res.status()).toBe(403);
  });
});
