import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AccountDeletionReason } from '../../../core/models/settings.models';
import { AccountSettingsStore } from './settings.store';
import { LanguageService } from '../../../core/services/language.service';

@Component({ selector: 'app-account-settings', imports: [ReactiveFormsModule], templateUrl: './account-settings.html', changeDetection: ChangeDetectionStrategy.OnPush, providers: [AccountSettingsStore] })
export class AccountSettings {
  private readonly fb = inject(FormBuilder);
  private readonly initialized = signal(false);
  protected readonly store = inject(AccountSettingsStore);
  protected readonly language = inject(LanguageService);
  protected readonly form = this.fb.nonNullable.group({ enableMessages: false, receiveEmailNotifications: false, hidePhoneNumber: false, receiveMessageNotifications: false, isProfilePrivate: false });
  protected readonly deletionReasons = [
    { value: AccountDeletionReason.NoLongerNeeded, label: 'I no longer need my account' },
    { value: AccountDeletionReason.PrivacyConcerns, label: 'Privacy concerns' },
    { value: AccountDeletionReason.TooManyNotifications, label: 'Too many notifications' },
    { value: AccountDeletionReason.BadExperience, label: 'I had a bad experience' },
    { value: AccountDeletionReason.Other, label: 'Other' },
  ];
  protected readonly deletionForm = this.fb.group({
    reason: [null as AccountDeletionReason | null, Validators.required],
    details: ['', Validators.maxLength(1000)],
    confirmed: [false, Validators.requiredTrue],
  });
  constructor() {
    this.store.load();
    effect(() => { const settings = this.store.settings(); if (settings && !this.initialized()) { this.form.setValue(settings); this.initialized.set(true); } });
  }
  protected save(): void { this.store.save(this.form.getRawValue()); }
  protected deleteAccount(): void {
    const value = this.deletionForm.getRawValue();
    if (this.deletionForm.invalid || (value.reason === AccountDeletionReason.Other && !value.details?.trim())) {
      this.deletionForm.markAllAsTouched(); return;
    }
    this.store.deleteAccount({ reason: value.reason, details: value.details?.trim() || null });
  }
}
