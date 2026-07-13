import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthService } from '../services/auth.service';

let refreshRequest: Observable<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSessionService);
  const auth = inject(AuthService);
  const isPublicAuthRequest = ['login', 'register', 'refresh', 'revoke'].some(
    (path) => request.url === `${API_ENDPOINTS.auth}/${path}`,
  );
  const authorizedRequest = session.accessToken && !isPublicAuthRequest
    ? request.clone({ setHeaders: { Authorization: `Bearer ${session.accessToken}` } })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isPublicAuthRequest || !session.refreshToken) {
        return throwError(() => error);
      }

      if (!refreshRequest) {
        refreshRequest = auth.refresh().pipe(
          map((newSession) => newSession.token),
          catchError((refreshError: unknown) => {
            auth.clearSession();
            return throwError(() => refreshError);
          }),
          finalize(() => (refreshRequest = null)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
      }

      return refreshRequest.pipe(
        switchMap((token) => next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
      );
    }),
  );
};
