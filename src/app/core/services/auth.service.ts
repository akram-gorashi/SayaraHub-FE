import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse } from '../models/api.models';
import { AuthSession, LoginRequest, RegisterRequest } from '../models/auth.models';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private refreshRequest: Observable<AuthSession> | null = null;
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
    if (!this.authSession.canRefresh()) {
      throw new Error('No refresh token is available.');
    }
    if (!this.refreshRequest) {
      this.refreshRequest = this.http
        .post<ApiResponse<AuthSession>>(
          `${API_ENDPOINTS.auth}/refresh`,
          { refreshToken: this.authSession.refreshToken },
          { withCredentials: true },
        )
        .pipe(
          map((response) => this.requireData(response)),
          tap((session) => this.authSession.set(session)),
          catchError((error: unknown) => { this.authSession.clear(); return throwError(() => error); }),
          finalize(() => (this.refreshRequest = null)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.refreshRequest;
  }

  logout(): Observable<void> {
    if (!this.authSession.canRefresh()) {
      this.authSession.clear();
      return of(undefined);
    }

    return this.revokeRequest(this.authSession.refreshToken);
  }

  ensureActiveSession(): Observable<boolean> {
    if (this.authSession.hasValidAccessToken()) return of(true);
    if (!this.authSession.canRefresh()) { this.authSession.clear(); return of(false); }
    return this.refresh().pipe(map(() => true), catchError(() => of(false)));
  }

  private revokeRequest(refreshToken: string | null): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(`${API_ENDPOINTS.auth}/revoke`, { refreshToken }, { withCredentials: true })
      .pipe(map(() => undefined), finalize(() => this.authSession.clear()));
  }

  revokeAll(): Observable<void> {
    return this.http
      .post<ApiResponse<object>>(`${API_ENDPOINTS.auth}/revoke-all`, {}, { withCredentials: true })
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
      .post<ApiResponse<AuthSession>>(`${API_ENDPOINTS.auth}/${path}`, request, { withCredentials: true })
      .pipe(map((response) => this.requireData(response)), tap((session) => this.authSession.set(session)));
  }

  private requireData(response: ApiResponse<AuthSession>): AuthSession {
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Authentication failed.');
    }

    return response.data;
  }
}
