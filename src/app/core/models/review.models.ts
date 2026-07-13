import { PageQuery } from './api.models';

export type ReviewQuery = PageQuery;

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
}
