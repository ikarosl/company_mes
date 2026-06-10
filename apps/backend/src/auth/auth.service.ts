import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { jwtVerify, SignJWT } from 'jose';
import type {
  AuthTokenKind,
  JwtClaims,
  LoginRequest,
  LoginResponse,
  UserProfile,
} from '@company/api-contract';
import { AuthRepository } from './auth.repository.js';

export interface AuthResultWithRefreshToken extends LoginResponse {
  refreshToken: string;
}

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev-only-company-system-secret',
);

@Injectable()
export class AuthService {
  private readonly refreshTokenIds = new Map<string, string>();

  constructor(@Inject(AuthRepository) private readonly authRepository: AuthRepository) {}

  async login(payload: LoginRequest): Promise<AuthResultWithRefreshToken> {
    const user = await this.authRepository.findActiveUserByUsername(payload.username);
    if (!user || !(await bcrypt.compare(payload.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid username or password');
    }

    const profile = await this.buildUserProfile(String(user.id));
    await this.authRepository.touchLastLogin(profile.id);

    return {
      user: profile,
      ...(await this.issueTokenPair(profile)),
    };
  }

  async refresh(refreshToken: string): Promise<AuthResultWithRefreshToken> {
    const claims = await this.verifyToken(refreshToken, 'refresh');
    const storedJti = this.refreshTokenIds.get(claims.sub);

    if (!claims.jti || storedJti !== claims.jti) {
      throw new UnauthorizedException('Refresh token is no longer valid');
    }

    const profile = await this.buildUserProfile(claims.sub);

    return {
      user: profile,
      ...(await this.issueTokenPair(profile)),
    };
  }

  async verifyAccessToken(accessToken: string) {
    return this.verifyToken(accessToken, 'access');
  }

  async revokeRefreshToken(refreshToken: string) {
    try {
      const claims = await this.verifyToken(refreshToken, 'refresh');
      if (claims.jti && this.refreshTokenIds.get(claims.sub) === claims.jti) {
        this.refreshTokenIds.delete(claims.sub);
      }
    } catch {
      // Logout must clear the browser cookie even when the token is already invalid.
    }
  }

  async profile(userId: string): Promise<UserProfile> {
    return this.buildUserProfile(userId);
  }

  private async buildUserProfile(userId: string) {
    const user = await this.authRepository.findActiveUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User is disabled or no longer exists');
    }

    const roles = await this.authRepository.findUserRoleCodes(userId);
    const permissions = await this.authRepository.findUserPermissionCodes(userId);
    return this.authRepository.toProfile(user, roles, permissions);
  }

  private async issueTokenPair(profile: UserProfile) {
    const accessToken = await this.signToken(profile, 'access', ACCESS_TOKEN_TTL_SECONDS);
    const refreshJti = randomUUID();
    const refreshToken = await this.signToken(
      profile,
      'refresh',
      REFRESH_TOKEN_TTL_SECONDS,
      refreshJti,
    );
    this.refreshTokenIds.set(profile.id, refreshJti);

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt: expiresAt(ACCESS_TOKEN_TTL_SECONDS),
      refreshTokenExpiresAt: expiresAt(REFRESH_TOKEN_TTL_SECONDS),
    };
  }

  private async signToken(
    profile: UserProfile,
    kind: AuthTokenKind,
    ttlSeconds: number,
    jti?: string,
  ) {
    const iat = nowSeconds();
    const jwt = new SignJWT({
      username: profile.username,
      roles: profile.roles,
      permissions: profile.permissions,
      kind,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(profile.id)
      .setIssuedAt(iat)
      .setExpirationTime(iat + ttlSeconds);

    if (jti) {
      jwt.setJti(jti);
    }

    return jwt.sign(JWT_SECRET);
  }

  private async verifyToken(token: string, kind: AuthTokenKind) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
      const claims = payload as unknown as JwtClaims;

      if (claims.kind !== kind || !claims.sub) {
        throw new UnauthorizedException('Token is invalid');
      }

      return claims;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Token has expired or is invalid');
    }
  }
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

const expiresAt = (ttlSeconds: number) =>
  new Date((nowSeconds() + ttlSeconds) * 1000).toISOString();
