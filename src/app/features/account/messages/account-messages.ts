import { DatePipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, afterRenderEffect, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

import { MessagesStore } from './messages.store';
import { Chat } from '../../../core/models/chat.models';

type ChatFilter = 'all' | 'buying' | 'selling' | 'unread';

@Component({
  selector: 'app-account-messages', imports: [DatePipe, DecimalPipe, FormsModule, TranslatePipe], templateUrl: './account-messages.html',
  styleUrl: './account-messages.scss', changeDetection: ChangeDetectionStrategy.OnPush, providers: [MessagesStore],
})
export class AccountMessages {
  protected readonly store = inject(MessagesStore);
  protected readonly draft = signal('');
  protected readonly showJumpToLatest = signal(false);
  protected readonly reportOpen = signal(false);
  protected readonly reportReason = signal('');
  protected readonly reportDetails = signal('');
  protected readonly searchTerm = signal('');
  protected readonly activeFilter = signal<ChatFilter>('all');
  protected readonly detailOpen = signal(false);
  protected readonly filteredChats = computed(() => {
    const query = this.searchTerm().trim().toLocaleLowerCase();
    const filter = this.activeFilter();
    return this.store.chats().filter((chat) => {
      const matchesQuery = !query || `${chat.carTitle} ${chat.otherUserName} ${chat.lastMessage ?? ''}`.toLocaleLowerCase().includes(query);
      const matchesFilter = filter === 'all'
        || (filter === 'buying' && !chat.currentUserIsSeller)
        || (filter === 'selling' && chat.currentUserIsSeller)
        || (filter === 'unread' && chat.unreadCount > 0);
      return matchesQuery && matchesFilter;
    });
  });
  private readonly messageList = viewChild<ElementRef<HTMLDivElement>>('messageList');
  private typingStopTimer: ReturnType<typeof setTimeout> | null = null;
  private lastMessageCount = 0;

  constructor() {
    this.store.load();
    afterRenderEffect(() => {
      const count = this.store.messages().length;
      const list = this.messageList()?.nativeElement;
      if (list && count !== this.lastMessageCount) {
        const shouldStick = this.lastMessageCount === 0 || this.isNearBottom(list);
        this.lastMessageCount = count;
        if (shouldStick) this.scrollToLatest();
      }
    });
  }

  protected updateDraft(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.draft.set(textarea.value);
    this.resizeComposer(textarea);
    this.store.notifyTyping(Boolean(textarea.value.trim()));
    if (this.typingStopTimer) clearTimeout(this.typingStopTimer);
    this.typingStopTimer = setTimeout(() => this.store.notifyTyping(false), 1400);
  }

  protected send(event: Event): void {
    event.preventDefault();
    this.store.notifyTyping(false);
    this.store.send(this.draft(), () => {
      this.draft.set('');
      const textarea = (event.target as HTMLFormElement).querySelector('textarea');
      if (textarea) this.resizeComposer(textarea);
      this.scrollToLatest();
    });
  }

  protected selectChat(chat: Chat): void {
    this.store.select(chat);
    this.detailOpen.set(true);
  }

  protected showInbox(): void {
    this.detailOpen.set(false);
    this.reportOpen.set(false);
  }

  protected setFilter(filter: ChatFilter): void {
    this.activeFilter.set(filter);
  }

  protected onMessagesScroll(event: Event): void {
    const list = event.target as HTMLDivElement;
    this.showJumpToLatest.set(!this.isNearBottom(list));
  }

  protected scrollToLatest(): void {
    setTimeout(() => {
      const list = this.messageList()?.nativeElement;
      if (!list) return;
      list.scrollTo({ top: list.scrollHeight, behavior: 'smooth' });
      this.showJumpToLatest.set(false);
    });
  }

  protected submitReport(event: Event): void {
    event.preventDefault();
    this.store.reportActiveChat(this.reportReason(), this.reportDetails(), () => {
      this.reportOpen.set(false);
      this.reportReason.set('');
      this.reportDetails.set('');
    });
  }

  private resizeComposer(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 130)}px`;
  }

  private isNearBottom(list: HTMLDivElement): boolean {
    return list.scrollHeight - list.scrollTop - list.clientHeight < 90;
  }
}
