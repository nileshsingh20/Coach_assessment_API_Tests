import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { uniqueEmail, futureIsoDate } from '../../src/utils/testData';

test.describe('POST /assessments/{id}/invitations (requires invitations:write)', () => {
  test('invites a candidate with delivery=none and returns their single-use link', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const email = uniqueEmail();

    const res = await invitationsWriteClient!.inviteCandidates(assessmentId, {
      candidates: [{ name: 'Invite Me', email }],
      delivery: 'none',
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.invited).toBe(1);
    expect(body.rows.length).toBe(1);
    expect(body.rows[0].status).toBe('invited');
    expect(body.rows[0].url).toMatch(/^https?:\/\//);
  });

  test('skips someone who already holds an open invitation unless resend is true', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const email = uniqueEmail();

    await invitationsWriteClient!.inviteCandidates(assessmentId, {
      candidates: [{ name: 'Repeat', email }],
      delivery: 'none',
    });

    const secondCall = await invitationsWriteClient!.inviteCandidates(assessmentId, {
      candidates: [{ name: 'Repeat', email }],
      delivery: 'none',
    });
    const secondBody = await secondCall.json();
    expect(secondBody.skipped).toBeGreaterThanOrEqual(1);

    const resendCall = await invitationsWriteClient!.inviteCandidates(assessmentId, {
      candidates: [{ name: 'Repeat', email }],
      delivery: 'none',
      resend: true,
    });
    const resendBody = await resendCall.json();
    expect(resendBody.invited).toBe(1);
  });

  test('invites a batch and reports a per-candidate outcome for each row', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const candidates = Array.from({ length: 3 }, (_, i) => ({
      name: `Batch ${i}`,
      email: uniqueEmail(`batch${i}`),
    }));

    const res = await invitationsWriteClient!.inviteCandidates(assessmentId, { candidates, delivery: 'none' });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.rows.length).toBe(3);
    expect(body.invited).toBe(3);
  });

  test('accepts sendAt and expiresAt for scheduled email delivery', async ({
    allScopesClient,
    invitationsWriteClient,
  }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);

    const res = await invitationsWriteClient!.inviteCandidates(assessmentId, {
      candidates: [{ name: 'Scheduled', email: uniqueEmail('scheduled') }],
      delivery: 'email',
      sendAt: futureIsoDate(1),
      expiresAt: futureIsoDate(15),
    });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body.scheduled).toBe(true);
  });

  test('422s when the candidates array is empty', async ({ allScopesClient, invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const res = await invitationsWriteClient!.inviteCandidates(assessmentId, { candidates: [] });
    expect(res.status()).toBe(422);
  });

  test('422s when a candidate is missing an email', async ({ allScopesClient, invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);
    const res = await invitationsWriteClient!.raw.post(`/assessments/${assessmentId}/invitations`, {
      data: { candidates: [{ name: 'No Email' }] },
      params: invitationsWriteClient!.cacheBustParams(),
    });
    expect(res.status()).toBe(422);
  });

  test('404s for an unknown assessment id', async ({ invitationsWriteClient }) => {
    test.skip(!invitationsWriteClient, 'COACH_ASSESS_API_KEY_INVITATIONS_WRITE not configured');
    const res = await invitationsWriteClient!.inviteCandidates('does-not-exist-000000000000', {
      candidates: [{ name: 'X', email: uniqueEmail() }],
    });
    expect(res.status()).toBe(404);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.inviteCandidates('any-id', {
      candidates: [{ name: 'X', email: uniqueEmail() }],
    });
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks invitations:write', async ({ allScopesClient, assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const assessmentId = await resolveAssessmentId(allScopesClient);

    const res = await assessmentsReadClient!.inviteCandidates(assessmentId, {
      candidates: [{ name: 'X', email: uniqueEmail() }],
    });
    expect(res.status()).toBe(403);
  });
});
