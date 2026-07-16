import { PageQuery } from './api.models';

export interface ReviewQuery extends PageQuery { status?: string; search?: string; }

export interface SaveReviewRequest {
  rating: number;
  comment: string;
}

export interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  reviewerId: number;
  reviewerName: string;
  reviewerImageUrl: string | null;
  sellerId: number;
  status: string;
  moderationReason: string | null;
}

export interface ModerateReviewRequest { decision: number | null; reason?: string | null; }
