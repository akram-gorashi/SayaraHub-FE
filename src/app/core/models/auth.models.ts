export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends LoginRequest {
  fullName: string;
}

export interface AuthSession {
  token: string;
  /** Legacy migration only. New refresh tokens are held in an HttpOnly cookie. */
  refreshToken?: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  fullName: string;
  email: string;
  roles: string[];
}
