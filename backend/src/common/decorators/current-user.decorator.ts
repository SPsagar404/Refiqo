import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../contracts/enums';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  onboardingComplete: boolean;
}

/** Injects the authenticated user (set by JwtStrategy) into a handler param. */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthUser | undefined,
    ctx: ExecutionContext,
  ): AuthUser | AuthUser[keyof AuthUser] => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUser;
    return data ? user?.[data] : user;
  },
);
