import { Injectable, computed, signal } from '@angular/core';

import { AuthSession } from '../models/auth.models';

const SESSION_STORAGE_KEY = 'sayaraHub.authSession';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly sessionState = signal<AuthSession | null>(this.readSession());

  readonly session = this.sessionState.asReadonly();
  readonly isAuthenticated = computed(() => {
    const session = this.sessionState();
    return session !== null && new Date(session.accessTokenExpiresAt).getTime() > Date.now();
  });

  get accessToken(): string | null {
    return this.sessionState()?.token ?? null;
  }

  get refreshToken(): string | null {
    return this.sessionState()?.refreshToken ?? null;
  }

  set(session: AuthSession): void {
    this.sessionState.set(session);
    this.storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  }

  updateIdentity(identity: Pick<AuthSession, 'fullName' | 'email'>): void {
    const session = this.sessionState();
    if (!session) {
      return;
    }

    this.set({ ...session, ...identity });
  }

  clear(): void {
    this.sessionState.set(null);
    this.storage?.removeItem(SESSION_STORAGE_KEY);
  }

  private readSession(): AuthSession | null {
    const value = this.storage?.getItem(SESSION_STORAGE_KEY);
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as AuthSession;
    } catch {
      this.storage?.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
