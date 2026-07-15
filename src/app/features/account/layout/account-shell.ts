import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';

import { Breadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { AccountStore } from '../data-access/account.store';
import { AccountSidebar } from './account-sidebar';

@Component({
  selector: 'app-account-shell',
  imports: [AccountSidebar, Breadcrumb, RouterOutlet],
  templateUrl: './account-shell.html',
  styleUrl: './account-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AccountStore],
})
export class AccountShell {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly navigationId = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.id),
    ),
    { initialValue: 0 },
  );

  protected readonly title = computed(() => {
    this.navigationId();
    return this.route.firstChild?.snapshot.data['accountTitle'] as string || 'My Account';
  });
}
