import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import {
  ModerationCar,
  ModerationDecision,
  ModerationHistory,
  ModerationQueueQuery,
  ModerationStatistics,
} from '../../../core/models/admin-moderation.models';
import { AdminModerationService } from '../../../core/services/admin-moderation.service';

@Injectable()
export class AdminModerationStore {
  private readonly service = inject(AdminModerationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly carsState = signal<ModerationCar[]>([]);
  private readonly historyState = signal<ModerationHistory[]>([]);
  private readonly statisticsState = signal<ModerationStatistics>({ pending: 0, approved: 0, rejected: 0 });
  private readonly queryState = signal<Required<Pick<ModerationQueueQuery, 'status' | 'pageNumber' | 'pageSize'>> & ModerationQueueQuery>({ status: 'Pending', pageNumber: 1, pageSize: 10 });
  private readonly totalState = signal(0);
  private readonly loadingState = signal(false);
  private readonly historyLoadingState = signal(false);
  private readonly moderatingState = signal<number | null>(null);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly cars = this.carsState.asReadonly();
  readonly history = this.historyState.asReadonly();
  readonly statistics = this.statisticsState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly status = computed(() => this.queryState().status);
  readonly total = this.totalState.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalState() / this.queryState().pageSize)));
  readonly currentPage = computed(() => this.queryState().pageNumber);
  readonly visiblePages = computed(() => {
    const totalPages = this.totalPages();
    const currentPage = this.currentPage();
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  });
  readonly loading = this.loadingState.asReadonly();
  readonly historyLoading = this.historyLoadingState.asReadonly();
  readonly moderating = this.moderatingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(changes: ModerationQueueQuery = {}): void {
    const query = { ...untracked(this.queryState), ...changes };
    this.queryState.set(query);
    this.loadingState.set(true);
    this.errorState.set(null);
    this.service.getCars(query).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: (response) => {
        this.carsState.set(response.data?.items ?? []);
        this.totalState.set(response.data?.totalCount ?? 0);
      },
      error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to load moderation queue.')),
    });
  }

  loadStatistics(): void {
    this.service.getStatistics().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (response) => {
        if (response.data) this.statisticsState.set(response.data);
      },
      error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to load moderation statistics.')),
    });
  }

  loadHistory(carId: number): void {
    this.historyState.set([]);
    this.historyLoadingState.set(true);
    this.service.getHistory(carId).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.historyLoadingState.set(false)),
    ).subscribe({
      next: (response) => this.historyState.set(response.data ?? []),
      error: (error: unknown) => this.errorState.set(this.message(error, 'Unable to load moderation history.')),
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
        this.loadStatistics();
        this.loadHistory(carId);
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
