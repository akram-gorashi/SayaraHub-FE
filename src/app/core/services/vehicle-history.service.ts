import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS, API_ROOT } from '../api/api-endpoints';
import { ApiResponse, EmptyResult } from '../models/api.models';
import { SaveVehicleHistoryRequest, VehicleHistory } from '../models/vehicle-history.models';

@Injectable({ providedIn: 'root' })
export class VehicleHistoryService {
  constructor(private readonly http: HttpClient) {}

  getByCar(carId: number): Observable<ApiResponse<VehicleHistory[]>> {
    return this.http.get<ApiResponse<VehicleHistory[]>>(`${API_ROOT}/cars/${carId}/history`);
  }

  create(carId: number, request: SaveVehicleHistoryRequest): Observable<ApiResponse<VehicleHistory>> {
    return this.http.post<ApiResponse<VehicleHistory>>(`${API_ROOT}/cars/${carId}/history`, request);
  }

  update(historyId: number, request: SaveVehicleHistoryRequest): Observable<ApiResponse<VehicleHistory>> {
    return this.http.put<ApiResponse<VehicleHistory>>(`${API_ENDPOINTS.vehicleHistory}/${historyId}`, request);
  }

  delete(historyId: number): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.vehicleHistory}/${historyId}`);
  }
}
