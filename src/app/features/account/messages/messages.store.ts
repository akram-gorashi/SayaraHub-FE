import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { Chat, ChatMessage } from '../../../core/models/chat.models';
import { ChatsService } from '../../../core/services/chats.service';
import { AccountStore } from '../data-access/account.store';

@Injectable()
export class MessagesStore {
  private readonly chatsService = inject(ChatsService);
  private readonly account = inject(AccountStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chatsState = signal<Chat[]>([]);
  private readonly messagesState = signal<ChatMessage[]>([]);
  private readonly activeChatState = signal<Chat | null>(null);
  private readonly loadingState = signal(false);
  private readonly sendingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly chats = this.chatsState.asReadonly();
  readonly messages = this.messagesState.asReadonly();
  readonly activeChat = this.activeChatState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly sending = this.sendingState.asReadonly();
  readonly error = this.errorState.asReadonly();

  load(): void {
    this.loadingState.set(true);
    this.chatsService.getChats({ pageNumber: 1, pageSize: 50 }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: (response) => {
        if (!response.success || !response.data) {
          this.errorState.set(response.message || 'Unable to load messages.');
          return;
        }
        this.chatsState.set(response.data.items);
        const first = response.data.items[0];
        if (first) this.select(first);
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  select(chat: Chat): void {
    this.activeChatState.set(chat);
    this.loadingState.set(true);
    this.chatsService.getMessages(chat.id, { pageNumber: 1, pageSize: 50 }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loadingState.set(false)),
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.messagesState.set(response.data.items);
          this.markRead(chat.id);
        }
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  send(content: string, onSuccess: () => void): void {
    const chat = this.activeChatState();
    const message = content.trim();
    if (!chat || !message || this.sendingState()) return;

    this.sendingState.set(true);
    this.chatsService.sendMessage(chat.id, { content: message }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.sendingState.set(false)),
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.messagesState.update((messages) => [...messages, response.data!]);
          onSuccess();
        }
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  isMine(message: ChatMessage): boolean {
    return message.senderId === this.account.profile()?.id;
  }

  private markRead(chatId: number): void {
    this.chatsService.markRead(chatId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => this.chatsState.update((chats) => chats.map((chat) => chat.id === chatId ? { ...chat, unreadCount: 0 } : chat)),
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof HttpErrorResponse
      ? (error.error as Partial<ApiResponse<unknown>> | null)?.message || 'Unable to load messages.'
      : 'Unable to load messages.';
  }
}
