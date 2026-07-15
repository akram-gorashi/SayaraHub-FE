import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { BlockedUser, UserReport } from '../../../core/models/safety.models';
import { UserSafetyService } from '../../../core/services/user-safety.service';

@Injectable()
export class SafetyStore {
  private readonly api = inject(UserSafetyService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly blockedState = signal<BlockedUser[]>([]);
  private readonly reportsState = signal<UserReport[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly blocked = this.blockedState.asReadonly();
  readonly reports = this.reportsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    forkJoin({ blocked: this.api.getBlocked({ pageNumber: 1, pageSize: 50 }), reports: this.api.getMyReports({ pageNumber: 1, pageSize: 50 }) })
      .pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false)))
      .subscribe({
        next: ({ blocked, reports }) => { this.blockedState.set(blocked.data?.items ?? []); this.reportsState.set(reports.data?.items ?? []); },
        error: error => this.errorState.set(this.message(error, 'Unable to load safety information.')),
      });
  }

  unblock(user: BlockedUser): void {
    this.api.unblock(user.userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.blockedState.update(items => items.filter(item => item.userId !== user.userId)); this.successState.set(`${user.fullName} was unblocked.`); },
      error: error => this.errorState.set(this.message(error, 'Unable to unblock this user.')),
    });
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback : fallback;
  }
}
