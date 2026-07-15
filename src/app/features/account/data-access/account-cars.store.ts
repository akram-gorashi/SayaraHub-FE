import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { CarSummary } from '../../../core/models/car.models';
import { CarsService } from '../../../core/services/cars.service';
import { SellerDashboardService } from '../../../core/services/seller-dashboard.service';

@Injectable()
export class AccountCarsStore {
  private readonly carsService = inject(CarsService);
  private readonly sellerDashboard = inject(SellerDashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly carsState = signal<CarSummary[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly removingState = signal<number | null>(null);
  private readonly updatingStatusState = signal<number | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly cars = this.carsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly removingId = this.removingState.asReadonly();
  readonly updatingStatusId = this.updatingStatusState.asReadonly();
  readonly success = this.successState.asReadonly();

  loadListings(search = ''): void {
    this.load(() => this.sellerDashboard.getCars({
      search: search || undefined,
      sortBy: 'listedDate', sortDirection: 'desc', pageNumber: 1, pageSize: 50,
    }));
  }

  loadFavorites(): void {
    this.load(() => this.carsService.getFavorites({ pageNumber: 1, pageSize: 50 }));
  }

  removeFavorite(carId: number): void {
    this.removingState.set(carId);
    this.carsService.removeFavorite(carId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.removingState.set(null)),
    ).subscribe({
      next: () => this.carsState.update((cars) => cars.filter((car) => car.id !== carId)),
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  deleteListing(carId: number): void {
    this.removingState.set(carId);
    this.errorState.set(null);
    this.carsService.delete(carId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.removingState.set(null)),
    ).subscribe({
      next: () => {
        this.carsState.update((cars) => cars.filter((car) => car.id !== carId));
        this.successState.set('Listing deleted successfully.');
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  markSold(carId: number): void {
    this.updatingStatusState.set(carId);
    this.errorState.set(null);
    this.sellerDashboard.updateStatus(carId, { status: 'Sold' }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.updatingStatusState.set(null)),
    ).subscribe({
      next: () => {
        this.carsState.update((cars) => cars.map((car) => car.id === carId ? { ...car, status: 'Sold' } : car));
        this.successState.set('Listing marked as sold.');
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  private load(request: () => ReturnType<CarsService['getFavorites']>): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    request().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.carsState.set(response.data.items);
          return;
        }
        this.errorState.set(response.message || 'Unable to load cars.');
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to load cars.'
      : 'Unable to load cars.';
  }
}
