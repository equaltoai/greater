#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { puppeteerConfig, testConfig } from './config';

async function uiIntegrationTest() {
  console.log('🎨 Testing Greater UI with Lesser data');
  
  const browser = await puppeteer.launch(puppeteerConfig);
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Track API calls and costs
    const apiMetrics = {
      calls: 0,
      totalCost: 0,
      endpoints: new Map<string, number>()
    };
    
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      request.continue();
    });
    
    page.on('response', (response) => {
      const url = response.url();
      if (url.includes('lesser.host') && url.includes('/api/')) {
        apiMetrics.calls++;
        
        const endpoint = url.split('?')[0].replace('https://lesser.host', '');
        apiMetrics.endpoints.set(endpoint, (apiMetrics.endpoints.get(endpoint) || 0) + 1);
        
        const costHeader = response.headers()['x-cost-total-micros'];
        if (costHeader) {
          apiMetrics.totalCost += parseInt(costHeader, 10);
          console.log(`💰 ${endpoint} - Cost: ${costHeader}μs`);
        }
      }
    });

    console.log('\n--- Testing Direct API Access ---');
    
    // First, let's verify the Lesser API directly
    const apiTest = await page.evaluate(async () => {
      const endpoints = [
        '/api/v1/timelines/public',
        '/api/v1/accounts/lookup?acct=aron@lesser.host',
        '/api/v1/instance',
        '/api/v2/search?q=test&type=statuses'
      ];
      
      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`https://lesser.host${endpoint}`);
          const data = await response.json();
          
          results.push({
            endpoint,
            status: response.status,
            ok: response.ok,
            dataType: Array.isArray(data) ? 'array' : typeof data,
            size: Array.isArray(data) ? data.length : Object.keys(data).length,
            sample: Array.isArray(data) && data[0] ? {
              id: data[0].id,
              type: data[0].type || 'status'
            } : null
          });
        } catch (error) {
          results.push({
            endpoint,
            error: error.message
          });
        }
      }
      
      return results;
    });
    
    console.log('\nAPI Test Results:');
    apiTest.forEach(result => {
      if (result.ok) {
        console.log(`✅ ${result.endpoint}`);
        console.log(`   Status: ${result.status}, Type: ${result.dataType}, Size: ${result.size}`);
        if (result.sample) {
          console.log(`   Sample: ${JSON.stringify(result.sample)}`);
        }
      } else {
        console.log(`❌ ${result.endpoint} - ${result.error || `Status: ${result.status}`}`);
      }
    });
    
    console.log('\n--- Testing Greater Pages ---');
    
    // Test 1: Try to access a public profile directly
    console.log('\n1. Profile Page Test');
    const profileUrl = `${testConfig.baseURL}/@aron@lesser.host`;
    await page.goto(profileUrl, { waitUntil: 'networkidle2' });
    
    const profileContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText.substring(0, 200),
        hasLoginForm: !!document.querySelector('input[type="url"]'),
        hasProfileElements: document.body.innerText.includes('aron') || 
                           document.body.innerText.includes('@aron')
      };
    });
    
    console.log(`Profile page (${profileUrl}):`);
    console.log(`- Title: ${profileContent.title}`);
    console.log(`- Has login form: ${profileContent.hasLoginForm}`);
    console.log(`- Has profile content: ${profileContent.hasProfileElements}`);
    
    if (profileContent.hasLoginForm) {
      console.log('⚠️  Redirected to login - Greater requires instance selection first');
    }
    
    // Test 2: Try public timeline with instance parameter
    console.log('\n2. Public Timeline Test');
    const timelineUrl = `${testConfig.baseURL}/public?instance=lesser.host`;
    await page.goto(timelineUrl, { waitUntil: 'networkidle2' });
    
    const timelineContent = await page.evaluate(() => {
      return {
        title: document.title,
        hasTimeline: document.body.innerText.includes('timeline') || 
                    document.body.innerText.includes('Timeline'),
        statusCount: document.querySelectorAll('article, [class*="status"], [class*="post"]').length,
        bodyPreview: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log(`Public timeline (${timelineUrl}):`);
    console.log(`- Title: ${timelineContent.title}`);
    console.log(`- Has timeline elements: ${timelineContent.hasTimeline}`);
    console.log(`- Status count: ${timelineContent.statusCount}`);
    
    // Test 3: Check localStorage for any stored data
    console.log('\n3. Client State Test');
    const clientState = await page.evaluate(() => {
      const state: any = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            state[key] = JSON.parse(localStorage.getItem(key) || '{}');
          } catch {
            state[key] = localStorage.getItem(key);
          }
        }
      }
      return state;
    });
    
    console.log('LocalStorage state:', Object.keys(clientState).length > 0 ? Object.keys(clientState) : 'Empty');
    
    console.log('\n--- API Metrics Summary ---');
    console.log(`Total API calls: ${apiMetrics.calls}`);
    console.log(`Total cost: ${apiMetrics.totalCost}μs (${(apiMetrics.totalCost / 1000).toFixed(2)}ms)`);
    
    if (apiMetrics.endpoints.size > 0) {
      console.log('\nCalls by endpoint:');
      apiMetrics.endpoints.forEach((count, endpoint) => {
        console.log(`  ${endpoint}: ${count} calls`);
      });
    }
    
    // Save screenshots
    await page.screenshot({ path: 'ui-test-final.png' });
    console.log('\n📸 Screenshot saved: ui-test-final.png');
    
  } catch (error) {
    console.error('\n❌ Test error:', error);
  } finally {
    await browser.close();
  }
}

uiIntegrationTest().catch(console.error);