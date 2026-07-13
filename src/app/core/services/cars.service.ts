import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, PagedResponse, QueryParams } from '../models/api.models';
import { CarDetails, CarQuery, CarSummary, CreateCarRequest, SaveCarRequest } from '../models/car.models';
import { toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class CarsService {
  constructor(private readonly http: HttpClient) {}

  getAll(query: CarQuery = {}): Observable<ApiResponse<PagedResponse<CarSummary>>> {
    return this.http.get<ApiResponse<PagedResponse<CarSummary>>>(API_ENDPOINTS.cars, {
      params: toHttpParams(query as QueryParams),
    });
  }

  filter(query: CarQuery = {}): Observable<ApiResponse<PagedResponse<CarSummary>>> {
    return this.http.get<ApiResponse<PagedResponse<CarSummary>>>(`${API_ENDPOINTS.cars}/filter`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  getById(id: number): Observable<ApiResponse<CarDetails>> {
    return this.http.get<ApiResponse<CarDetails>>(`${API_ENDPOINTS.cars}/${id}`);
  }

  getRelated(id: number): Observable<ApiResponse<CarSummary[]>> {
    return this.http.get<ApiResponse<CarSummary[]>>(`${API_ENDPOINTS.cars}/${id}/related`);
  }

  getMine(query: CarQuery = {}): Observable<ApiResponse<PagedResponse<CarSummary>>> {
    return this.http.get<ApiResponse<PagedResponse<CarSummary>>>(`${API_ENDPOINTS.cars}/mine`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  getFavorites(query: Pick<CarQuery, 'pageNumber' | 'pageSize'> = {}): Observable<ApiResponse<PagedResponse<CarSummary>>> {
    return this.http.get<ApiResponse<PagedResponse<CarSummary>>>(`${API_ENDPOINTS.cars}/favorites`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  addFavorite(id: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(`${API_ENDPOINTS.cars}/${id}/favorite`, {});
  }

  removeFavorite(id: number): Observable<ApiResponse<string>> {
    return this.http.delete<ApiResponse<string>>(`${API_ENDPOINTS.cars}/${id}/favorite`);
  }

  create(request: CreateCarRequest): Observable<ApiResponse<CarSummary>> {
    return this.http.post<ApiResponse<CarSummary>>(API_ENDPOINTS.cars, this.toFormData(request));
  }

  update(id: number, request: SaveCarRequest): Observable<CarDetails> {
    return this.http.put<CarDetails>(`${API_ENDPOINTS.cars}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cars}/${id}`);
  }

  upload(file: File): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('File', file);
    return this.http.post<ApiResponse<string>>(`${API_ENDPOINTS.cars}/upload`, formData);
  }

  private toFormData(request: CreateCarRequest): FormData {
    const formData = new FormData();
    const { images, featureIds, ...fields } = request;

    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, String(value));
    }
    for (const featureId of featureIds) {
      formData.append('FeatureIds', String(featureId));
    }
    for (const image of images) {
      formData.append('Images', image);
    }

    return formData;
  }
}
