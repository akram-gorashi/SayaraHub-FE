import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS, API_ROOT } from '../api/api-endpoints';
import { ApiResponse, EmptyResult, PagedResponse, QueryParams } from '../models/api.models';
import {
  ContactMessage,
  ContactMessageQuery,
  CreateContactMessageRequest,
} from '../models/contact-message.models';
import { toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class ContactMessagesService {
  constructor(private readonly http: HttpClient) {}

  create(carId: number, request: CreateContactMessageRequest): Observable<ApiResponse<ContactMessage>> {
    return this.http.post<ApiResponse<ContactMessage>>(`${API_ROOT}/cars/${carId}/contact-messages`, request);
  }

  getInbox(query: ContactMessageQuery = {}): Observable<ApiResponse<PagedResponse<ContactMessage>>> {
    return this.http.get<ApiResponse<PagedResponse<ContactMessage>>>(`${API_ENDPOINTS.seller}/contact-messages`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  getById(id: number): Observable<ApiResponse<ContactMessage>> {
    return this.http.get<ApiResponse<ContactMessage>>(`${API_ENDPOINTS.seller}/contact-messages/${id}`);
  }

  markRead(id: number): Observable<ApiResponse<ContactMessage>> {
    return this.http.patch<ApiResponse<ContactMessage>>(`${API_ENDPOINTS.seller}/contact-messages/${id}/read`, {});
  }

  delete(id: number): Observable<ApiResponse<EmptyResult>> {
    return this.http.delete<ApiResponse<EmptyResult>>(`${API_ENDPOINTS.seller}/contact-messages/${id}`);
  }
}
