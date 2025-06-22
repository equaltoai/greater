import puppeteer from 'puppeteer';

const TEST_URL = 'https://dev.greater.website/local';

async function debugTimeline() {
  console.log('🔍 Debugging Timeline component at:', TEST_URL);
  
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    devtools: true,  // Open devtools
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    
    // Log all console messages
    page.on('console', msg => {
      console.log(`[${msg.type()}]`, msg.text());
    });
    
    // Intercept API responses
    await page.setRequestInterception(true);
    page.on('request', request => {
      if (request.url().includes('/api/v1/timelines')) {
        console.log('📡 API Request:', request.url());
      }
      request.continue();
    });
    
    page.on('response', async response => {
      if (response.url().includes('/api/v1/timelines')) {
        console.log('📥 API Response:', response.status(), response.url());
        try {
          const data = await response.json();
          console.log('📊 Response data:', JSON.stringify(data).substring(0, 200) + '...');
          console.log('📊 Status count:', Array.isArray(data) ? data.length : 0);
        } catch (e) {
          console.log('Could not parse response');
        }
      }
    });
    
    console.log('🌐 Navigating to page...');
    await page.goto(TEST_URL, { waitUntil: 'networkidle2' });
    
    // Wait for any dynamic loading
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Check timeline store state
    const storeState = await page.evaluate(() => {
      // Try to access the timeline store from window if exposed
      return new Promise(resolve => {
        setTimeout(() => {
          const timelineData = {
            hasTimelineContainer: !!document.querySelector('.relative.h-full.flex.flex-col'),
            hasStatusCards: document.querySelectorAll('.bg-surface.rounded-lg.border.border-border').length,
            hasLoadingSpinner: !!document.querySelector('.animate-spin'),
            hasErrorState: !!document.querySelector('[class*="error"]'),
            hasEmptyState: !!document.querySelector('[class*="empty"]'),
            bodyClasses: document.body.className,
            timelineHTML: document.querySelector('.relative.h-full.flex.flex-col')?.innerHTML?.substring(0, 500)
          };
          resolve(timelineData);
        }, 2000);
      });
    });
    
    console.log('\n📋 Timeline State:', storeState);
    
    // Take screenshot
    await page.screenshot({ path: 'timeline-debug.png', fullPage: true });
    console.log('📸 Screenshot saved as timeline-debug.png');
    
    // Keep browser open for manual inspection
    console.log('\n⏸️  Browser will stay open for 30 seconds for inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));
    
  } finally {
    await browser.close();
  }
}

debugTimeline().catch(console.error);