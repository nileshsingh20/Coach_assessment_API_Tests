import { test, expect } from '../../src/fixtures/test-fixtures';
import { resolveAssessmentId } from '../../src/utils/discovery';
import { futureIsoDate } from '../../src/utils/testData';

test.describe.configure({ mode: 'serial' });

test.describe('Assessment shareable link lifecycle (GET needs assessments:read, mutations need invitations:write)', () => {
  let assessmentId: string;

  test.beforeEach(({ assessmentsReadClient, invitationsWriteClient }) => {
    test.skip(
      !assessmentsReadClient || !invitationsWriteClient,
      'requires both COACH_ASSESS_API_KEY_ASSESSMENTS_READ and COACH_ASSESS_API_KEY_INVITATIONS_WRITE',
    );
  });

  test('GET returns either the existing link or 404 when none exists yet', async ({
    allScopesClient,
    assessmentsReadClient,
  }) => {
    assessmentId = await resolveAssessmentId(allScopesClient);
    const res = await assessmentsReadClient!.getAssessmentLink(assessmentId);
    expect([200, 404]).toContain(res.status());
  });

  test('POST creates the shareable link', async ({ invitationsWriteClient }) => {
    const res = await invitationsWriteClient!.createAssessmentLink(assessmentId, { expiresAt: futureIsoDate(14) });
    expect(res.status()).toBe(201);

    const body = await res.json();
    expect(body).toHaveProperty('url');
    expect(body).toHaveProperty('expiresAt');
    expect(body.url).toMatch(/^https?:\/\//);
  });

  test('POST is idempotent — calling it again returns the same live link', async ({ invitationsWriteClient }) => {
    const first = await (await invitationsWriteClient!.createAssessmentLink(assessmentId)).json();
    const second = await (await invitationsWriteClient!.createAssessmentLink(assessmentId)).json();
    expect(second.url).toBe(first.url);
  });

  test('GET (with assessments:read only) sees the live link', async ({ assessmentsReadClient }) => {
    const res = await assessmentsReadClient!.getAssessmentLink(assessmentId);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('url');
  });

  test('PATCH moves the registration deadline without changing the URL', async ({
    invitationsWriteClient,
    assessmentsReadClient,
  }) => {
    const before = await (await assessmentsReadClient!.getAssessmentLink(assessmentId)).json();
    const newDeadline = futureIsoDate(30);

    const res = await invitationsWriteClient!.updateAssessmentLinkDeadline(assessmentId, newDeadline);
    expect(res.status()).toBe(200);

    const after = await res.json();
    expect(after.url).toBe(before.url);
    expect(new Date(after.expiresAt).toISOString().slice(0, 10)).toBe(
      new Date(newDeadline).toISOString().slice(0, 10),
    );
  });

  test('PATCH 422s without expiresAt', async ({ invitationsWriteClient }) => {
    const res = await invitationsWriteClient!.raw.patch(`/assessments/${assessmentId}/link`, { data: {}, params: invitationsWriteClient!.cacheBustParams() });
    expect(res.status()).toBe(422);
  });

  test('POST /regenerate replaces the URL', async ({ invitationsWriteClient, assessmentsReadClient }) => {
    const before = await (await assessmentsReadClient!.getAssessmentLink(assessmentId)).json();
    const res = await invitationsWriteClient!.regenerateAssessmentLink(assessmentId);
    expect(res.status()).toBe(201);

    const after = await res.json();
    expect(after.url).not.toBe(before.url);
  });

  test('DELETE revokes the link', async ({ invitationsWriteClient }) => {
    const res = await invitationsWriteClient!.revokeAssessmentLink(assessmentId);
    expect(res.status()).toBe(204);
  });

  test('GET 404s after revocation', async ({ assessmentsReadClient }) => {
    const res = await assessmentsReadClient!.getAssessmentLink(assessmentId);
    expect(res.status()).toBe(404);
  });

  test('creating a new link again after revocation still works', async ({ invitationsWriteClient }) => {
    const res = await invitationsWriteClient!.createAssessmentLink(assessmentId);
    expect(res.status()).toBe(201);
  });
});

test.describe('Shareable link scope enforcement', () => {
  test('GET link 403s for a key that lacks assessments:read', async ({ allScopesClient, candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await candidatesReadClient!.getAssessmentLink(id);
    expect(res.status()).toBe(403);
  });

  test('creating a link 403s for a key that lacks invitations:write', async ({
    allScopesClient,
    assessmentsReadClient,
  }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const id = await resolveAssessmentId(allScopesClient);
    const res = await assessmentsReadClient!.createAssessmentLink(id);
    expect(res.status()).toBe(403);
  });
});
