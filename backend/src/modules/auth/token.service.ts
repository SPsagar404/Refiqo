import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'crypto';
import { UserRole } from '../../contracts/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from './strategies/jwt.strategy';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface IssueContext {
  userAgent?: string;
  ip?: string;
}

/**
 * Issues access tokens and persists rotating refresh-token sessions.
 * Refresh tokens are opaque (random) and stored hashed; the JWT only carries
 * the session id so a stolen DB row can't be replayed as a bearer token.
 */
@Injectable()
export class TokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async issuePair(
    user: { id: string; email: string; role: UserRole },
    ctx: IssueContext = {},
  ): Promise<TokenPair> {
    const accessToken = await this.signAccess(user);

    const refreshSecret = randomUUID() + randomUUID();
    const ttlSec = this.config.get<number>('jwt.refreshTtl')!;
    const expiresAt = new Date(Date.now() + ttlSec * 1000);

    const session = await this.prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: await argon2.hash(refreshSecret),
        userAgent: ctx.userAgent,
        ip: ctx.ip,
        expiresAt,
      },
      select: { id: true },
    });

    // refreshToken = "<sessionId>.<secret>" — sessionId locates the row, secret is verified by hash.
    const refreshToken = `${session.id}.${refreshSecret}`;
    return { accessToken, refreshToken };
  }

  /** Validates a refresh token, revokes the old session, issues a fresh pair. */
  async rotate(refreshToken: string, ctx: IssueContext = {}): Promise<TokenPair> {
    const session = await this.verifyRefresh(refreshToken);
    await this.prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });
    return this.issuePair(session.user, ctx);
  }

  async revoke(refreshToken: string): Promise<void> {
    const [sessionId] = refreshToken.split('.');
    if (!sessionId) return;
    await this.prisma.session
      .updateMany({
        where: { id: sessionId, revokedAt: null },
        data: { revokedAt: new Date() },
      })
      .catch(() => undefined);
  }

  private async signAccess(user: { id: string; email: string; role: UserRole }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    };
    return this.jwt.signAsync(payload, {
      secret: this.config.get<string>('jwt.accessSecret'),
      expiresIn: this.config.get<number>('jwt.accessTtl'),
    });
  }

  private async verifyRefresh(refreshToken: string) {
    const [sessionId, secret] = refreshToken.split('.');
    if (!sessionId || !secret) {
      throw new RefreshError();
    }
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    if (
      !session ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      !(await argon2.verify(session.refreshTokenHash, secret))
    ) {
      throw new RefreshError();
    }
    return session;
  }
}

export class RefreshError extends UnauthorizedException {
  constructor() {
    super({ message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' });
  }
}
