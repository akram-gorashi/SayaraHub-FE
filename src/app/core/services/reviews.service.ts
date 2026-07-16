import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, EmptyResult, PagedResponse, QueryParams } from '../models/api.models';
import { Review, ReviewQuery, SaveReviewRequest } from '../models/review.models';
import { toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class ReviewsService {
  constructor(private readonly http: HttpClient) {}

  getBySeller(sellerId: number, query: ReviewQuery = {}): Observable<ApiResponse<PagedResponse<Review>>> {
    return this.http.get<ApiResponse<PagedResponse<Review>>>(`${API_ENDPOINTS.sellers}/${sellerId}/reviews`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  getMine(sellerId: number): Observable<ApiResponse<Review | null>> {
    return this.http.get<ApiResponse<Review | null>>(`${API_ENDPOINTS.reviews}/mine`, { params: { sellerId } });
  }

  create(sellerId: number, request: SaveReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${API_ENDPOINTS.sellers}/${sellerId}/reviews`, request);
  }

  update(reviewId: number, request: SaveReviewRequest): Observable<ApiResponse<Review>> {
    return this.http.put<ApiResponse<Review>>(`${API_ENDPOINTS.reviews}/${reviewId}`, request);
  }

  delete(reviewId: number): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.reviews}/${reviewId}`);
  }
}
