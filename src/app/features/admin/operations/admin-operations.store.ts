import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { AuditLog, AuditLogQuery } from '../../../core/models/admin-moderation.models';
import { ApiResponse, PagedResponse } from '../../../core/models/api.models';
import { DeadLetterNotification } from '../../../core/models/notification.models';
import { ReportDecision, ReportQuery, UserReport } from '../../../core/models/safety.models';
import { Review, ReviewQuery } from '../../../core/models/review.models';
import { AdminModerationService } from '../../../core/services/admin-moderation.service';

export type OperationsTab = 'reports' | 'reviews' | 'audit' | 'notifications';

@Injectable()
export class AdminOperationsStore {
  private readonly api = inject(AdminModerationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reportsState = signal<PagedResponse<UserReport> | null>(null);
  private readonly auditState = signal<PagedResponse<AuditLog> | null>(null);
  private readonly reviewsState = signal<PagedResponse<Review> | null>(null);
  private readonly deadLettersState = signal<PagedResponse<DeadLetterNotification> | null>(null);
  private readonly reportQueryState = signal<ReportQuery>({ pageNumber: 1, pageSize: 10, status: 'Open' });
  private readonly auditQueryState = signal<AuditLogQuery>({ pageNumber: 1, pageSize: 10 });
  private readonly reviewQueryState = signal<ReviewQuery>({ pageNumber: 1, pageSize: 10, status: 'Pending' });
  private readonly deadLetterPageState = signal(1);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly reports = computed(() => this.reportsState()?.items ?? []);
  readonly auditLogs = computed(() => this.auditState()?.items ?? []);
  readonly reviews = computed(() => this.reviewsState()?.items ?? []);
  readonly deadLetters = computed(() => this.deadLettersState()?.items ?? []);
  readonly reportQuery = this.reportQueryState.asReadonly();
  readonly auditQuery = this.auditQueryState.asReadonly();
  readonly reviewQuery = this.reviewQueryState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();
  readonly reportPage = computed(() => this.reportsState()?.pageNumber ?? 1);
  readonly reportPages = computed(() => this.reportsState()?.totalPages ?? 1);
  readonly auditPage = computed(() => this.auditState()?.pageNumber ?? 1);
  readonly auditPages = computed(() => this.auditState()?.totalPages ?? 1);
  readonly reviewPage = computed(() => this.reviewsState()?.pageNumber ?? 1);
  readonly reviewPages = computed(() => this.reviewsState()?.totalPages ?? 1);
  readonly deadLetterPage = computed(() => this.deadLettersState()?.pageNumber ?? 1);
  readonly deadLetterPages = computed(() => this.deadLettersState()?.totalPages ?? 1);

  loadReports(changes: ReportQuery = {}): void {
    const query = { ...this.reportQueryState(), ...changes };
    this.reportQueryState.set(query);
    this.run(this.api.getReports(query), data => this.reportsState.set(data));
  }

  loadAudit(changes: AuditLogQuery = {}): void {
    const query = { ...this.auditQueryState(), ...changes };
    this.auditQueryState.set(query);
    this.run(this.api.getAuditLogs(query), data => this.auditState.set(data));
  }

  loadReviews(changes: ReviewQuery = {}): void {
    const query = { ...this.reviewQueryState(), ...changes };
    this.reviewQueryState.set(query);
    this.run(this.api.getReviews(query), data => this.reviewsState.set(data));
  }

  loadDeadLetters(pageNumber = this.deadLetterPageState()): void {
    this.deadLetterPageState.set(pageNumber);
    this.run(this.api.getNotificationDeadLetters({ pageNumber, pageSize: 10 }), data => this.deadLettersState.set(data));
  }

  loadTab(tab: OperationsTab): void {
    if (tab === 'reports') this.loadReports();
    else if (tab === 'reviews') this.loadReviews();
    else if (tab === 'audit') this.loadAudit();
    else this.loadDeadLetters();
  }

  moderateReview(review: Review, decision: number, reason: string, done: () => void): void {
    this.loadingState.set(true);
    this.api.moderateReview(review.id, { decision, reason: reason || null }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: () => { this.successState.set(decision === 1 ? 'Review approved.' : 'Review rejected.'); done(); this.loadReviews(); },
      error: error => this.errorState.set(this.message(error, 'Unable to moderate the review.')),
    });
  }

  resolve(report: UserReport, decision: ReportDecision, note: string, done: () => void): void {
    this.loadingState.set(true);
    this.api.resolveReport(report.id, { decision, note: note || null }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: () => {
        this.successState.set(decision === ReportDecision.Resolve ? 'Report resolved.' : 'Report dismissed.');
        done();
        this.loadReports();
      },
      error: error => this.errorState.set(this.message(error, 'Unable to resolve the report.')),
    });
  }

  retry(item: DeadLetterNotification): void {
    this.api.retryNotification(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => { this.successState.set(response.message || 'Notification queued for retry.'); this.loadDeadLetters(); },
      error: error => this.errorState.set(this.message(error, 'Unable to retry the notification.')),
    });
  }

  exportAudit(): void {
    const { pageNumber: _page, pageSize: _size, ...filters } = this.auditQueryState();
    this.api.exportAuditLogs(filters).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = `sayaramatch-audit-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click();
        URL.revokeObjectURL(url);
      },
      error: error => this.errorState.set(this.message(error, 'Unable to export audit logs.')),
    });
  }

  pages(current: number, total: number): number[] {
    const start = Math.max(1, Math.min(current - 2, total - 4));
    return Array.from({ length: Math.min(5, total) }, (_, index) => start + index);
  }

  private run<T>(request: import('rxjs').Observable<ApiResponse<PagedResponse<T>>>, assign: (data: PagedResponse<T>) => void): void {
    this.loadingState.set(true); this.errorState.set(null);
    request.pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false))).subscribe({
      next: response => { if (response.data) assign(response.data); },
      error: error => this.errorState.set(this.message(error, 'Unable to load administration data.')),
    });
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback : fallback;
  }
}
