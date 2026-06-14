import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalOAuthAdapter } from './ports/local-oauth.adapter';
import { OAUTH_PORT } from './ports/oauth.port';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: config.get<number>('jwt.accessTtl') },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    // OAuthPort — local adapter for dev; swap to a cloud adapter when ADAPTER_MODE=cloud.
    { provide: OAUTH_PORT, useClass: LocalOAuthAdapter },
  ],
  exports: [TokenService, JwtModule, PassportModule],
})
export class AuthModule {}
