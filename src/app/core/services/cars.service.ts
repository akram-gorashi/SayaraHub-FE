import { HttpClient, HttpEventType, HttpResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, filter, map, tap } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, PagedResponse, QueryParams } from '../models/api.models';
import { CarDetails, CarQuery, CarSummary, CreateCarRequest, UpdateCarRequest } from '../models/car.models';
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

  getBySeller(id: number, query: CarQuery = {}): Observable<ApiResponse<PagedResponse<CarSummary>>> {
    return this.http.get<ApiResponse<PagedResponse<CarSummary>>>(`${API_ENDPOINTS.cars}/seller/${id}`, {
      params: toHttpParams(query as QueryParams),
    });
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

  create(request: CreateCarRequest, onProgress?: (progress: number) => void): Observable<ApiResponse<CarSummary>> {
    return this.save('POST', API_ENDPOINTS.cars, request, onProgress);
  }

  update(id: number, request: UpdateCarRequest, onProgress?: (progress: number) => void): Observable<ApiResponse<CarSummary>> {
    return this.save('PUT', `${API_ENDPOINTS.cars}/${id}`, request, onProgress);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${API_ENDPOINTS.cars}/${id}`);
  }

  upload(file: File): Observable<ApiResponse<string>> {
    const formData = new FormData();
    formData.append('File', file);
    return this.http.post<ApiResponse<string>>(`${API_ENDPOINTS.cars}/upload`, formData);
  }

  private toFormData(request: CreateCarRequest | UpdateCarRequest): FormData {
    const formData = new FormData();
    const { images, featureIds, ...fields } = request;

    for (const [key, value] of Object.entries(fields)) {
      if (key === 'existingImageIds' || key === 'imageOrder') continue;
      formData.append(key, String(value));
    }
    for (const featureId of featureIds) {
      formData.append('FeatureIds', String(featureId));
    }
    if ('existingImageIds' in request) {
      for (const imageId of request.existingImageIds) {
        formData.append('ExistingImageIds', String(imageId));
      }
      for (const imageKey of request.imageOrder) {
        formData.append('ImageOrder', imageKey);
      }
    }
    for (const image of images) {
      formData.append('Images', image);
    }

    return formData;
  }

  private save(
    method: 'POST' | 'PUT',
    url: string,
    request: CreateCarRequest | UpdateCarRequest,
    onProgress?: (progress: number) => void,
  ): Observable<ApiResponse<CarSummary>> {
    return this.http.request<ApiResponse<CarSummary>>(method, url, {
      body: this.toFormData(request),
      observe: 'events',
      reportProgress: true,
    }).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          onProgress?.(Math.round((event.loaded / event.total) * 100));
        }
      }),
      filter((event): event is HttpResponse<ApiResponse<CarSummary>> => event instanceof HttpResponse),
      map((response) => response.body!),
    );
  }
}
