import {
  Body,
  Controller,
  Get,
  Headers,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { LoginRequest } from '@company/api-contract';
import { OperationLogService } from '../operation-log/operation-log.service.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(OperationLogService) private readonly operationLogService: OperationLogService,
  ) {}

  @Post('login')
  async login(
    @Body() payload: LoginRequest,
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    try {
      const { refreshToken, ...body } = await this.authService.login(payload);
      setRefreshTokenCookie(response, refreshToken);
      await this.operationLogService.write({
        logType: 'auth',
        module: 'auth',
        action: 'login',
        userId: body.user.id,
        result: 'success',
        ip: readIp(request),
        remark: payload.username,
      });
      return body;
    } catch (error) {
      await this.operationLogService.write({
        logType: 'auth',
        module: 'auth',
        action: 'login',
        result: 'failed',
        ip: readIp(request),
        remark: error instanceof Error ? `${payload.username}: ${error.message}` : payload.username,
      });
      throw error;
    }
  }

  @Post('refresh')
  async refresh(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    const { refreshToken, ...body } = await this.authService.refresh(
      readRefreshTokenCookie(request),
    );
    setRefreshTokenCookie(response, refreshToken);
    return body;
  }

  @Post('logout')
  async logout(
    @Req() request: CookieRequest,
    @Res({ passthrough: true }) response: CookieResponse,
  ) {
    try {
      const refreshToken = readOptionalRefreshTokenCookie(request);
      if (refreshToken) {
        await this.authService.revokeRefreshToken(refreshToken);
      }
    } catch {
      // Logout must still clear the browser cookie even when token revocation fails.
    } finally {
      clearRefreshTokenCookie(response);
    }

    return { success: true };
  }

  @Get('me')
  async me(@Headers('authorization') authorization?: string) {
    const claims = await this.authService.verifyAccessToken(readBearerToken(authorization));
    return this.authService.profile(claims.sub);
  }

  @Get('validate')
  async validate(@Headers('authorization') authorization?: string) {
    const claims = await this.authService.verifyAccessToken(readBearerToken(authorization));
    return {
      valid: true,
      user: await this.authService.profile(claims.sub),
    };
  }
}

const readBearerToken = (authorization?: string) => {
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedException('Missing bearer token');
  }

  return token;
};

interface CookieRequest {
  ip?: string;
  socket?: {
    remoteAddress?: string;
  };
  headers: {
    cookie?: string;
    ['x-forwarded-for']?: string;
  };
}

interface CookieResponse {
  cookie: (name: string, value: string, options: RefreshCookieOptions) => void;
  clearCookie: (
    name: string,
    options: Pick<RefreshCookieOptions, 'httpOnly' | 'sameSite' | 'secure' | 'path'>,
  ) => void;
}

interface RefreshCookieOptions {
  httpOnly: true;
  sameSite: 'lax';
  secure: boolean;
  path: string;
  maxAge: number;
}

const REFRESH_TOKEN_COOKIE_NAME = 'company_refresh_token';
const REFRESH_TOKEN_COOKIE_PATH = process.env.REFRESH_TOKEN_COOKIE_PATH ?? '/api/auth';
const REFRESH_TOKEN_COOKIE_SECURE = process.env.REFRESH_TOKEN_COOKIE_SECURE === 'true';
const REFRESH_TOKEN_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: REFRESH_TOKEN_COOKIE_SECURE,
  path: REFRESH_TOKEN_COOKIE_PATH,
  maxAge: REFRESH_TOKEN_COOKIE_MAX_AGE,
} as const;

const setRefreshTokenCookie = (response: CookieResponse, refreshToken: string) => {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, refreshCookieOptions);
};

const clearRefreshTokenCookie = (response: CookieResponse) => {
  const { maxAge: _maxAge, ...clearOptions } = refreshCookieOptions;
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, clearOptions);
};

const readRefreshTokenCookie = (request: CookieRequest) => {
  const refreshToken = readOptionalRefreshTokenCookie(request);
  if (!refreshToken) {
    throw new UnauthorizedException('Missing refresh token');
  }

  return refreshToken;
};

const readOptionalRefreshTokenCookie = (request: CookieRequest) => {
  const cookies = request.headers.cookie?.split(';') ?? [];

  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split('=');
    if (rawName === REFRESH_TOKEN_COOKIE_NAME) {
      return decodeURIComponent(rawValue.join('='));
    }
  }

  return null;
};

const readIp = (request: CookieRequest) => {
  const forwarded = request.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? null;
  }

  return request.ip ?? request.socket?.remoteAddress ?? null;
};
