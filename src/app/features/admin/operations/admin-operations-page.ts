import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { UserReport, ReportDecision } from '../../../core/models/safety.models';
import { Review } from '../../../core/models/review.models';
import { AdminOperationsStore, OperationsTab } from './admin-operations.store';

@Component({
  selector: 'app-admin-operations-page',
  imports: [DatePipe, FormsModule, RouterLink, TitleCasePipe, TranslatePipe],
  templateUrl: './admin-operations-page.html', styleUrl: './admin-operations-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush, providers: [AdminOperationsStore],
})
export class AdminOperationsPage {
  protected readonly store = inject(AdminOperationsStore);
  protected readonly activeTab = signal<OperationsTab>('reports');
  protected readonly decisionReport = signal<UserReport | null>(null);
  protected readonly decision = signal<ReportDecision>(ReportDecision.Resolve);
  protected readonly decisionNote = signal('');
  protected readonly reviewDecisionItem = signal<Review | null>(null);
  protected readonly reviewDecision = signal(1);
  protected readonly reviewReason = signal('');
  protected readonly reviewSearch = signal('');
  protected readonly reviewStatus = signal('Pending');
  protected readonly reportSearch = signal('');
  protected readonly reportStatus = signal('Open');
  protected readonly reportType = signal('');
  protected readonly auditSearch = signal('');
  protected readonly auditAction = signal('');
  protected readonly auditEntity = signal('');
  protected readonly ReportDecision = ReportDecision;

  constructor() { this.store.loadReports(); }

  protected selectTab(tab: OperationsTab): void { this.activeTab.set(tab); this.store.loadTab(tab); }
  protected searchReports(): void { this.store.loadReports({ pageNumber: 1, search: this.reportSearch(), status: this.reportStatus(), targetType: this.reportType() || undefined }); }
  protected searchAudit(): void { this.store.loadAudit({ pageNumber: 1, search: this.auditSearch(), action: this.auditAction() || undefined, entityType: this.auditEntity() || undefined }); }
  protected openDecision(report: UserReport, decision: ReportDecision): void { this.decisionReport.set(report); this.decision.set(decision); this.decisionNote.set(report.resolutionNote ?? ''); }
  protected closeDecision(): void { this.decisionReport.set(null); this.decisionNote.set(''); }
  protected confirmDecision(): void { const report = this.decisionReport(); if (report) this.store.resolve(report, this.decision(), this.decisionNote().trim(), () => this.closeDecision()); }
  protected searchReviews(): void { this.store.loadReviews({ pageNumber: 1, search: this.reviewSearch(), status: this.reviewStatus() }); }
  protected openReviewDecision(review: Review, decision: number): void { this.reviewDecisionItem.set(review); this.reviewDecision.set(decision); this.reviewReason.set(review.moderationReason ?? ''); }
  protected closeReviewDecision(): void { this.reviewDecisionItem.set(null); this.reviewReason.set(''); }
  protected confirmReviewDecision(): void { const review = this.reviewDecisionItem(); if (review) this.store.moderateReview(review, this.reviewDecision(), this.reviewReason().trim(), () => this.closeReviewDecision()); }
}
