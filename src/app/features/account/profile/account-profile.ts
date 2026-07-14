import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AccountStore } from '../data-access/account.store';

@Component({
  selector: 'app-account-profile',
  imports: [ReactiveFormsModule],
  templateUrl: './account-profile.html',
  styleUrl: './account-profile.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountProfile {
  private readonly formBuilder = inject(FormBuilder);
  private readonly initialized = signal(false);

  protected readonly store = inject(AccountStore);
  protected readonly passwordMismatch = signal(false);
  protected readonly profileForm = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: [{ value: '', disabled: true }],
    phoneNumber: [''],
  });
  protected readonly passwordForm = this.formBuilder.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]],
    confirmNewPassword: ['', Validators.required],
  });

  constructor() {
    this.store.load();
    effect(() => {
      const profile = this.store.profile();
      if (!profile || this.initialized()) {
        return;
      }
      this.profileForm.patchValue({
        fullName: profile.fullName,
        email: profile.email,
        phoneNumber: profile.phoneNumber ?? '',
      });
      this.initialized.set(true);
    });
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const { fullName, phoneNumber } = this.profileForm.getRawValue();
    this.store.updateProfile({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim() || null,
    });
  }

  protected changePassword(): void {
    const request = this.passwordForm.getRawValue();
    this.passwordMismatch.set(request.newPassword !== request.confirmNewPassword);
    if (this.passwordForm.invalid || this.passwordMismatch()) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.store.changePassword(request, () => this.passwordForm.reset());
  }

  protected clearPasswordMismatch(): void {
    this.passwordMismatch.set(false);
    this.store.clearFeedback();
  }
}
