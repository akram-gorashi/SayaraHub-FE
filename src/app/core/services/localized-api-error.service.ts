import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { LanguageService } from './language.service';

@Injectable({ providedIn: 'root' })
export class LocalizedApiErrorService {
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);

  message(error: unknown, englishFallback = 'Something went wrong. Please try again.'): string {
    if (!(error instanceof HttpErrorResponse)) return this.fallback(englishFallback);
    if (error.status === 0) return this.translate.instant('errors.offline');
    if (error.status === 401) return this.translate.instant('errors.unauthorized');
    if (error.status === 403) return this.translate.instant('errors.forbidden');
    if (error.status === 404) return this.translate.instant('errors.notFound');
    if (error.status >= 500) return this.translate.instant('errors.server');
    if (this.language.language() === 'ar') return this.translate.instant('errors.generic');
    const response = error.error as { message?: string; title?: string; errors?: Record<string, string[]> } | null;
    const validation = response?.errors ? Object.values(response.errors).flat().filter(Boolean).join(' ') : '';
    return response?.message || validation || response?.title || englishFallback;
  }

  private fallback(englishFallback: string): string {
    return this.language.language() === 'ar' ? this.translate.instant('errors.generic') : englishFallback;
  }
}
