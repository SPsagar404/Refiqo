import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'admin-access';
}

export interface AdminPrincipal {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

/** Separate strategy/secret namespace for the admin principal. */
@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: `${config.get<string>('jwt.accessSecret')}:admin`,
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminPrincipal> {
    if (payload.type !== 'admin-access') throw new UnauthorizedException('Invalid token type');
    const admin = await this.prisma.adminUser.findUnique({ where: { id: payload.sub } });
    if (!admin) throw new UnauthorizedException('Admin not found');
    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      permissions: admin.permissions,
    };
  }
}
