import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { MessagesStore } from './messages.store';

@Component({
  selector: 'app-account-messages', imports: [DatePipe, FormsModule], templateUrl: './account-messages.html',
  styleUrl: './account-messages.scss', changeDetection: ChangeDetectionStrategy.OnPush, providers: [MessagesStore],
})
export class AccountMessages {
  protected readonly store = inject(MessagesStore);
  protected readonly draft = signal('');
  constructor() { this.store.load(); }
  protected updateDraft(event: Event): void { this.draft.set((event.target as HTMLTextAreaElement).value); }
  protected send(event: Event): void { event.preventDefault(); this.store.send(this.draft(), () => this.draft.set('')); }
}
