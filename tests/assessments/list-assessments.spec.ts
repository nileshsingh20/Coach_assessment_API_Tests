import { test, expect } from '../../src/fixtures/test-fixtures';

test.describe('GET /assessments (requires assessments:read)', () => {
  test('returns a paginated list of active assessments by default', async ({ assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const res = await assessmentsReadClient!.listAssessments();
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('page', 1);
    expect(body).toHaveProperty('pageSize');
    expect(body).toHaveProperty('total');
    expect(Array.isArray(body.data)).toBe(true);

    for (const assessment of body.data) {
      expect(assessment.status).toBe('active');
    }
  });

  test('respects page and pageSize params', async ({ assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const res = await assessmentsReadClient!.listAssessments({ page: 1, pageSize: 2 });
    expect(res.status()).toBe(200);

    const body = await res.json();
    expect(body.page).toBe(1);
    expect(body.pageSize).toBe(2);
    expect(body.data.length).toBeLessThanOrEqual(2);
  });

  test('accepts status=all to include every lifecycle state', async ({ assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const res = await assessmentsReadClient!.listAssessments({ status: 'all' });
    expect(res.status()).toBe(200);
  });

  test('supports free-text search via q', async ({ assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const res = await assessmentsReadClient!.listAssessments({ q: 'a' });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
  });

  test('422s for an invalid status value', async ({ assessmentsReadClient }) => {
    test.skip(!assessmentsReadClient, 'COACH_ASSESS_API_KEY_ASSESSMENTS_READ not configured');
    const res = await assessmentsReadClient!.listAssessments({ status: 'not-a-real-status' });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.error.code).toBe('validation_error');
    expect(Array.isArray(body.error.details)).toBe(true);
  });

  test('401s with a missing or invalid key', async ({ invalidClient }) => {
    const res = await invalidClient.listAssessments();
    expect(res.status()).toBe(401);
  });

  test('403s for a key that lacks assessments:read', async ({ candidatesReadClient }) => {
    test.skip(!candidatesReadClient, 'COACH_ASSESS_API_KEY_CANDIDATES_READ not configured');
    const res = await candidatesReadClient!.listAssessments();
    expect(res.status()).toBe(403);
    const body = await res.json();
    expect(body.error.code).toBe('insufficient_scope');
  });
});
