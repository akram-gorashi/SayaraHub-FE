import { Injectable, effect, inject, signal } from '@angular/core';
import { Notification } from '../models/notification.models';
import { AuthSessionService } from './auth-session.service';
import { DjangoNotificationRealtimeService } from './django-notification-realtime.service';
import { NotificationsService } from './notifications.service';

@Injectable({ providedIn: 'root' })
export class DjangoNotificationCenterService {
  private readonly session = inject(AuthSessionService);
  private readonly api = inject(NotificationsService);
  private readonly realtime = inject(DjangoNotificationRealtimeService);
  private readonly itemsState = signal<Notification[]>([]);
  private readonly unreadState = signal(0);
  private readonly latestState = signal<Notification | null>(null);

  readonly items = this.itemsState.asReadonly();
  readonly unread = this.unreadState.asReadonly();
  readonly latest = this.latestState.asReadonly();

  constructor() {
    this.realtime.notifications$.subscribe((notification) => {
      this.itemsState.update((items) =>
        [notification, ...items.filter((item) => item.id !== notification.id)].slice(0, 8));
      this.latestState.set(notification);
      if (!notification.isRead) this.unreadState.update((count) => count + 1);
    });
    effect(() => {
      if (this.session.isAuthenticated()) {
        this.load();
        this.realtime.connect();
      } else {
        this.realtime.disconnect();
        this.itemsState.set([]);
        this.unreadState.set(0);
      }
    });
  }

  markRead(notification: Notification): void {
    if (notification.isRead) return;
    this.api.markRead(notification.id).subscribe(() => {
      this.itemsState.update((items) => items.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item));
      this.unreadState.update((count) => Math.max(0, count - 1));
    });
  }

  load(): void {
    this.api.getAll({ pageNumber: 1, pageSize: 8 }).subscribe((response) =>
      this.itemsState.set(response.data?.items ?? []));
    this.api.getUnreadCount().subscribe((response) =>
      this.unreadState.set(response.data?.count ?? 0));
  }
}
