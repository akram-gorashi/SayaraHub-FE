import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { CarCard } from '../../../features/cars/components/car-card/car-card';
import { TemplatePluginsService } from '../../services/template-plugins';
import { LandingFilters, LandingStore } from './landing.store';

@Component({
  selector: 'app-main-layout',
  imports: [CarCard, DecimalPipe],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LandingStore],
  host: {
    '(document:keydown.escape)': 'closeMobileSearch()',
  },
})
export class MainLayout {
  protected readonly store = inject(LandingStore);
  protected readonly mobileSearchOpen = signal(false);
  private readonly templatePlugins = inject(TemplatePluginsService);
  private readonly router = inject(Router);
  private searchTrigger: HTMLElement | null = null;

  constructor() {
    this.store.load();
    this.templatePlugins.initializeHomePlugins();
  }

  protected updateTextFilter(key: 'search' | 'city', event: Event): void {
    this.store.updateFilter(key, (event.target as HTMLInputElement).value.trimStart());
  }

  protected updateSelectFilter(
    key: 'brandId' | 'transmissionId' | 'fuelTypeId',
    event: Event,
  ): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.updateFilter(key, value ? Number(value) : null);
  }

  protected updateYearFilter(key: 'minYear' | 'maxYear', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.store.updateFilter(key, value ? Number(value) : null);
  }

  protected submitSearch(event: Event): void {
    event.preventDefault();
    this.closeMobileSearch();
    this.navigateToCarList();
  }

  protected openMobileSearch(): void {
    this.searchTrigger = document.activeElement as HTMLElement | null;
    this.mobileSearchOpen.set(true);
    setTimeout(() => document.querySelector<HTMLInputElement>('#landing-search-panel input')?.focus());
  }

  protected closeMobileSearch(): void {
    if (!this.mobileSearchOpen()) return;
    this.mobileSearchOpen.set(false);
    setTimeout(() => this.searchTrigger?.focus());
  }

  protected browseBrand(brandId: number): void {
    void this.router.navigate(['/cars'], { queryParams: { brandIds: brandId } });
  }

  private navigateToCarList(): void {
    const filters = this.store.filters();
    void this.router.navigate(['/cars'], {
      queryParams: {
        search: filters.search || null,
        brandIds: filters.brandId,
        transmissionIds: filters.transmissionId,
        fuelTypeIds: filters.fuelTypeId,
        minYear: filters.minYear,
        maxYear: filters.maxYear,
        city: filters.city || null,
      },
    });
  }
}
