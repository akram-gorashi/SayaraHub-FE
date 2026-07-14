import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription, finalize } from 'rxjs';

import { CarQuery, CarSummary } from '../../models/car.models';
import { MasterData } from '../../models/master-data.models';
import { CarsService } from '../../services/cars.service';
import { MasterDataService } from '../../services/master-data.service';

export interface LandingFilters {
  search: string;
  brandId: number | null;
  transmissionId: number | null;
  fuelTypeId: number | null;
  minYear: number | null;
  maxYear: number | null;
  city: string;
  sortDirection: 'asc' | 'desc';
}

const INITIAL_FILTERS: LandingFilters = {
  search: '',
  brandId: null,
  transmissionId: null,
  fuelTypeId: null,
  minYear: null,
  maxYear: null,
  city: '',
  sortDirection: 'desc',
};

@Injectable()
export class LandingStore {
  private readonly carsService = inject(CarsService);
  private readonly masterDataService = inject(MasterDataService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly carsState = signal<CarSummary[]>([]);
  private readonly masterDataState = signal<MasterData | null>(null);
  private readonly pendingRequests = signal(0);
  private readonly errorState = signal<string | null>(null);
  private readonly totalCountState = signal(0);
  private readonly filtersState = signal<LandingFilters>({ ...INITIAL_FILTERS });
  private carsRequest?: Subscription;

  readonly cars = this.carsState.asReadonly();
  readonly filters = this.filtersState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly totalCount = this.totalCountState.asReadonly();
  readonly loading = computed(() => this.pendingRequests() > 0);
  readonly brands = computed(() => this.masterDataState()?.carBrands.items ?? []);
  readonly transmissions = computed(() => this.masterDataState()?.transmissions.items ?? []);
  readonly fuelTypes = computed(() => this.masterDataState()?.fuelTypes.items ?? []);
  readonly years = computed(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1989 }, (_, index) => currentYear - index);
  });

  load(): void {
    this.loadCars();
    this.loadMasterData();
  }

  updateFilter<K extends keyof LandingFilters>(key: K, value: LandingFilters[K]): void {
    this.filtersState.update((filters) => ({ ...filters, [key]: value }));
  }

  search(): void {
    this.loadCars();
  }

  reset(): void {
    this.filtersState.set({ ...INITIAL_FILTERS });
    this.loadCars();
  }

  private loadCars(): void {
    this.carsRequest?.unsubscribe();
    this.errorState.set(null);
    this.beginRequest();

    this.carsRequest = this.carsService
      .getAll(this.toCarQuery())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.endRequest()),
      )
      .subscribe({
        next: (response) => {
          if (!response.success || !response.data) {
            this.errorState.set(response.message || 'Unable to load cars.');
            this.carsState.set([]);
            this.totalCountState.set(0);
            return;
          }

          this.carsState.set(response.data.items);
          this.totalCountState.set(response.data.totalCount);
        },
        error: (error: unknown) => {
          this.errorState.set(this.errorMessage(error));
          this.carsState.set([]);
          this.totalCountState.set(0);
        },
      });
  }

  private loadMasterData(): void {
    this.beginRequest();
    this.masterDataService
      .getAll({ pageNumber: 1, pageSize: 50 })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.endRequest()),
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.masterDataState.set(response.data);
          } else {
            this.errorState.set(response.message || 'Unable to load filter options.');
          }
        },
        error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
      });
  }

  private toCarQuery(): CarQuery {
    const filters = this.filtersState();
    return {
      search: filters.search || undefined,
      brandIds: filters.brandId ? [filters.brandId] : undefined,
      transmissionIds: filters.transmissionId ? [filters.transmissionId] : undefined,
      fuelTypeIds: filters.fuelTypeId ? [filters.fuelTypeId] : undefined,
      minYear: filters.minYear ?? undefined,
      maxYear: filters.maxYear ?? undefined,
      city: filters.city || undefined,
      sortBy: 'listedDate',
      sortDirection: filters.sortDirection,
      pageNumber: 1,
      pageSize: 8,
    };
  }

  private beginRequest(): void {
    this.pendingRequests.update((count) => count + 1);
  }

  private endRequest(): void {
    this.pendingRequests.update((count) => Math.max(0, count - 1));
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const apiMessage = (error.error as { message?: string } | null)?.message;
      return apiMessage || 'The API is currently unavailable. Please try again.';
    }

    return 'Something went wrong while loading the landing page.';
  }
}
