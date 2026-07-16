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
    return this.http.post<ApiResponse<VehicleHistory>>(`${API_ROOT}/cars/${carId}/history`, this.formData(request));
  }

  update(historyId: number, request: SaveVehicleHistoryRequest): Observable<ApiResponse<VehicleHistory>> {
    return this.http.put<ApiResponse<VehicleHistory>>(`${API_ENDPOINTS.vehicleHistory}/${historyId}`, this.formData(request));
  }

  delete(historyId: number): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.vehicleHistory}/${historyId}`);
  }

  private formData(request: SaveVehicleHistoryRequest): FormData {
    const data = new FormData();
    data.append('description', request.description);
    data.append('serviceDate', request.serviceDate);
    data.append('mileage', String(request.mileage));
    data.append('provider', request.provider);
    if (request.cost !== null && request.cost !== undefined) data.append('cost', String(request.cost));
    data.append('recordType', request.recordType);
    if (request.document) data.append('document', request.document, request.document.name);
    return data;
  }
}
