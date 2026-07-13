import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, finalize, map, of, tap } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse } from '../models/api.models';
import { AuthSession, LoginRequest, RegisterRequest } from '../models/auth.models';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    private readonly http: HttpClient,
    private readonly authSession: AuthSessionService,
  ) {}

  login(request: LoginRequest): Observable<AuthSession> {
    return this.authenticate('login', request);
  }

  register(request: RegisterRequest): Observable<AuthSession> {
    return this.authenticate('register', request);
  }

  refresh(): Observable<AuthSession> {
    const refreshToken = this.authSession.refreshToken;
    if (!refreshToken) {
      throw new Error('No refresh token is available.');
    }

    return this.http
      .post<ApiResponse<AuthSession>>(`${API_ENDPOINTS.auth}/refresh`, { refreshToken })
      .pipe(map((response) => this.requireData(response)), tap((session) => this.authSession.set(session)));
  }

  logout(): Observable<void> {
    const refreshToken = this.authSession.refreshToken;
    if (!refreshToken) {
      this.authSession.clear();
      return of(undefined);
    }

    return this.http
      .post<ApiResponse<object>>(`${API_ENDPOINTS.auth}/revoke`, { refreshToken })
      .pipe(map(() => undefined), finalize(() => this.authSession.clear()));
  }

  revokeAll(): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(`${API_ENDPOINTS.auth}/revoke-all`, {})
      .pipe(map(() => undefined), finalize(() => this.authSession.clear()));
  }

  clearSession(): void {
    this.authSession.clear();
  }

  private authenticate(
    path: 'login' | 'register',
    request: LoginRequest | RegisterRequest,
  ): Observable<AuthSession> {
    return this.http
      .post<ApiResponse<AuthSession>>(`${API_ENDPOINTS.auth}/${path}`, request)
      .pipe(map((response) => this.requireData(response)), tap((session) => this.authSession.set(session)));
  }

  private requireData(response: ApiResponse<AuthSession>): AuthSession {
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Authentication failed.');
    }

    return response.data;
  }
}
