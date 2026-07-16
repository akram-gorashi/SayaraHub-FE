import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { SellerCarDetails } from '../../../core/models/seller-dashboard.models';
import { SellerDashboardService } from '../../../core/services/seller-dashboard.service';
import { VehicleHistory } from '../../../core/models/vehicle-history.models';
import { SaveVehicleHistoryRequest } from '../../../core/models/vehicle-history.models';
import { VehicleHistoryService } from '../../../core/services/vehicle-history.service';

@Injectable()
export class ListingDetailsStore {
  private readonly sellerDashboard = inject(SellerDashboardService);
  private readonly vehicleHistory = inject(VehicleHistoryService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly carState = signal<SellerCarDetails | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly historyState = signal<VehicleHistory[]>([]);
  private readonly historySavingState = signal(false);
  private readonly successState = signal<string | null>(null);

  readonly car = this.carState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly history = this.historyState.asReadonly();
  readonly historySaving = this.historySavingState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(carId: number): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    forkJoin({ car: this.sellerDashboard.getCar(carId), history: this.vehicleHistory.getByCar(carId) }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: ({ car, history }) => {
        if (car.success && car.data) this.carState.set(car.data);
        else this.errorState.set(car.message);
        this.historyState.set(history.data ?? []);
      },
      error: (error: unknown) => this.errorState.set(error instanceof HttpErrorResponse
        ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to load the listing.'
        : 'Unable to load the listing.'),
    });
  }

  saveHistory(carId: number, requestValue: SaveVehicleHistoryRequest, historyId?: number): void {
    if (!requestValue.description.trim() || this.historySavingState()) return;
    this.historySavingState.set(true);
    this.errorState.set(null);
    this.successState.set(null);
    const request = historyId
      ? this.vehicleHistory.update(historyId, requestValue)
      : this.vehicleHistory.create(carId, requestValue);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.historySavingState.set(false))).subscribe({
      next: response => {
        if (!response.data) { this.errorState.set(response.message); return; }
        this.historyState.update(items => historyId
          ? items.map(item => item.id === historyId ? response.data! : item)
          : [response.data!, ...items]);
        this.successState.set(historyId ? 'History record updated.' : 'History record added.');
      },
      error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to save the history record.')),
    });
  }

  deleteHistory(historyId: number): void {
    this.vehicleHistory.delete(historyId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.historyState.update(items => items.filter(item => item.id !== historyId)); this.successState.set('History record deleted.'); },
      error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to delete the history record.')),
    });
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback
      : fallback;
  }
}
