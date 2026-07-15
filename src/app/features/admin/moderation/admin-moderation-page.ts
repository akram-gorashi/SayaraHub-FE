import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { ModerationCar, ModerationDecision } from '../../../core/models/admin-moderation.models';
import { AdminModerationService } from '../../../core/services/admin-moderation.service';
import { NotificationCenterService } from '../../../core/services/notification-center.service';
import { AdminModerationStore } from './admin-moderation.store';

@Component({
  selector: 'app-admin-moderation-page',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, ReactiveFormsModule, TitleCasePipe],
  templateUrl: './admin-moderation-page.html',
  styleUrl: './admin-moderation-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AdminModerationStore],
})
export class AdminModerationPage {
  protected readonly store = inject(AdminModerationStore);
  private readonly service = inject(AdminModerationService);
  private readonly notifications = inject(NotificationCenterService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly selected = signal<ModerationCar | null>(null);
  protected readonly fullscreenImage = signal<string | null>(null);
  protected readonly rejectionReason = signal('');
  protected readonly search = new FormControl('', { nonNullable: true });
  protected readonly listedFrom = new FormControl('', { nonNullable: true });
  protected readonly listedTo = new FormControl('', { nonNullable: true });
  protected readonly statuses = ['Pending', 'Available', 'Rejected'];
  protected readonly pageSizes = [10, 20, 50];
  private readonly searchTerm = toSignal(this.search.valueChanges.pipe(
    debounceTime(300), distinctUntilChanged(),
  ), { initialValue: '' });

  constructor() {
    this.store.load();
    effect(() => this.store.load({ search: this.searchTerm().trim() || undefined, pageNumber: 1 }));
    effect(() => {
      if (this.notifications.latest()?.type === 'ListingPendingReview')
        this.store.load({ pageNumber: 1 });
    });
    const requestedCarId = Number(this.route.snapshot.queryParamMap.get('carId'));
    if (Number.isInteger(requestedCarId) && requestedCarId > 0) {
      this.service.getCar(requestedCarId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (response) => { if (response.data) this.review(response.data); },
      });
    }
  }

  protected chooseStatus(status: string): void {
    this.selected.set(null);
    this.store.load({ status, pageNumber: 1 });
  }

  protected applyFilters(): void {
    this.store.load({
      listedFrom: this.listedFrom.value || undefined,
      listedTo: this.listedTo.value || undefined,
      pageNumber: 1,
    });
  }

  protected clearFilters(): void {
    this.search.setValue('');
    this.listedFrom.setValue('');
    this.listedTo.setValue('');
    this.store.load({ search: undefined, listedFrom: undefined, listedTo: undefined, pageNumber: 1 });
  }

  protected changePage(pageNumber: number): void {
    if (pageNumber >= 1 && pageNumber <= this.store.totalPages()) this.store.load({ pageNumber });
  }

  protected changePageSize(event: Event): void {
    this.store.load({ pageSize: Number((event.target as HTMLSelectElement).value), pageNumber: 1 });
  }

  protected review(car: ModerationCar): void {
    this.selected.set(car);
    this.rejectionReason.set(car.moderationReason ?? '');
    this.store.loadHistory(car.id);
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
