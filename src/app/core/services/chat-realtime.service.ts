import { Injectable, NgZone, inject, signal } from '@angular/core';
import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { Subject } from 'rxjs';

import { ChatMessage, ChatPresence } from '../models/chat.models';
import { AuthSessionService } from './auth-session.service';

@Injectable({ providedIn: 'root' })
export class ChatRealtimeService {
  private readonly authSession = inject(AuthSessionService);
  private readonly zone = inject(NgZone);
  private readonly joinedChatIds = new Set<number>();
  private readonly messageSubject = new Subject<ChatMessage>();
  private readonly presenceSubject = new Subject<ChatPresence>();
  private startPromise: Promise<void> | null = null;
  private readonly connectedState = signal(false);

  private readonly connection: HubConnection = new HubConnectionBuilder()
    .withUrl('/hubs/chat', {
      accessTokenFactory: () => this.authSession.accessToken ?? '',
    })
    .withAutomaticReconnect([0, 2_000, 10_000, 30_000])
    .configureLogging(LogLevel.Warning)
    .build();

  readonly connected = this.connectedState.asReadonly();
  readonly messages$ = this.messageSubject.asObservable();
  readonly presence$ = this.presenceSubject.asObservable();

  constructor() {
    this.connection.on('MessageReceived', (message: ChatMessage) => {
      this.zone.run(() => this.messageSubject.next(message));
    });
    this.connection.on('PresenceChanged', (presence: ChatPresence) => {
      this.zone.run(() => this.presenceSubject.next(presence));
    });
    this.connection.onreconnecting(() => this.zone.run(() => this.connectedState.set(false)));
    this.connection.onclose(() => this.zone.run(() => this.connectedState.set(false)));
    this.connection.onreconnected(() => {
      this.zone.run(() => this.connectedState.set(true));
      void this.joinKnownChats();
    });
  }

  async joinChats(chatIds: readonly number[]): Promise<void> {
    chatIds.forEach((chatId) => this.joinedChatIds.add(chatId));
    await this.ensureStarted();
    await Promise.all(chatIds.map((chatId) => this.connection.invoke('JoinChat', chatId)));
  }

  private async ensureStarted(): Promise<void> {
    if (this.connection.state === HubConnectionState.Connected) return;
    if (!this.startPromise) {
      this.startPromise = this.connection.start()
        .then(() => this.zone.run(() => this.connectedState.set(true)))
        .finally(() => { this.startPromise = null; });
    }
    await this.startPromise;
  }

  private async joinKnownChats(): Promise<void> {
    if (this.connection.state !== HubConnectionState.Connected) return;
    await Promise.all([...this.joinedChatIds].map((chatId) => this.connection.invoke('JoinChat', chatId)));
  }
}
