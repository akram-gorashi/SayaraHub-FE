import { ChangeDetectionStrategy, Component, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AccountSettingsStore } from './settings.store';

@Component({ selector: 'app-account-settings', imports: [ReactiveFormsModule], templateUrl: './account-settings.html', changeDetection: ChangeDetectionStrategy.OnPush, providers: [AccountSettingsStore] })
export class AccountSettings {
  private readonly fb = inject(FormBuilder);
  private readonly initialized = signal(false);
  protected readonly store = inject(AccountSettingsStore);
  protected readonly form = this.fb.nonNullable.group({ enableMessages: false, receiveEmailNotifications: false, hidePhoneNumber: false, receiveMessageNotifications: false, isProfilePrivate: false });
  constructor() {
    this.store.load();
    effect(() => { const settings = this.store.settings(); if (settings && !this.initialized()) { this.form.setValue(settings); this.initialized.set(true); } });
  }
  protected save(): void { this.store.save(this.form.getRawValue()); }
}
