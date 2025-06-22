import type { PuppeteerLaunchOptions } from 'puppeteer';

export const testConfig = {
  baseURL: process.env.TEST_BASE_URL || 'https://dev.greater.website',
  lesserInstance: process.env.LESSER_INSTANCE || 'https://lesser.host',
  testTimeout: 30000,
  slowMo: process.env.CI ? 0 : 50, // Slow down actions for debugging
};

export const puppeteerConfig: PuppeteerLaunchOptions = {
  headless: false, // Required for WebAuthn
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-accelerated-2d-canvas',
    '--disable-gpu',
    // Enable WebAuthn support
    '--enable-features=WebAuthenticationCable',
    // Enable virtual authenticator for testing
    '--enable-web-authentication-testing-api',
  ],
  defaultViewport: {
    width: 1280,
    height: 720,
  },
  // Slower actions to handle WebAuthn UI
  slowMo: testConfig.slowMo,
};

// Test authentication methods
export const authMethods = {
  // WebAuthn virtual authenticator for testing
  webauthn: {
    enabled: !process.env.SKIP_WEBAUTHN_TESTS,
    virtualAuthenticator: {
      protocol: 'ctap2',
      transport: 'internal',
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
    },
  },
  // OAuth providers for testing
  oauth: {
    github: {
      enabled: process.env.TEST_OAUTH_GITHUB_TOKEN ? true : false,
      token: process.env.TEST_OAUTH_GITHUB_TOKEN,
    },
    google: {
      enabled: process.env.TEST_OAUTH_GOOGLE_TOKEN ? true : false,
      token: process.env.TEST_OAUTH_GOOGLE_TOKEN,
    },
  },
  // Wallet authentication (mock for testing)
  wallet: {
    enabled: process.env.TEST_WALLET_ADDRESS ? true : false,
    address: process.env.TEST_WALLET_ADDRESS,
    privateKey: process.env.TEST_WALLET_PRIVATE_KEY, // Only for test environments
  },
};

// Test user accounts
export const testAccounts = {
  aron: {
    username: '@aron@lesser.host',
    displayName: 'Aron',
  },
  aron2: {
    username: '@aron2@lesser.host', 
    displayName: 'Aron 2',
  },
};