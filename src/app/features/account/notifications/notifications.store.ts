import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { Notification, NotificationPreference, NotificationQuery } from '../../../core/models/notification.models';
import { NotificationCenterService } from '../../../core/services/notification-center.service';
import { NotificationsService } from '../../../core/services/notifications.service';

@Injectable()
export class NotificationsStore {
  private readonly api = inject(NotificationsService);
  private readonly center = inject(NotificationCenterService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly itemsState = signal<Notification[]>([]);
  private readonly preferencesState = signal<NotificationPreference[]>([]);
  private readonly queryState = signal<NotificationQuery>({ pageNumber: 1, pageSize: 10 });
  private readonly totalState = signal(0);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);
  readonly items = this.itemsState.asReadonly();
  readonly preferences = this.preferencesState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly total = this.totalState.asReadonly();
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalState() / (this.queryState().pageSize ?? 10))));
  readonly currentPage = computed(() => this.queryState().pageNumber ?? 1);
  readonly visiblePages = computed(() => {
    const totalPages = this.totalPages();
    const current = this.currentPage();
    const start = Math.max(1, Math.min(current - 2, totalPages - 4));
    const end = Math.min(totalPages, start + 4);
    return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
  });
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(changes: NotificationQuery = {}): void {
    const query = { ...this.queryState(), ...changes };
    this.queryState.set(query);
    this.loadingState.set(true);
    forkJoin({ history: this.api.getAll(query), preferences: this.api.getPreferences() }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: ({ history, preferences }) => {
        this.itemsState.set(history.data?.items ?? []);
        this.totalState.set(history.data?.totalCount ?? 0);
        this.preferencesState.set(preferences.data ?? []);
      },
      error: (error: unknown) => this.errorState.set(this.message(error)),
    });
  }

  setPreference(eventType: string, isEnabled: boolean): void {
    this.preferencesState.update(items => items.map(item => item.eventType === eventType ? { ...item, isEnabled } : item));
  }

  savePreferences(): void {
    this.savingState.set(true); this.errorState.set(null); this.successState.set(null);
    this.api.updatePreferences({ preferences: this.preferencesState() }).pipe(
      takeUntilDestroyed(this.destroyRef), finalize(() => this.savingState.set(false)),
    ).subscribe({
      next: response => { this.preferencesState.set(response.data ?? []); this.successState.set('Notification preferences updated.'); },
      error: (error: unknown) => this.errorState.set(this.message(error)),
    });
  }

  markRead(item: Notification): void {
    this.center.markRead(item);
    this.itemsState.update(items => items.map(value => value.id === item.id ? { ...value, isRead: true } : value));
  }

  markAllRead(): void {
    this.api.markAllRead().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.itemsState.update(items => items.map(item => ({ ...item, isRead: true }))); this.center.load(); },
      error: (error: unknown) => this.errorState.set(this.message(error)),
    });
  }

  delete(item: Notification): void {
    this.api.delete(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => { this.itemsState.update(items => items.filter(value => value.id !== item.id)); this.totalState.update(total => Math.max(0, total - 1)); this.center.load(); },
      error: (error: unknown) => this.errorState.set(this.message(error)),
    });
  }

  private message(error: unknown): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to load notifications.'
      : 'Unable to load notifications.';
  }
}
