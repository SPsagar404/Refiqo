import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from '../../../common/decorators/current-user.decorator';
import { UserStatus } from '../../../contracts/enums';
import { PrismaService } from '../../../prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  type: 'access';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('jwt.accessSecret'),
    });
  }

  /** Runs on every authenticated request; returned value becomes `request.user`. */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid token type');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, status: true, onboardingComplete: true },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      onboardingComplete: user.onboardingComplete,
    };
  }
}
