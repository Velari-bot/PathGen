export interface EpicAccount {
  id: string;
  displayName: string;
  email?: string;
  linkedAccounts?: {
    psn?: string;
    xbox?: string;
    nintendo?: string;
  };
}

export interface EpicOAuthConfig {
  clientId: string;
  redirectUri: string;
  scope: string;
}

export class EpicService {
  private clientId: string;
  private redirectUri: string;
  private scope: string;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_EPIC_CLIENT_ID || '';
    this.redirectUri = process.env.NEXT_PUBLIC_EPIC_REDIRECT_URI || '';
    this.scope = 'basic_profile';
  }

  // Initialize Epic OAuth flow
  initiateOAuth(): void {
    const authUrl = `https://www.epicgames.com/id/authorize?client_id=${this.clientId}&redirect_uri=${encodeURIComponent(this.redirectUri)}&response_type=code&scope=${this.scope}`;
    window.location.href = authUrl;
  }

  // Handle OAuth callback and exchange code for access token
  async handleOAuthCallback(code: string): Promise<EpicAccount | null> {
    try {
      const response = await fetch('/api/epic/oauth-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        throw new Error('Failed to exchange OAuth code');
      }

      const data = await response.json();
      return data.account;
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return null;
    }
  }

  // Get Epic account info from access token
  async getAccountInfo(accessToken: string): Promise<EpicAccount | null> {
    try {
      const response = await fetch('https://api.epicgames.dev/epic/oauth/v1/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get account info');
      }

      const data = await response.json();
      return {
        id: data.sub,
        displayName: data.preferred_username,
        email: data.email,
      };
    } catch (error) {
      console.error('Error getting Epic account info:', error);
      return null;
    }
  }

  // Verify Epic account exists and get basic info
  async verifyAccount(displayName: string): Promise<EpicAccount | null> {
    try {
      const response = await fetch(`/api/epic/verify-account?displayName=${encodeURIComponent(displayName)}`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.account;
    } catch (error) {
      console.error('Error verifying Epic account:', error);
      return null;
    }
  }
}

export const epicService = new EpicService();
