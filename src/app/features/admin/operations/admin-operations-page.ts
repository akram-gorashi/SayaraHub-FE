import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { UserReport, ReportDecision } from '../../../core/models/safety.models';
import { AdminOperationsStore } from './admin-operations.store';

@Component({ selector: 'app-admin-operations-page', imports: [DatePipe, RouterLink, TitleCasePipe], templateUrl: './admin-operations-page.html', styleUrl: './admin-operations-page.scss', changeDetection: ChangeDetectionStrategy.OnPush, providers: [AdminOperationsStore] })
export class AdminOperationsPage {
  protected readonly store = inject(AdminOperationsStore);
  protected readonly activeTab = signal<'reports' | 'audit' | 'notifications'>('reports');
  protected readonly ReportDecision = ReportDecision;
  constructor() { this.store.load(); }
  protected decide(report: UserReport, decision: ReportDecision): void {
    const note = globalThis.prompt?.('Optional administrator note:', report.resolutionNote ?? '') ?? '';
    this.store.resolve(report, decision, note.trim());
  }
}
