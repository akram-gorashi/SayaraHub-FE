import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { AuditLog } from '../../../core/models/admin-moderation.models';
import { ApiResponse } from '../../../core/models/api.models';
import { DeadLetterNotification } from '../../../core/models/notification.models';
import { ReportDecision, ReportQuery, UserReport } from '../../../core/models/safety.models';
import { AdminModerationService } from '../../../core/services/admin-moderation.service';

@Injectable()
export class AdminOperationsStore {
  private readonly api = inject(AdminModerationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reportsState = signal<UserReport[]>([]);
  private readonly auditState = signal<AuditLog[]>([]);
  private readonly deadLettersState = signal<DeadLetterNotification[]>([]);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly reports = this.reportsState.asReadonly();
  readonly auditLogs = this.auditState.asReadonly();
  readonly deadLetters = this.deadLettersState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(reportQuery: ReportQuery = {}): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    forkJoin({
      reports: this.api.getReports({ pageNumber: 1, pageSize: 50, ...reportQuery }),
      audit: this.api.getAuditLogs({ pageNumber: 1, pageSize: 50 }),
      deadLetters: this.api.getNotificationDeadLetters({ pageNumber: 1, pageSize: 50 }),
    }).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false))).subscribe({
      next: ({ reports, audit, deadLetters }) => {
        this.reportsState.set(reports.data?.items ?? []);
        this.auditState.set(audit.data?.items ?? []);
        this.deadLettersState.set(deadLetters.data?.items ?? []);
      },
      error: error => this.errorState.set(this.message(error, 'Unable to load administration data.')),
    });
  }

  resolve(report: UserReport, decision: ReportDecision, note: string): void {
    this.api.resolveReport(report.id, { decision, note: note || null }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        if (response.data) this.reportsState.update(items => items.map(item => item.id === report.id ? response.data! : item));
        this.successState.set(decision === ReportDecision.Resolve ? 'Report resolved.' : 'Report dismissed.');
      },
      error: error => this.errorState.set(this.message(error, 'Unable to resolve the report.')),
    });
  }

  retry(item: DeadLetterNotification): void {
    this.api.retryNotification(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => { this.deadLettersState.update(items => items.filter(value => value.id !== item.id)); this.successState.set(response.message || 'Notification queued for retry.'); },
      error: error => this.errorState.set(this.message(error, 'Unable to retry the notification.')),
    });
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback : fallback;
  }
}
