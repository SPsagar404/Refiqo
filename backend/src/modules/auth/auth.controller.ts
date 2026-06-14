import { Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodBody } from '../../common/decorators/zod.decorator';
import { OAuthProvider } from '../../contracts/enums';
import { AuthService } from './auth.service';
import {
  forgotPasswordSchema,
  loginSchema,
  logoutSchema,
  oauthProviderParamSchema,
  oauthSchema,
  refreshSchema,
  resetPasswordSchema,
  signupSchema,
} from './dto/auth.schema';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  private ctx(req: Request) {
    return { userAgent: req.headers['user-agent'], ip: req.ip };
  }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Create an account and return tokens' })
  signup(@ZodBody(signupSchema) body: typeof signupSchema._type, @Req() req: Request) {
    return this.auth.signup(body, this.ctx(req));
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Authenticate with email + password' })
  login(@ZodBody(loginSchema) body: typeof loginSchema._type, @Req() req: Request) {
    return this.auth.login(body, this.ctx(req));
  }

  @Public()
  @Post('oauth/:provider')
  @ApiOperation({ summary: 'Authenticate via OAuth provider id token' })
  oauth(
    @Param() params: typeof oauthProviderParamSchema._type,
    @ZodBody(oauthSchema) body: typeof oauthSchema._type,
    @Req() req: Request,
  ) {
    const parsed = oauthProviderParamSchema.parse(params);
    const provider = parsed.provider.toUpperCase() as OAuthProvider;
    return this.auth.oauth(provider, body.idToken, this.ctx(req));
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token, return a new pair' })
  refresh(@ZodBody(refreshSchema) body: typeof refreshSchema._type, @Req() req: Request) {
    return this.auth.refresh(body.refreshToken, this.ctx(req));
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh-token session' })
  logout(@ZodBody(logoutSchema) body: typeof logoutSchema._type) {
    return this.auth.logout(body.refreshToken);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Send a password reset link/token' })
  forgot(@ZodBody(forgotPasswordSchema) body: typeof forgotPasswordSchema._type) {
    return this.auth.forgotPassword(body);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Set a new password using a reset token' })
  reset(@ZodBody(resetPasswordSchema) body: typeof resetPasswordSchema._type) {
    return this.auth.resetPassword(body);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Current user + onboarding state' })
  me(@CurrentUser('id') userId: string) {
    return this.auth.me(userId);
  }

  @ApiBearerAuth()
  @Get('sessions')
  @ApiOperation({ summary: 'List active sessions' })
  sessions(@CurrentUser('id') userId: string) {
    return this.auth.listSessions(userId);
  }

  @ApiBearerAuth()
  @Delete('sessions/:id')
  @ApiOperation({ summary: 'Revoke a session' })
  revokeSession(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.auth.revokeSession(userId, id);
  }
}
