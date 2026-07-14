import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { LoginRequest, RegisterRequest } from '../../../core/models/auth.models';
import { AuthService } from '../../../core/services/auth.service';

@Injectable()
export class AuthStore {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  private readonly submittingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly submitting = this.submittingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  login(request: LoginRequest, returnUrl = '/'): void {
    this.authenticate(() => this.auth.login(request), returnUrl);
  }

  register(request: RegisterRequest): void {
    this.authenticate(() => this.auth.register(request), '/');
  }

  clearError(): void {
    this.errorState.set(null);
  }

  private authenticate(
    request: () => ReturnType<AuthService['login']>,
    destination: string,
  ): void {
    if (this.submittingState()) {
      return;
    }

    this.submittingState.set(true);
    this.errorState.set(null);

    request().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.submittingState.set(false)),
    ).subscribe({
      next: () => void this.router.navigateByUrl(this.safeDestination(destination)),
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  private safeDestination(destination: string): string {
    return destination.startsWith('/') && !destination.startsWith('//') ? destination : '/';
  }

  private errorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const response = error.error as Partial<ApiResponse<unknown>> | null;
      return response?.message || 'We could not authenticate you. Please try again.';
    }

    return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
}
