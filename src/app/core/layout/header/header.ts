import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { AuthSessionService } from '../../services/auth-session.service';
import { Notification } from '../../models/notification.models';
import { NotificationCenterService } from '../../services/notification-center.service';
import { LanguageService } from '../../services/language.service';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, TranslatePipe],
  templateUrl: './header.html',
  styleUrl: './header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:click)': 'closeMenus()',
  },
})
export class Header {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly session = inject(AuthSessionService);
  protected readonly loggingOut = signal(false);
  protected readonly notifications = inject(NotificationCenterService);
  protected readonly notificationOpen = signal(false);
  protected readonly pagesOpen = signal(false);
  protected readonly mobileNavigationOpen = signal(false);
  protected readonly language = inject(LanguageService);

  protected toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.notificationOpen.update(open => !open);
    this.pagesOpen.set(false);
  }

  protected togglePages(event: Event): void {
    event.stopPropagation();
    this.pagesOpen.update(open => !open);
    this.notificationOpen.set(false);
  }

  protected toggleMobileNavigation(event: Event): void {
    event.stopPropagation();
    this.mobileNavigationOpen.update(open => !open);
  }

  protected closeMenus(): void {
    this.notificationOpen.set(false);
    this.pagesOpen.set(false);
  }

  protected closeNavigation(): void {
    this.mobileNavigationOpen.set(false);
    this.closeMenus();
  }

  protected openNotification(notification: Notification): void {
    this.closeMenus();
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
