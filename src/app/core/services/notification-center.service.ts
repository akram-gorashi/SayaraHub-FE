import { Injectable, NgZone, effect, inject, signal } from '@angular/core';
import { HubConnection, HubConnectionBuilder, HubConnectionState, LogLevel } from '@microsoft/signalr';

import { Notification } from '../models/notification.models';
import { AuthSessionService } from './auth-session.service';
import { NotificationsService } from './notifications.service';

const notificationHubUrl = new URL(
  '/hubs/notifications',
  globalThis.location?.origin && globalThis.location.origin !== 'null'
    ? globalThis.location.origin
    : 'http://localhost',
).toString();

@Injectable({ providedIn: 'root' })
export class NotificationCenterService {
  private readonly session = inject(AuthSessionService);
  private readonly api = inject(NotificationsService);
  private readonly zone = inject(NgZone);
  private readonly itemsState = signal<Notification[]>([]);
  private readonly unreadState = signal(0);
  private readonly latestState = signal<Notification | null>(null);
  private startPromise: Promise<void> | null = null;
  private readonly connection: HubConnection = new HubConnectionBuilder()
    .withUrl(notificationHubUrl, { accessTokenFactory: () => this.session.accessToken ?? '' })
    .withAutomaticReconnect([0, 2_000, 10_000, 30_000])
    .configureLogging(LogLevel.Warning)
    .build();

  readonly items = this.itemsState.asReadonly();
  readonly unread = this.unreadState.asReadonly();
  readonly latest = this.latestState.asReadonly();

  constructor() {
    this.connection.on('NotificationReceived', (notification: Notification) => {
      this.zone.run(() => {
        this.itemsState.update((items) => [notification, ...items.filter((item) => item.id !== notification.id)].slice(0, 8));
        this.latestState.set(notification);
        if (!notification.isRead) this.unreadState.update((count) => count + 1);
      });
    });
    this.connection.onreconnected(() => this.load());

    effect(() => {
      if (this.session.isAuthenticated()) {
        this.load();
        void this.start().catch(() => undefined);
      } else {
        this.itemsState.set([]);
        this.unreadState.set(0);
        if (this.connection.state !== HubConnectionState.Disconnected) void this.connection.stop();
      }
    });
  }

  markRead(notification: Notification): void {
    if (notification.isRead) return;
    this.api.markRead(notification.id).subscribe({
      next: () => {
        this.itemsState.update((items) => items.map((item) => item.id === notification.id ? { ...item, isRead: true } : item));
        this.unreadState.update((count) => Math.max(0, count - 1));
      },
    });
  }

  load(): void {
    this.api.getAll({ pageNumber: 1, pageSize: 8 }).subscribe({
      next: (response) => this.itemsState.set(response.data?.items ?? []),
    });
    this.api.getUnreadCount().subscribe({
      next: (response) => this.unreadState.set(response.data?.count ?? 0),
    });
  }

  private async start(): Promise<void> {
    if (this.connection.state === HubConnectionState.Connected) return;
    if (!this.startPromise) {
      this.startPromise = this.connection.start().finally(() => { this.startPromise = null; });
    }
    await this.startPromise;
  }
}
