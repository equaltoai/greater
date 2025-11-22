import { test, expect } from '@playwright/test';

test.describe('Timeline', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GraphQL requests
    await page.route('**/api/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.query.includes('getTimeline')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              timeline: {
                edges: [
                  {
                    node: {
                      id: '1',
                      content: 'Hello World',
                      account: {
                        id: 'user1',
                        username: 'testuser',
                        displayName: 'Test User',
                        avatarUrl: 'https://example.com/avatar.png',
                      },
                      createdAt: new Date().toISOString(),
                      visibility: 'PUBLIC',
                      favouritesCount: 0,
                      reblogsCount: 0,
                      repliesCount: 0,
                      favourited: false,
                      boosted: false,
                      bookmarked: false,
                      attachments: [],
                      mentions: [],
                      tags: [],
                      emojis: [],
                    },
                  },
                ],
                pageInfo: {
                  hasNextPage: false,
                  endCursor: 'cursor-1',
                },
              },
            },
          }),
        });
        return;
      }

      if (postData.query.includes('favoriteStatus')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              favoriteStatus: {
                id: '1',
                favourited: true,
                favouritesCount: 1,
              },
            },
          }),
        });
        return;
      }

      if (postData.query.includes('boostStatus')) {
         await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              boostStatus: {
                id: '1',
                boosted: true,
                reblogsCount: 1,
              },
            },
          }),
        });
        return;
      }

      await route.continue();
    });

    // Mock auth state
    await page.addInitScript(() => {
      localStorage.setItem('greater_auth', JSON.stringify({
        'https://test.instance': {
            access_token: 'mock-token',
            token_type: 'Bearer',
            scope: 'read write follow',
            created_at: Date.now() / 1000
        }
      }));
      localStorage.setItem('greater_current_instance', 'https://test.instance');
      localStorage.setItem('greater_user', JSON.stringify({
        id: 'me',
        username: 'me',
        acct: 'me@test.instance',
        display_name: 'Me',
        url: 'https://test.instance/@me',
        avatar: 'https://test.instance/avatar.png',
        header: 'https://test.instance/header.png',
        locked: false,
        created_at: new Date().toISOString(),
        note: 'My bio',
        url_str: 'https://test.instance/@me',
        followers_count: 0,
        following_count: 0,
        statuses_count: 0,
      }));
    });

    await page.goto('/');
  });

  test('should render timeline items', async ({ page }) => {
    await expect(page.getByText('Hello World')).toBeVisible();
    await expect(page.getByText('Test User')).toBeVisible();
  });

  test('should handle favorite action', async ({ page }) => {
    const favoriteButton = page.locator('button[aria-label="Favorite"]');
    await expect(favoriteButton).toBeVisible();
    await favoriteButton.click();
    // Depending on how optimistic updates are handled, we might see the count update immediately
    // This assumes the UI updates based on the click or the mock response
    await expect(page.getByText('1', { exact: true })).toBeVisible(); 
  });

  test('should handle boost action', async ({ page }) => {
    const boostButton = page.locator('button[aria-label="Boost"]');
    await expect(boostButton).toBeVisible();
    await boostButton.click();
    await expect(page.getByText('1', { exact: true })).toBeVisible();
  });
});
