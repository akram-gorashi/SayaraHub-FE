import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { API_ENDPOINTS } from '../api/api-endpoints';
import { ApiResponse, PagedResponse, QueryParams } from '../models/api.models';
import { CarModelMasterData, MasterData, MasterDataItem, MasterDataQuery } from '../models/master-data.models';
import { toHttpParams } from '../utils/http-params';

type MasterDataItemPath = 'body-types' | 'car-brands' | 'car-conditions' | 'features' | 'fuel-types' | 'transmissions';

@Injectable({ providedIn: 'root' })
export class MasterDataService {
  private readonly cache = new Map<string, Observable<unknown>>();

  constructor(private readonly http: HttpClient) {}

  getAll(query: MasterDataQuery = {}): Observable<ApiResponse<MasterData>> {
    return this.getCached<MasterData>(API_ENDPOINTS.masterData, query);
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
    return this.getCached<PagedResponse<CarModelMasterData>>(
      `${API_ENDPOINTS.masterData}/car-models`,
      query,
    );
  }

  getCarModelsByBrand(
    carBrandId: number,
    query: MasterDataQuery = {},
  ): Observable<ApiResponse<PagedResponse<CarModelMasterData>>> {
    return this.getCached<PagedResponse<CarModelMasterData>>(
      `${API_ENDPOINTS.masterData}/car-brands/${carBrandId}/models`,
      query,
    );
  }

  private getItems(
    path: MasterDataItemPath,
    query: MasterDataQuery,
  ): Observable<ApiResponse<PagedResponse<MasterDataItem>>> {
    return this.getCached<PagedResponse<MasterDataItem>>(
      `${API_ENDPOINTS.masterData}/${path}`,
      query,
    );
  }

  private getCached<T>(url: string, query: MasterDataQuery): Observable<ApiResponse<T>> {
    const params = this.params(query);
    const key = `${url}?${params.toString()}`;
    const cached = this.cache.get(key) as Observable<ApiResponse<T>> | undefined;
    if (cached) return cached;

    const request = this.http.get<ApiResponse<T>>(url, { params }).pipe(
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.cache.set(key, request);
    return request;
  }

  private params(query: MasterDataQuery) {
    return toHttpParams(query as QueryParams);
  }
}
