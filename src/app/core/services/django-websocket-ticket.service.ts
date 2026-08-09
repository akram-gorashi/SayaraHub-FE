import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiResponse } from '../models/api.models';

interface WebSocketTicket {
  ticket: string;
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class DjangoWebSocketTicketService {
  private readonly http = inject(HttpClient);

  async issue(): Promise<string> {
    const response = await firstValueFrom(
      this.http.post<ApiResponse<WebSocketTicket>>('/api/v1/Auth/websocket-ticket', {}),
    );
    if (!response.success || !response.data?.ticket) throw new Error('Unable to issue WebSocket ticket.');
    return response.data.ticket;
  }
}
