import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, EmptyResult } from '../models/api.models';
import { RevokeSessionResult, UserSession } from '../models/session.models';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<ApiResponse<UserSession[]>> {
    return this.http.get<ApiResponse<UserSession[]>>(`${API_ENDPOINTS.auth}/sessions`, {
      withCredentials: true,
    });
  }

  revoke(sessionId: string): Observable<ApiResponse<RevokeSessionResult>> {
    return this.http.delete<ApiResponse<RevokeSessionResult>>(
      `${API_ENDPOINTS.auth}/sessions/${sessionId}`,
      { withCredentials: true },
    );
  }

  revokeOthers(): Observable<ApiResponse<EmptyResult>> {
    return this.http.post<ApiResponse<EmptyResult>>(
      `${API_ENDPOINTS.auth}/sessions/revoke-others`,
      {},
      { withCredentials: true },
    );
  }
}
