import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Notification } from '../../../core/models/notification.models';
import { NotificationsStore } from './notifications.store';

@Component({
  selector: 'app-account-notifications',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './account-notifications.html',
  styleUrl: './account-notifications.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NotificationsStore],
})
export class AccountNotifications {
  protected readonly store = inject(NotificationsStore);
  private readonly router = inject(Router);
  constructor() { this.store.load(); }
  protected filterRead(value: string): void { this.store.load({ isRead: value === '' ? undefined : value === 'unread', pageNumber: 1 }); }
  protected filterType(value: string): void { this.store.load({ type: value || undefined, pageNumber: 1 }); }
  protected page(pageNumber: number): void { if (pageNumber >= 1 && pageNumber <= this.store.totalPages()) this.store.load({ pageNumber }); }
  protected open(item: Notification): void { this.store.markRead(item); if (item.actionUrl) void this.router.navigateByUrl(item.actionUrl); }
  protected label(type: string): string { return type.replace(/([a-z])([A-Z])/g, '$1 $2'); }
}
