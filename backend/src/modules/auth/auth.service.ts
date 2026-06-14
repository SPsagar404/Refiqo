import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { OAuthProvider, UserStatus } from '../../contracts/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { ForgotPasswordDto, LoginDto, ResetPasswordDto, SignupDto } from './dto/auth.schema';
import { OAUTH_PORT, OAuthPort } from './ports/oauth.port';
import { TokenService } from './token.service';

interface RequestContext {
  userAgent?: string;
  ip?: string;
}

const PUBLIC_USER_SELECT = {
  id: true,
  email: true,
  fullName: true,
  avatarUrl: true,
  role: true,
  status: true,
  isVerified: true,
  onboardingStep: true,
  onboardingComplete: true,
  createdAt: true,
} as const;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    @Inject(OAUTH_PORT) private readonly oauthPort: OAuthPort,
  ) {}

  async signup(dto: SignupDto, ctx: RequestContext) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException({ message: 'Email already registered', code: 'EMAIL_TAKEN' });
    }
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash: await argon2.hash(dto.password),
        notificationPrefs: { create: {} },
      },
      select: PUBLIC_USER_SELECT,
    });
    const pair = await this.tokens.issuePair(user, ctx);
    return { user, ...pair };
  }

  async login(dto: LoginDto, ctx: RequestContext) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordHash || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException({
        message: 'Invalid email or password',
        code: 'INVALID_CREDENTIALS',
      });
    }
    this.assertActive(user.status);
    const pair = await this.tokens.issuePair(user, ctx);
    return { user: this.toPublic(user), ...pair };
  }

  async oauth(provider: OAuthProvider, idToken: string, ctx: RequestContext) {
    const profile = await this.oauthPort.verify(provider, idToken);

    const identity = await this.prisma.authProvider.findUnique({
      where: { provider_providerUserId: { provider, providerUserId: profile.providerUserId } },
      include: { user: true },
    });

    let user = identity?.user ?? null;
    if (!user) {
      // Link to an existing email account, or create a fresh one.
      user = await this.prisma.user.findUnique({ where: { email: profile.email } });
      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            fullName: profile.fullName,
            avatarUrl: profile.avatarUrl,
            isVerified: true,
            notificationPrefs: { create: {} },
          },
        });
      }
      await this.prisma.authProvider.create({
        data: { userId: user.id, provider, providerUserId: profile.providerUserId },
      });
    }
    this.assertActive(user.status);
    const pair = await this.tokens.issuePair(user, ctx);
    return { user: this.toPublic(user), ...pair };
  }

  async refresh(refreshToken: string, ctx: RequestContext) {
    return this.tokens.rotate(refreshToken, ctx);
  }

  async logout(refreshToken: string) {
    await this.tokens.revoke(refreshToken);
    return { success: true };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Always respond success to avoid account enumeration.
    if (user) {
      const token = await this.jwt.signAsync(
        { sub: user.id, type: 'reset' },
        { secret: this.resetSecret(), expiresIn: 3600 },
      );
      // Local/dev: log the link. Cloud: an email adapter would send it.
      this.logger.log(`Password reset token for ${user.email}: ${token}`);
    }
    return { success: true };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let userId: string;
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; type: string }>(dto.token, {
        secret: this.resetSecret(),
      });
      if (payload.type !== 'reset') throw new Error('wrong type');
      userId = payload.sub;
    } catch {
      throw new UnauthorizedException({
        message: 'Invalid or expired reset token',
        code: 'INVALID_RESET_TOKEN',
      });
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await argon2.hash(dto.password) },
    });
    // Revoke all sessions on password change.
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: PUBLIC_USER_SELECT,
    });
    return user;
  }

  async listSessions(userId: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, userAgent: true, ip: true, createdAt: true, expiresAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return sessions;
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private assertActive(status: UserStatus) {
    if (status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException({
        message: `Account is ${status.toLowerCase()}`,
        code: 'ACCOUNT_INACTIVE',
      });
    }
  }

  private resetSecret(): string {
    return `${this.config.get<string>('jwt.accessSecret')}:reset`;
  }

  private toPublic<T extends Record<string, unknown>>(user: T) {
    const { passwordHash: _passwordHash, ...rest } = user as Record<string, unknown>;
    return rest;
  }
}
