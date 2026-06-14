import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Enforces a valid admin JWT. Applied at the admin controller level. */
@Injectable()
export class AdminJwtGuard extends AuthGuard('admin-jwt') {}
