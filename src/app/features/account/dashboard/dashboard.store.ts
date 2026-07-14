import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { CarSummary } from '../../../core/models/car.models';
import { SellerDashboardStatistics } from '../../../core/models/seller-dashboard.models';
import { SellerDashboardService } from '../../../core/services/seller-dashboard.service';

@Injectable()
export class DashboardStore {
  private readonly dashboard = inject(SellerDashboardService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly statisticsState = signal<SellerDashboardStatistics | null>(null);
  private readonly recentListingsState = signal<CarSummary[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly statistics = this.statisticsState.asReadonly();
  readonly recentListings = this.recentListingsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);

    forkJoin({
      statistics: this.dashboard.getStatistics(),
      listings: this.dashboard.getCars({
        sortBy: 'listedDate',
        sortDirection: 'desc',
        pageNumber: 1,
        pageSize: 5,
      }),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: ({ statistics, listings }) => {
        if (!statistics.success || !statistics.data || !listings.success || !listings.data) {
          this.errorState.set(statistics.message || listings.message || 'Unable to load your dashboard.');
          return;
        }
        this.statisticsState.set(statistics.data);
        this.recentListingsState.set(listings.data.items);
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to load your dashboard.';
    }
    return 'Unable to load your dashboard.';
  }
}
