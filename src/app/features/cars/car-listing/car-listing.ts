import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Breadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { CarCard } from '../components/car-card/car-card';
import { CarSortOption, CarListingStore, MultiSelectFilter } from './car-listing.store';

@Component({
  selector: 'app-car-listing',
  imports: [Breadcrumb, CarCard],
  templateUrl: './car-listing.html',
  styleUrl: './car-listing.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CarListingStore],
})
export class CarListing {
  protected readonly store = inject(CarListingStore);
  private readonly route = inject(ActivatedRoute);

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
  }
}
