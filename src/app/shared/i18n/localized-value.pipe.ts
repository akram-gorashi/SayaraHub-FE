import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'smCurrency', standalone: true, pure: false })
export class LocalizedCurrencyPipe implements PipeTransform {
  private readonly language = inject(LanguageService);
  transform(value: number | null | undefined): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat(this.language.locale(), {
      style: 'currency', currency: 'SAR', maximumFractionDigits: 0,
    }).format(value);
  }
}

@Pipe({ name: 'smNumber', standalone: true, pure: false })
export class LocalizedNumberPipe implements PipeTransform {
  private readonly language = inject(LanguageService);
  transform(value: number | null | undefined, maximumFractionDigits = 0): string {
    if (value === null || value === undefined) return '—';
    return new Intl.NumberFormat(this.language.locale(), { maximumFractionDigits }).format(value);
  }
}

@Pipe({ name: 'smDate', standalone: true, pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);
  transform(value: string | Date | null | undefined, style: 'short' | 'medium' = 'medium'): string {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(this.language.locale(), style === 'short'
      ? { year: 'numeric', month: 'numeric', day: 'numeric' }
      : { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
  }
}

@Pipe({ name: 'smLocalizedText', standalone: true, pure: false })
export class LocalizedTextPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(english: string | null | undefined, arabic: string | null | undefined): string {
    if (this.language.language() === 'ar' && arabic?.trim()) return arabic;
    return english?.trim() || arabic?.trim() || '';
  }
}
