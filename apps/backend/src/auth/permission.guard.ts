import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service.js';
import type { CurrentUserProfile } from './current-user.decorator.js';
import { REQUIRED_PERMISSION_KEY } from './require-permission.decorator.js';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const permission = this.reflector.getAllAndOverride<string | undefined>(
      REQUIRED_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permission) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PermissionRequest>();
    const claims = await this.authService.verifyAccessToken(
      readBearerToken(request.headers.authorization),
    );
    const profile = await this.authService.profile(claims.sub);

    if (!profile.permissions.includes(permission)) {
      throw new ForbiddenException('Permission denied');
    }

    request.user = {
      id: claims.sub,
      username: profile.username,
      roles: profile.roles,
      permissions: profile.permissions,
    };

    return true;
  }
}

interface PermissionRequest {
  headers: {
    authorization?: string;
  };
  user?: CurrentUserProfile;
}

const readBearerToken = (authorization?: string) => {
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedException('Missing bearer token');
  }

  return token;
};
