import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, EmptyResult } from '../models/api.models';
import {
  DeleteAccountRequest,
  UpdateUserSettingsRequest,
  UserSettings,
} from '../models/settings.models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private readonly http: HttpClient) {}

  get(): Observable<ApiResponse<UserSettings>> {
    return this.http.get<ApiResponse<UserSettings>>(API_ENDPOINTS.settings);
  }

  update(request: UpdateUserSettingsRequest): Observable<ApiResponse<UserSettings>> {
    return this.http.put<ApiResponse<UserSettings>>(API_ENDPOINTS.settings, request);
  }

  deleteAccount(request: DeleteAccountRequest): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.settings}/account`, { body: request });
  }
}
