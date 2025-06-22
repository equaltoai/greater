#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { puppeteerConfig, testConfig } from './config';

async function verifyBug() {
  console.log('🐛 Verifying the Greater/Lesser Integration Bug\n');

  const browser = await puppeteer.launch({
    ...puppeteerConfig,
    headless: false, // Need to see what's happening
    devtools: true  // Open DevTools
  });
  
  try {
    const page = await browser.newPage();
    
    // Inject logging to verify the bug
    await page.evaluateOnNewDocument(() => {
      // Override fetch to log all API calls
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        console.log('🔴 FETCH INTERCEPTED:', args[0], args[1]);
        if (typeof args[0] === 'string' && args[0].includes('/api/v1/')) {
          console.log('API Call to:', args[0]);
          console.log('Headers:', args[1]?.headers);
        }
        return originalFetch(...args);
      };
      
      // Log localStorage state
      console.log('📦 LocalStorage auth:', {
        instance: localStorage.getItem('auth:instance'),
        hasToken: !!localStorage.getItem('auth:token'),
        account: localStorage.getItem('auth:account')
      });
    });
    
    console.log('1. Navigate to Greater...');
    await page.goto(testConfig.baseURL);
    
    // Mock auth to bypass login
    console.log('2. Setting up mock authentication for lesser.host...');
    await page.evaluate(() => {
      localStorage.setItem('auth:instance', 'lesser.host');
      localStorage.setItem('auth:token', 'mock-test-token');
      localStorage.setItem('auth:account', JSON.stringify({
        id: '1',
        username: 'aron',
        acct: 'aron@lesser.host'
      }));
      
      // Also set the default instance (this might be the issue!)
      localStorage.setItem('instance', 'mastodon.social'); // BUG: Wrong default!
    });
    
    console.log('3. Navigate to home timeline...');
    await page.goto(`${testConfig.baseURL}/home`);
    await page.waitForTimeout(3000);
    
    console.log('4. Check what instance the API client is using...');
    const clientState = await page.evaluate(() => {
      // Try to access the client's instance
      const stored = {
        authInstance: localStorage.getItem('auth:instance'),
        defaultInstance: localStorage.getItem('instance'),
        currentUrl: window.location.href
      };
      
      // Check if we can access any global stores
      if ((window as any).authStore) {
        stored['authStore'] = (window as any).authStore.currentInstance;
      }
      
      return stored;
    });
    
    console.log('Client state:', clientState);
    
    console.log('\n5. Try clicking favorite button and watch the console...');
    console.log('   Check DevTools console for:');
    console.log('   - Which instance URL is used in the API call');
    console.log('   - Whether it matches lesser.host or uses mastodon.social');
    
    // Find and click a favorite button
    const favoriteButton = await page.$('[data-testid="favorite-button"], [aria-label*="Favorite"], button[class*="favorite"]');
    if (favoriteButton) {
      console.log('\n6. Clicking favorite button now...');
      await favoriteButton.click();
      await page.waitForTimeout(2000);
      
      console.log('\n🔍 CHECK THE DEVTOOLS CONSOLE!');
      console.log('If the API call goes to mastodon.social instead of lesser.host,');
      console.log('then we\'ve confirmed the bug!');
    } else {
      console.log('❌ No favorite button found - may need to wait for timeline to load');
    }
    
    console.log('\n--- THE BUG ---');
    console.log('In timeline.svelte.ts:');
    console.log('❌ WRONG: const client = getClient(); // Uses wrong instance');
    console.log('✅ RIGHT: const client = getClient(authStore.currentInstance || undefined);');
    
    console.log('\n--- THE FIX ---');
    console.log('Update all these methods in timeline.svelte.ts to pass the instance:');
    console.log('- favoriteStatus (line 297)');
    console.log('- unfavoriteStatus (line 326)');
    console.log('- reblogStatus (line 354)');
    console.log('- unreblogStatus (line 384)');
    console.log('- bookmarkStatus (line 413)');
    console.log('- unbookmarkStatus (line 429)');
    
    console.log('\nPress Ctrl+C to close when done checking...');
    
    // Keep browser open
    await new Promise(() => {});
    
  } catch (error) {
    console.error('Error:', error);
  }
}

verifyBug().catch(console.error);