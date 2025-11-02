import puppeteer, { Browser, Page } from 'puppeteer';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { puppeteerConfig, testConfig, testAccounts } from './config';
import { AuthHelper } from './helpers/auth';

// TODO: Re-enable once CI provides a running Greater instance for these puppeteer journeys.
describe.skip('Timeline Integration Tests', () => {
  let browser: Browser;
  let page: Page;
  let authHelper: AuthHelper;

  beforeAll(async () => {
    browser = await puppeteer.launch(puppeteerConfig);
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    authHelper = new AuthHelper(browser, page);
    
    // Set up request interception to log API calls
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/')) {
        console.log('API Request:', request.method(), request.url());
      }
      request.continue();
    });

    page.on('response', (response) => {
      if (response.url().includes('/api/v1/')) {
        console.log('API Response:', response.status(), response.url());
        // Log cost tracking header
        const costHeader = response.headers()['x-cost-total-micros'];
        if (costHeader) {
          console.log('Operation cost:', costHeader, 'micros');
        }
      }
    });
  });

  describe('Home Timeline', () => {
    it('should load the home page', async () => {
      await page.goto(testConfig.baseURL);
      
      // Check for main elements
      const title = await page.title();
      expect(title).toContain('Greater');
      
      // Look for login button (unauthenticated state)
      const loginButton = await page.$('[data-testid="login-button"]');
      expect(loginButton).toBeTruthy();
    });

    it('should display public timeline without authentication', async () => {
      await page.goto(`${testConfig.baseURL}/public`);
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline"]', { timeout: 10000 });
      
      // Check for status cards
      const statusCards = await page.$$('[data-testid="status-card"]');
      console.log(`Found ${statusCards.length} statuses in public timeline`);
      
      // Verify at least some statuses are loaded
      expect(statusCards.length).toBeGreaterThan(0);
      
      // Check first status has required elements
      if (statusCards.length > 0) {
        const firstStatus = statusCards[0];
        const author = await firstStatus.$('[data-testid="status-author"]');
        const content = await firstStatus.$('[data-testid="status-content"]');
        const timestamp = await firstStatus.$('[data-testid="status-timestamp"]');
        
        expect(author).toBeTruthy();
        expect(content).toBeTruthy();
        expect(timestamp).toBeTruthy();
        
        // Log the content for debugging
        const authorText = await author?.evaluate(el => el.textContent);
        const contentText = await content?.evaluate(el => el.textContent);
        console.log('First status:', { author: authorText, content: contentText });
      }
    });

    it('should load more statuses on scroll', async () => {
      await page.goto(`${testConfig.baseURL}/public`);
      
      // Wait for initial load
      await page.waitForSelector('[data-testid="timeline"]');
      const initialStatuses = await page.$$('[data-testid="status-card"]');
      const initialCount = initialStatuses.length;
      
      // Scroll to bottom
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
      });
      
      // Wait for potential new statuses to load
      await page.waitForTimeout(2000);
      
      const updatedStatuses = await page.$$('[data-testid="status-card"]');
      const updatedCount = updatedStatuses.length;
      
      console.log(`Statuses after scroll: ${initialCount} -> ${updatedCount}`);
      
      // Should have loaded more statuses (or at least not fewer)
      expect(updatedCount).toBeGreaterThanOrEqual(initialCount);
    });

    it('should show authenticated home timeline after login', async () => {
      // Mock authentication for testing
      await page.goto(testConfig.baseURL);
      await authHelper.mockAuthenticate(testAccounts.aron.username);
      
      // Navigate to home timeline
      await page.goto(`${testConfig.baseURL}/home`);
      
      // Wait for timeline to load
      await page.waitForSelector('[data-testid="timeline"]', { timeout: 10000 });
      
      // Check for compose box (only visible when authenticated)
      const composeBox = await page.$('[data-testid="compose-box"]');
      expect(composeBox).toBeTruthy();
      
      // Check for user menu (authenticated state)
      const userMenu = await page.$('[data-testid="user-menu"]');
      expect(userMenu).toBeTruthy();
      
      // Verify timeline loaded
      const statusCards = await page.$$('[data-testid="status-card"]');
      console.log(`Found ${statusCards.length} statuses in home timeline`);
    });

    it('should display user interactions on statuses', async () => {
      await page.goto(`${testConfig.baseURL}/public`);
      await page.waitForSelector('[data-testid="status-card"]');
      
      const firstStatus = await page.$('[data-testid="status-card"]');
      if (!firstStatus) throw new Error('No status found');
      
      // Check for interaction buttons
      const replyButton = await firstStatus.$('[data-testid="reply-button"]');
      const boostButton = await firstStatus.$('[data-testid="boost-button"]');
      const favoriteButton = await firstStatus.$('[data-testid="favorite-button"]');
      
      expect(replyButton).toBeTruthy();
      expect(boostButton).toBeTruthy();
      expect(favoriteButton).toBeTruthy();
      
      // Get interaction counts
      const replyCount = await firstStatus.$('[data-testid="reply-count"]');
      const boostCount = await firstStatus.$('[data-testid="boost-count"]');
      const favoriteCount = await firstStatus.$('[data-testid="favorite-count"]');
      
      if (replyCount) {
        const count = await replyCount.evaluate(el => el.textContent);
        console.log('Reply count:', count);
      }
      if (boostCount) {
        const count = await boostCount.evaluate(el => el.textContent);
        console.log('Boost count:', count);
      }
      if (favoriteCount) {
        const count = await favoriteCount.evaluate(el => el.textContent);
        console.log('Favorite count:', count);
      }
    });

    it('should handle timeline errors gracefully', async () => {
      // Test with invalid instance
      await page.goto(`${testConfig.baseURL}/public?instance=invalid.example.com`);
      
      // Should show error message or fallback
      const errorMessage = await page.$('[data-testid="error-message"]');
      const emptyState = await page.$('[data-testid="empty-timeline"]');
      
      // Either error or empty state should be shown
      expect(errorMessage || emptyState).toBeTruthy();
    });
  });

  describe('Timeline Filters and Search', () => {
    it('should filter timeline by media only', async () => {
      await page.goto(`${testConfig.baseURL}/public`);
      await page.waitForSelector('[data-testid="timeline"]');
      
      // Click media filter if available
      const mediaFilter = await page.$('[data-testid="filter-media"]');
      if (mediaFilter) {
        await mediaFilter.click();
        await page.waitForTimeout(1000);
        
        // Check that all visible statuses have media
        const statusCards = await page.$$('[data-testid="status-card"]');
        for (const status of statusCards) {
          const media = await status.$('[data-testid="status-media"]');
          expect(media).toBeTruthy();
        }
      }
    });

    it('should search for statuses', async () => {
      await page.goto(`${testConfig.baseURL}/search`);
      
      // Type search query
      const searchInput = await page.$('[data-testid="search-input"]');
      if (searchInput) {
        await searchInput.type('test');
        await page.keyboard.press('Enter');
        
        // Wait for results
        await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });
        
        // Check for status results
        const statusResults = await page.$$('[data-testid="search-result-status"]');
        console.log(`Found ${statusResults.length} status results`);
      }
    });
  });
});
