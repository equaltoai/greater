#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { puppeteerConfig, testConfig } from './config';

async function runBasicTests() {
  console.log('🚀 Starting Puppeteer tests for Greater/Lesser integration');
  console.log(`Base URL: ${testConfig.baseURL}`);
  console.log(`Lesser Instance: ${testConfig.lesserInstance}`);
  console.log('Running in headful mode for WebAuthn support\n');

  const browser = await puppeteer.launch(puppeteerConfig);
  
  try {
    const page = await browser.newPage();
    
    // Enable request/response logging
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      if (request.url().includes('/api/v1/')) {
        console.log(`📤 API Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
    
    page.on('response', (response) => {
      if (response.url().includes('/api/v1/')) {
        const costHeader = response.headers()['x-cost-total-micros'];
        console.log(`📥 API Response: ${response.status()} ${response.url()}`);
        if (costHeader) {
          console.log(`💰 Operation cost: ${costHeader} micros`);
        }
      }
    });

    console.log('\n--- Test 1: Loading Greater homepage ---');
    await page.goto(testConfig.baseURL);
    const title = await page.title();
    console.log(`✅ Page title: ${title}`);

    console.log('\n--- Test 2: Fetching public timeline from Lesser ---');
    await page.goto(`${testConfig.baseURL}/public`);
    
    // Wait for timeline to load
    await page.waitForSelector('[data-testid="timeline"]', { timeout: 10000 });
    
    // Count statuses
    const statusCount = await page.$$eval('[data-testid="status-card"]', cards => cards.length);
    console.log(`✅ Found ${statusCount} statuses in public timeline`);
    
    // Get first status details
    if (statusCount > 0) {
      const firstStatus = await page.$eval('[data-testid="status-card"]:first-child', (card) => {
        const author = card.querySelector('[data-testid="status-author"]')?.textContent || '';
        const content = card.querySelector('[data-testid="status-content"]')?.textContent || '';
        const timestamp = card.querySelector('[data-testid="status-timestamp"]')?.textContent || '';
        return { author, content: content.substring(0, 100), timestamp };
      });
      
      console.log('\n📝 First status:');
      console.log(`   Author: ${firstStatus.author}`);
      console.log(`   Content: ${firstStatus.content}...`);
      console.log(`   Time: ${firstStatus.timestamp}`);
    }

    console.log('\n--- Test 3: Profile page for @aron@lesser.host ---');
    await page.goto(`${testConfig.baseURL}/@aron@lesser.host`);
    
    try {
      await page.waitForSelector('[data-testid="profile-header"]', { timeout: 10000 });
      
      const profileInfo = await page.$eval('[data-testid="profile-header"]', (header) => {
        const displayName = header.querySelector('[data-testid="profile-display-name"]')?.textContent || '';
        const username = header.querySelector('[data-testid="profile-username"]')?.textContent || '';
        const bio = header.querySelector('[data-testid="profile-bio"]')?.textContent || '';
        
        // Get stats
        const followers = header.querySelector('[data-testid="followers-count"]')?.textContent || '0';
        const following = header.querySelector('[data-testid="following-count"]')?.textContent || '0';
        const statuses = header.querySelector('[data-testid="statuses-count"]')?.textContent || '0';
        
        return { displayName, username, bio: bio.substring(0, 100), followers, following, statuses };
      });
      
      console.log('✅ Profile loaded:');
      console.log(`   Display Name: ${profileInfo.displayName}`);
      console.log(`   Username: ${profileInfo.username}`);
      console.log(`   Bio: ${profileInfo.bio}...`);
      console.log(`   Stats: ${profileInfo.followers} followers, ${profileInfo.following} following, ${profileInfo.statuses} posts`);
    } catch (error) {
      console.log('❌ Failed to load profile - might need authentication or profile doesn\'t exist');
    }

    console.log('\n--- Test 4: Search functionality ---');
    await page.goto(`${testConfig.baseURL}/search`);
    
    const searchInput = await page.$('[data-testid="search-input"]');
    if (searchInput) {
      await searchInput.type('test');
      await page.keyboard.press('Enter');
      
      try {
        await page.waitForSelector('[data-testid="search-results"]', { timeout: 5000 });
        console.log('✅ Search results loaded');
      } catch {
        console.log('⚠️  Search results not found - might need implementation');
      }
    } else {
      console.log('⚠️  Search input not found');
    }

    console.log('\n--- Test 5: WebAuthn availability check ---');
    const hasWebAuthn = await page.evaluate(() => {
      return 'PublicKeyCredential' in window;
    });
    console.log(`✅ WebAuthn available: ${hasWebAuthn}`);

    console.log('\n🎉 Basic tests completed!');
    console.log('\nTo run full test suite: npm run test:puppeteer');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// Run the tests
runBasicTests().catch(console.error);