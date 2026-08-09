import { Pipe, PipeTransform, inject } from '@angular/core';

import { LanguageService } from '../../core/services/language.service';

@Pipe({ name: 'localizedDate', standalone: true, pure: false })
export class LocalizedDatePipe implements PipeTransform {
  private readonly language = inject(LanguageService);

  transform(value: string | Date | null | undefined, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat(this.language.locale(), options).format(date);
  }
}
