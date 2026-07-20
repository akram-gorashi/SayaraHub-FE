import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Breadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { CarCard } from '../components/car-card/car-card';
import { CarSortOption, CarListingStore, MultiSelectFilter } from './car-listing.store';

@Component({
  selector: 'app-car-listing',
  imports: [Breadcrumb, CarCard, TranslatePipe],
  templateUrl: './car-listing.html',
  styleUrl: './car-listing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CarListingStore],
  host: {
    '(document:keydown.escape)': 'closeFilters()',
  },
})
export class CarListing {
  protected readonly store = inject(CarListingStore);
  protected readonly filtersOpen = signal(false);
  private readonly route = inject(ActivatedRoute);
  private filterTrigger: HTMLElement | null = null;

  constructor() {
    this.store.initialize(this.route.snapshot.queryParamMap);
  }

  protected updateSearch(event: Event): void {
    this.store.updateSearch((event.target as HTMLInputElement).value);
  }

  protected updatePrice(key: 'minPrice' | 'maxPrice', event: Event): void {
    this.store.updatePrice(key, (event.target as HTMLInputElement).value);
  }

  protected toggleFilter(key: MultiSelectFilter, value: number, event: Event): void {
    this.store.toggleFilter(key, value, (event.target as HTMLInputElement).checked);
  }

  protected updateSort(event: Event): void {
    this.store.setSort((event.target as HTMLSelectElement).value as CarSortOption);
  }

  protected setViewMode(event: Event, mode: 'grid' | 'list'): void {
    event.preventDefault();
    this.store.setViewMode(mode);
  }

  protected submitFilters(event: Event): void {
    event.preventDefault();
    this.store.applyFilters();
    this.closeFilters();
  }

  protected openFilters(): void {
    this.filterTrigger = document.activeElement as HTMLElement | null;
    this.filtersOpen.set(true);
    setTimeout(() => document.querySelector<HTMLInputElement>('#car-filters input')?.focus());
  }

  protected closeFilters(): void {
    if (!this.filtersOpen()) return;
    this.filtersOpen.set(false);
    setTimeout(() => this.filterTrigger?.focus());
  }
}
