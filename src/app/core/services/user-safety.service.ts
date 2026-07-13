import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, EmptyResult, PagedResponse, QueryParams } from '../models/api.models';
import {
  BlockedUser,
  CreateReportRequest,
  SafetyQuery,
  UserReport,
} from '../models/safety.models';
import { toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class UserSafetyService {
  constructor(private readonly http: HttpClient) {}

  getBlocked(query: SafetyQuery = {}): Observable<ApiResponse<PagedResponse<BlockedUser>>> {
    return this.http.get<ApiResponse<PagedResponse<BlockedUser>>>(`${API_ENDPOINTS.users}/me/blocked`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  block(userId: number): Observable<ApiResponse<BlockedUser>> {
    return this.http.post<ApiResponse<BlockedUser>>(`${API_ENDPOINTS.users}/${userId}/block`, {});
  }

  unblock(userId: number): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.users}/${userId}/block`);
  }

  report(request: CreateReportRequest): Observable<ApiResponse<UserReport>> {
    return this.http.post<ApiResponse<UserReport>>(API_ENDPOINTS.reports, request);
  }

  getMyReports(query: SafetyQuery = {}): Observable<ApiResponse<PagedResponse<UserReport>>> {
    return this.http.get<ApiResponse<PagedResponse<UserReport>>>(`${API_ENDPOINTS.reports}/mine`, {
      params: toHttpParams(query as QueryParams),
    });
  }
}
