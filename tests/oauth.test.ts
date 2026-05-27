import { describe, expect, it, vi, beforeEach } from 'vitest';
import { GenericOAuthProvider, OAuthService, GoogleOAuthPreset } from '../src/core/auth/oauth.js';

describe('OAuth', () => {
  const config = GoogleOAuthPreset({
    clientId: 'id',
    clientSecret: 'secret',
    redirectUri: 'http://localhost/callback',
  });

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('generates correct auth url', () => {
    const provider = new GenericOAuthProvider('google', config);
    const url = provider.getAuthUrl('my-state');
    
    expect(url).toContain('client_id=id');
    expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%2Fcallback');
    expect(url).toContain('state=my-state');
  });

  it('exchanges code for tokens', async () => {
    const provider = new GenericOAuthProvider('google', config);
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        access_token: 'abc',
        expires_in: 3600,
      }),
    } as any);

    const tokens = await provider.getTokens('some-code');
    
    expect(tokens.accessToken).toBe('abc');
    expect(fetch).toHaveBeenCalledWith(config.tokenUrl, expect.objectContaining({
      method: 'POST',
    }));
  });

  it('gets user info', async () => {
    const provider = new GenericOAuthProvider('google', config);
    
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        sub: '123',
        email: 'test@example.com',
        name: 'Test User',
      }),
    } as any);

    const info = await provider.getUserInfo('abc');
    
    expect(info.id).toBe('123');
    expect(info.email).toBe('test@example.com');
    expect(info.name).toBe('Test User');
  });

  it('manages providers in OAuthService', () => {
    const service = new OAuthService();
    const provider = new GenericOAuthProvider('google', config);
    
    service.registerProvider(provider);
    expect(service.getProvider('google')).toBe(provider);
    expect(() => service.getProvider('github')).toThrow();
  });
});
