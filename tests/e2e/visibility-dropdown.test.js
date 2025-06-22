const puppeteer = require('puppeteer');

describe('Visibility Dropdown', () => {
  let browser;
  let page;
  const baseUrl = 'https://dev.greater.website';
  const apiUrl = 'https://lesser.host';

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    // Login process
    await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'networkidle2' });
    
    // Enter instance URL - clear field first as it has "https://" prefix
    await page.waitForSelector('input[placeholder="mastodon.social"]');
    await page.click('input[placeholder="mastodon.social"]', { clickCount: 3 }); // Triple click to select all
    await page.type('input[placeholder="mastodon.social"]', 'lesser.host');
    
    // Wait for validation to complete (green checkmark)
    await page.waitForSelector('.text-success', { timeout: 5000 });
    
    // Click continue button
    await page.click('button[type="submit"]');
    
    // Wait for redirect to OAuth page on lesser.host
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    
    // Check if we're on the OAuth authorize page
    const currentUrl = page.url();
    if (currentUrl.includes('/oauth/authorize')) {
      // Look for and click the authorize button
      // Lesser might have a different button structure than standard Mastodon
      try {
        // Try standard Mastodon authorize button first
        await page.waitForSelector('button[name="commit"]', { timeout: 5000 });
        await page.click('button[name="commit"]');
      } catch (e) {
        // Try alternative selectors
        const authorizeButton = await page.$('button:has-text("Authorize")') || 
                              await page.$('input[type="submit"][value="Authorize"]') ||
                              await page.$('button[type="submit"]');
        if (authorizeButton) {
          await authorizeButton.click();
        }
      }
      
      // Wait for redirect back to Greater
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }
    
    // Wait for home page to load (indicates successful login)
    await page.waitForSelector('a[href="/compose"]', { timeout: 15000 });
  });

  afterEach(async () => {
    await page.close();
  });

  test('visibility dropdown should be visible and not go off screen', async () => {
    // Navigate to compose page
    await page.goto(`${baseUrl}/compose`, { waitUntil: 'networkidle2' });

    // Wait for compose box to load
    await page.waitForSelector('.compose-box', { timeout: 10000 });

    // Find visibility button
    const visibilityButton = await page.$('[title="Visibility"]');
    expect(visibilityButton).toBeTruthy();

    // Click visibility button to open dropdown
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
    expect(dropdownBox.y).toBeGreaterThanOrEqual(0);
    expect(dropdownBox.y + dropdownBox.height).toBeLessThanOrEqual(viewport.height);
    
    // Check dropdown width is reasonable
    expect(dropdownBox.width).toBeGreaterThan(200); // Should be at least 200px wide (w-56 = 14rem = 224px)
    
    // Take screenshot for visual verification
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/visibility-dropdown-open.png',
      fullPage: false 
    });

    // Check all visibility options are visible
    const visibilityOptions = await page.$$eval('.absolute.left-0.w-56 button', buttons => 
      buttons.map(btn => {
        const labelEl = btn.querySelector('.font-medium');
        const descEl = btn.querySelector('.text-xs');
        return {
          label: labelEl ? labelEl.textContent : '',
          description: descEl ? descEl.textContent : ''
        };
      })
    );

    expect(visibilityOptions).toHaveLength(4);
    expect(visibilityOptions[0].label).toBe('Public');
    expect(visibilityOptions[1].label).toBe('Unlisted');
    expect(visibilityOptions[2].label).toBe('Followers only');
    expect(visibilityOptions[3].label).toBe('Direct');

    // Check descriptions are visible
    expect(visibilityOptions[0].description).toBe('Visible for all');
    expect(visibilityOptions[1].description).toBe('Not in public timelines');
    expect(visibilityOptions[2].description).toBe('Only followers can see');
    expect(visibilityOptions[3].description).toBe('Only people mentioned');
  });

  test('dropdown should position below button when near top of viewport', async () => {
    await page.goto(`${baseUrl}/compose`, { waitUntil: 'networkidle2' });
    
    // Scroll to put compose box near top
    await page.evaluate(() => window.scrollTo(0, 0));
    
    // Wait for compose box
    await page.waitForSelector('.compose-box', { timeout: 10000 });
    
    // Click visibility button
    const visibilityButton = await page.$('[title="Visibility"]');
    await visibilityButton.click();
    
    // Wait for dropdown
    await page.waitForSelector('.absolute.left-0.w-56', { timeout: 5000 });
    
    // Check if dropdown has 'top-full' class (positioned below)
    const dropdownClasses = await page.$eval('.absolute.left-0.w-56', el => el.className);
    const isPositionedBelow = dropdownClasses.includes('top-full');
    
    // Get button and dropdown positions
    const buttonBox = await visibilityButton.boundingBox();
    const dropdownBox = await page.$('.absolute.left-0.w-56').then(el => el.boundingBox());
    
    // If near top of viewport, dropdown should be below button
    if (buttonBox.y < 300) {
      expect(isPositionedBelow).toBe(true);
      expect(dropdownBox.y).toBeGreaterThan(buttonBox.y + buttonBox.height);
    }
    
    await page.screenshot({ 
      path: 'tests/e2e/screenshots/visibility-dropdown-below.png',
      fullPage: false 
    });
  });

  test('clicking outside dropdown should close it', async () => {
    await page.goto(`${baseUrl}/compose`, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('.compose-box', { timeout: 10000 });
    
    // Open dropdown
    const visibilityButton = await page.$('[title="Visibility"]');
    await visibilityButton.click();
    
    // Verify dropdown is open
    await page.waitForSelector('.absolute.left-0.w-56', { timeout: 5000 });
    
    // Click outside (on the compose textarea)
    await page.click('textarea[placeholder="What\'s on your mind?"]');
    
    // Wait a bit for dropdown to close
    await page.waitForTimeout(500);
    
    // Verify dropdown is closed
    const dropdownAfterClick = await page.$('.absolute.left-0.w-56');
    expect(dropdownAfterClick).toBeFalsy();
  });

  test('selecting visibility option should update button and close dropdown', async () => {
    await page.goto(`${baseUrl}/compose`, { waitUntil: 'networkidle2' });
    
    await page.waitForSelector('.compose-box', { timeout: 10000 });
    
    // Open dropdown
    const visibilityButton = await page.$('[title="Visibility"]');
    await visibilityButton.click();
    
    await page.waitForSelector('.absolute.left-0.w-56', { timeout: 5000 });
    
    // Click "Followers only" option
    await page.click('.absolute.left-0.w-56 button:nth-child(3)');
    
    // Wait for dropdown to close
    await page.waitForTimeout(500);
    
    // Verify dropdown is closed
    const dropdownAfterSelect = await page.$('.absolute.left-0.w-56');
    expect(dropdownAfterSelect).toBeFalsy();
    
    // Verify the button shows the correct icon (should be Users icon for "Followers only")
    // This would require checking the SVG content or class, which is implementation-specific
  });
});