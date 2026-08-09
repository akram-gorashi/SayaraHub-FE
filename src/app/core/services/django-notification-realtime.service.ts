import { Injectable, NgZone, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';

import { Notification } from '../models/notification.models';
import { AuthSessionService } from './auth-session.service';
import { djangoWebSocketUrl } from './django-websocket-url';
import { DjangoWebSocketTicketService } from './django-websocket-ticket.service';

interface NotificationEvent {
  type: 'notification.received';
  notification: Notification;
  catchUp?: boolean;
}

@Injectable({ providedIn: 'root' })
export class DjangoNotificationRealtimeService {
  private readonly session = inject(AuthSessionService);
  private readonly zone = inject(NgZone);
  private readonly tickets = inject(DjangoWebSocketTicketService);
  private readonly notificationSubject = new Subject<Notification>();
  private readonly connectedState = signal(false);
  private socket: WebSocket | null = null;
  private retryAttempt = 0;
  private lastNotificationId = 0;
  private stopped = false;

  readonly connected = this.connectedState.asReadonly();
  readonly notifications$ = this.notificationSubject.asObservable();

  connect(): void {
    if (this.socket || !this.session.accessToken) return;
    this.stopped = false;
    void this.open().catch(() => this.reconnect());
  }

  private async open(): Promise<void> {
    if (this.socket || !this.session.accessToken) return;
    const ticket = await this.tickets.issue();
    if (this.stopped) return;
    const socket = new WebSocket(djangoWebSocketUrl('/ws/notifications/', {
      ticket,
      afterId: this.lastNotificationId,
    }));
    this.socket = socket;
    socket.onopen = () => this.zone.run(() => {
      this.retryAttempt = 0;
      this.connectedState.set(true);
    });
    socket.onmessage = (message) => this.zone.run(() => {
      const event = JSON.parse(message.data) as NotificationEvent;
      if (event.type !== 'notification.received') return;
      this.lastNotificationId = Math.max(this.lastNotificationId, event.notification.id);
      this.notificationSubject.next(event.notification);
    });
    socket.onclose = () => this.zone.run(() => {
      if (this.socket === socket) this.socket = null;
      this.connectedState.set(false);
      if (!this.stopped && this.session.isAuthenticated()) this.reconnect();
    });
  }

  disconnect(): void {
    this.stopped = true;
    this.socket?.close(1000, 'Client closed');
    this.socket = null;
    this.connectedState.set(false);
  }

  private reconnect(): void {
    const delays = [0, 2_000, 10_000, 30_000];
    const delay = delays[Math.min(this.retryAttempt++, delays.length - 1)];
    setTimeout(() => this.connect(), delay);
  }
}
