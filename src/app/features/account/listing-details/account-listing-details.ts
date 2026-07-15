import { CurrencyPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ListingDetailsStore } from './listing-details.store';

@Component({
  selector: 'app-account-listing-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, TitleCasePipe],
  templateUrl: './account-listing-details.html',
  styleUrl: './account-listing-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ListingDetailsStore],
})
export class AccountListingDetails {
  private readonly route = inject(ActivatedRoute);
  protected readonly store = inject(ListingDetailsStore);
  protected readonly carId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly historyDescription = signal('');
  protected readonly editingHistoryId = signal<number | null>(null);

  constructor() { this.store.load(this.carId); }

  protected editHistory(id: number, description: string): void {
    this.editingHistoryId.set(id);
    this.historyDescription.set(description);
  }

  protected cancelHistoryEdit(): void {
    this.editingHistoryId.set(null);
    this.historyDescription.set('');
  }

  protected saveHistory(): void {
    if (!this.historyDescription().trim()) return;
    this.store.saveHistory(this.carId, this.historyDescription(), this.editingHistoryId() ?? undefined);
    this.cancelHistoryEdit();
  }

  protected deleteHistory(id: number): void {
    if (globalThis.confirm('Delete this vehicle-history record?')) this.store.deleteHistory(id);
  }
}
