import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import {
  ModerateCarRequest,
  ModerationCar,
  ModerationHistory,
  ModerationQueueQuery,
  ModerationStatistics,
} from '../models/admin-moderation.models';
import { ApiResponse, EmptyResult, PageQuery, PagedResponse, QueryParams } from '../models/api.models';
import { DeadLetterNotification } from '../models/notification.models';
import { ReportQuery, ResolveReportRequest, UserReport } from '../models/safety.models';
import { toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class AdminModerationService {
  constructor(private readonly http: HttpClient) {}

  getCars(query: ModerationQueueQuery = {}): Observable<ApiResponse<PagedResponse<ModerationCar>>> {
    return this.http.get<ApiResponse<PagedResponse<ModerationCar>>>(`${API_ENDPOINTS.adminModeration}/cars`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  getCar(carId: number): Observable<ApiResponse<ModerationCar>> {
    return this.http.get<ApiResponse<ModerationCar>>(`${API_ENDPOINTS.adminModeration}/cars/${carId}`);
  }

  moderateCar(carId: number, request: ModerateCarRequest): Observable<ApiResponse<ModerationCar>> {
    return this.http.patch<ApiResponse<ModerationCar>>(
      `${API_ENDPOINTS.adminModeration}/cars/${carId}`,
      request,
    );
  }

  getStatistics(): Observable<ApiResponse<ModerationStatistics>> {
    return this.http.get<ApiResponse<ModerationStatistics>>(`${API_ENDPOINTS.adminModeration}/statistics`);
  }

  getHistory(carId: number): Observable<ApiResponse<ModerationHistory[]>> {
    return this.http.get<ApiResponse<ModerationHistory[]>>(
      `${API_ENDPOINTS.adminModeration}/cars/${carId}/history`,
    );
  }

  getReports(query: ReportQuery = {}): Observable<ApiResponse<PagedResponse<UserReport>>> {
    return this.http.get<ApiResponse<PagedResponse<UserReport>>>(`${API_ENDPOINTS.adminModeration}/reports`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  resolveReport(reportId: number, request: ResolveReportRequest): Observable<ApiResponse<UserReport>> {
    return this.http.patch<ApiResponse<UserReport>>(
      `${API_ENDPOINTS.adminModeration}/reports/${reportId}`,
      request,
    );
  }

  getNotificationDeadLetters(
    query: PageQuery = {},
  ): Observable<ApiResponse<PagedResponse<DeadLetterNotification>>> {
    return this.http.get<ApiResponse<PagedResponse<DeadLetterNotification>>>(
      `${API_ENDPOINTS.adminModeration}/notification-dead-letters`,
      { params: toHttpParams(query as QueryParams) },
    );
  }

  retryNotification(id: string): Observable<ApiResponse<EmptyResult>> {
    return this.http.post<ApiResponse<EmptyResult>>(
      `${API_ENDPOINTS.adminModeration}/notification-dead-letters/${id}/retry`,
      {},
    );
  }
}
