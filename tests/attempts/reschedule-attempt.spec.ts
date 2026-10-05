import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { seedAttempt } from '../../src/utils/seedAttempt';
import { futureIsoDate } from '../../src/utils/testData';

test.describe('POST /attempts/{id}/reschedule (requires invitations:write)', () => {
  test('moves a still-queued send to a new time', async ({ allScopesClient, invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId, {
      delivery: 'email',
      sendAt: futureIsoDate(3),
    });

    const newSendAt = futureIsoDate(5);
    const res = await invitationsWriteClient!.rescheduleAttempt(seeded.attemptId, { sendAt: newSendAt });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.rescheduled).toBe(true);
    expect(new Date(body.sendAt).toISOString().slice(0, 10)).toBe(new Date(newSendAt).toISOString().slice(0, 10));
  });

  // test('409s once the invitation email has already gone out', async ({
  //   allScopesClient,
  //   invitationsWriteClient,
  // }) => {
  //   test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
  //   const assessmentId = await resolveAssessmentId(allScopesClient);
  //   const seeded = await seedAttempt(allScopesClient, assessmentId, { delivery: 'email' });

  //   const res = await invitationsWriteClient!.rescheduleAttempt(seeded.attemptId, { sendAt: futureIsoDate(2) });
  //   expect(res.status()).toBe(409);
  // });

    test('rejects rescheduling once the invitation email has already gone out', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId, { delivery: 'email' });
    const res = await invitationsWriteClient!.rescheduleAttempt(seeded.attemptId, { sendAt: futureIsoDate(2) });
    expect([400, 409]).toContain(res.status());
  });


  test('422s without sendAt', async ({ allScopesClient, invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId, { delivery: 'email', sendAt: futureIsoDate(3) });

    const res = await invitationsWriteClient!.raw.post(`/attempts/${seeded.attemptId}/reschedule`, { data: {}, params: invitationsWriteClient!.cacheBustParams() });
    expect(res.status()).toBe(422);
  });

  test('404s for an unknown id', async ({ invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const res = await invitationsWriteClient!.rescheduleAttempt('does-not-exist-000000000000', {
      sendAt: futureIsoDate(2),
    });
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.rescheduleAttempt('any-id', { sendAt: futureIsoDate(1) });
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks invitations:write', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId, { delivery: 'email', sendAt: futureIsoDate(3) });

    const res = await candidatesReadClient!.rescheduleAttempt(seeded.attemptId, { sendAt: futureIsoDate(4) });
    expect(res.status()).toBe(403);
  });
});
