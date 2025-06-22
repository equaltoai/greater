const puppeteer = require('puppeteer');

describe('Visibility Dropdown - Simple Test', () => {
  let browser;
  let page;
  const baseUrl = 'https://dev.greater.website';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  test('visibility dropdown positioning and functionality', async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('Please login manually in the browser window...');
    
    // Navigate to login page
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle2' });
    
    // Wait for user to complete login manually
    await page.waitForSelector('a[href="/compose"]', { timeout: 120000 }); // 2 minute timeout
    
    console.log('Login detected! Running tests...');
    
    // Navigate to compose page
    await page.goto(`${baseUrl}/compose`, { waitUntil: 'networkidle2' });
    
    // Wait for compose box to load
    await page.waitForSelector('.compose-box', { timeout: 10000 });
    
    // Find visibility button
    const visibilityButton = await page.$('[title="Visibility"]');
    expect(visibilityButton).toBeTruthy();
    
    // Test 1: Click visibility button to open dropdown
    console.log('Test 1: Opening dropdown...');
    await visibilityButton.click();
    
    // Wait for dropdown to appear
    await page.waitForSelector('.absolute.left-0.w-56', { timeout: 5000 });
    
    // Get dropdown element
    const dropdown = await page.$('.absolute.left-0.w-56');
    
    // Get dropdown bounding box
    const dropdownBox = await dropdown.boundingBox();
    
    // Get viewport dimensions
    const viewport = page.viewport();
    
    // Check dropdown is within viewport
    console.log('Dropdown position:', dropdownBox);
    expect(dropdownBox.y).toBeGreaterThanOrEqual(0);
    expect(dropdownBox.y + dropdownBox.height).toBeLessThanOrEqual(viewport.height);
    
    // Check dropdown width is reasonable (w-56 = 14rem = 224px)
    expect(dropdownBox.width).toBeGreaterThan(200);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/visibility-dropdown-fixed.png',
      fullPage: false 
    });
    
    // Test 2: Check all visibility options are visible and properly formatted
    console.log('Test 2: Checking visibility options...');
    const visibilityOptions = await page.$$eval('.absolute.left-0.w-56 button', buttons => 
      buttons.map(btn => {
        const labelEl = btn.querySelector('.font-medium');
        const descEl = btn.querySelector('.text-xs');
        return {
          label: labelEl ? labelEl.textContent : '',
          description: descEl ? descEl.textContent : '',
          hasCheckmark: !!btn.querySelector('svg path[fill-rule="evenodd"]')
        };
      })
    );
    
    console.log('Found options:', visibilityOptions);
    expect(visibilityOptions).toHaveLength(4);
    expect(visibilityOptions[0].label).toBe('Public');
    expect(visibilityOptions[0].description).toBe('Visible for all');
    expect(visibilityOptions[0].hasCheckmark).toBe(true); // Default is public
    
    // Test 3: Click outside to close
    console.log('Test 3: Testing click outside to close...');
    await page.click('textarea[placeholder="What\'s on your mind?"]');
    await page.waitForTimeout(500);
    
    // Verify dropdown is closed
    const dropdownAfterClick = await page.$('.absolute.left-0.w-56');
    expect(dropdownAfterClick).toBeFalsy();
    
    // Test 4: Select different visibility
    console.log('Test 4: Selecting different visibility...');
    await visibilityButton.click();
    await page.waitForSelector('.absolute.left-0.w-56', { timeout: 5000 });
    
    // Click "Followers only" (3rd option)
    await page.click('.absolute.left-0.w-56 button:nth-child(3)');
    await page.waitForTimeout(500);
    
    // Verify dropdown closed
    const dropdownAfterSelect = await page.$('.absolute.left-0.w-56');
    expect(dropdownAfterSelect).toBeFalsy();
    
    // Open dropdown again to verify selection
    await visibilityButton.click();
    await page.waitForSelector('.absolute.left-0.w-56', { timeout: 5000 });
    
    const updatedOptions = await page.$$eval('.absolute.left-0.w-56 button', buttons => 
      buttons.map(btn => ({
        label: btn.querySelector('.font-medium')?.textContent || '',
        hasCheckmark: !!btn.querySelector('svg path[fill-rule="evenodd"]')
      }))
    );
    
    // Verify "Followers only" is now selected
    expect(updatedOptions[2].label).toBe('Followers only');
    expect(updatedOptions[2].hasCheckmark).toBe(true);
    expect(updatedOptions[0].hasCheckmark).toBe(false); // Public should not be selected
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/visibility-dropdown-followers-selected.png',
      fullPage: false 
    });
    
    console.log('All tests passed!');
    
    await page.close();
  });
});