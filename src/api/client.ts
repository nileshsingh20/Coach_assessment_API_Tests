import { HttpRequestContext, HttpResponse } from './httpContext';
import {
  CandidateInput,
  InviteRequestBody,
  ResendRequestBody,
  RescheduleRequestBody,
  ExtendRequestBody,
  BulkAttemptsRequestBody,
} from '../types';


type APIRequestContext = HttpRequestContext;
type APIResponse = HttpResponse;


export class CoachAssessClient {
  private constructor(private readonly ctx: APIRequestContext) {}

  static async create(apiKey: string, baseURL?: string): Promise<CoachAssessClient> {
    const ctx = new HttpRequestContext(
      baseURL || process.env.COACH_ASSESS_BASE_URL || 'https://assess.coachlms.org/api/public/v1',
      {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    );
    return new CoachAssessClient(ctx);
  }

  get raw(): APIRequestContext {
    return this.ctx;
  }

  async dispose(): Promise<void> {
   
  }

  
  cacheBustParams(extra?: Record<string, string | number>): Record<string, string | number> {
    return { ...(extra ?? {}), _cb: `${Date.now()}${Math.random().toString(36).slice(2, 8)}` };
  }

 
  me(): Promise<APIResponse> {
    return this.ctx.get('/me', { params: this.cacheBustParams() });
  }

  listAssessments(params?: Record<string, string | number>): Promise<APIResponse> {
    return this.ctx.get('/assessments', { params: this.cacheBustParams(params) });
  }

  getAssessment(id: string): Promise<APIResponse> {
    return this.ctx.get(`/assessments/${id}`, { params: this.cacheBustParams() });
  }

  getAssessmentLink(id: string): Promise<APIResponse> {
    return this.ctx.get(`/assessments/${id}/link`, { params: this.cacheBustParams() });
  }

  createAssessmentLink(id: string, body?: { expiresAt?: string }): Promise<APIResponse> {
    return this.ctx.post(`/assessments/${id}/link`, { data: body ?? {}, params: this.cacheBustParams() });
  }

  updateAssessmentLinkDeadline(id: string, expiresAt: string): Promise<APIResponse> {
    return this.ctx.patch(`/assessments/${id}/link`, { data: { expiresAt }, params: this.cacheBustParams() });
  }

  revokeAssessmentLink(id: string): Promise<APIResponse> {
    return this.ctx.delete(`/assessments/${id}/link`, { params: this.cacheBustParams() });
  }

  regenerateAssessmentLink(id: string): Promise<APIResponse> {
    return this.ctx.post(`/assessments/${id}/link/regenerate`, { params: this.cacheBustParams() });
  }

  listCandidatesOnAssessment(id: string, params?: Record<string, string | number>): Promise<APIResponse> {
    return this.ctx.get(`/assessments/${id}/candidates`, { params: this.cacheBustParams(params) });
  }

  listCandidates(params?: Record<string, string | number>): Promise<APIResponse> {
    return this.ctx.get('/candidates', { params: this.cacheBustParams(params) });
  }

  upsertCandidate(body: CandidateInput): Promise<APIResponse> {
    return this.ctx.post('/candidates', { data: body, params: this.cacheBustParams() });
  }

  getCandidate(id: string): Promise<APIResponse> {
    return this.ctx.get(`/candidates/${id}`, { params: this.cacheBustParams() });
  }

  updateCandidate(id: string, body: CandidateInput): Promise<APIResponse> {
    return this.ctx.patch(`/candidates/${id}`, { data: body, params: this.cacheBustParams() });
  }

  inviteCandidates(assessmentId: string, body: InviteRequestBody): Promise<APIResponse> {
    return this.ctx.post(`/assessments/${assessmentId}/invitations`, {
      data: body,
      params: this.cacheBustParams(),
    });
  }

  getAttempt(id: string): Promise<APIResponse> {
    return this.ctx.get(`/attempts/${id}`, { params: this.cacheBustParams() });
  }

  resendAttempt(id: string, body?: ResendRequestBody): Promise<APIResponse> {
    return this.ctx.post(`/attempts/${id}/resend`, { data: body ?? {}, params: this.cacheBustParams() });
  }

  rescheduleAttempt(id: string, body: RescheduleRequestBody): Promise<APIResponse> {
    return this.ctx.post(`/attempts/${id}/reschedule`, { data: body, params: this.cacheBustParams() });
  }

  extendAttempt(id: string, body: ExtendRequestBody): Promise<APIResponse> {
    return this.ctx.post(`/attempts/${id}/extend`, { data: body, params: this.cacheBustParams() });
  }

  closeAttempt(id: string): Promise<APIResponse> {
    return this.ctx.post(`/attempts/${id}/close`, { params: this.cacheBustParams() });
  }

  bulkAttempts(body: BulkAttemptsRequestBody): Promise<APIResponse> {
    return this.ctx.post('/attempts/bulk', { data: body, params: this.cacheBustParams() });
  }

  getCandidateResults(candidateId: string, params?: Record<string, string | number>): Promise<APIResponse> {
    return this.ctx.get(`/candidates/${candidateId}/results`, { params: this.cacheBustParams(params) });
  }

  listResults(params?: Record<string, string | number>): Promise<APIResponse> {
    return this.ctx.get('/results', { params: this.cacheBustParams(params) });
  }

  getAssessmentResults(assessmentId: string, params?: Record<string, string | number>): Promise<APIResponse> {
    return this.ctx.get(`/assessments/${assessmentId}/results`, { params: this.cacheBustParams(params) });
  }

  getFullResult(attemptId: string): Promise<APIResponse> {
    return this.ctx.get(`/attempts/${attemptId}/result`, { params: this.cacheBustParams() });
  }
}
