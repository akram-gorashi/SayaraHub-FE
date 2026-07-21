import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'sarCurrency', standalone: true, pure: false })
export class SarCurrencyPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: number | null | undefined, maximumFractionDigits = 0): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
    return new Intl.NumberFormat(this.language.locale(), {
      style: 'currency',
      currency: 'SAR',
      maximumFractionDigits,
    }).format(value);
  }
}
