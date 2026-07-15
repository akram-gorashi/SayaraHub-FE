import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ModerationCar, ModerationDecision } from '../../../core/models/admin-moderation.models';
import { AdminModerationStore } from './admin-moderation.store';

@Component({
  selector: 'app-admin-moderation-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, FormsModule, TitleCasePipe],
  templateUrl: './admin-moderation-page.html',
  styleUrl: './admin-moderation-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AdminModerationStore],
})
export class AdminModerationPage {
  protected readonly store = inject(AdminModerationStore);
  protected readonly selected = signal<ModerationCar | null>(null);
  protected readonly rejectionReason = signal('');
  protected readonly statuses = ['Pending', 'Available', 'Rejected'];

  constructor() { this.store.load(); }

  protected chooseStatus(status: string): void {
    this.selected.set(null);
    this.store.load(status);
  }

  protected review(car: ModerationCar): void {
    this.selected.set(car);
    this.rejectionReason.set(car.moderationReason ?? '');
  }

  protected approve(): void {
    const car = this.selected();
    if (car) this.store.moderate(car.id, ModerationDecision.Approve, null);
  }

  protected reject(): void {
    const car = this.selected();
    const reason = this.rejectionReason().trim();
    if (car && reason.length >= 10) this.store.moderate(car.id, ModerationDecision.Reject, reason);
  }
}
