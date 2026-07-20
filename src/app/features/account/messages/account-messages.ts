import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { MessagesStore } from './messages.store';

@Component({
  selector: 'app-account-messages', imports: [DatePipe, FormsModule, TranslatePipe], templateUrl: './account-messages.html',
  styleUrl: './account-messages.scss', changeDetection: ChangeDetectionStrategy.OnPush, providers: [MessagesStore],
})
export class AccountMessages {
  protected readonly store = inject(MessagesStore);
  protected readonly draft = signal('');
  private readonly messageList = viewChild<ElementRef<HTMLDivElement>>('messageList');
  constructor() {
    this.store.load();
    afterRenderEffect(() => {
      this.store.messages();
      const list = this.messageList()?.nativeElement;
      if (list) list.scrollTop = list.scrollHeight;
    });
  }
  protected updateDraft(event: Event): void { this.draft.set((event.target as HTMLTextAreaElement).value); }
  protected send(event: Event): void { event.preventDefault(); this.store.send(this.draft(), () => this.draft.set('')); }
}
