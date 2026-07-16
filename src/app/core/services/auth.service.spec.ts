import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { AuthSession } from '../models/auth.models';
import { AuthService } from './auth.service';
import { AuthSessionService } from './auth-session.service';

describe('AuthService refresh flow', () => {
  let auth: AuthService;
  let session: AuthSessionService;
  let http: HttpTestingController;

  const activeSession = (token: string, refreshToken?: string): AuthSession => ({
    token,
    refreshToken,
    accessTokenExpiresAt: new Date(Date.now() + 60_000).toISOString(),
    refreshTokenExpiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    fullName: 'Test Seller',
    email: 'seller@example.com',
    roles: ['Seller'],
  });

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    auth = TestBed.inject(AuthService);
    session = TestBed.inject(AuthSessionService);
    http = TestBed.inject(HttpTestingController);
    session.clear();
  });

  afterEach(() => {
    session.clear();
    http.verify();
  });

  it('does not retain a raw refresh token in the browser session', () => {
    session.set(activeSession('access-token', 'raw-refresh-secret'));

    expect(session.refreshToken).toBeNull();
    expect(session.session()?.refreshToken).toBeUndefined();
    expect(session.canRefresh()).toBe(true);
  });

  it('shares one rotation request between simultaneous refresh callers', () => {
    session.set(activeSession('expired-access-token'));
    let first = '';
    let second = '';

    auth.refresh().subscribe(value => first = value.token);
    auth.refresh().subscribe(value => second = value.token);

    const request = http.expectOne('/api/v1/Auth/refresh');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ success: true, message: 'refreshed', data: activeSession('replacement-token') });

    expect(first).toBe('replacement-token');
    expect(second).toBe('replacement-token');
    expect(session.accessToken).toBe('replacement-token');
  });
});
