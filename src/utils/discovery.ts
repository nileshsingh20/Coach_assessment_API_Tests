import { CoachAssessClient } from '../api/client';

export async function resolveAssessmentId(client: CoachAssessClient): Promise<string> {
  const pinned = process.env.COACH_ASSESS_TEST_ASSESSMENT_ID;
  if (pinned) {
    return pinned;
  }

  const res = await client.listAssessments({ pageSize: 1, status: 'active' });
  if (!res.ok()) {
    throw new Error(
      `Could not auto-discover an assessment to test against (GET /assessments returned ${res.status()}). ` +
        'Set COACH_ASSESS_TEST_ASSESSMENT_ID in .env instead.',
    );
  }

  const body = await res.json();
  if (!body.data || body.data.length === 0) {
    throw new Error(
      'No active assessments found in this organisation. Set COACH_ASSESS_TEST_ASSESSMENT_ID in .env.',
    );
  }

  return body.data[0].id as string;
}
