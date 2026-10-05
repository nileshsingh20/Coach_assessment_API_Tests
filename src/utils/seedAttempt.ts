import { CoachAssessClient } from '../api/client';
import { uniqueEmail } from './testData';

export interface SeededAttempt {
  attemptId: string;
  candidateId: string;
  email: string;
  url?: string;
}

export async function seedAttempt(
  client: CoachAssessClient,
  assessmentId: string,
  overrides?: {
    delivery?: 'email' | 'none';
    sendAt?: string;
    expiresAt?: string;
    name?: string;
  },
): Promise<SeededAttempt> {
  const email = uniqueEmail('seed');
  const res = await client.inviteCandidates(assessmentId, {
    candidates: [{ name: overrides?.name ?? 'Seed Attempt', email }],
    delivery: overrides?.delivery ?? 'none',
    sendAt: overrides?.sendAt,
    expiresAt: overrides?.expiresAt,
  });

  if (!res.ok()) {
    throw new Error(`Failed to seed an attempt for tests (status ${res.status()}).`);
  }

  const body = await res.json();
  const row = body.rows?.[0];
  if (!row?.attemptId) {
    throw new Error('Invite response did not include an attemptId to seed the attempt with.');
  }

  return { attemptId: row.attemptId, candidateId: row.candidateId, email, url: row.url };
}
