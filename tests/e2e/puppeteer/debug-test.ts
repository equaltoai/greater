#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { puppeteerConfig, testConfig } from './config';

async function debugTest() {
  console.log('🔍 Debug test for Greater/Lesser integration');
  console.log(`Base URL: ${testConfig.baseURL}`);

  const browser = await puppeteer.launch(puppeteerConfig);
  
  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Browser console error:', msg.text());
      }
    });

    console.log('\n--- Checking homepage ---');
    await page.goto(testConfig.baseURL);
    await page.screenshot({ path: 'homepage.png' });
    console.log('Screenshot saved: homepage.png');
    
    // Get page content
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Check what's on the page
    const bodyText = await page.$eval('body', el => el.innerText);
    console.log('\nPage content preview:');
    console.log(bodyText.substring(0, 500) + '...');
    
    // Check for any error messages
    const errorElements = await page.$$('[class*="error"], [data-testid*="error"]');
    if (errorElements.length > 0) {
      console.log(`\n⚠️  Found ${errorElements.length} error elements`);
    }
    
    // Try different selectors for timeline
    console.log('\n--- Checking for timeline elements ---');
    const selectors = [
      '[data-testid="timeline"]',
      '.timeline',
      '[class*="timeline"]',
      'main',
      '[role="feed"]',
      '[data-testid="status-card"]',
      '.status-card',
      '[class*="status"]'
    ];
    
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (element) {
        console.log(`✅ Found element with selector: ${selector}`);
      }
    }
    
    console.log('\n--- Navigating to /public ---');
    await page.goto(`${testConfig.baseURL}/public`);
    await page.waitForTimeout(3000); // Wait for page to load
    await page.screenshot({ path: 'public-timeline.png' });
    console.log('Screenshot saved: public-timeline.png');
    
    // Check page structure
    const publicBodyText = await page.$eval('body', el => el.innerText);
    console.log('\nPublic timeline content preview:');
    console.log(publicBodyText.substring(0, 500) + '...');
    
    // Look for any Svelte components
    const svelteComponents = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*');
      const svelteElements = [];
      allElements.forEach(el => {
        if (el.getAttribute('data-svelte') || el.className.includes('svelte')) {
          svelteElements.push({
            tag: el.tagName,
            class: el.className,
            id: el.id,
            testId: el.getAttribute('data-testid')
          });
        }
      });
      return svelteElements;
    });
    
    if (svelteComponents.length > 0) {
      console.log('\nFound Svelte components:', svelteComponents);
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    console.log('\n🔍 Debug test completed. Check homepage.png and public-timeline.png');
    await browser.close();
  }
}

debugTest().catch(console.error);