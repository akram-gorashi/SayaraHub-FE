import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { LocalizedDatePipe } from '../../../shared/pipes/localized-date.pipe';
import { SarCurrencyPipe } from '../../../shared/pipes/sar-currency.pipe';

import { DashboardStore } from './dashboard.store';

@Component({
  selector: 'app-account-dashboard',
  imports: [LocalizedDatePipe, RouterLink, SarCurrencyPipe, TranslatePipe],
  templateUrl: './account-dashboard.html',
  styleUrl: './account-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DashboardStore],
})
export class AccountDashboard {
  protected readonly store = inject(DashboardStore);

  constructor() {
    this.store.load();
  }

  protected statusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'available': return 'badge-success';
      case 'reserved': return 'badge-info';
      case 'sold': return 'badge-primary';
      default: return 'badge-danger';
    }
  }
}
