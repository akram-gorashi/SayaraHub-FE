import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ListingDetailsStore } from './listing-details.store';

@Component({
  selector: 'app-account-listing-details',
  imports: [CurrencyPipe, DatePipe, RouterLink, TranslatePipe],
  templateUrl: './account-listing-details.html',
  styleUrl: './account-listing-details.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ListingDetailsStore],
})
export class AccountListingDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly translate = inject(TranslateService);
  protected readonly store = inject(ListingDetailsStore);
  protected readonly carId = Number(this.route.snapshot.paramMap.get('id'));
  protected readonly historyDescription = signal('');
  protected readonly editingHistoryId = signal<number | null>(null);
  protected readonly historyDate = signal(new Date().toISOString().slice(0, 10));
  protected readonly historyMileage = signal(0);
  protected readonly historyProvider = signal('');
  protected readonly historyCost = signal<number | null>(null);
  protected readonly historyType = signal('Service');
  protected readonly historyDocument = signal<File | null>(null);

  constructor() { this.store.load(this.carId); }

  protected editHistory(record: import('../../../core/models/vehicle-history.models').VehicleHistory): void {
    this.editingHistoryId.set(record.id); this.historyDescription.set(record.description);
    this.historyDate.set(record.serviceDate.slice(0, 10)); this.historyMileage.set(record.mileage);
    this.historyProvider.set(record.provider); this.historyCost.set(record.cost); this.historyType.set(record.recordType);
  }

  protected cancelHistoryEdit(): void {
    this.editingHistoryId.set(null);
    this.historyDescription.set('');
    this.historyDate.set(new Date().toISOString().slice(0, 10)); this.historyMileage.set(0);
    this.historyProvider.set(''); this.historyCost.set(null); this.historyType.set('Service'); this.historyDocument.set(null);
  }

  protected saveHistory(): void {
    if (!this.historyDescription().trim()) return;
    this.store.saveHistory(this.carId, { description: this.historyDescription(), serviceDate: this.historyDate(),
      mileage: this.historyMileage(), provider: this.historyProvider(), cost: this.historyCost(),
      recordType: this.historyType(), document: this.historyDocument() }, this.editingHistoryId() ?? undefined);
    this.cancelHistoryEdit();
  }

  protected documentSelected(event: Event): void { this.historyDocument.set((event.target as HTMLInputElement).files?.[0] ?? null); }

  protected deleteHistory(id: number): void {
    if (globalThis.confirm(this.translate.instant('account.confirmDeleteHistory'))) this.store.deleteHistory(id);
  }
}
