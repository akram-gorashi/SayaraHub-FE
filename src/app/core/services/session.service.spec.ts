import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { SessionService } from './session.service';

describe('SessionService', () => {
  let service: SessionService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SessionService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads sessions with credentials', () => {
    service.getAll().subscribe();
    const request = http.expectOne(`${API_ENDPOINTS.auth}/sessions`);
    expect(request.request.withCredentials).toBe(true);
    request.flush({ success: true, message: '', data: [] });
  });

  it('revokes an individual session with credentials', () => {
    service.revoke('session-id').subscribe();
    const request = http.expectOne(`${API_ENDPOINTS.auth}/sessions/session-id`);
    expect(request.request.method).toBe('DELETE');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ success: true, message: '', data: { currentSessionRevoked: false } });
  });

  it('revokes other sessions with credentials', () => {
    service.revokeOthers().subscribe();
    const request = http.expectOne(`${API_ENDPOINTS.auth}/sessions/revoke-others`);
    expect(request.request.method).toBe('POST');
    expect(request.request.withCredentials).toBe(true);
    request.flush({ success: true, message: '', data: {} });
  });
});
