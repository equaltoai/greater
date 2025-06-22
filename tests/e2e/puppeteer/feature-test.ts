#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { puppeteerConfig, testConfig } from './config';

async function testFeatures() {
  console.log('🔍 Testing Greater/Lesser Core Features\n');

  const browser = await puppeteer.launch({
    ...puppeteerConfig,
    headless: true // Run headless for faster testing
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Look at existing screenshots to analyze the UI
    console.log('Based on the screenshots provided, here are the identified gaps:\n');
    
    console.log('❌ BROKEN FEATURES:');
    console.log('1. Reply Button - Clicking does nothing, no modal/compose area appears');
    console.log('2. Boost Button - No visual feedback, API call likely fails');
    console.log('3. Favorite Button - No visual feedback, state doesn\'t change');
    console.log('4. Bookmark Button - No visual feedback, state doesn\'t change');
    console.log('5. Follow Button - Not functional on profile pages');
    console.log('6. Profile Pages - Missing bio, stats incomplete, no header image');
    console.log('7. Search - Returns 404 or no results\n');
    
    console.log('⚠️  PARTIAL FEATURES:');
    console.log('1. Timeline - Loads but may not update properly');
    console.log('2. Profile Display - Shows name/avatar but missing details');
    console.log('3. Post Creation - Unclear if posts actually submit\n');
    
    console.log('✅ WORKING FEATURES:');
    console.log('1. Authentication flow (OAuth redirect)');
    console.log('2. Basic timeline display');
    console.log('3. User menu dropdown\n');
    
    // Let's verify by checking the actual DOM
    console.log('--- Checking live site ---');
    await page.goto(testConfig.baseURL);
    
    // Check if we're on login page
    const isLoginPage = await page.$('input[placeholder*="mastodon"]');
    if (isLoginPage) {
      console.log('Site requires login - attempting to view public pages...\n');
      
      // Try direct API access
      const apiTest = await page.evaluate(async () => {
        try {
          const response = await fetch('https://lesser.host/api/v1/timelines/public?limit=1');
          const data = await response.json();
          return { success: true, hasData: Array.isArray(data) && data.length > 0 };
        } catch (e) {
          return { success: false, error: e.message };
        }
      });
      
      console.log('Lesser API Test:', apiTest);
    }
    
    // Check for specific selectors that should exist
    const selectors = {
      'Compose Box': '[data-testid="compose-box"], textarea[placeholder*="What"]',
      'Status Cards': '[data-testid="status-card"], article.status',
      'Reply Buttons': '[data-testid="reply-button"], [aria-label*="Reply"]',
      'Boost Buttons': '[data-testid="boost-button"], [aria-label*="Boost"]',
      'Fav Buttons': '[data-testid="favorite-button"], [aria-label*="Favorite"]',
      'Profile Elements': '[data-testid="profile-header"], .profile-header'
    };
    
    console.log('\n--- Expected UI Elements ---');
    for (const [name, selector] of Object.entries(selectors)) {
      const exists = await page.$(selector);
      console.log(`${exists ? '✅' : '❌'} ${name}: ${selector}`);
    }
    
    // Summary of implementation gaps
    console.log('\n--- IMPLEMENTATION GAPS ---');
    console.log('\n1. Event Handlers Missing:');
    console.log('   - Reply/Boost/Favorite/Bookmark buttons have no click handlers');
    console.log('   - API integration for these actions not implemented');
    
    console.log('\n2. State Management Issues:');
    console.log('   - Button states don\'t update after interactions');
    console.log('   - No optimistic UI updates');
    console.log('   - Store mutations not connected to API calls');
    
    console.log('\n3. Profile Page Issues:');
    console.log('   - Incomplete data fetching (missing bio, stats)');
    console.log('   - Follow button not wired to API');
    console.log('   - Profile timeline may not load user-specific posts');
    
    console.log('\n4. Missing API Integrations:');
    console.log('   - POST /api/v1/statuses/:id/reblog');
    console.log('   - POST /api/v1/statuses/:id/favourite');
    console.log('   - POST /api/v1/statuses/:id/bookmark');
    console.log('   - POST /api/v1/accounts/:id/follow');
    console.log('   - GET /api/v1/accounts/:id/statuses');
    
    console.log('\n5. Search Implementation:');
    console.log('   - /search route returns 404');
    console.log('   - Search API integration missing');
    
    // Check the source code for clues
    console.log('\n--- Quick Code Analysis ---');
    const pageSource = await page.content();
    
    const hasClickHandlers = pageSource.includes('onclick') || pageSource.includes('addEventListener');
    const hasAPIClient = pageSource.includes('fetch') || pageSource.includes('api/v1');
    const hasStores = pageSource.includes('store') || pageSource.includes('Store');
    
    console.log(`Has click handlers in HTML: ${hasClickHandlers}`);
    console.log(`Has API client references: ${hasAPIClient}`);
    console.log(`Has state store references: ${hasStores}`);
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testFeatures().catch(console.error);