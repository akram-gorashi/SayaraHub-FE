import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { SellerCarDetails } from '../../../core/models/seller-dashboard.models';
import { SellerDashboardService } from '../../../core/services/seller-dashboard.service';

@Injectable()
export class ListingDetailsStore {
  private readonly sellerDashboard = inject(SellerDashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly carState = signal<SellerCarDetails | null>(null);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly car = this.carState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  load(carId: number): void {
    this.loadingState.set(true);
    this.sellerDashboard.getCar(carId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) this.carState.set(response.data);
        else this.errorState.set(response.message);
      },
      error: (error: unknown) => this.errorState.set(error instanceof HttpErrorResponse
        ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to load the listing.'
        : 'Unable to load the listing.'),
    });
  }
}
