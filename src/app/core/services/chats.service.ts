import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_ENDPOINTS, API_ROOT } from '../api/api-endpoints';
import { ApiResponse, PagedResponse, QueryParams } from '../models/api.models';
import {
  Chat,
  ChatMessage,
  ChatQuery,
  CreateChatRequest,
  MarkMessagesReadResult,
  MessageQuery,
  SendMessageRequest,
} from '../models/chat.models';
import { toHttpParams } from '../utils/http-params';

@Injectable({ providedIn: 'root' })
export class ChatsService {
  constructor(private readonly http: HttpClient) {}

  create(carId: number, request: CreateChatRequest): Observable<ApiResponse<Chat>> {
    return this.http.post<ApiResponse<Chat>>(`${API_ROOT}/cars/${carId}/chats`, request);
  }

  getChats(query: ChatQuery = {}): Observable<ApiResponse<PagedResponse<Chat>>> {
    return this.http.get<ApiResponse<PagedResponse<Chat>>>(API_ENDPOINTS.chats, {
      params: toHttpParams(query as QueryParams),
    });
  }

  getMessages(chatId: number, query: MessageQuery = {}): Observable<ApiResponse<PagedResponse<ChatMessage>>> {
    return this.http.get<ApiResponse<PagedResponse<ChatMessage>>>(`${API_ENDPOINTS.chats}/${chatId}/messages`, {
      params: toHttpParams(query as QueryParams),
    });
  }

  sendMessage(chatId: number, request: SendMessageRequest): Observable<ApiResponse<ChatMessage>> {
    return this.http.post<ApiResponse<ChatMessage>>(`${API_ENDPOINTS.chats}/${chatId}/messages`, request);
  }

  markRead(chatId: number): Observable<ApiResponse<MarkMessagesReadResult>> {
    return this.http.patch<ApiResponse<MarkMessagesReadResult>>(`${API_ENDPOINTS.chats}/${chatId}/read`, {});
  }
}
