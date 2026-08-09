import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { ChatMessage, ChatPresence, ChatTyping } from '../models/chat.models';
import { AuthSessionService } from './auth-session.service';
import { djangoWebSocketUrl } from './django-websocket-url';
import { DjangoWebSocketTicketService } from './django-websocket-ticket.service';

export interface DjangoChatReadReceipt {
  chatId: number;
  readerId: number;
  markedReadCount: number;
}

type ChatEvent =
  | { type: 'message.received'; message: ChatMessage }
  | ({ type: 'typing.changed' } & ChatTyping)
  | ({ type: 'presence.changed' } & ChatPresence)
  | ({ type: 'messages.read' } & DjangoChatReadReceipt);

@Injectable({ providedIn: 'root' })
export class DjangoChatRealtimeService {
  private readonly session = inject(AuthSessionService);
  private readonly zone = inject(NgZone);
  private readonly tickets = inject(DjangoWebSocketTicketService);
  private readonly sockets = new Map<number, WebSocket>();
  private readonly retryAttempts = new Map<number, number>();
  private readonly lastMessageIds = new Map<number, number>();
  private readonly intentionallyClosed = new Set<number>();
  private readonly messageSubject = new Subject<ChatMessage>();
  private readonly presenceSubject = new Subject<ChatPresence>();
  private readonly typingSubject = new Subject<ChatTyping>();
  private readonly readSubject = new Subject<DjangoChatReadReceipt>();
  private readonly connectedState = signal(false);

  readonly connected = this.connectedState.asReadonly();
  readonly messages$ = this.messageSubject.asObservable();
  readonly presence$ = this.presenceSubject.asObservable();
  readonly typing$ = this.typingSubject.asObservable();
  readonly readReceipts$ = this.readSubject.asObservable();

  async joinChats(chatIds: readonly number[]): Promise<void> {
    await Promise.all(chatIds.map(async (chatId) => {
      this.intentionallyClosed.delete(chatId);
      if (!this.sockets.has(chatId)) await this.connect(chatId);
    }));
  }

  async sendTyping(chatId: number, isTyping: boolean): Promise<void> {
    this.send(chatId, { type: 'typing', isTyping });
  }

  async sendRead(chatId: number): Promise<void> {
    this.send(chatId, { type: 'read' });
  }

  disconnect(chatId?: number): void {
    const ids = chatId === undefined ? [...this.sockets.keys()] : [chatId];
    ids.forEach((id) => {
      this.intentionallyClosed.add(id);
      this.sockets.get(id)?.close(1000, 'Client closed');
      this.sockets.delete(id);
    });
    this.connectedState.set(this.sockets.size > 0);
  }

  private async connect(chatId: number): Promise<void> {
    if (!this.session.accessToken) return;
    const ticket = await this.tickets.issue();
    if (this.intentionallyClosed.has(chatId)) return;
    const socket = new WebSocket(djangoWebSocketUrl(`/ws/chats/${chatId}/`, {
      ticket,
      afterId: this.lastMessageIds.get(chatId) ?? 0,
    }));
    this.sockets.set(chatId, socket);

    socket.onopen = () => this.zone.run(() => {
      this.retryAttempts.set(chatId, 0);
      this.connectedState.set(true);
    });
    socket.onmessage = (event) => this.zone.run(() => this.handle(JSON.parse(event.data) as ChatEvent));
    socket.onclose = () => this.zone.run(() => {
      if (this.sockets.get(chatId) === socket) this.sockets.delete(chatId);
      this.connectedState.set(this.sockets.size > 0);
      if (!this.intentionallyClosed.has(chatId) && this.session.isAuthenticated()) this.reconnect(chatId);
    });
  }

  private reconnect(chatId: number): void {
    const attempt = this.retryAttempts.get(chatId) ?? 0;
    const delays = [0, 2_000, 10_000, 30_000];
    this.retryAttempts.set(chatId, attempt + 1);
    setTimeout(() => void this.connect(chatId), delays[Math.min(attempt, delays.length - 1)]);
  }

  private handle(event: ChatEvent): void {
    if (event.type === 'message.received') {
      this.lastMessageIds.set(event.message.chatId, Math.max(this.lastMessageIds.get(event.message.chatId) ?? 0, event.message.id));
      this.messageSubject.next(event.message);
    } else if (event.type === 'typing.changed') {
      this.typingSubject.next(event);
    } else if (event.type === 'presence.changed') {
      this.presenceSubject.next(event);
    } else if (event.type === 'messages.read') {
      this.readSubject.next(event);
    }
  }

  private send(chatId: number, payload: object): void {
    const socket = this.sockets.get(chatId);
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(payload));
  }
}
