import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ParamMap } from '@angular/router';
import { Subscription, finalize } from 'rxjs';

import { CarQuery, CarSummary } from '../../../core/models/car.models';
import { MasterData } from '../../../core/models/master-data.models';
import { CarsService } from '../../../core/services/cars.service';
import { MasterDataService } from '../../../core/services/master-data.service';
import { CarViewMode } from '../models/car-view-mode';

export type MultiSelectFilter = 'brands' | 'transmissions' | 'fuelTypes' | 'features';
export type CarSortOption = 'latest' | 'priceAsc' | 'priceDesc' | 'yearDesc' | 'mileageAsc';

interface ListingFilters {
  search: string;
  brands: string[];
  transmissions: string[];
  fuelTypes: string[];
  features: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minYear: number | null;
  maxYear: number | null;
  city: string;
  sort: CarSortOption;
}

const INITIAL_FILTERS: ListingFilters = {
  search: '',
  brands: [],
  transmissions: [],
  fuelTypes: [],
  features: [],
  minPrice: null,
  maxPrice: null,
  minYear: null,
  maxYear: null,
  city: '',
  sort: 'latest',
};

@Injectable()
export class CarListingStore {
  private readonly carsService = inject(CarsService);
  private readonly masterDataService = inject(MasterDataService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly carsState = signal<CarSummary[]>([]);
  private readonly masterDataState = signal<MasterData | null>(null);
  private readonly filtersState = signal<ListingFilters>({ ...INITIAL_FILTERS });
  private readonly viewModeState = signal<CarViewMode>(this.readViewMode());
  private readonly pageState = signal(1);
  private readonly totalCountState = signal(0);
  private readonly totalPagesState = signal(0);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private carsRequest?: Subscription;

  readonly pageSize = 9;
  readonly cars = this.carsState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly viewMode = this.viewModeState.asReadonly();
  readonly page = this.pageState.asReadonly();
  readonly totalCount = this.totalCountState.asReadonly();
  readonly totalPages = this.totalPagesState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly brands = computed(() => this.masterDataState()?.carBrands.items ?? []);
  readonly transmissions = computed(() => this.masterDataState()?.transmissions.items ?? []);
  readonly fuelTypes = computed(() => this.masterDataState()?.fuelTypes.items ?? []);
  readonly features = computed(() => this.masterDataState()?.features.items ?? []);
  readonly showingFrom = computed(() => (this.totalCount() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1));
  readonly showingTo = computed(() => Math.min(this.page() * this.pageSize, this.totalCount()));
  readonly visiblePages = computed(() => {
    const totalPages = this.totalPages();
    const current = this.page();
    const start = Math.max(1, Math.min(current - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  });

  initialize(queryParams: ParamMap): void {
    this.filtersState.update((filters) => ({
      ...filters,
      search: queryParams.get('search') ?? '',
      brands: queryParams.getAll('brands').filter(Boolean),
      transmissions: queryParams.getAll('transmissions').filter(Boolean),
      fuelTypes: queryParams.getAll('fuelTypes').filter(Boolean),
      minYear: this.numberParam(queryParams, 'minYear'),
      maxYear: this.numberParam(queryParams, 'maxYear'),
      city: queryParams.get('city') ?? '',
    }));
    const requestedPage = Number(queryParams.get('page'));
    this.pageState.set(Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1);
    this.loadCars();
    this.loadMasterData();
  }

  setViewMode(mode: CarViewMode): void {
    this.viewModeState.set(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sayaraHub.carViewMode', mode);
    }
  }

  updateSearch(value: string): void {
    this.filtersState.update((filters) => ({ ...filters, search: value }));
  }

  updatePrice(key: 'minPrice' | 'maxPrice', value: string): void {
    this.filtersState.update((filters) => ({
      ...filters,
      [key]: value === '' ? null : Number(value),
    }));
  }

  toggleFilter(key: MultiSelectFilter, value: string, checked: boolean): void {
    this.filtersState.update((filters) => {
      const selected = filters[key];
      return {
        ...filters,
        [key]: checked ? [...selected, value] : selected.filter((item) => item !== value),
      };
    });
  }

  isSelected(key: MultiSelectFilter, value: string): boolean {
    return this.filtersState()[key].includes(value);
  }

  setSort(sort: CarSortOption): void {
    this.filtersState.update((filters) => ({ ...filters, sort }));
    this.pageState.set(1);
    this.loadCars();
  }

  applyFilters(): void {
    this.pageState.set(1);
    this.loadCars();
  }

  resetFilters(): void {
    this.filtersState.set({ ...INITIAL_FILTERS });
    this.pageState.set(1);
    this.loadCars();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) {
      return;
    }
    this.pageState.set(page);
    this.loadCars();
    globalThis.scrollTo?.({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    this.loadCars();
  }

  private loadCars(): void {
    this.carsRequest?.unsubscribe();
    this.loadingState.set(true);
    this.errorState.set(null);

    this.carsRequest = this.carsService
      .getAll(this.toQuery())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingState.set(false)),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.setError(response.message || 'Unable to load cars.');
            return;
          }
          this.carsState.set(response.data.items);
          this.totalCountState.set(response.data.totalCount);
          this.totalPagesState.set(response.data.totalPages);
        },
        error: (error: unknown) => this.setError(this.errorMessage(error)),
      });
  }

  private loadMasterData(): void {
    if (this.masterDataState()) {
      return;
    }
    this.masterDataService
      .getAll({ pageNumber: 1, pageSize: 50 })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.masterDataState.set(response.data);
          }
        },
      });
  }

  private toQuery(): CarQuery {
    const filters = this.filtersState();
    const sort = this.sortQuery(filters.sort);
    return {
      search: filters.search || undefined,
      brands: filters.brands.length ? filters.brands : undefined,
      transmissions: filters.transmissions.length ? filters.transmissions : undefined,
      fuelTypes: filters.fuelTypes.length ? filters.fuelTypes : undefined,
      features: filters.features.length ? filters.features : undefined,
      minPrice: filters.minPrice ?? undefined,
      maxPrice: filters.maxPrice ?? undefined,
      minYear: filters.minYear ?? undefined,
      maxYear: filters.maxYear ?? undefined,
      city: filters.city || undefined,
      sortBy: sort.sortBy,
      sortDirection: sort.sortDirection,
      pageNumber: this.pageState(),
      pageSize: this.pageSize,
    };
  }

  private sortQuery(sort: CarSortOption): Pick<CarQuery, 'sortBy' | 'sortDirection'> {
    switch (sort) {
      case 'priceAsc': return { sortBy: 'price', sortDirection: 'asc' };
      case 'priceDesc': return { sortBy: 'price', sortDirection: 'desc' };
      case 'yearDesc': return { sortBy: 'year', sortDirection: 'desc' };
      case 'mileageAsc': return { sortBy: 'mileage', sortDirection: 'asc' };
      default: return { sortBy: 'listedDate', sortDirection: 'desc' };
    }
  }

  private setError(message: string): void {
    this.errorState.set(message);
    this.carsState.set([]);
    this.totalCountState.set(0);
    this.totalPagesState.set(0);
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (error.error as { message?: string } | null)?.message || 'Unable to reach the cars API.';
    }
    return 'Something went wrong while loading cars.';
  }

  private readViewMode(): CarViewMode {
    if (typeof localStorage === 'undefined') {
      return 'grid';
    }
    return localStorage.getItem('sayaraHub.carViewMode') === 'list' ? 'list' : 'grid';
  }

  private numberParam(params: ParamMap, key: string): number | null {
    const value = params.get(key);
    if (!value) {
      return null;
    }
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
