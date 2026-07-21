import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { AuthSessionService } from './auth-session.service';

export type AppLanguage = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly session = inject(AuthSessionService);
  private readonly document = inject(DOCUMENT);
  private readonly languageState = signal<AppLanguage>('en');

  readonly language = this.languageState.asReadonly();
  readonly isRtl = () => this.languageState() === 'ar';
  readonly locale = () => this.languageState() === 'ar' ? 'ar-SA' : 'en-SA';

  constructor() {
    const preferred = this.readPreference();
    this.apply(preferred);
    effect(() => {
      const email = this.session.session()?.email;
      if (!email) return;
      const stored = this.readStorage(this.key(email));
      if (stored && stored !== this.languageState()) this.apply(stored);
    });
  }

  setLanguage(language: AppLanguage): void {
    this.apply(language);
    this.writeStorage('sayaraMatch.language', language);
    const email = this.session.session()?.email;
    if (email) this.writeStorage(this.key(email), language);
  }

  toggle(): void {
    this.setLanguage(this.languageState() === 'en' ? 'ar' : 'en');
  }

  private apply(language: AppLanguage): void {
    this.languageState.set(language);
    this.translate.use(language);
    this.document.documentElement.lang = language;
    this.document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    this.document.body?.classList.toggle('rtl', language === 'ar');
    this.document.body?.classList.toggle('rtl-mode', language === 'ar');
  }

  private readPreference(): AppLanguage {
    const email = this.session.session()?.email;
    return (email && this.readStorage(this.key(email)))
      || this.readStorage('sayaraMatch.language')
      || (globalThis.navigator?.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en');
  }

  private key(email: string): string {
    return `sayaraMatch.language.${email.trim().toLowerCase()}`;
  }

  private readStorage(key: string): AppLanguage | null {
    try {
      const value = globalThis.localStorage?.getItem(key);
      return value === 'ar' || value === 'en' ? value : null;
    } catch { return null; }
  }

  private writeStorage(key: string, value: AppLanguage): void {
    try { globalThis.localStorage?.setItem(key, value); } catch { /* Storage may be unavailable. */ }
  }
}
