import { PageQuery } from './api.models';

export enum ModerationDecision {
  Approve = 1,
  Reject = 2,
}

export interface ModerationQueueQuery extends PageQuery {
  status?: string;
}

export interface ModerateCarRequest {
  decision: ModerationDecision | null;
  reason?: string | null;
}

export interface ModerationCar {
  id: number;
  title: string;
  status: string;
  sellerId: number;
  sellerName: string;
  brand: string;
  model: string;
  price: number;
  listedDate: string;
  moderationReason: string | null;
  moderatedAt: string | null;
  moderatedByUserId: number | null;
}

export interface ModerationStatistics {
  pending: number;
  approved: number;
  rejected: number;
}
