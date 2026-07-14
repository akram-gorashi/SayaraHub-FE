import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { DeleteAccountRequest, UpdateUserSettingsRequest, UserSettings } from '../../../core/models/settings.models';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { SettingsService } from '../../../core/services/settings.service';

@Injectable()
export class AccountSettingsStore {
  private readonly settingsService = inject(SettingsService);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly settingsState = signal<UserSettings | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly deletingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);
  readonly settings = this.settingsState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly deleting = this.deletingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.settingsService.get().pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.loadingState.set(false))).subscribe({
      next: (response) => response.success && response.data ? this.settingsState.set(response.data) : this.errorState.set(response.message),
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  save(request: UpdateUserSettingsRequest): void {
    this.savingState.set(true); this.errorState.set(null); this.successState.set(null);
    this.settingsService.update(request).pipe(takeUntilDestroyed(this.destroyRef), finalize(() => this.savingState.set(false))).subscribe({
      next: (response) => { if (response.success && response.data) { this.settingsState.set(response.data); this.successState.set(response.message || 'Settings updated.'); } else this.errorState.set(response.message); },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  deleteAccount(request: DeleteAccountRequest): void {
    this.deletingState.set(true); this.errorState.set(null); this.successState.set(null);
    this.settingsService.deleteAccount(request).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.deletingState.set(false)),
    ).subscribe({
      next: (response) => {
        if (!response.success) { this.errorState.set(response.message); return; }
        this.authSession.clear();
        void this.router.navigate(['/login']);
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof HttpErrorResponse ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to complete the request.' : 'Unable to complete the request.';
  }
}
