#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { puppeteerConfig, testConfig } from './config';

async function integrationTest() {
  console.log('🚀 Testing Greater/Lesser integration');
  console.log(`Greater URL: ${testConfig.baseURL}`);
  console.log(`Lesser Instance: ${testConfig.lesserInstance}`);

  const browser = await puppeteer.launch(puppeteerConfig);
  
  try {
    const page = await browser.newPage();
    
    // Enable request/response logging
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      if (request.url().includes('lesser.host')) {
        console.log(`📤 Lesser API Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });
    
    page.on('response', (response) => {
      if (response.url().includes('lesser.host')) {
        const costHeader = response.headers()['x-cost-total-micros'];
        console.log(`📥 Lesser API Response: ${response.status()} ${response.url()}`);
        if (costHeader) {
          console.log(`💰 Operation cost: ${costHeader} micros`);
        }
      }
    });

    console.log('\n--- Step 1: Set Lesser instance ---');
    await page.goto(testConfig.baseURL);
    
    // Fill in the instance URL
    const instanceInput = await page.$('input[type="url"], input[name="instance"], input[placeholder*="instance"]');
    if (instanceInput) {
      await instanceInput.click({ clickCount: 3 }); // Select all
      await instanceInput.type('https://lesser.host');
      console.log('✅ Entered Lesser instance URL');
      
      // Find and click continue button
      const continueButton = await page.$('button:has-text("Continue"), button[type="submit"]');
      if (continueButton) {
        await continueButton.click();
        console.log('✅ Clicked continue button');
        
        // Wait for navigation or OAuth flow
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {
          console.log('⚠️  Navigation timeout - checking current state');
        });
      }
    }
    
    console.log('\n--- Step 2: Check public timeline ---');
    // Try direct navigation to public timeline with instance parameter
    await page.goto(`${testConfig.baseURL}/public?instance=lesser.host`);
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
    
    // Take screenshot
    await page.screenshot({ path: 'lesser-public-timeline.png' });
    console.log('📸 Screenshot saved: lesser-public-timeline.png');
    
    // Check what's loaded
    const pageContent = await page.content();
    
    // Look for various timeline indicators
    const hasTimeline = pageContent.includes('timeline') || 
                       pageContent.includes('Timeline') ||
                       pageContent.includes('status') ||
                       pageContent.includes('Status');
    
    console.log(`Timeline content found: ${hasTimeline}`);
    
    // Try to find any posts/statuses
    const possibleSelectors = [
      'article',
      'div[class*="status"]',
      'div[class*="post"]',
      'div[class*="card"]',
      '[role="article"]',
      'main div div' // Generic nested divs
    ];
    
    for (const selector of possibleSelectors) {
      const elements = await page.$$(selector);
      if (elements.length > 0) {
        console.log(`✅ Found ${elements.length} elements matching: ${selector}`);
        
        // Get text from first element
        if (elements[0]) {
          const text = await elements[0].evaluate(el => el.textContent?.substring(0, 100));
          console.log(`   Sample content: ${text}...`);
        }
        break;
      }
    }
    
    console.log('\n--- Step 3: Test profile page ---');
    await page.goto(`${testConfig.baseURL}/@aron@lesser.host`);
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }).catch(() => {});
    
    await page.screenshot({ path: 'lesser-profile-aron.png' });
    console.log('📸 Screenshot saved: lesser-profile-aron.png');
    
    // Check for profile elements
    const profileText = await page.evaluate(() => document.body.innerText);
    if (profileText.includes('aron') || profileText.includes('@aron')) {
      console.log('✅ Profile page loaded with user info');
    } else {
      console.log('⚠️  Profile page may not have loaded correctly');
    }
    
    console.log('\n--- Step 4: API endpoint test ---');
    // Direct API call to Lesser
    const apiResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('https://lesser.host/api/v1/timelines/public');
        return {
          status: response.status,
          headers: {
            contentType: response.headers.get('content-type'),
            cost: response.headers.get('x-cost-total-micros')
          },
          ok: response.ok
        };
      } catch (error) {
        return { error: error.message };
      }
    });
    
    console.log('Lesser API test:', apiResponse);
    
    console.log('\n✅ Integration test completed!');
    console.log('Check the screenshots to see the actual page content.');
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

integrationTest().catch(console.error);