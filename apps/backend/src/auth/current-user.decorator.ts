import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUserProfile {
  id: string;
  username: string;
  roles: string[];
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (field: keyof CurrentUserProfile | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<{ user?: CurrentUserProfile }>();
    const user = request.user;

    if (!field) {
      return user;
    }

    return user?.[field];
  },
);
