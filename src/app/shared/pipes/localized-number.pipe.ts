import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'localizedNumber', standalone: true, pure: false })
export class LocalizedNumberPipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: number | null | undefined, options: Intl.NumberFormatOptions = {}): string {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '';
    return new Intl.NumberFormat(this.language.locale(), options).format(value);
  }
}
