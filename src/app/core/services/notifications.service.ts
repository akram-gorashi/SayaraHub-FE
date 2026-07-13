import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, EmptyResult, PagedResponse, QueryParams } from '../models/api.models';
import { Notification, NotificationQuery, UnreadNotificationCount } from '../models/notification.models';
import { toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  constructor(private readonly http: HttpClient) {}

  getAll(query: NotificationQuery = {}): Observable<ApiResponse<PagedResponse<Notification>>> {
    return this.http.get<ApiResponse<PagedResponse<Notification>>>(API_ENDPOINTS.notifications, {
      params: toHttpParams(query as QueryParams),
    });
  }

  getUnreadCount(): Observable<ApiResponse<UnreadNotificationCount>> {
    return this.http.get<ApiResponse<UnreadNotificationCount>>(`${API_ENDPOINTS.notifications}/unread-count`);
  }

  markRead(id: number): Observable<ApiResponse<Notification>> {
    return this.http.patch<ApiResponse<Notification>>(`${API_ENDPOINTS.notifications}/${id}/read`, {});
  }

  markAllRead(): Observable<ApiResponse<UnreadNotificationCount>> {
    return this.http.patch<ApiResponse<UnreadNotificationCount>>(`${API_ENDPOINTS.notifications}/read-all`, {});
  }

  delete(id: number): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.notifications}/${id}`);
  }
}
