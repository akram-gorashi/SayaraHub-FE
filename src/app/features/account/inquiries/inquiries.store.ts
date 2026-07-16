import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { ContactMessage, ContactMessageQuery } from '../../../core/models/contact-message.models';
import { ContactMessagesService } from '../../../core/services/contact-messages.service';
import { InquiryCenterService } from '../../../core/services/inquiry-center.service';

@Injectable()
export class InquiriesStore {
  private readonly api = inject(ContactMessagesService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly center = inject(InquiryCenterService);
  private readonly itemsState = signal<ContactMessage[]>([]);
  private readonly selectedState = signal<ContactMessage | null>(null);
  private readonly queryState = signal<ContactMessageQuery>({ pageNumber: 1, pageSize: 10 });
  private readonly totalState = signal(0);
  private readonly loadingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly items = this.itemsState.asReadonly();
  readonly selected = this.selectedState.asReadonly();
  readonly query = this.queryState.asReadonly();
  readonly total = this.totalState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly currentPage = computed(() => this.queryState().pageNumber ?? 1);
  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalState() / (this.queryState().pageSize ?? 10))));
  readonly visiblePages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const start = Math.max(1, Math.min(current - 2, total - 4));
    const end = Math.min(total, start + 4);
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  });

  constructor() {
    let initialized = false;
    effect(() => {
      this.center.version();
      if (initialized) this.load();
      initialized = true;
    });
  }

  load(changes: ContactMessageQuery = {}): void {
    const query = { ...untracked(this.queryState), ...changes };
    this.queryState.set(query);
    this.loadingState.set(true);
    this.errorState.set(null);
    this.api.getInbox(query).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: response => {
        this.itemsState.set(response.data?.items ?? []);
        this.totalState.set(response.data?.totalCount ?? 0);
      },
      error: error => this.errorState.set(this.message(error, 'Unable to load inquiries.')),
    });
  }

  open(item: ContactMessage): void {
    this.selectedState.set(item);
    if (item.isRead) return;
    this.api.markRead(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: response => {
        const updated = response.data ?? { ...item, isRead: true };
        this.selectedState.set(updated);
        this.itemsState.update(items => items.map(value => value.id === item.id ? updated : value));
        this.center.refresh();
      },
      error: error => this.errorState.set(this.message(error, 'Unable to mark the inquiry as read.')),
    });
  }

  delete(item: ContactMessage): void {
    this.api.delete(item.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        if (this.selectedState()?.id === item.id) this.selectedState.set(null);
        this.load();
        this.center.refresh();
      },
      error: error => this.errorState.set(this.message(error, 'Unable to delete the inquiry.')),
    });
  }

  private message(error: unknown, fallback: string): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback
      : fallback;
  }
}
