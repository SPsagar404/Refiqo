import { BadRequestException, Injectable } from '@nestjs/common';
import { OAuthProvider } from '../../../contracts/enums';
import { OAuthPort, OAuthProfile } from './oauth.port';

/**
 * Dev/local OAuth adapter. Accepts a base64url JSON "id token" so the full
 * OAuth flow is exercisable without provider credentials. The cloud adapter
 * (swapped in when ADAPTER_MODE=cloud) verifies a real signed token instead.
 *
 * Stub token: base64url(JSON.stringify({ sub, email, name, picture? }))
 */
@Injectable()
export class LocalOAuthAdapter extends OAuthPort {
  async verify(provider: OAuthProvider, idToken: string): Promise<OAuthProfile> {
    try {
      const json = Buffer.from(idToken, 'base64url').toString('utf8');
      const claims = JSON.parse(json) as {
        sub?: string;
        email?: string;
        name?: string;
        picture?: string;
      };
      if (!claims.sub || !claims.email) {
        throw new Error('missing sub/email');
      }
      return {
        provider,
        providerUserId: claims.sub,
        email: claims.email.toLowerCase(),
        fullName: claims.name ?? claims.email.split('@')[0],
        avatarUrl: claims.picture,
      };
    } catch {
      throw new BadRequestException({
        message: 'Invalid OAuth token',
        code: 'OAUTH_INVALID_TOKEN',
      });
    }
  }
}
