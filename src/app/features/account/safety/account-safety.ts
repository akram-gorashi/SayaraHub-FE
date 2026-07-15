import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BlockedUser } from '../../../core/models/safety.models';
import { SafetyStore } from './safety.store';

@Component({ selector: 'app-account-safety', imports: [DatePipe, RouterLink, TitleCasePipe], templateUrl: './account-safety.html', styleUrl: './account-safety.scss', changeDetection: ChangeDetectionStrategy.OnPush, providers: [SafetyStore] })
export class AccountSafety {
  protected readonly store = inject(SafetyStore);
  constructor() { this.store.load(); }
  protected unblock(user: BlockedUser): void { if (globalThis.confirm?.(`Unblock ${user.fullName}?`)) this.store.unblock(user); }
}
