import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, PagedResponse, QueryParams } from '../models/api.models';
import { CarQuery, CarSummary } from '../models/car.models';
import {
  SellerCarDetails,
  SellerCarImage,
  SellerDashboardStatistics,
  UpdateCarStatusRequest,
} from '../models/seller-dashboard.models';
import { toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class SellerDashboardService {
  constructor(private readonly http: HttpClient) {}

  getCars(query: CarQuery = {}): Observable<ApiResponse<PagedResponse<CarSummary>>> {
    return this.http.get<ApiResponse<PagedResponse<CarSummary>>>(`${API_ENDPOINTS.seller}/cars`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  getCar(carId: number): Observable<ApiResponse<SellerCarDetails>> {
    return this.http.get<ApiResponse<SellerCarDetails>>(`${API_ENDPOINTS.seller}/cars/${carId}`);
  }

  getStatistics(): Observable<ApiResponse<SellerDashboardStatistics>> {
    return this.http.get<ApiResponse<SellerDashboardStatistics>>(`${API_ENDPOINTS.seller}/statistics`);
  }

  updateStatus(carId: number, request: UpdateCarStatusRequest): Observable<ApiResponse<string>> {
    return this.http.patch<ApiResponse<string>>(`${API_ENDPOINTS.seller}/cars/${carId}/status`, request);
  }

  getImages(carId: number): Observable<ApiResponse<SellerCarImage[]>> {
    return this.http.get<ApiResponse<SellerCarImage[]>>(`${API_ENDPOINTS.seller}/cars/${carId}/images`);
  }

  retryImage(carId: number, imageId: number): Observable<ApiResponse<string>> {
    return this.http.post<ApiResponse<string>>(
      `${API_ENDPOINTS.seller}/cars/${carId}/images/${imageId}/retry`,
      {},
    );
  }
}
