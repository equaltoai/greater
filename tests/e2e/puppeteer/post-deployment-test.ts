#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { puppeteerConfig } from './config';

async function postDeploymentTest() {
  console.log('🧪 Post-Deployment Test for Greater/Lesser Integration');
  console.log('Testing: https://dev.greater.website\n');

  const browser = await puppeteer.launch({
    ...puppeteerConfig,
    headless: false,
    devtools: true
  });
  
  const results = {
    working: [] as string[],
    broken: [] as string[],
    errors: [] as { feature: string, error: string }[]
  };
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Capture console logs and errors
    const consoleLogs: string[] = [];
    const networkErrors: string[] = [];
    
    page.on('console', (msg) => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error' && !text.includes('ERR_BLOCKED_BY_CLIENT')) {
        results.errors.push({ feature: 'Console', error: text });
      }
    });
    
    page.on('response', (response) => {
      if (response.status() >= 400 && response.url().includes('lesser.host')) {
        const error = `${response.status()} ${response.url()}`;
        networkErrors.push(error);
        results.errors.push({ 
          feature: 'API Call', 
          error: error 
        });
      }
    });

    console.log('--- Test 1: Login and Authentication ---');
    await page.goto('https://dev.greater.website');
    
    // Enter instance
    const instanceInput = await page.waitForSelector('input[placeholder*="mastodon.social"]');
    await instanceInput?.click({ clickCount: 3 });
    await instanceInput?.type('lesser.host');
    
    const continueButton = await page.$('button');
    await continueButton?.click();
    
    // Wait for OAuth redirect or error
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});
    
    const currentUrl = page.url();
    if (currentUrl.includes('oauth') || currentUrl.includes('auth')) {
      console.log('✅ OAuth flow initiated correctly');
      results.working.push('OAuth authentication flow');
      
      // For testing, let's mock the auth
      await page.goto('https://dev.greater.website');
      await page.evaluate(() => {
        localStorage.setItem('auth:instance', 'lesser.host');
        localStorage.setItem('auth:token', 'test-token');
        localStorage.setItem('auth:account', JSON.stringify({
          id: 'https://lesser.host/users/aron',
          username: 'aron',
          acct: 'aron@lesser.host',
          display_name: 'Aron',
          avatar: 'https://media.lesser.host/media/aron/avatar/1750535109827305771.jpg'
        }));
      });
      
      console.log('✅ Mock authentication set');
    }
    
    console.log('\n--- Test 2: Home Timeline ---');
    await page.goto('https://dev.greater.website/home');
    await page.waitForTimeout(3000);
    
    // Check if timeline loads
    const timelineElement = await page.$('[class*="timeline"], [data-testid="timeline"], main');
    if (timelineElement) {
      const statuses = await page.$$('article, [class*="status"], [data-testid="status-card"]');
      console.log(`✅ Timeline loaded with ${statuses.length} statuses`);
      results.working.push(`Timeline display (${statuses.length} statuses)`);
      
      if (statuses.length > 0) {
        // Test interactions on first status
        console.log('\n--- Test 3: Status Interactions ---');
        
        // Test favorite
        const favButton = await statuses[0].$('button[aria-label*="Favorite"], button[title*="Favorite"], [class*="favorite"] button');
        if (favButton) {
          console.log('Clicking favorite button...');
          await favButton.click();
          await page.waitForTimeout(2000);
          
          // Check if any network error occurred
          const favError = networkErrors.find(e => e.includes('favourite'));
          if (favError) {
            console.log(`❌ Favorite failed: ${favError}`);
            results.broken.push('Favorite button');
          } else {
            console.log('✅ Favorite button clicked (check network tab for result)');
            results.working.push('Favorite button click');
          }
        }
        
        // Test boost
        const boostButton = await statuses[0].$('button[aria-label*="Boost"], button[title*="Boost"], [class*="boost"] button');
        if (boostButton) {
          console.log('Clicking boost button...');
          await boostButton.click();
          await page.waitForTimeout(2000);
          
          const boostError = networkErrors.find(e => e.includes('reblog'));
          if (boostError) {
            console.log(`❌ Boost failed: ${boostError}`);
            results.broken.push('Boost button');
          } else {
            console.log('✅ Boost button clicked');
            results.working.push('Boost button click');
          }
        }
      }
    } else {
      console.log('❌ Timeline not found');
      results.broken.push('Timeline loading');
    }
    
    console.log('\n--- Test 4: Profile Page ---');
    await page.goto('https://dev.greater.website/@aron2@lesser.host');
    await page.waitForTimeout(3000);
    
    // Check profile elements
    const profileName = await page.$('[class*="display-name"], [data-testid="profile-display-name"]');
    const profileUsername = await page.$('[class*="username"], [data-testid="profile-username"]');
    const followButton = await page.$('button:has-text("Follow"), button[class*="follow"]');
    
    if (profileName && profileUsername) {
      console.log('✅ Profile page loaded');
      results.working.push('Profile page display');
      
      // Get displayed text
      const name = await profileName.evaluate(el => el.textContent);
      const username = await profileUsername.evaluate(el => el.textContent);
      console.log(`   Name: ${name}`);
      console.log(`   Username: ${username}`);
      
      if (followButton) {
        console.log('Clicking follow button...');
        await followButton.click();
        await page.waitForTimeout(2000);
        
        const followError = networkErrors.find(e => e.includes('follow'));
        if (followError) {
          console.log(`❌ Follow failed: ${followError}`);
          results.broken.push('Follow button');
        } else {
          console.log('✅ Follow button clicked');
          results.working.push('Follow button click');
        }
      }
    } else {
      console.log('❌ Profile page not loaded properly');
      results.broken.push('Profile page loading');
    }
    
    console.log('\n--- Test 5: Compose Box ---');
    await page.goto('https://dev.greater.website/compose');
    await page.waitForTimeout(2000);
    
    const composeTextarea = await page.$('textarea[placeholder*="What"], [data-testid="compose-textarea"]');
    if (composeTextarea) {
      console.log('✅ Compose box found');
      results.working.push('Compose box display');
      
      // Try quote boost button
      const quoteButton = await page.$('button[aria-label*="Quote"], [title*="Quote"]');
      if (quoteButton) {
        console.log('Clicking quote boost...');
        await quoteButton.click();
        await page.waitForTimeout(1000);
        
        const quoteError = networkErrors.find(e => e.includes('reblog') && e.includes('//'));
        if (quoteError) {
          console.log('❌ Quote boost has empty status ID issue');
          results.broken.push('Quote boost (empty status ID)');
        }
      }
    } else {
      console.log('❌ Compose box not found');
      results.broken.push('Compose box');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'post-deployment-test.png', fullPage: true });
    
    console.log('\n=== TEST SUMMARY ===\n');
    
    console.log('✅ WORKING FEATURES:');
    results.working.forEach(f => console.log(`   - ${f}`));
    
    console.log('\n❌ BROKEN FEATURES:');
    results.broken.forEach(f => console.log(`   - ${f}`));
    
    console.log('\n🚨 ERRORS DETECTED:');
    results.errors.forEach(e => console.log(`   - ${e.feature}: ${e.error}`));
    
    console.log('\n📊 API CALLS OBSERVED:');
    const apiCalls = consoleLogs.filter(log => log.includes('lesser.host/api'));
    apiCalls.slice(0, 10).forEach(call => console.log(`   ${call}`));
    
    // Generate report
    const report = `# Greater/Lesser Post-Deployment Test Report

Generated: ${new Date().toISOString()}

## Summary
- ✅ Working: ${results.working.length} features
- ❌ Broken: ${results.broken.length} features
- 🚨 Errors: ${results.errors.length} errors

## Working Features
${results.working.map(f => `- ${f}`).join('\n')}

## Broken Features
${results.broken.map(f => `- ${f}`).join('\n')}

## Errors Detected
${results.errors.map(e => `### ${e.feature}\n\`\`\`\n${e.error}\n\`\`\``).join('\n\n')}

## Key Issues Found

1. **Account ID Format Mismatch**
   - Follow API uses numeric ID: \`495433748435615\`
   - Lesser expects: \`https://lesser.host/users/aron2\`
   
2. **Quote Boost Empty Status ID**
   - API call: \`/api/v1/statuses//reblog\` (double slash)
   - Missing status ID parameter

3. **Schema Validation Warnings**
   - API responses don't match expected Mastodon schema
   - Data still works but shows validation warnings

## Console Logs Sample
\`\`\`
${consoleLogs.slice(-20).join('\n')}
\`\`\`

## Recommendations
1. Fix account ID handling to use Lesser's URL-based IDs
2. Fix quote boost to pass proper status ID
3. Update schema validation to handle Lesser's response format
`;

    require('fs').writeFileSync('post-deployment-report.md', report);
    console.log('\n📄 Full report saved to post-deployment-report.md');
    
    console.log('\nPress Ctrl+C to close browser...');
    await new Promise(() => {}); // Keep browser open
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

postDeploymentTest().catch(console.error);