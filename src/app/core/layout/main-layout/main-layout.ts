import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { LandingFilters, LandingStore } from './landing.store';
import { TemplatePluginsService } from '../../services/template-plugins';

@Component({
  selector: 'app-main-layout',
  imports: [CurrencyPipe, DecimalPipe, RouterLink],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LandingStore],
})
export class MainLayout {
  protected readonly store = inject(LandingStore);
  private readonly templatePlugins = inject(TemplatePluginsService);
  private readonly router = inject(Router);

  constructor() {
    this.store.load();
    this.templatePlugins.initializeHomePlugins();
  }

  protected updateTextFilter(key: 'search' | 'city', event: Event): void {
    this.store.updateFilter(key, (event.target as HTMLInputElement).value.trimStart());
  }

  protected updateSelectFilter(
    key: 'brand' | 'transmission' | 'fuelType' | 'sortDirection',
    event: Event,
  ): void {
    this.store.updateFilter(key, (event.target as HTMLSelectElement).value as LandingFilters[typeof key]);
  }

  protected updateYearFilter(key: 'minYear' | 'maxYear', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.updateFilter(key, value ? Number(value) : null);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    this.navigateToCarList();
  }

  protected browseBrand(brand: string): void {
    void this.router.navigate(['/cars'], { queryParams: { brands: brand } });
  }

  protected useFallbackImage(event: Event): void {
    (event.target as HTMLImageElement).src = 'assets/img/car/01.jpg';
  }

  private navigateToCarList(): void {
    const filters = this.store.filters();
    void this.router.navigate(['/cars'], {
      queryParams: {
        search: filters.search || null,
        brands: filters.brand || null,
        transmissions: filters.transmission || null,
        fuelTypes: filters.fuelType || null,
        minYear: filters.minYear,
        maxYear: filters.maxYear,
        city: filters.city || null,
      },
    });
  }
}
