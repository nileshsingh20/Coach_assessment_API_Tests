import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { seedAttempt } from '../../src/utils/seedAttempt';
import { futureIsoDate } from '../../src/utils/testData';

test.describe('POST /attempts/bulk (requires invitations:write)', () => {
  test('closes several attempts in one call and reports each outcome', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seededA = await seedAttempt(allScopesClient, assessmentId);
    const seededB = await seedAttempt(allScopesClient, assessmentId);

    const res = await invitationsWriteClient!.bulkAttempts({
      action: 'close',
      attemptIds: [seededA.attemptId, seededB.attemptId],
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.rows.length).toBe(2);
    expect(body.succeeded + body.skipped).toBe(2);
    for (const row of body.rows) {
      expect([seededA.attemptId, seededB.attemptId]).toContain(row.attemptId);
      expect(row).toHaveProperty('status');
    }
  });

  test('extends several attempts in one call', async ({ allScopesClient, invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seededA = await seedAttempt(allScopesClient, assessmentId);
    const seededB = await seedAttempt(allScopesClient, assessmentId);

    const res = await invitationsWriteClient!.bulkAttempts({
      action: 'extend',
      attemptIds: [seededA.attemptId, seededB.attemptId],
      expiresAt: futureIsoDate(30),
    });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.rows.length).toBe(2);
  });

  test('422s for an empty attemptIds array', async ({ invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const res = await invitationsWriteClient!.bulkAttempts({ action: 'close', attemptIds: [] });
    expect(res.status()).toBe(422);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.bulkAttempts({ action: 'close', attemptIds: ['any-id'] });
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks invitations:write', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const seeded = await seedAttempt(allScopesClient, assessmentId);

    const res = await candidatesReadClient!.bulkAttempts({ action: 'close', attemptIds: [seeded.attemptId] });
    expect(res.status()).toBe(403);
  });
});
