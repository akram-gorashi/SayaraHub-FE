import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Breadcrumb } from '../../../shared/ui/breadcrumb/breadcrumb';
import { AuthStore } from '../data-access/auth.store';

@Component({
  selector: 'app-register-page',
  imports: [Breadcrumb, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AuthStore],
})
export class RegisterPage {
  private readonly formBuilder = inject(FormBuilder);

  protected readonly store = inject(AuthStore);
  protected readonly passwordVisible = signal(false);
  protected readonly passwordType = computed(() => this.passwordVisible() ? 'text' : 'password');
  protected readonly form = this.formBuilder.nonNullable.group({
    fullName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    acceptedTerms: [false, Validators.requiredTrue],
  });

  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { fullName, email, password } = this.form.getRawValue();
    this.store.register({ fullName, email, password });
  }
}
