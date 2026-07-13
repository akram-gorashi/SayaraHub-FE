import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, PagedResponse, QueryParams } from '../models/api.models';
import { CarModelMasterData, MasterData, MasterDataItem, MasterDataQuery } from '../models/master-data.models';
import { toHttpParams } from '../utils/http-params';

type MasterDataItemPath = 'body-types' | 'car-brands' | 'car-conditions' | 'features' | 'fuel-types' | 'transmissions';

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  constructor(private readonly http: HttpClient) {}

  getAll(query: MasterDataQuery = {}): Observable<ApiResponse<MasterData>> {
    return this.http.get<ApiResponse<MasterData>>(API_ENDPOINTS.masterData, {
      params: this.params(query),
    });
  }

  getBodyTypes(query: MasterDataQuery = {}) {
    return this.getItems('body-types', query);
  }

  getCarBrands(query: MasterDataQuery = {}) {
    return this.getItems('car-brands', query);
  }

  getCarConditions(query: MasterDataQuery = {}) {
    return this.getItems('car-conditions', query);
  }

  getFeatures(query: MasterDataQuery = {}) {
    return this.getItems('features', query);
  }

  getFuelTypes(query: MasterDataQuery = {}) {
    return this.getItems('fuel-types', query);
  }

  getTransmissions(query: MasterDataQuery = {}) {
    return this.getItems('transmissions', query);
  }

  getCarModels(query: MasterDataQuery = {}): Observable<ApiResponse<PagedResponse<CarModelMasterData>>> {
    return this.http.get<ApiResponse<PagedResponse<CarModelMasterData>>>(`${API_ENDPOINTS.masterData}/car-models`, {
      params: this.params(query),
    });
  }

  getCarModelsByBrand(
    carBrandId: number,
    query: MasterDataQuery = {},
  ): Observable<ApiResponse<PagedResponse<CarModelMasterData>>> {
    return this.http.get<ApiResponse<PagedResponse<CarModelMasterData>>>(
      `${API_ENDPOINTS.masterData}/car-brands/${carBrandId}/models`,
      { params: this.params(query) },
    );
  }

  private getItems(
    path: MasterDataItemPath,
    query: MasterDataQuery,
  ): Observable<ApiResponse<PagedResponse<MasterDataItem>>> {
    return this.http.get<ApiResponse<PagedResponse<MasterDataItem>>>(`${API_ENDPOINTS.masterData}/${path}`, {
      params: this.params(query),
    });
  }

  private params(query: MasterDataQuery) {
    return toHttpParams(query as QueryParams);
  }
}
