import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, EmptyResult } from '../models/api.models';
import { SavedSearch, SavedSearchRequest } from '../models/saved-search.models';

@Injectable({ providedIn: 'root' })
export class SavedSearchService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<ApiResponse<SavedSearch[]>> {
    return this.http.get<ApiResponse<SavedSearch[]>>(API_ENDPOINTS.savedSearches);
  }

  create(request: SavedSearchRequest): Observable<ApiResponse<SavedSearch>> {
    return this.http.post<ApiResponse<SavedSearch>>(API_ENDPOINTS.savedSearches, request);
  }

  update(id: number, request: SavedSearchRequest): Observable<ApiResponse<SavedSearch>> {
    return this.http.put<ApiResponse<SavedSearch>>(`${API_ENDPOINTS.savedSearches}/${id}`, request);
  }

  delete(id: number): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.savedSearches}/${id}`);
  }
}
