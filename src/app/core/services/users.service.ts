import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, EmptyResult } from '../models/api.models';
import {
  ChangePasswordRequest,
  PublicUserProfile,
  UpdateUserProfileRequest,
  UserImageResult,
  UserProfile,
} from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  constructor(private readonly http: HttpClient) {}

  getMe(): Observable<ApiResponse<UserProfile>> {
    return this.http.get<ApiResponse<UserProfile>>(`${API_ENDPOINTS.users}/me`);
  }

  getPublicProfile(userId: number): Observable<ApiResponse<PublicUserProfile>> {
    return this.http.get<ApiResponse<PublicUserProfile>>(`${API_ENDPOINTS.users}/${userId}`);
  }

  updateMe(request: UpdateUserProfileRequest): Observable<ApiResponse<UserProfile>> {
    return this.http.put<ApiResponse<UserProfile>>(`${API_ENDPOINTS.users}/me`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<EmptyResult>> {
    return this.http.put<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.users}/me/password`, request);
  }

  replaceImage(file: File): Observable<ApiResponse<UserImageResult>> {
    const formData = new FormData();
    formData.append('File', file);
    return this.http.post<ApiResponse<UserImageResult>>(`${API_ENDPOINTS.users}/me/image`, formData);
  }

  removeImage(): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.users}/me/image`);
  }
}
