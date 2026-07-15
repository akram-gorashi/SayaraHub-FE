import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AuthSessionService } from '../../services/auth-session.service';
import { Notification } from '../../models/notification.models';
import { NotificationCenterService } from '../../services/notification-center.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly session = inject(AuthSessionService);
  protected readonly loggingOut = signal(false);
  protected readonly notifications = inject(NotificationCenterService);

  protected openNotification(notification: Notification): void {
    this.notifications.markRead(notification);
    if (notification.actionUrl) void this.router.navigateByUrl(notification.actionUrl);
  }

  protected logout(): void {
    if (this.loggingOut()) {
      return;
    }

    this.loggingOut.set(true);
    this.auth.logout().pipe(
      finalize(() => this.loggingOut.set(false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl('/'),
      error: () => void this.router.navigateByUrl('/'),
    });
  }
}
