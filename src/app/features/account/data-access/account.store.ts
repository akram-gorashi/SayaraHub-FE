import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { ChangePasswordRequest, UpdateUserProfileRequest, UserProfile } from '../../../core/models/user.models';
import { AuthSessionService } from '../../../core/services/auth-session.service';
import { UsersService } from '../../../core/services/users.service';

@Injectable()
export class AccountStore {
  private readonly users = inject(UsersService);
  private readonly session = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly profileState = signal<UserProfile | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingProfileState = signal(false);
  private readonly changingPasswordState = signal(false);
  private readonly uploadingImageState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly successState = signal<string | null>(null);
  private profileRequested = false;

  readonly profile = this.profileState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly savingProfile = this.savingProfileState.asReadonly();
  readonly changingPassword = this.changingPasswordState.asReadonly();
  readonly uploadingImage = this.uploadingImageState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly success = this.successState.asReadonly();
  readonly imageUrl = computed(() => this.profileState()?.imageUrl || 'assets/img/account/user-v2.jpg');

  load(): void {
    if (this.profileRequested) {
      return;
    }

    this.profileRequested = true;
    this.loadingState.set(true);
    this.users.getMe().pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.profileState.set(response.data);
          return;
        }
        this.errorState.set(response.message || 'Unable to load your profile.');
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to load your profile.')),
    });
  }

  updateProfile(request: UpdateUserProfileRequest): void {
    if (this.savingProfileState()) {
      return;
    }

    this.beginOperation();
    this.savingProfileState.set(true);
    this.users.updateMe(request).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.savingProfileState.set(false)),
    ).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.errorState.set(response.message || 'Unable to save your profile.');
          return;
        }
        this.profileState.set(response.data);
        this.session.updateIdentity({ fullName: response.data.fullName, email: response.data.email });
        this.successState.set(response.message || 'Profile updated successfully.');
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to save your profile.')),
    });
  }

  changePassword(request: ChangePasswordRequest, onSuccess: () => void): void {
    if (this.changingPasswordState()) {
      return;
    }

    this.beginOperation();
    this.changingPasswordState.set(true);
    this.users.changePassword(request).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.changingPasswordState.set(false)),
    ).subscribe({
      next: (response) => {
        if (!response.success) {
          this.errorState.set(response.message || 'Unable to change your password.');
          return;
        }
        onSuccess();
        this.successState.set(response.message || 'Password changed successfully.');
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to change your password.')),
    });
  }

  replaceImage(file: File): void {
    if (this.uploadingImageState()) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.errorState.set('Choose a valid image file.');
      return;
    }

    this.beginOperation();
    this.uploadingImageState.set(true);
    this.users.replaceImage(file).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.uploadingImageState.set(false)),
    ).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.errorState.set(response.message || 'Unable to update your profile image.');
          return;
        }
        this.profileState.update((profile) => profile ? { ...profile, imageUrl: response.data!.imageUrl } : profile);
        this.successState.set(response.message || 'Profile image updated.');
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error, 'Unable to update your profile image.')),
    });
  }

  clearFeedback(): void {
    this.errorState.set(null);
    this.successState.set(null);
  }

  private beginOperation(): void {
    this.errorState.set(null);
    this.successState.set(null);
  }

  private errorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      return (error.error as Partial<ApiResponse<unknown>> | null)?.message || fallback;
    }
    return fallback;
  }
}
