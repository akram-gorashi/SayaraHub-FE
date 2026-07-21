import { HttpErrorResponse } from '@angular/common/http';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

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
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly chatsState = signal<Chat[]>([]);
  private readonly messagesState = signal<ChatMessage[]>([]);
  private readonly activeChatState = signal<Chat | null>(null);
  private readonly loadingState = signal(false);
  private readonly sendingState = signal(false);
  private readonly errorState = signal<string | null>(null);
  private readonly typingChatIds = signal<Set<number>>(new Set<number>());
  private readonly typingTimers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly chats = this.chatsState.asReadonly();
  readonly messages = this.messagesState.asReadonly();
  readonly activeChat = this.activeChatState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly sending = this.sendingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly typingChats = this.typingChatIds.asReadonly();

  constructor() {
    this.realtime.messages$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((message) => {
      this.receive(message);
    });
    this.realtime.presence$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((presence) => {
      this.updatePresence(presence.userId, presence.isOnline, presence.lastSeenAt);
    });
    this.realtime.typing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((typing) => {
      const activeChat = this.activeChatState();
      if (typing.userId === this.account.profile()?.id) return;
      this.setTyping(typing.chatId, typing.isTyping && activeChat?.id === typing.chatId);
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
    if (chat.otherUserIsOnline) return this.translate.instant('account.chatOnlineNow');
    return chat.otherUserLastSeenAt ? this.translate.instant('account.chatLastSeen') : this.translate.instant('account.chatOffline');
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
    if (state === 'online') return this.translate.instant('account.chatOnline');
    if (state === 'recent') return this.translate.instant('account.chatRecentlyOnline');
    return this.translate.instant('account.chatOffline');
  }

  isTyping(chatId: number): boolean {
    return this.typingChatIds().has(chatId);
  }

  showDateSeparator(index: number): boolean {
    const messages = this.messagesState();
    const current = messages[index];
    if (!current) return false;
    const previous = messages[index - 1];
    return !previous || this.dayKey(previous.sentAt) !== this.dayKey(current.sentAt);
  }

  dateLabel(value: string): string {
    const date = new Date(value);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (this.dayKey(value) === this.dayKey(today.toISOString())) return this.translate.instant('account.chatToday');
    if (this.dayKey(value) === this.dayKey(yesterday.toISOString())) return this.translate.instant('account.chatYesterday');
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  deliveryLabel(message: ChatMessage): string {
    if (!this.isMine(message)) return '';
    return message.isRead ? this.translate.instant('account.chatRead') : this.translate.instant('account.chatDelivered');
  }

  notifyTyping(isTyping: boolean): void {
    const chatId = this.activeChatState()?.id;
    if (!chatId) return;
    void this.realtime.sendTyping(chatId, isTyping).catch(() => undefined);
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

  private setTyping(chatId: number, isTyping: boolean): void {
    const existing = this.typingTimers.get(chatId);
    if (existing) clearTimeout(existing);
    this.typingTimers.delete(chatId);

    this.typingChatIds.update((ids) => {
      const next = new Set(ids);
      if (isTyping) next.add(chatId);
      else next.delete(chatId);
      return next;
    });

    if (isTyping) {
      this.typingTimers.set(chatId, setTimeout(() => this.setTyping(chatId, false), 3500));
    }
  }

  private chronological(messages: ChatMessage[]): ChatMessage[] {
    return [...messages].sort((left, right) =>
      this.timestamp(left.sentAt) - this.timestamp(right.sentAt) || left.id - right.id);
  }

  private timestamp(value: string | null): number {
    return value ? new Date(value).getTime() : 0;
  }

  private dayKey(value: string): string {
    const date = new Date(value);
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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
