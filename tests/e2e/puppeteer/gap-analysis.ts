#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { puppeteerConfig, testConfig } from './config';

interface TestResult {
  feature: string;
  status: 'working' | 'broken' | 'partial' | 'not-implemented';
  details: string;
  apiCalls?: string[];
  errors?: string[];
}

async function gapAnalysisTest() {
  console.log('🔍 Greater/Lesser Gap Analysis');
  console.log('Testing all core functionality to identify broken features\n');

  const browser = await puppeteer.launch({
    ...puppeteerConfig,
    devtools: true // Open devtools to see network/console errors
  });
  
  const results: TestResult[] = [];
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Track all API calls and errors
    const apiCalls: string[] = [];
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];
    
    // Enable comprehensive logging
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiCalls.push(`${request.method()} ${url}`);
      }
      request.continue();
    });
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('/api/') && response.status() >= 400) {
        networkErrors.push(`${response.status()} ${url}`);
      }
    });
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });

    // First, we need to authenticate
    console.log('--- Setting up authentication ---');
    await page.goto(testConfig.baseURL);
    
    // Mock authentication to bypass OAuth
    await page.evaluate((instance) => {
      // Mock auth data
      localStorage.setItem('auth:instance', instance);
      localStorage.setItem('auth:token', 'mock-token-for-testing');
      localStorage.setItem('auth:account', JSON.stringify({
        id: '1',
        username: 'aron',
        acct: 'aron@lesser.host',
        display_name: 'Aron',
        avatar: 'https://lesser.host/avatars/aron.jpg',
        url: 'https://lesser.host/@aron'
      }));
      
      // Set auth in any global stores
      if ((window as any).authStore) {
        (window as any).authStore.set({
          instance,
          token: 'mock-token-for-testing',
          account: {
            id: '1',
            username: 'aron',
            acct: 'aron@lesser.host'
          }
        });
      }
    }, testConfig.lesserInstance);
    
    // Reload to apply auth
    await page.reload({ waitUntil: 'networkidle2' });
    
    console.log('\n--- Testing Core Features ---\n');
    
    // Test 1: Timeline Loading
    console.log('1. Testing Timeline Loading...');
    apiCalls.length = 0;
    await page.goto(`${testConfig.baseURL}/home`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const timelineTest = await page.evaluate(() => {
      const statuses = document.querySelectorAll('[data-testid="status-card"], article, .status, [class*="status"]');
      return {
        statusCount: statuses.length,
        hasComposeBox: !!document.querySelector('[data-testid="compose-box"], textarea, [placeholder*="What"]'),
        pageTitle: document.title,
        hasError: document.body.innerText.includes('error') || document.body.innerText.includes('Error')
      };
    });
    
    results.push({
      feature: 'Timeline Loading',
      status: timelineTest.statusCount > 0 ? 'working' : 'broken',
      details: `Found ${timelineTest.statusCount} statuses. Compose box: ${timelineTest.hasComposeBox}`,
      apiCalls: apiCalls.filter(call => call.includes('timeline'))
    });
    
    // Test 2: Reply Functionality
    console.log('2. Testing Reply...');
    if (timelineTest.statusCount > 0) {
      const replyResult = await page.evaluate(async () => {
        const firstStatus = document.querySelector('[data-testid="status-card"], article, .status');
        if (!firstStatus) return { error: 'No status found' };
        
        const replyButton = firstStatus.querySelector('[data-testid="reply-button"], [aria-label*="Reply"], button[title*="Reply"], [class*="reply"]');
        if (!replyButton) return { error: 'Reply button not found' };
        
        // Click reply
        (replyButton as HTMLElement).click();
        
        // Wait a bit
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check what happened
        return {
          replyModalOpened: !!document.querySelector('[data-testid="reply-modal"], [role="dialog"], .modal'),
          replyTextareaVisible: !!document.querySelector('[data-testid="reply-textarea"], textarea[placeholder*="Reply"]'),
          urlChanged: window.location.pathname.includes('reply') || window.location.pathname.includes('compose'),
          errors: Array.from(document.querySelectorAll('.error, [class*="error"]')).map(el => el.textContent)
        };
      });
      
      results.push({
        feature: 'Reply Button',
        status: replyResult.replyModalOpened || replyResult.replyTextareaVisible ? 'working' : 'broken',
        details: JSON.stringify(replyResult),
        errors: replyResult.errors
      });
    }
    
    // Test 3: Boost Functionality  
    console.log('3. Testing Boost...');
    apiCalls.length = 0;
    const boostResult = await page.evaluate(async () => {
      const firstStatus = document.querySelector('[data-testid="status-card"], article, .status');
      if (!firstStatus) return { error: 'No status found' };
      
      const boostButton = firstStatus.querySelector('[data-testid="boost-button"], [aria-label*="Boost"], button[title*="Boost"], [class*="boost"], [class*="reblog"]');
      if (!boostButton) return { error: 'Boost button not found' };
      
      const initialClass = boostButton.className;
      const initialAriaPressed = boostButton.getAttribute('aria-pressed');
      
      // Click boost
      (boostButton as HTMLElement).click();
      
      // Wait for potential update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        clicked: true,
        classChanged: boostButton.className !== initialClass,
        ariaPressedChanged: boostButton.getAttribute('aria-pressed') !== initialAriaPressed,
        boosted: boostButton.classList.contains('boosted') || boostButton.getAttribute('aria-pressed') === 'true',
        buttonState: {
          className: boostButton.className,
          ariaPressed: boostButton.getAttribute('aria-pressed'),
          disabled: (boostButton as HTMLButtonElement).disabled
        }
      };
    });
    
    results.push({
      feature: 'Boost Button',
      status: boostResult.boosted ? 'working' : 'broken',
      details: JSON.stringify(boostResult),
      apiCalls: apiCalls.filter(call => call.includes('reblog') || call.includes('boost'))
    });
    
    // Test 4: Favorite Functionality
    console.log('4. Testing Favorite...');
    apiCalls.length = 0;
    const favoriteResult = await page.evaluate(async () => {
      const firstStatus = document.querySelector('[data-testid="status-card"], article, .status');
      if (!firstStatus) return { error: 'No status found' };
      
      const favButton = firstStatus.querySelector('[data-testid="favorite-button"], [aria-label*="Favorite"], [aria-label*="Like"], button[title*="Favorite"], [class*="favorite"], [class*="like"]');
      if (!favButton) return { error: 'Favorite button not found' };
      
      const initialClass = favButton.className;
      const initialAriaPressed = favButton.getAttribute('aria-pressed');
      
      // Click favorite
      (favButton as HTMLElement).click();
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        clicked: true,
        classChanged: favButton.className !== initialClass,
        ariaPressedChanged: favButton.getAttribute('aria-pressed') !== initialAriaPressed,
        favorited: favButton.classList.contains('favorited') || favButton.classList.contains('liked') || favButton.getAttribute('aria-pressed') === 'true',
        buttonState: {
          className: favButton.className,
          ariaPressed: favButton.getAttribute('aria-pressed')
        }
      };
    });
    
    results.push({
      feature: 'Favorite Button',
      status: favoriteResult.favorited ? 'working' : 'broken',
      details: JSON.stringify(favoriteResult),
      apiCalls: apiCalls.filter(call => call.includes('favourite') || call.includes('favorite'))
    });
    
    // Test 5: Bookmark Functionality
    console.log('5. Testing Bookmark...');
    apiCalls.length = 0;
    const bookmarkResult = await page.evaluate(async () => {
      const firstStatus = document.querySelector('[data-testid="status-card"], article, .status');
      if (!firstStatus) return { error: 'No status found' };
      
      const bookmarkButton = firstStatus.querySelector('[data-testid="bookmark-button"], [aria-label*="Bookmark"], button[title*="Bookmark"], [class*="bookmark"]');
      if (!bookmarkButton) return { error: 'Bookmark button not found' };
      
      const initialClass = bookmarkButton.className;
      
      // Click bookmark
      (bookmarkButton as HTMLElement).click();
      
      // Wait for update
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        clicked: true,
        classChanged: bookmarkButton.className !== initialClass,
        bookmarked: bookmarkButton.classList.contains('bookmarked') || bookmarkButton.getAttribute('aria-pressed') === 'true'
      };
    });
    
    results.push({
      feature: 'Bookmark Button',
      status: bookmarkResult.bookmarked ? 'working' : 'broken',
      details: JSON.stringify(bookmarkResult),
      apiCalls: apiCalls.filter(call => call.includes('bookmark'))
    });
    
    // Test 6: Profile Pages
    console.log('6. Testing Profile Pages...');
    apiCalls.length = 0;
    await page.goto(`${testConfig.baseURL}/@aron@lesser.host`, { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);
    
    const profileResult = await page.evaluate(() => {
      return {
        hasAvatar: !!document.querySelector('[data-testid="profile-avatar"], img[alt*="avatar"], .avatar'),
        hasDisplayName: !!document.querySelector('[data-testid="profile-display-name"], .display-name'),
        hasUsername: !!document.querySelector('[data-testid="profile-username"], .username'),
        hasBio: !!document.querySelector('[data-testid="profile-bio"], .bio, .note'),
        hasStats: !!document.querySelector('[data-testid="followers-count"], .followers-count'),
        hasFollowButton: !!document.querySelector('[data-testid="follow-button"], button[class*="follow"]'),
        hasTimeline: document.querySelectorAll('[data-testid="status-card"], article, .status').length > 0,
        profileText: document.body.innerText.substring(0, 200)
      };
    });
    
    results.push({
      feature: 'Profile Display',
      status: profileResult.hasDisplayName && profileResult.hasUsername ? 'partial' : 'broken',
      details: `Avatar: ${profileResult.hasAvatar}, Name: ${profileResult.hasDisplayName}, Bio: ${profileResult.hasBio}, Stats: ${profileResult.hasStats}, Timeline: ${profileResult.hasTimeline}`,
      apiCalls: apiCalls.filter(call => call.includes('accounts'))
    });
    
    // Test 7: Follow/Unfollow
    console.log('7. Testing Follow/Unfollow...');
    if (profileResult.hasFollowButton) {
      apiCalls.length = 0;
      const followResult = await page.evaluate(async () => {
        const followButton = document.querySelector('[data-testid="follow-button"], button[class*="follow"]') as HTMLButtonElement;
        if (!followButton) return { error: 'Follow button not found' };
        
        const initialText = followButton.textContent;
        const initialClass = followButton.className;
        
        // Click follow
        followButton.click();
        
        // Wait for update
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        return {
          clicked: true,
          textChanged: followButton.textContent !== initialText,
          classChanged: followButton.className !== initialClass,
          newText: followButton.textContent,
          disabled: followButton.disabled
        };
      });
      
      results.push({
        feature: 'Follow Button',
        status: followResult.textChanged ? 'working' : 'broken',
        details: JSON.stringify(followResult),
        apiCalls: apiCalls.filter(call => call.includes('follow'))
      });
    }
    
    // Test 8: Posting
    console.log('8. Testing Post Creation...');
    await page.goto(`${testConfig.baseURL}/home`, { waitUntil: 'networkidle2' });
    apiCalls.length = 0;
    
    const postResult = await page.evaluate(async () => {
      const composeBox = document.querySelector('[data-testid="compose-box"] textarea, textarea[placeholder*="What"], .compose-form textarea') as HTMLTextAreaElement;
      if (!composeBox) return { error: 'Compose box not found' };
      
      // Type test content
      composeBox.value = 'Test post from Puppeteer gap analysis';
      composeBox.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Find post button
      const postButton = document.querySelector('[data-testid="post-button"], button[type="submit"], button:has-text("Post"), button:has-text("Publish")') as HTMLButtonElement;
      if (!postButton) return { error: 'Post button not found' };
      
      const wasDisabled = postButton.disabled;
      
      // Click post
      postButton.click();
      
      // Wait for response
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      return {
        composeBoxCleared: composeBox.value === '',
        buttonWasDisabled: wasDisabled,
        currentUrl: window.location.pathname,
        hasNewStatus: document.body.innerText.includes('Test post from Puppeteer')
      };
    });
    
    results.push({
      feature: 'Post Creation',
      status: postResult.composeBoxCleared || postResult.hasNewStatus ? 'working' : 'broken',
      details: JSON.stringify(postResult),
      apiCalls: apiCalls.filter(call => call.includes('statuses') && call.includes('POST'))
    });
    
    // Test 9: Search
    console.log('9. Testing Search...');
    apiCalls.length = 0;
    const searchBox = await page.$('input[placeholder*="Search"], [data-testid="search-input"]');
    if (searchBox) {
      await searchBox.type('test');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(2000);
      
      const searchResult = await page.evaluate(() => {
        return {
          hasResults: !!document.querySelector('[data-testid="search-results"], .search-results'),
          resultCount: document.querySelectorAll('[data-testid="search-result"], .search-result').length,
          currentUrl: window.location.pathname
        };
      });
      
      results.push({
        feature: 'Search',
        status: searchResult.hasResults ? 'working' : 'broken',
        details: `Results found: ${searchResult.resultCount}`,
        apiCalls: apiCalls.filter(call => call.includes('search'))
      });
    }
    
    // Save diagnostic screenshot
    await page.screenshot({ path: 'gap-analysis-final.png', fullPage: true });
    
    console.log('\n--- GAP ANALYSIS RESULTS ---\n');
    
    // Summary
    const working = results.filter(r => r.status === 'working').length;
    const broken = results.filter(r => r.status === 'broken').length;
    const partial = results.filter(r => r.status === 'partial').length;
    
    console.log(`✅ Working: ${working}`);
    console.log(`❌ Broken: ${broken}`);
    console.log(`⚠️  Partial: ${partial}`);
    console.log('\nDetailed Results:');
    
    results.forEach(result => {
      const icon = result.status === 'working' ? '✅' : result.status === 'partial' ? '⚠️' : '❌';
      console.log(`\n${icon} ${result.feature}: ${result.status.toUpperCase()}`);
      console.log(`   Details: ${result.details}`);
      if (result.apiCalls && result.apiCalls.length > 0) {
        console.log(`   API Calls: ${result.apiCalls.join(', ')}`);
      }
      if (result.errors && result.errors.length > 0) {
        console.log(`   Errors: ${result.errors.join(', ')}`);
      }
    });
    
    if (consoleErrors.length > 0) {
      console.log('\n🚨 Console Errors:');
      consoleErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (networkErrors.length > 0) {
      console.log('\n🚨 Network Errors:');
      networkErrors.forEach(error => console.log(`   - ${error}`));
    }
    
    // Create markdown report
    const report = `# Greater/Lesser Gap Analysis Report

Generated: ${new Date().toISOString()}

## Summary
- ✅ Working: ${working}
- ❌ Broken: ${broken}  
- ⚠️  Partial: ${partial}

## Feature Status

${results.map(r => {
  const icon = r.status === 'working' ? '✅' : r.status === 'partial' ? '⚠️' : '❌';
  return `### ${icon} ${r.feature}
**Status**: ${r.status}
**Details**: ${r.details}
${r.apiCalls?.length ? `**API Calls**: ${r.apiCalls.join(', ')}` : ''}
${r.errors?.length ? `**Errors**: ${r.errors.join(', ')}` : ''}
`;
}).join('\n')}

## Console Errors
${consoleErrors.length > 0 ? consoleErrors.map(e => `- ${e}`).join('\n') : 'None'}

## Network Errors  
${networkErrors.length > 0 ? networkErrors.map(e => `- ${e}`).join('\n') : 'None'}
`;
    
    await page.evaluate((reportContent) => {
      const fs = require('fs');
      fs.writeFileSync('gap-analysis-report.md', reportContent);
    }, report).catch(() => {
      // If we can't write from browser, write from Node
      const fs = require('fs');
      fs.writeFileSync('gap-analysis-report.md', report);
    });
    
    console.log('\n📄 Full report saved to gap-analysis-report.md');
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
  } finally {
    console.log('\nPress Ctrl+C to close the browser and exit.');
    // Keep browser open for inspection
    await new Promise(() => {}); // Wait indefinitely
  }
}

gapAnalysisTest().catch(console.error);