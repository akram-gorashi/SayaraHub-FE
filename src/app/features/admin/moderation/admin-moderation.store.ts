import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { ModerationCar, ModerationDecision, ModerationStatistics } from '../../../core/models/admin-moderation.models';
import { AdminModerationService } from '../../../core/services/admin-moderation.service';

@Injectable()
export class AdminModerationStore {
  private readonly service = inject(AdminModerationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly carsState = signal<ModerationCar[]>([]);
  private readonly statisticsState = signal<ModerationStatistics>({ pending: 0, approved: 0, rejected: 0 });
  private readonly statusState = signal('Pending');
  private readonly loadingState = signal(false);
  private readonly moderatingState = signal<number | null>(null);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly cars = this.carsState.asReadonly();
  readonly statistics = this.statisticsState.asReadonly();
  readonly status = this.statusState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly moderating = this.moderatingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(status = this.statusState()): void {
    this.statusState.set(status);
    this.loadingState.set(true);
    this.errorState.set(null);
    forkJoin({
      cars: this.service.getCars({ status, pageNumber: 1, pageSize: 50 }),
      statistics: this.service.getStatistics(),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: ({ cars, statistics }) => {
        this.carsState.set(cars.data?.items ?? []);
        if (statistics.data) this.statisticsState.set(statistics.data);
      },
      error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to load moderation queue.')),
    });
  }

  moderate(carId: number, decision: ModerationDecision, reason: string | null): void {
    this.moderatingState.set(carId);
    this.errorState.set(null);
    this.successState.set(null);
    this.service.moderateCar(carId, { decision, reason }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.moderatingState.set(null)),
    ).subscribe({
      next: (response) => {
        this.successState.set(response.message);
        this.load();
      },
      error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to moderate this listing.')),
    });
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback
      : fallback;
  }
}
