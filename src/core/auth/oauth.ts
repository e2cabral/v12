import { UnauthorizedError } from '../errors/app-error.js';

export interface OAuthProvider {
  name: string;
  getAuthUrl(state?: string): string;
  getTokens(code: string): Promise<OAuthTokens>;
  getUserInfo(accessToken: string): Promise<OAuthUserInfo>;
}

export type OAuthTokens = {
  accessToken: string;
  refreshToken?: string;
  idToken?: string;
  expiresIn?: number;
  tokenType?: string;
};

export type OAuthUserInfo = {
  id: string;
  email?: string;
  name?: string;
  picture?: string;
  raw: Record<string, any>;
};

export type OAuthConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope?: string[];
  authorizeUrl: string;
  tokenUrl: string;
  userUrl: string;
};

export class GenericOAuthProvider implements OAuthProvider {
  constructor(
    public readonly name: string,
    private readonly config: OAuthConfig,
  ) {}

  getAuthUrl(state?: string): string {
    const url = new URL(this.config.authorizeUrl);
    url.searchParams.set('client_id', this.config.clientId);
    url.searchParams.set('redirect_uri', this.config.redirectUri);
    url.searchParams.set('response_type', 'code');
    if (this.config.scope) {
      url.searchParams.set('scope', this.config.scope.join(' '));
    }
    if (state) {
      url.searchParams.set('state', state);
    }
    return url.toString();
  }

  async getTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: this.config.redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new UnauthorizedError(`Failed to get OAuth tokens: ${error}`);
    }

    const data = await response.json() as any;
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      idToken: data.id_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(this.config.userUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new UnauthorizedError(`Failed to get user info: ${error}`);
    }

    const raw = await response.json() as any;
    
    // Tentativa de normalizacao basica
    return {
      id: raw.id || raw.sub || String(raw.uid),
      email: raw.email,
      name: raw.name || raw.displayName || raw.login,
      picture: raw.picture || raw.avatar_url,
      raw,
    };
  }
}

export class OAuthService {
  private providers = new Map<string, OAuthProvider>();

  registerProvider(provider: OAuthProvider) {
    this.providers.set(provider.name, provider);
  }

  getProvider(name: string): OAuthProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`OAuth provider "${name}" not found`);
    }
    return provider;
  }
}

export const GoogleOAuthPreset = (
  config: Omit<OAuthConfig, 'authorizeUrl' | 'tokenUrl' | 'userUrl'>,
): OAuthConfig => ({
  authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  userUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
  scope: ['openid', 'email', 'profile'],
  ...config,
});

export const GitHubOAuthPreset = (
  config: Omit<OAuthConfig, 'authorizeUrl' | 'tokenUrl' | 'userUrl'>,
): OAuthConfig => ({
  authorizeUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  userUrl: 'https://api.github.com/user',
  scope: ['user:email'],
  ...config,
});

export const MicrosoftOAuthPreset = (
  config: Omit<OAuthConfig, 'authorizeUrl' | 'tokenUrl' | 'userUrl'> & { tenant?: string },
): OAuthConfig => {
  const tenant = config.tenant || 'common';
  return {
    authorizeUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize`,
    tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    userUrl: 'https://graph.microsoft.com/v1.0/me',
    scope: ['openid', 'profile', 'email', 'User.Read'],
    ...config,
  };
};

export const AppleOAuthPreset = (
  config: Omit<OAuthConfig, 'authorizeUrl' | 'tokenUrl' | 'userUrl'>,
): OAuthConfig => ({
  authorizeUrl: 'https://appleid.apple.com/auth/authorize',
  tokenUrl: 'https://appleid.apple.com/auth/token',
  userUrl: '', // Apple nao tem endpoint de user info padrao, os dados vem no id_token
  scope: ['name', 'email'],
  ...config,
});

export const LinkedInOAuthPreset = (
  config: Omit<OAuthConfig, 'authorizeUrl' | 'tokenUrl' | 'userUrl'>,
): OAuthConfig => ({
  authorizeUrl: 'https://www.linkedin.com/oauth/v2/authorization',
  tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  userUrl: 'https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))',
  scope: ['r_liteprofile', 'r_emailaddress'],
  ...config,
});
