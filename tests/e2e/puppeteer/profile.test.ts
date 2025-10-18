import puppeteer, { Browser, Page } from 'puppeteer';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { puppeteerConfig, testConfig, testAccounts } from './config';
import { AuthHelper } from './helpers/auth';

// TODO: Requires a running Greater instance; skip until we can provision one in CI.
describe.skip('Profile and Posting Tests', () => {
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
  });

  describe('Profile Pages', () => {
    it('should display user profile', async () => {
      // Navigate to aron's profile
      await page.goto(`${testConfig.baseURL}/@aron@lesser.host`);
      
      // Wait for profile to load
      await page.waitForSelector('[data-testid="profile-header"]', { timeout: 10000 });
      
      // Check profile elements
      const displayName = await page.$('[data-testid="profile-display-name"]');
      const username = await page.$('[data-testid="profile-username"]');
      const bio = await page.$('[data-testid="profile-bio"]');
      const avatar = await page.$('[data-testid="profile-avatar"]');
      
      expect(displayName).toBeTruthy();
      expect(username).toBeTruthy();
      expect(avatar).toBeTruthy();
      
      // Get profile info
      const displayNameText = await displayName?.evaluate(el => el.textContent);
      const usernameText = await username?.evaluate(el => el.textContent);
      
      console.log('Profile info:', { displayName: displayNameText, username: usernameText });
      expect(usernameText).toContain('aron@lesser.host');
    });

    it('should show user statistics', async () => {
      await page.goto(`${testConfig.baseURL}/@aron@lesser.host`);
      await page.waitForSelector('[data-testid="profile-header"]');
      
      // Check for stats
      const followersCount = await page.$('[data-testid="followers-count"]');
      const followingCount = await page.$('[data-testid="following-count"]');
      const statusesCount = await page.$('[data-testid="statuses-count"]');
      
      expect(followersCount).toBeTruthy();
      expect(followingCount).toBeTruthy();
      expect(statusesCount).toBeTruthy();
      
      // Log stats
      const followers = await followersCount?.evaluate(el => el.textContent);
      const following = await followingCount?.evaluate(el => el.textContent);
      const statuses = await statusesCount?.evaluate(el => el.textContent);
      
      console.log('Profile stats:', { followers, following, statuses });
    });

    it('should display user timeline on profile', async () => {
      await page.goto(`${testConfig.baseURL}/@aron@lesser.host`);
      await page.waitForSelector('[data-testid="profile-timeline"]');
      
      // Check for user's statuses
      const statusCards = await page.$$('[data-testid="status-card"]');
      console.log(`Found ${statusCards.length} statuses on profile`);
      
      // Verify statuses are from the correct user
      if (statusCards.length > 0) {
        const firstStatus = statusCards[0];
        const author = await firstStatus.$('[data-testid="status-author"]');
        const authorText = await author?.evaluate(el => el.textContent);
        
        expect(authorText).toContain('aron');
      }
    });

    it('should allow following/unfollowing when authenticated', async () => {
      // Mock auth as aron2
      await page.goto(testConfig.baseURL);
      await authHelper.mockAuthenticate(testAccounts.aron2.username);
      
      // Navigate to aron's profile
      await page.goto(`${testConfig.baseURL}/@aron@lesser.host`);
      await page.waitForSelector('[data-testid="profile-header"]');
      
      // Check for follow button
      const followButton = await page.$('[data-testid="follow-button"]');
      expect(followButton).toBeTruthy();
      
      // Get initial button state
      const initialText = await followButton?.evaluate(el => el.textContent);
      console.log('Follow button text:', initialText);
      
      // Click follow/unfollow
      if (followButton) {
        await followButton.click();
        await page.waitForTimeout(1000);
        
        // Check button state changed
        const updatedText = await followButton.evaluate(el => el.textContent);
        expect(updatedText).not.toBe(initialText);
      }
    });
  });

  describe('Posting Functionality', () => {
    beforeEach(async () => {
      // Authenticate before posting tests
      await page.goto(testConfig.baseURL);
      await authHelper.mockAuthenticate(testAccounts.aron.username);
    });

    it('should show compose box when authenticated', async () => {
      await page.goto(`${testConfig.baseURL}/home`);
      
      const composeBox = await page.$('[data-testid="compose-box"]');
      expect(composeBox).toBeTruthy();
      
      // Check compose elements
      const textArea = await composeBox?.$('textarea');
      const postButton = await composeBox?.$('[data-testid="post-button"]');
      const charCounter = await composeBox?.$('[data-testid="char-counter"]');
      
      expect(textArea).toBeTruthy();
      expect(postButton).toBeTruthy();
      expect(charCounter).toBeTruthy();
    });

    it('should create a new post', async () => {
      await page.goto(`${testConfig.baseURL}/home`);
      await page.waitForSelector('[data-testid="compose-box"]');
      
      // Type a test post
      const textArea = await page.$('[data-testid="compose-box"] textarea');
      if (!textArea) throw new Error('Compose textarea not found');
      
      const testContent = `Test post from Puppeteer at ${new Date().toISOString()}`;
      await textArea.click();
      await textArea.type(testContent);
      
      // Check character counter updated
      const charCounter = await page.$('[data-testid="char-counter"]');
      const charCount = await charCounter?.evaluate(el => el.textContent);
      console.log('Character count:', charCount);
      
      // Submit post
      const postButton = await page.$('[data-testid="post-button"]');
      await postButton?.click();
      
      // Wait for post to appear in timeline
      await page.waitForTimeout(2000);
      
      // Check if post appeared
      const latestStatus = await page.$('[data-testid="status-card"]:first-child');
      if (latestStatus) {
        const content = await latestStatus.$('[data-testid="status-content"]');
        const contentText = await content?.evaluate(el => el.textContent);
        
        console.log('Latest post content:', contentText);
        expect(contentText).toContain('Test post from Puppeteer');
      }
    });

    it('should handle post visibility options', async () => {
      await page.goto(`${testConfig.baseURL}/home`);
      await page.waitForSelector('[data-testid="compose-box"]');
      
      // Check for visibility selector
      const visibilityButton = await page.$('[data-testid="visibility-button"]');
      expect(visibilityButton).toBeTruthy();
      
      if (visibilityButton) {
        await visibilityButton.click();
        
        // Check visibility options
        const publicOption = await page.$('[data-testid="visibility-public"]');
        const unlistedOption = await page.$('[data-testid="visibility-unlisted"]');
        const followersOption = await page.$('[data-testid="visibility-followers"]');
        
        expect(publicOption).toBeTruthy();
        expect(unlistedOption).toBeTruthy();
        expect(followersOption).toBeTruthy();
      }
    });

    it('should support content warnings', async () => {
      await page.goto(`${testConfig.baseURL}/home`);
      await page.waitForSelector('[data-testid="compose-box"]');
      
      // Toggle CW
      const cwButton = await page.$('[data-testid="cw-button"]');
      if (cwButton) {
        await cwButton.click();
        
        // Check for CW input
        const cwInput = await page.$('[data-testid="cw-input"]');
        expect(cwInput).toBeTruthy();
        
        if (cwInput) {
          await cwInput.type('Test content warning');
        }
      }
    });

    it('should handle reply to status', async () => {
      await page.goto(`${testConfig.baseURL}/public`);
      await page.waitForSelector('[data-testid="status-card"]');
      
      // Click reply on first status
      const firstStatus = await page.$('[data-testid="status-card"]');
      const replyButton = await firstStatus?.$('[data-testid="reply-button"]');
      
      if (replyButton) {
        await replyButton.click();
        
        // Check reply interface
        const replyCompose = await page.$('[data-testid="reply-compose"]');
        expect(replyCompose).toBeTruthy();
        
        // Check that it shows replying to
        const replyingTo = await page.$('[data-testid="replying-to"]');
        expect(replyingTo).toBeTruthy();
      }
    });

    it('should handle boost/favorite interactions', async () => {
      await page.goto(`${testConfig.baseURL}/home`);
      await page.waitForSelector('[data-testid="status-card"]');
      
      const firstStatus = await page.$('[data-testid="status-card"]');
      
      // Test favorite
      const favoriteButton = await firstStatus?.$('[data-testid="favorite-button"]');
      const initialFavCount = await firstStatus?.$('[data-testid="favorite-count"]');
      const initialCount = await initialFavCount?.evaluate(el => el.textContent || '0');
      
      if (favoriteButton) {
        await favoriteButton.click();
        await page.waitForTimeout(1000);
        
        // Check if favorited
        const isFavorited = await favoriteButton.evaluate(el => 
          el.classList.contains('favorited') || el.getAttribute('data-favorited') === 'true'
        );
        expect(isFavorited).toBe(true);
      }
      
      // Test boost
      const boostButton = await firstStatus?.$('[data-testid="boost-button"]');
      if (boostButton) {
        await boostButton.click();
        await page.waitForTimeout(1000);
        
        // Check if boosted
        const isBoosted = await boostButton.evaluate(el => 
          el.classList.contains('boosted') || el.getAttribute('data-boosted') === 'true'
        );
        expect(isBoosted).toBe(true);
      }
    });
  });

  describe('Profile Editing', () => {
    beforeEach(async () => {
      await page.goto(testConfig.baseURL);
      await authHelper.mockAuthenticate(testAccounts.aron.username);
    });

    it('should allow editing own profile', async () => {
      // Navigate to own profile
      await page.goto(`${testConfig.baseURL}/@aron@lesser.host`);
      await page.waitForSelector('[data-testid="profile-header"]');
      
      // Look for edit profile button
      const editButton = await page.$('[data-testid="edit-profile-button"]');
      expect(editButton).toBeTruthy();
      
      if (editButton) {
        await editButton.click();
        
        // Check for edit form
        await page.waitForSelector('[data-testid="profile-edit-form"]');
        
        const displayNameInput = await page.$('[data-testid="edit-display-name"]');
        const bioTextarea = await page.$('[data-testid="edit-bio"]');
        const saveButton = await page.$('[data-testid="save-profile-button"]');
        
        expect(displayNameInput).toBeTruthy();
        expect(bioTextarea).toBeTruthy();
        expect(saveButton).toBeTruthy();
      }
    });
  });
});
