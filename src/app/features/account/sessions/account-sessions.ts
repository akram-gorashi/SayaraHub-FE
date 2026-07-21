import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

import { UserSession } from '../../../core/models/session.models';
import { SessionsStore } from './sessions.store';

type Confirmation = { kind: 'session'; session: UserSession } | { kind: 'others' };

@Component({
  selector: 'app-account-sessions',
  imports: [DatePipe, TranslatePipe],
  templateUrl: './account-sessions.html',
  styleUrl: './account-sessions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [SessionsStore],
})
export class AccountSessions {
  protected readonly store = inject(SessionsStore);
  protected readonly confirmation = signal<Confirmation | null>(null);

  constructor() {
    this.store.load();
  }

  protected confirm(): void {
    const confirmation = this.confirmation();
    this.confirmation.set(null);
    if (!confirmation) return;
    if (confirmation.kind === 'others') this.store.revokeOthers();
    else this.store.revoke(confirmation.session);
  }
}
