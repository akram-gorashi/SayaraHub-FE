import { Injectable, effect, inject, signal } from '@angular/core';

import { AuthSessionService } from './auth-session.service';
import { ChatsService } from './chats.service';
import { ChatRealtimeService } from './chat-realtime.service';

@Injectable({ providedIn: 'root' })
export class MessageCenterService {
  private readonly api = inject(ChatsService);
  private readonly realtime = inject(ChatRealtimeService);
  private readonly session = inject(AuthSessionService);
  private readonly unreadState = signal(0);

  readonly unread = this.unreadState.asReadonly();

  constructor() {
    effect(() => {
      if (!this.session.isAuthenticated()) {
        this.unreadState.set(0);
        return;
      }
      this.refresh();
    });

    this.realtime.messages$.subscribe(() => this.refresh());
    this.realtime.readReceipts$.subscribe(() => this.refresh());
  }

  refresh(): void {
    if (!this.session.isAuthenticated()) return;

    this.api.getChats({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: response => {
        const chats = response.data?.items ?? [];
        this.unreadState.set(chats.reduce((total, chat) => total + chat.unreadCount, 0));
        void this.realtime.joinChats(chats.map(chat => chat.id));
      },
    });
  }
}
