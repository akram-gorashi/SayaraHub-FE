import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { UserSession } from '../../../core/models/session.models';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { SessionService } from '../../../core/services/session.service';

@Injectable()
export class SessionsStore {
  private readonly service = inject(SessionService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly sessionsState = signal<UserSession[]>([]);
  private readonly loadingState = signal(false);
  private readonly processingState = signal<string | null>(null);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);

  readonly sessions = this.sessionsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly processing = this.processingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.errorState.set(null);
    this.service.getAll().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: response => response.success && response.data
        ? this.sessionsState.set(response.data)
        : this.errorState.set(response.message),
      error: error => this.errorState.set(this.errorMessage(error)),
    });
  }

  revoke(session: UserSession): void {
    this.processingState.set(session.id);
    this.clearMessages();
    this.service.revoke(session.id).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.processingState.set(null)),
    ).subscribe({
      next: response => {
        if (!response.success || !response.data) {
          this.errorState.set(response.message);
          return;
        }
        if (response.data.currentSessionRevoked) {
          this.authSession.clear();
          void this.router.navigate(['/login']);
          return;
        }
        this.sessionsState.update(items => items.filter(item => item.id !== session.id));
        this.successState.set(response.message || 'The session was logged out.');
      },
      error: error => this.errorState.set(this.errorMessage(error)),
    });
  }

  revokeOthers(): void {
    this.processingState.set('others');
    this.clearMessages();
    this.service.revokeOthers().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.processingState.set(null)),
    ).subscribe({
      next: response => {
        if (!response.success) {
          this.errorState.set(response.message);
          return;
        }
        this.sessionsState.update(items => items.filter(item => item.isCurrent));
        this.successState.set(response.message || 'All other devices were logged out.');
      },
      error: error => this.errorState.set(this.errorMessage(error)),
    });
  }

  private clearMessages(): void {
    this.errorState.set(null);
    this.successState.set(null);
  }

  private errorMessage(error: unknown): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to manage this session.'
      : 'Unable to manage this session.';
  }
}
