import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../contracts/enums';

export const ROLES_KEY = 'roles';

/** Restricts a route to the listed roles (enforced by RolesGuard). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
