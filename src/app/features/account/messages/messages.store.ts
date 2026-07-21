import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { ApiResponse } from '../../../core/models/api.models';
import { Chat, ChatMessage } from '../../../core/models/chat.models';
import { ChatsService } from '../../../core/services/chats.service';
import { ChatRealtimeService } from '../../../core/services/chat-realtime.service';
import { AccountStore } from '../data-access/account.store';

@Injectable()
export class MessagesStore {
  private readonly chatsService = inject(ChatsService);
  private readonly realtime = inject(ChatRealtimeService);
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

  constructor() {
    this.realtime.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      this.receive(message);
    });
    this.realtime.presence$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((presence) => {
      this.updatePresence(presence.userId, presence.isOnline, presence.lastSeenAt);
    });
  }

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
        void this.realtime.joinChats(response.data.items.map((chat) => chat.id))
          .catch(() => this.errorState.set('Messages loaded, but live updates are temporarily unavailable.'));
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
          this.messagesState.set(this.chronological(response.data.items));
          void this.realtime.joinChats([chat.id]);
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
          this.upsertMessage(response.data);
          this.updateChatSummary(response.data);
          onSuccess();
        }
      },
      error: (error: unknown) => this.errorState.set(this.errorMessage(error)),
    });
  }

  isMine(message: ChatMessage): boolean {
    return message.senderId === this.account.profile()?.id;
  }

  presenceLabel(chat: Chat): string {
    if (chat.otherUserIsOnline) return 'Online now';
    return chat.otherUserLastSeenAt ? 'Last seen ' : 'Offline';
  }

  presenceState(chat: Chat): 'online' | 'recent' | 'offline' {
    if (chat.otherUserIsOnline) return 'online';
    if (!chat.otherUserLastSeenAt) return 'offline';
    const lastSeen = new Date(chat.otherUserLastSeenAt).getTime();
    if (!Number.isFinite(lastSeen)) return 'offline';
    return Date.now() - lastSeen <= 15 * 60 * 1000 ? 'recent' : 'offline';
  }

  presenceIconLabel(chat: Chat): string {
    const state = this.presenceState(chat);
    if (state === 'online') return 'Online';
    if (state === 'recent') return 'Recently online';
    return 'Offline';
  }

  private receive(message: ChatMessage): void {
    const activeChat = this.activeChatState();
    if (activeChat?.id === message.chatId) {
      this.upsertMessage(message);
      if (!this.isMine(message)) this.markRead(message.chatId);
    }
    this.updateChatSummary(message);
  }

  private upsertMessage(message: ChatMessage): void {
    this.messagesState.update((messages) => {
      if (messages.some((item) => item.id === message.id)) return messages;
      return this.chronological([...messages, message]);
    });
  }

  private updateChatSummary(message: ChatMessage): void {
    const isIncoming = !this.isMine(message);
    const isActive = this.activeChatState()?.id === message.chatId;
    this.chatsState.update((chats) => chats
      .map((chat) => chat.id === message.chatId ? {
        ...chat,
        lastMessage: message.content,
        lastMessageAt: message.sentAt,
        unreadCount: isIncoming && !isActive ? chat.unreadCount + 1 : chat.unreadCount,
      } : chat)
      .sort((left, right) => this.timestamp(right.lastMessageAt) - this.timestamp(left.lastMessageAt)));
  }

  private updatePresence(userId: number, isOnline: boolean, lastSeenAt: string | null): void {
    this.chatsState.update((chats) => chats.map((chat) => chat.otherUserId === userId ? {
      ...chat,
      otherUserIsOnline: isOnline,
      otherUserLastSeenAt: lastSeenAt,
    } : chat));
    const activeChat = this.activeChatState();
    if (activeChat?.otherUserId === userId) {
      this.activeChatState.set({
        ...activeChat,
        otherUserIsOnline: isOnline,
        otherUserLastSeenAt: lastSeenAt,
      });
    }
  }

  private chronological(messages: ChatMessage[]): ChatMessage[] {
    return [...messages].sort((left, right) =>
      this.timestamp(left.sentAt) - this.timestamp(right.sentAt) || left.id - right.id);
  }

  private timestamp(value: string | null): number {
    return value ? new Date(value).getTime() : 0;
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
