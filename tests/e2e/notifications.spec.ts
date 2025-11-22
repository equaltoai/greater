import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    // Mock GraphQL requests
    await page.route('**/api/graphql', async (route) => {
      const request = route.request();
      const postData = request.postDataJSON();

      if (postData.query.includes('notifications')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              notifications: {
                edges: [
                  {
                    node: {
                      id: '1',
                      type: 'MENTION',
                      account: {
                        id: 'user1',
                        username: 'testuser',
                        displayName: 'Test User',
                        avatarUrl: 'https://example.com/avatar.png',
                      },
                      status: {
                         id: 's1',
                         content: 'Hello @me',
                         account: {
                            id: 'user1',
                            username: 'testuser',
                            displayName: 'Test User',
                            avatarUrl: 'https://example.com/avatar.png',
                         },
                         createdAt: new Date().toISOString(),
                         visibility: 'PUBLIC',
                      },
                      createdAt: new Date().toISOString(),
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

    await page.goto('/notifications');
  });

  test('should render notifications', async ({ page }) => {
    await expect(page.getByText('Test User')).toBeVisible();
    await expect(page.getByText('Hello @me')).toBeVisible();
  });
});
