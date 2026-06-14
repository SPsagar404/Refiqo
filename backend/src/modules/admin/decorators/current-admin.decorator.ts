import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AdminPrincipal } from '../strategies/admin-jwt.strategy';

export const CurrentAdmin = createParamDecorator(
  (data: keyof AdminPrincipal | undefined, ctx: ExecutionContext) => {
    const admin = ctx.switchToHttp().getRequest().user as AdminPrincipal;
    return data ? admin?.[data] : admin;
  },
);
