#!/usr/bin/env node

import puppeteer from 'puppeteer';
import { testConfig } from './config';

async function testAPIFormats() {
  console.log('🔍 Testing Lesser API Response Formats\n');

  const browser = await puppeteer.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Get public timeline and examine status format
    console.log('--- Test 1: Status Object Format ---');
    const timelineResponse = await page.goto('https://lesser.host/api/v1/timelines/public?limit=1');
    const statuses = await timelineResponse?.json();
    
    if (Array.isArray(statuses) && statuses.length > 0) {
      const status = statuses[0];
      console.log('Status ID format:', status.id);
      console.log('Status fields:');
      console.log('  - favourited:', status.favourited, '(exists:', 'favourited' in status, ')');
      console.log('  - favorited:', status.favorited, '(exists:', 'favorited' in status, ')');
      console.log('  - favourites_count:', status.favourites_count);
      console.log('  - favorites_count:', status.favorites_count);
      console.log('  - reblogged:', status.reblogged, '(exists:', 'reblogged' in status, ')');
      console.log('  - boosted:', status.boosted, '(exists:', 'boosted' in status, ')');
      console.log('  - bookmarked:', status.bookmarked, '(exists:', 'bookmarked' in status, ')');
      console.log('\nFull status object keys:', Object.keys(status).sort());
    }
    
    // Test 2: Check account format
    console.log('\n--- Test 2: Account Object Format ---');
    const accountResponse = await page.goto('https://lesser.host/api/v1/accounts/lookup?acct=aron@lesser.host');
    const account = await accountResponse?.json();
    
    if (account && !account.error) {
      console.log('Account ID format:', account.id);
      console.log('Account fields:');
      console.log('  - followers_count:', account.followers_count);
      console.log('  - following_count:', account.following_count);
      console.log('  - statuses_count:', account.statuses_count);
      console.log('\nFull account object keys:', Object.keys(account).sort());
    }
    
    // Test 3: Try interaction endpoints (will fail without auth, but check response)
    console.log('\n--- Test 3: Interaction Endpoint Responses ---');
    const endpoints = [
      '/api/v1/statuses/1750535066-ddPWPAHK/favourite',
      '/api/v1/statuses/1750535066-ddPWPAHK/reblog',
      '/api/v1/statuses/1750535066-ddPWPAHK/bookmark'
    ];
    
    for (const endpoint of endpoints) {
      const response = await page.goto(`https://lesser.host${endpoint}`, {
        waitUntil: 'networkidle0'
      }).catch(e => null);
      
      if (response) {
        console.log(`\n${endpoint}:`);
        console.log(`  Status: ${response.status()}`);
        console.log(`  Status Text: ${response.statusText()}`);
        
        try {
          const body = await response.json();
          console.log(`  Response:`, JSON.stringify(body, null, 2).substring(0, 200));
        } catch {
          const text = await response.text();
          console.log(`  Response Text:`, text.substring(0, 100));
        }
      }
    }
    
    // Test 4: Compare with standard Mastodon
    console.log('\n--- Test 4: Field Name Comparison ---');
    console.log('\nStandard Mastodon uses:');
    console.log('  - favourited (British spelling)');
    console.log('  - favourites_count');
    console.log('  - reblogged');
    console.log('  - reblogs_count');
    console.log('  - bookmarked');
    
    console.log('\nIf Lesser uses different field names, the Greater UI won\'t update correctly!');
    
    // Test 5: Check instance info for version
    console.log('\n--- Test 5: Instance Version ---');
    const instanceResponse = await page.goto('https://lesser.host/api/v1/instance');
    const instance = await instanceResponse?.json();
    console.log('Instance version:', instance.version);
    console.log('Mastodon compatible:', instance.version.includes('compatible'));
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
  
  console.log('\n📋 Summary:');
  console.log('Check the field names above - if Lesser uses different spellings');
  console.log('than standard Mastodon, that would explain why interactions fail!');
}

testAPIFormats().catch(console.error);