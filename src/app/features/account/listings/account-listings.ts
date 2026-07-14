import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AccountCarsStore } from '../data-access/account-cars.store';

@Component({
  selector: 'app-account-listings',
  imports: [CurrencyPipe, DatePipe, RouterLink, TitleCasePipe],
  templateUrl: './account-listings.html',
  styleUrl: './account-listings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AccountCarsStore],
})
export class AccountListings {
  protected readonly store = inject(AccountCarsStore);
  protected readonly search = signal('');

  constructor() { this.store.loadListings(); }

  protected updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    this.store.loadListings(this.search().trim());
  }

  protected statusClass(status: string): string {
    return ({ available: 'badge-success', reserved: 'badge-info', sold: 'badge-primary' } as Record<string, string>)[status.toLowerCase()] || 'badge-danger';
  }
}
