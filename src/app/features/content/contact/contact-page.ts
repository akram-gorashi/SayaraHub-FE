import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PageHero } from '../shared/page-hero';

@Component({
  selector: 'app-contact-page',
  imports: [PageHero, ReactiveFormsModule],
  templateUrl: './contact-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPage {
  private readonly fb = inject(FormBuilder);
  protected readonly openingEmail = signal(false);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
    phone: ['', Validators.maxLength(30)],
    subject: ['', [Validators.required, Validators.maxLength(150)]],
    message: ['', [Validators.required, Validators.maxLength(2_000)]],
  });

  protected send(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    const body = `Name: ${value.name}\nEmail: ${value.email}\nPhone: ${value.phone || 'Not provided'}\n\n${value.message}`;
    this.openingEmail.set(true);
    globalThis.location.href = `mailto:support@sayaramatch.com?subject=${encodeURIComponent(value.subject)}&body=${encodeURIComponent(body)}`;
    this.openingEmail.set(false);
  }
}
