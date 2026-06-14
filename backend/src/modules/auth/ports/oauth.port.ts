import { OAuthProvider } from '../../../contracts/enums';

export interface OAuthProfile {
  provider: OAuthProvider;
  providerUserId: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
}

/**
 * Verifies a provider id_token and returns a normalised profile.
 * Local adapter decodes a stub token; cloud adapter calls the real provider.
 */
export abstract class OAuthPort {
  abstract verify(provider: OAuthProvider, idToken: string): Promise<OAuthProfile>;
}

export const OAUTH_PORT = Symbol('OAUTH_PORT');
