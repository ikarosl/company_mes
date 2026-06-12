export type AuthTokenKind = 'access' | 'refresh';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export interface TokenPair {
  accessToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
}

export interface LoginResponse extends TokenPair {
  user: UserProfile;
}

export interface RefreshResponse extends TokenPair {
  user: UserProfile;
}

export interface ValidateTokenResponse {
  valid: true;
  user: UserProfile;
}

export interface JwtClaims {
  sub: string;
  username: string;
  /** @deprecated 已从 JWT 中移除，权限通过 DB 查询获取 */
  roles?: string[];
  /** @deprecated 已从 JWT 中移除，权限通过 DB 查询获取 */
  permissions?: string[];
  kind: AuthTokenKind;
  exp: number;
  iat: number;
  jti?: string;
}
