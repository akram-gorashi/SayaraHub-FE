import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { SavedSearchRequest } from '../models/saved-search.models';
import { SavedSearchService } from './saved-search.service';

describe('SavedSearchService', () => {
  let service: SavedSearchService;
  let http: HttpTestingController;
  const request: SavedSearchRequest = {
    name: 'Toyota in Riyadh', carBrandId: 1, carModelId: null,
    minPrice: 30_000, maxPrice: 100_000, city: 'Riyadh',
    notifyNewListings: true, notifyPriceDrops: true, notifySold: true, isEnabled: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(SavedSearchService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('creates a saved search', () => {
    service.create(request).subscribe();
    const call = http.expectOne(API_ENDPOINTS.savedSearches);
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(request);
    call.flush({ success: true, message: '', data: null });
  });

  it('updates a saved search', () => {
    service.update(7, request).subscribe();
    const call = http.expectOne(`${API_ENDPOINTS.savedSearches}/7`);
    expect(call.request.method).toBe('PUT');
    call.flush({ success: true, message: '', data: null });
  });

  it('deletes a saved search', () => {
    service.delete(7).subscribe();
    const call = http.expectOne(`${API_ENDPOINTS.savedSearches}/7`);
    expect(call.request.method).toBe('DELETE');
    call.flush({ success: true, message: '', data: {} });
  });
});
