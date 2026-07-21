import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { BlockedUser } from '../../../core/models/safety.models';
import { SafetyStore } from './safety.store';

@Component({ selector: 'app-account-safety', imports: [DatePipe, RouterLink, TitleCasePipe, TranslatePipe], templateUrl: './account-safety.html', styleUrl: './account-safety.scss', changeDetection: ChangeDetectionStrategy.OnPush, providers: [SafetyStore] })
export class AccountSafety {
  protected readonly store = inject(SafetyStore);
  private readonly translate = inject(TranslateService);
  constructor() { this.store.load(); }
  protected unblock(user: BlockedUser): void { if (globalThis.confirm?.(this.translate.instant('account.confirmUnblock', { name: user.fullName }))) this.store.unblock(user); }
}
