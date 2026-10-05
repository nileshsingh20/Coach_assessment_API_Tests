import { test as base } from '@playwright/test';
import type {
  TestType,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test';
import { CoachAssessClient } from '../api/client';

export type CoachAssessFixtures = {
  
  allScopesClient: CoachAssessClient;
  assessmentsReadClient: CoachAssessClient | null;
  candidatesReadClient: CoachAssessClient | null;
  candidatesWriteClient: CoachAssessClient | null;
  invitationsWriteClient: CoachAssessClient | null;
  resultsReadClient: CoachAssessClient | null;
  invalidClient: CoachAssessClient;
};

type BaseFixtures = PlaywrightTestArgs & PlaywrightTestOptions;
type UseOptional = (r: CoachAssessClient | null) => Promise<void>;
type UseRequired = (r: CoachAssessClient) => Promise<void>;

export const test: TestType<
  PlaywrightTestArgs & PlaywrightTestOptions & CoachAssessFixtures,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> = base.extend<CoachAssessFixtures>({
  allScopesClient: async ({}: BaseFixtures, use: UseRequired) => {
    const key = process.env.COACH_ASSESS_API_KEY_ALL;
    if (!key) {
      throw new Error(
        'COACH_ASSESS_API_KEY_ALL is not set. Copy .env.example to .env and fill in a key holding every scope.',
      );
    }
    const client = await CoachAssessClient.create(key);
    await use(client);
    await client.dispose();
  },

  assessmentsReadClient: async ({}: BaseFixtures, use: UseOptional) => {
    const key = process.env.COACH_ASSESS_API_KEY_ASSESSMENTS_READ;
    if (!key) {
      await use(null);
      return;
    }
    const client = await CoachAssessClient.create(key);
    await use(client);
    await client.dispose();
  },

  candidatesReadClient: async ({}: BaseFixtures, use: UseOptional) => {
    const key = process.env.COACH_ASSESS_API_KEY_CANDIDATES_READ;
    if (!key) {
      await use(null);
      return;
    }
    const client = await CoachAssessClient.create(key);
    await use(client);
    await client.dispose();
  },

  candidatesWriteClient: async ({}: BaseFixtures, use: UseOptional) => {
    const key = process.env.COACH_ASSESS_API_KEY_CANDIDATES_WRITE;
    if (!key) {
      await use(null);
      return;
    }
    const client = await CoachAssessClient.create(key);
    await use(client);
    await client.dispose();
  },

  invitationsWriteClient: async ({}: BaseFixtures, use: UseOptional) => {
    const key = process.env.COACH_ASSESS_API_KEY_INVITATIONS_WRITE;
    if (!key) {
      await use(null);
      return;
    }
    const client = await CoachAssessClient.create(key);
    await use(client);
    await client.dispose();
  },

  resultsReadClient: async ({}: BaseFixtures, use: UseOptional) => {
    const key = process.env.COACH_ASSESS_API_KEY_RESULTS_READ;
    if (!key) {
      await use(null);
      return;
    }
    const client = await CoachAssessClient.create(key);
    await use(client);
    await client.dispose();
  },

  invalidClient: async ({}: BaseFixtures, use: UseRequired) => {
    const client = await CoachAssessClient.create('ca_live_invalid_or_revoked_00000000000000');
    await use(client);
    await client.dispose();
  },
});

export { expect } from '@playwright/test';
