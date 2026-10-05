export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: Array<{ path: string; message: string }>;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AssessmentModule {
  name: string;
  category: string;
  minutes: number;
}

export interface CandidateField {
  key: string;
  required: boolean;
}

export interface AssessmentCounts {
  invited: number;
  ongoing: number;
  completed: number;
  expired: number;
}

export type AssessmentStatus = 'draft' | 'needs-configuration' | 'active' | 'paused' | 'archived';

export interface Assessment {
  id: string;
  humanId: number;
  slug: string;
  name: string;
  status: AssessmentStatus;
  liveVersion: string;
  estimatedMinutes: number;
  modules: AssessmentModule[];
  candidateFields: CandidateField[];
  counts: AssessmentCounts;
  createdAt: string;
  updatedAt: string;
}

export interface ShareableLink {
  url: string;
  expiresAt: string;
}

export type AttemptStatus =
  | 'invited'
  | 'consented'
  | 'in-progress'
  | 'interrupted'
  | 'completed'
  | 'expired'
  | 'withdrawn';

export interface AttemptResultSummary {
  overallScore: number;
  benchmarkScore: number;
  meetsBenchmark: boolean;
  recommendation: string;
  integrity: string;
  reviewerDecision: string;
}

export interface EmailDelivery {
  status: string;
  lastError?: string;
  givenUp: boolean;
}

export interface AttemptSummary {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  externalId?: string;
  assessmentId: string;
  assessmentName: string;
  assessmentVersion: string;
  status: AttemptStatus;
  progressPct: number;
  invitedAt?: string;
  scheduledSendAt?: string;
  startedAt?: string;
  submittedAt?: string;
  expiresAt?: string;
  reviewerName?: string;
  emailDelivery?: EmailDelivery;
  result?: AttemptResultSummary;
  updatedAt: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  externalId?: string;
  customFields?: Record<string, unknown>;
  createdAt: string;
}

export interface CandidateWithAttempts extends Candidate {
  attempts: AttemptSummary[];
}

export interface CandidateInput {
  name: string;
  email: string;
  phone?: string;
  externalId?: string;
  customFields?: Record<string, unknown>;
}

export interface InviteCandidateItem {
  name: string;
  email: string;
  phone?: string;
  externalId?: string;
  customFields?: Record<string, unknown>;
}

export interface InviteRequestBody {
  candidates: InviteCandidateItem[];
  delivery?: 'email' | 'none';
  sendAt?: string;
  expiresAt?: string;
  message?: string;
  reviewerId?: string;
  resend?: boolean;
}

export interface InviteRow {
  email: string;
  name: string;
  status: string;
  reason?: string;
  candidateId?: string;
  attemptId?: string;
  url?: string;
}

export interface InviteResponse {
  invited: number;
  skipped: number;
  sendAt?: string;
  expiresAt?: string;
  scheduled: boolean;
  rows: InviteRow[];
}

export interface MeResponse {
  key: {
    id: string;
    label: string;
    prefix: string;
    scopes: string[];
    expiresAt?: string;
  };
  organisation: {
    id: string;
    name: string;
  };
}

export type Attempt = AttemptSummary;

export interface ResendRequestBody {
  delivery?: 'email' | 'none';
  sendAt?: string;
  expiresAt?: string;
  message?: string;
}

export interface ResendResponse {
  resent: boolean;
  sendAt?: string;
  expiresAt?: string;
  scheduled: boolean;
  url?: string;
}

export interface RescheduleRequestBody {
  sendAt: string;
}

export interface RescheduleResponse {
  rescheduled: boolean;
  sendAt: string;
}

export interface ExtendRequestBody {
  expiresAt: string;
  notifyCandidate?: boolean;
}

export interface ExtendResponse {
  extended: boolean;
  expiresAt: string;
}

export interface CloseResponse {
  closed: boolean;
  expiresAt: string;
}

export type BulkAttemptAction = 'resend' | 'extend' | 'close';


export interface BulkAttemptsRequestBody {
  action: BulkAttemptAction;
  attemptIds: string[];
  delivery?: 'email' | 'none';
  sendAt?: string;
  message?: string;
  expiresAt?: string;
  notifyCandidate?: boolean;
}

export interface BulkAttemptRowOutcome {
  attemptId: string;
  status: string;
  reason?: string;
  url?: string;
}

export interface BulkAttemptsResponse {
  succeeded: number;
  skipped: number;
  rows: BulkAttemptRowOutcome[];
}



export interface ResultReviewerDecision {
  decision: string;
  reason?: string;
  decidedAt: string;
}

export interface ResultSummary {
  attemptId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  externalId?: string;
  assessmentId: string;
  assessmentName: string;
  assessmentVersion: string;
  submittedAt: string;
  analysisStatus: string;
  overallScore: number;
  band?: string;
  benchmarkScore: number;
  meetsBenchmark: boolean;
  recommendation: string;
  integrity: string;
  reviewerDecision?: ResultReviewerDecision;
  reportUrl?: string;
}

export interface FullResultReport {
  overall: Record<string, unknown>;
  rings: Record<string, unknown>;
  analysisStatus: string;
  recommendation: string;
  integrity: string;
  url?: string;
}

export interface FullResult {
  schemaVersion: number;
  candidate: Candidate;
  assessment: {
    id: string;
    name: string;
    version: string;
  };
  attempt: {
    id: string;
    status: AttemptStatus;
    submittedAt?: string;
  };
  report: FullResultReport;
  reviewerDecision?: Record<string, unknown>;
}

export interface FullResultPending {
  status: string;
  attemptId: string;
  attemptStatus: AttemptStatus;
  message?: string;
}
