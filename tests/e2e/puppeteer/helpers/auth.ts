import { Page, Browser } from 'puppeteer';
import { testConfig, authMethods } from '../config';

export class AuthHelper {
  constructor(private browser: Browser, private page: Page) {}

  /**
   * Set up a virtual authenticator for WebAuthn testing
   */
  async setupVirtualAuthenticator() {
    if (!authMethods.webauthn.enabled) {
      console.log('WebAuthn tests are disabled');
      return null;
    }

    // Create a virtual authenticator
    const client = await this.page.target().createCDPSession();
    await client.send('WebAuthn.enable');
    
    const { authenticatorId } = await client.send('WebAuthn.addVirtualAuthenticator', {
      options: authMethods.webauthn.virtualAuthenticator,
    });

    return { client, authenticatorId };
  }

  /**
   * Authenticate using OAuth (for testing when WebAuthn is not available)
   */
  async authenticateWithOAuth(provider: 'github' | 'google') {
    const config = authMethods.oauth[provider];
    if (!config.enabled) {
      throw new Error(`OAuth provider ${provider} is not configured for testing`);
    }

    // Navigate to login page
    await this.page.goto(`${testConfig.baseURL}/login`);
    
    // Click OAuth provider button
    await this.page.click(`[data-oauth-provider="${provider}"]`);
    
    // Handle OAuth flow (this would need provider-specific handling)
    // For testing, we might need to mock the OAuth response
    console.log(`OAuth authentication with ${provider} initiated`);
    
    // Wait for redirect back to app
    await this.page.waitForNavigation({
      waitUntil: 'networkidle0',
    });
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      // Check for auth token in localStorage
      const hasToken = await this.page.evaluate(() => {
        return !!localStorage.getItem('auth_token');
      });
      
      if (!hasToken) return false;
      
      // Verify by checking for user menu or profile element
      const userMenu = await this.page.$('[data-testid="user-menu"]');
      return !!userMenu;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser() {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) return null;

    return await this.page.evaluate(() => {
      // Access the auth store directly
      const authData = localStorage.getItem('auth_token');
      if (!authData) return null;
      
      try {
        const parsed = JSON.parse(authData);
        return {
          username: parsed.username,
          displayName: parsed.display_name,
          instance: parsed.instance,
        };
      } catch {
        return null;
      }
    });
  }

  /**
   * Logout current user
   */
  async logout() {
    const isAuth = await this.isAuthenticated();
    if (!isAuth) return;

    // Click user menu
    await this.page.click('[data-testid="user-menu"]');
    
    // Click logout
    await this.page.click('[data-testid="logout-button"]');
    
    // Wait for redirect to home
    await this.page.waitForNavigation({
      waitUntil: 'networkidle0',
    });
  }

  /**
   * Mock authentication for faster testing
   * This bypasses the actual auth flow and sets up the session directly
   */
  async mockAuthenticate(username: string) {
    // Set up mock auth data in localStorage
    await this.page.evaluate((user) => {
      const mockAuthData = {
        token: 'mock-test-token',
        username: user,
        instance: 'lesser.host',
        display_name: user.replace('@', '').split('@')[0],
      };
      localStorage.setItem('auth_token', JSON.stringify(mockAuthData));
    }, username);

    // Reload to apply auth state
    await this.page.reload();
  }
}