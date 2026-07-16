import { Injectable, computed, effect, inject, signal } from '@angular/core';

import { AuthSessionService } from './auth-session.service';
import { ContactMessagesService } from './contact-messages.service';
import { NotificationCenterService } from './notification-center.service';

@Injectable({ providedIn: 'root' })
export class InquiryCenterService {
  private readonly api = inject(ContactMessagesService);
  private readonly notifications = inject(NotificationCenterService);
  private readonly session = inject(AuthSessionService);
  private readonly unreadState = signal(0);
  private readonly versionState = signal(0);

  readonly unread = this.unreadState.asReadonly();
  readonly version = this.versionState.asReadonly();
  readonly canUseInbox = computed(() => {
    const roles = this.session.session()?.roles ?? [];
    return roles.includes('Seller') || roles.includes('Admin');
  });

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated() || !this.canUseInbox()) { this.unreadState.set(0); return; }
      this.refresh();
    });
    effect(() => {
      const notification = this.notifications.latest();
      if (notification?.type === 'ContactInquiry') {
        this.versionState.update(value => value + 1);
        this.refresh();
      }
    });
  }

  refresh(): void {
    if (!this.canUseInbox()) return;
    this.api.getInbox({ pageNumber: 1, pageSize: 1, isRead: false }).subscribe({
      next: response => this.unreadState.set(response.data?.totalCount ?? 0),
    });
  }
}
