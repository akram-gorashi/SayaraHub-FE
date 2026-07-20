import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { AccountCarsStore } from '../data-access/account-cars.store';
import { CarSummary } from '../../../core/models/car.models';

type ListingAction = { kind: 'delete' | 'sold'; car: CarSummary };

@Component({
  selector: 'app-account-listings',
  imports: [CurrencyPipe, DatePipe, RouterLink, TitleCasePipe, TranslatePipe],
  templateUrl: './account-listings.html',
  styleUrl: './account-listings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AccountCarsStore],
})
export class AccountListings {
  protected readonly store = inject(AccountCarsStore);
  protected readonly search = signal('');
  protected readonly confirmation = signal<ListingAction | null>(null);

  constructor() { this.store.loadListings(); }

  protected updateSearch(event: Event): void {
    this.search.set((event.target as HTMLInputElement).value);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    this.store.loadListings(this.search().trim());
  }

  protected statusClass(status: string): string {
    return ({ available: 'badge-success', pending: 'badge-info', reserved: 'badge-info', sold: 'badge-primary', rejected: 'badge-danger' } as Record<string, string>)[status.toLowerCase()] || 'badge-danger';
  }

  protected ask(kind: ListingAction['kind'], car: CarSummary): void { this.confirmation.set({ kind, car }); }
  protected cancel(): void { this.confirmation.set(null); }
  protected confirm(): void {
    const action = this.confirmation();
    if (!action) return;
    if (action.kind === 'delete') this.store.deleteListing(action.car.id);
    else this.store.markSold(action.car.id);
    this.confirmation.set(null);
  }
}
