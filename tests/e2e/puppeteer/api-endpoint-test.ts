#!/usr/bin/env node

import puppeteer from 'puppeteer';

async function testAPIEndpoints() {
  console.log('🔍 Testing Greater/Lesser API Integration\n');

  const browser = await puppeteer.launch({ headless: true });
  
  try {
    const page = await browser.newPage();
    
    // Test 1: Direct API calls to understand the ID format issue
    console.log('--- Test 1: Account ID Formats ---');
    
    // Get aron2's account info
    const accountLookup = await page.goto('https://lesser.host/api/v1/accounts/lookup?acct=aron2@lesser.host');
    const aron2Account = await accountLookup?.json().catch(() => null);
    
    if (aron2Account) {
      console.log('Aron2 account from Lesser API:');
      console.log(`  ID: ${aron2Account.id}`);
      console.log(`  ID type: ${typeof aron2Account.id}`);
      console.log(`  Username: ${aron2Account.username}`);
      console.log(`  URL: ${aron2Account.url}`);
      
      // Try to follow using the ID we got
      console.log('\n--- Test 2: Follow API ---');
      console.log(`Attempting POST to: /api/v1/accounts/${aron2Account.id}/follow`);
      
      // Note: This will fail without auth, but we can see the URL format
    }
    
    // Test 3: Check a status to understand quote boost issue
    console.log('\n--- Test 3: Status Format ---');
    const timelineResponse = await page.goto('https://lesser.host/api/v1/timelines/public?limit=1');
    const statuses = await timelineResponse?.json().catch(() => []);
    
    if (statuses.length > 0) {
      const status = statuses[0];
      console.log('Sample status from Lesser:');
      console.log(`  ID: ${status.id}`);
      console.log(`  Content: ${status.content?.substring(0, 50)}...`);
      console.log(`  Reblog endpoint would be: /api/v1/statuses/${status.id}/reblog`);
    }
    
    // Test 4: Visit Greater and check console for actual API calls
    console.log('\n--- Test 4: Greater Console Analysis ---');
    
    // Enable console logging
    const logs: string[] = [];
    page.on('console', (msg) => {
      logs.push(`[${msg.type()}] ${msg.text()}`);
    });
    
    page.on('response', (response) => {
      if (response.url().includes('lesser.host/api')) {
        logs.push(`API: ${response.status()} ${response.url()}`);
      }
    });
    
    // Mock auth and visit profile
    await page.goto('https://dev.greater.website');
    await page.evaluate(() => {
      localStorage.setItem('auth:instance', 'lesser.host');
      localStorage.setItem('auth:token', 'test-token');
      localStorage.setItem('auth:account', JSON.stringify({
        id: 'https://lesser.host/users/aron',
        username: 'aron',
        acct: 'aron@lesser.host'
      }));
    });
    
    // Visit aron2's profile
    await page.goto('https://dev.greater.website/@aron2@lesser.host');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get what's actually on the page
    const profileData = await page.evaluate(() => {
      const getTextContent = (selector: string) => {
        const el = document.querySelector(selector);
        return el?.textContent?.trim() || null;
      };
      
      // Try various selectors to find profile data
      return {
        displayName: getTextContent('[class*="display-name"]') || getTextContent('h1'),
        username: getTextContent('[class*="username"]') || getTextContent('[class*="acct"]'),
        followButton: !!document.querySelector('button:has-text("Follow")') || !!document.querySelector('button[class*="follow"]'),
        pageTitle: document.title,
        bodyText: document.body.innerText.substring(0, 200)
      };
    });
    
    console.log('\nProfile page data:');
    console.log(`  Title: ${profileData.pageTitle}`);
    console.log(`  Display Name: ${profileData.displayName}`);
    console.log(`  Username: ${profileData.username}`);
    console.log(`  Has Follow Button: ${profileData.followButton}`);
    
    console.log('\n--- Console Logs from Greater ---');
    logs.slice(-20).forEach(log => console.log(log));
    
    // Generate report
    const report = `# Greater/Lesser API Integration Test

## Key Findings

### 1. Account ID Mismatch
- **Lesser returns**: URL-based IDs like \`https://lesser.host/users/aron2\`
- **Greater expects**: Numeric IDs (based on error: \`495433748435615\`)
- **Issue**: Greater is likely using a hash or transformation of the ID

### 2. API Response Data
\`\`\`json
// Aron2 Account
${JSON.stringify(aron2Account, null, 2)}

// Sample Status  
${statuses.length > 0 ? JSON.stringify(statuses[0], null, 2).substring(0, 500) : 'No statuses'}
\`\`\`

### 3. Console Logs
\`\`\`
${logs.join('\n')}
\`\`\`

## Recommendations

1. **Fix Account ID Handling**:
   - Greater should use the account ID as-is from Lesser
   - Don't transform or hash the ID
   
2. **Fix Quote Boost**:
   - Ensure status ID is passed to reblog endpoint
   - Check ComposeBox quote boost handler

3. **Schema Validation**:
   - Update schemas to accept Lesser's response format
   - Or disable strict validation for Lesser instances
`;

    require('fs').writeFileSync('api-endpoint-test-plan.md', report);
    console.log('\n📄 Report saved to api-endpoint-test-plan.md');
    
  } catch (error) {
    console.error('Test error:', error);
  } finally {
    await browser.close();
  }
}

testAPIEndpoints().catch(console.error);