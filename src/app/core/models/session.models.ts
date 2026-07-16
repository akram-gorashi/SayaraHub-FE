export interface UserSession {
  id: string;
  deviceName: string;
  browser: string;
  ipAddress: string | null;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
  isCurrent: boolean;
}

export interface RevokeSessionResult {
  currentSessionRevoked: boolean;
}
