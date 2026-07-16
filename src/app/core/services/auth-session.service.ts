import { Injectable, computed, signal } from '@angular/core';

import { AuthSession } from '../models/auth.models';

const SESSION_STORAGE_KEY = 'sayaraHub.authSession';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly sessionState = signal<AuthSession | null>(this.readSession());
  private readonly nowState = signal(Date.now());
  private expiryTimer: ReturnType<typeof setTimeout> | null = null;

  readonly session = this.sessionState.asReadonly();
  readonly hasValidAccessToken = computed(() => {
    const session = this.sessionState();
    return session !== null && new Date(session.accessTokenExpiresAt).getTime() > this.nowState();
  });
  readonly isAdmin = computed(() => this.sessionState()?.roles?.includes('Admin') ?? false);
  readonly userId = computed(() => this.readUserId(this.sessionState()?.token));
  readonly canRefresh = computed(() => {
    const expiresAt = this.sessionState()?.refreshTokenExpiresAt;
    return !!expiresAt && new Date(expiresAt).getTime() > this.nowState();
  });
  readonly isAuthenticated = computed(() => this.hasValidAccessToken() || this.canRefresh());

  constructor() { this.scheduleExpiryCheck(); }

  get accessToken(): string | null {
    return this.sessionState()?.token ?? null;
  }

  get refreshToken(): string | null {
    // Supports one refresh for sessions created before the HttpOnly-cookie migration.
    return this.sessionState()?.refreshToken ?? null;
  }

  set(session: AuthSession): void {
    const { refreshToken: _legacyRefreshToken, ...safeSession } = session;
    this.sessionState.set(safeSession);
    this.nowState.set(Date.now());
    this.storage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeSession));
    this.scheduleExpiryCheck();
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
    this.nowState.set(Date.now());
    this.storage?.removeItem(SESSION_STORAGE_KEY);
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    this.expiryTimer = null;
  }

  private readSession(): AuthSession | null {
    const value = this.storage?.getItem(SESSION_STORAGE_KEY);
    if (!value) {
      return null;
    }

    try {
      const session = JSON.parse(value) as AuthSession;
      return { ...session, roles: session.roles ?? [] };
    } catch {
      this.storage?.removeItem(SESSION_STORAGE_KEY);
      return null;
    }
  }

  private readUserId(token: string | undefined): number | null {
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const claims = JSON.parse(atob(padded)) as { sub?: string };
      const userId = Number(claims.sub);
      return Number.isInteger(userId) && userId > 0 ? userId : null;
    } catch {
      return null;
    }
  }

  private scheduleExpiryCheck(): void {
    if (this.expiryTimer) clearTimeout(this.expiryTimer);
    const session = this.sessionState();
    if (!session) return;
    const now = Date.now();
    const expirations = [session.accessTokenExpiresAt, session.refreshTokenExpiresAt]
      .map(value => new Date(value).getTime()).filter(value => Number.isFinite(value) && value > now);
    if (!expirations.length) { this.nowState.set(now); return; }
    const delay = Math.min(Math.min(...expirations) - now + 50, 2_147_000_000);
    this.expiryTimer = setTimeout(() => { this.nowState.set(Date.now()); this.scheduleExpiryCheck(); }, delay);
  }

  private get storage(): Storage | null {
    return typeof localStorage === 'undefined' ? null : localStorage;
  }
}
