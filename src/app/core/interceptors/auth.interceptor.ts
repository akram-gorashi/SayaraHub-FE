import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, map, switchMap, throwError } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { AuthSessionService } from '../services/auth-session.service';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const session = inject(AuthSessionService);
  const auth = inject(AuthService);
  const document = inject(DOCUMENT);
  const isPublicAuthRequest = ['login', 'register', 'refresh', 'revoke'].some(
    (path) => request.url === `${API_ENDPOINTS.auth}/${path}`,
  );
  const localizedRequest = request.clone({
    setHeaders: {
      'Accept-Language': document.documentElement.lang === 'ar' ? 'ar-SA' : 'en-SA',
    },
  });
  const authorizedRequest = session.accessToken && !isPublicAuthRequest
    ? localizedRequest.clone({ setHeaders: { Authorization: `Bearer ${session.accessToken}` } })
    : localizedRequest;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isPublicAuthRequest || !session.canRefresh()) {
        return throwError(() => error);
      }

      return auth.refresh().pipe(
        map((newSession) => newSession.token),
        switchMap((token) => next(localizedRequest.clone({ setHeaders: { Authorization: `Bearer ${token}` } }))),
      );
    }),
  );
};
