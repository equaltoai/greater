import puppeteer from 'puppeteer';

const TEST_URL = 'https://dev.greater.website/local';

async function testLocalTimeline() {
  console.log('🧪 Testing local timeline at:', TEST_URL);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 800 });
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console error:', msg.text());
      }
    });
    
    // Log network errors
    page.on('pageerror', error => {
      console.log('❌ Page error:', error.message);
    });
    
    // Log failed requests
    page.on('requestfailed', request => {
      console.log('❌ Request failed:', request.url(), request.failure()?.errorText);
    });
    
    console.log('📱 Navigating to local timeline...');
    const response = await page.goto(TEST_URL, { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('📊 Response status:', response?.status());
    
    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check page title
    const title = await page.title();
    console.log('📄 Page title:', title);
    
    // Look for timeline container
    console.log('\n🔍 Checking for timeline elements...');
    
    // Check for the Timeline component container
    const timelineContainer = await page.$('.relative.h-full.flex.flex-col');
    console.log('✓ Timeline container found:', !!timelineContainer);
    
    // Check for any error states
    const errorState = await page.$('[data-testid="error-message"]');
    if (errorState) {
      const errorText = await page.evaluate(el => el.textContent, errorState);
      console.log('⚠️  Error state detected:', errorText);
    }
    
    // Check for empty state
    const emptyState = await page.$('.text-center');
    if (emptyState) {
      const emptyText = await page.evaluate(el => el.textContent, emptyState);
      console.log('📭 Empty state detected:', emptyText);
    }
    
    // Check for loading state
    const loadingState = await page.$('.animate-spin');
    console.log('⏳ Loading state:', !!loadingState);
    
    // Check for status cards using class-based selectors
    const statusCards = await page.$$('.bg-surface.rounded-lg.border.border-border');
    console.log('📝 Status cards found:', statusCards.length);
    
    // Check for offline indicator
    const offlineBanner = await page.$('.offline-banner');
    if (offlineBanner) {
      const offlineText = await page.evaluate(el => el.textContent, offlineBanner);
      console.log('🔌 Offline banner detected:', offlineText);
    }
    
    // Take a screenshot for visual inspection
    await page.screenshot({ 
      path: 'local-timeline-test.png',
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved as local-timeline-test.png');
    
    // Get page content for debugging
    const bodyContent = await page.evaluate(() => {
      const body = document.body;
      return {
        innerHTML: body.innerHTML.substring(0, 500) + '...',
        classList: Array.from(body.classList),
        childrenCount: body.children.length
      };
    });
    
    console.log('\n📋 Page body info:', {
      classList: bodyContent.classList,
      childrenCount: bodyContent.childrenCount
    });
    
    // Check for any Svelte components mounted
    const svelteComponents = await page.evaluate(() => {
      const components = document.querySelectorAll('[data-svelte-h]');
      return components.length;
    });
    console.log('🎯 Svelte components detected:', svelteComponents);
    
    console.log('\n✅ Test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the test
testLocalTimeline().catch(console.error);