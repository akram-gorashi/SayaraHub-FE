import { PageQuery } from './api.models';

export enum ReportDecision {
  Resolve = 1,
  Dismiss = 2,
}

export type SafetyQuery = PageQuery;

export interface ReportQuery extends PageQuery {
  status?: string;
  targetType?: string;
  search?: string;
}

export interface CreateReportRequest {
  targetType: string;
  targetId: number;
  reason: string;
  details?: string | null;
}

export interface ResolveReportRequest {
  decision: ReportDecision | null;
  note?: string | null;
}

export interface BlockedUser {
  userId: number;
  fullName: string;
  imageUrl: string | null;
  blockedAt: string;
}

export interface UserReport {
  id: number;
  reporterId: number;
  reporterName: string;
  targetType: string;
  targetId: number;
  reason: string;
  details: string | null;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedByUserId: number | null;
  resolutionNote: string | null;
  targetLabel: string;
  targetUrl: string | null;
}
