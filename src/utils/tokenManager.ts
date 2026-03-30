import { auth } from '../firebase';

/**
 * Utility class to manage Firebase ID tokens and keep them fresh
 */
export class TokenManager {
  private static instance: TokenManager;
  private currentToken: string | null = null;
  private tokenExpiryTime: number | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  /**
   * Get a valid Firebase ID token
   */
  public async getValidToken(): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) {
      this.clearToken();
      return null;
    }

    // If we have a valid token that's not about to expire, return it
    if (this.currentToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime - 5 * 60 * 1000) {
      return this.currentToken;
    }

    try {
      // Force refresh to get a new token
      const token = await user.getIdToken(true);
      
      // Firebase tokens expire in 1 hour
      this.currentToken = token;
      this.tokenExpiryTime = Date.now() + 60 * 60 * 1000;
      
      // Set up refresh before expiry
      this.setupRefreshTimer();
      
      return token;
    } catch (error) {
      console.error('Error refreshing Firebase token:', error);
      this.clearToken();
      return null;
    }
  }

  private setupRefreshTimer() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh 5 minutes before expiry
    if (this.tokenExpiryTime) {
      const refreshIn = this.tokenExpiryTime - Date.now() - 5 * 60 * 1000;
      this.refreshTimer = setTimeout(() => this.getValidToken(), refreshIn);
    }
  }

  private clearToken() {
    this.currentToken = null;
    this.tokenExpiryTime = null;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Clear the current token and timer when logging out
   */
  public handleLogout() {
    this.clearToken();
  }
}

export const tokenManager = TokenManager.getInstance();
