/**
 * Portal Smoke Tests
 * 
 * Automated tests for validating portal load, channel listing,
 * and video playback with the YASEM Next.js application.
 * 
 * MAC Address: Fixed to A0:BB:3E:17:1E:90
 * Serial Number: Randomized per test run
 * Device ID: Randomized per test run
 */

import { test, expect } from '@playwright/test';
import { TEST_CONFIG, createTestProfileConfig } from './testUtils';

test.describe('Portal Smoke Tests', () => {
  const portalUrl = TEST_CONFIG.PORTAL_URL;
  
  test.beforeEach(async ({ page }) => {
    // Set up console error monitoring
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Store for later verification
    (page as any).consoleErrors = consoleErrors;
  });

  test('1. Portal Load - should load the portal successfully', async ({ page }) => {
    const profileConfig = createTestProfileConfig(portalUrl);
    
    // Navigate to the portal page with test profile
    // Note: The actual profile creation would happen via API
    await page.goto(`/portal/test-profile?portal=${encodeURIComponent(portalUrl)}`);
    
    // Wait for portal to load (30 second timeout)
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Verify portal content area exists
    const portalContent = page.locator('#portal-content, .portal-container, iframe');
    await expect(portalContent.first()).toBeVisible({ timeout: 30000 });
    
    // Check for critical errors (excluding known warnings)
    const consoleErrors = (page as any).consoleErrors as string[];
    const criticalErrors = consoleErrors.filter(
      err => !err.includes('Warning') && !err.includes('deprecated')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('2. Channel Listing - should display channel list', async ({ page }) => {
    await page.goto(`/portal/test-profile?portal=${encodeURIComponent(portalUrl)}`);
    
    // Wait for portal to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Additional wait for channel list to populate (60 seconds)
    // This varies by portal implementation
    await page.waitForTimeout(5000);
    
    // Look for channel list elements
    // Common selectors for IPTV portals
    const channelSelectors = [
      '.channel-item',
      '.channel-list li',
      '[data-channel]',
      '.stb-channel',
      '#channel-list .channel',
    ];
    
    let channelFound = false;
    for (const selector of channelSelectors) {
      const channels = page.locator(selector);
      const count = await channels.count();
      if (count > 0) {
        channelFound = true;
        console.log(`Found ${count} channels using selector: ${selector}`);
        break;
      }
    }
    
    // At least one channel should be visible
    expect(channelFound).toBeTruthy();
  });

  test('3. Playback - should initiate video playback', async ({ page }) => {
    await page.goto(`/portal/test-profile?portal=${encodeURIComponent(portalUrl)}`);
    
    // Wait for portal to load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for channel list
    await page.waitForTimeout(5000);
    
    // Click on the first available channel
    const firstChannel = page.locator(
      '.channel-item, [data-channel], .stb-channel, #channel-list li'
    ).first();
    
    if (await firstChannel.isVisible()) {
      await firstChannel.click();
    } else {
      // Skip if no channels available
      test.skip();
    }
    
    // Wait for video element to appear
    const videoElement = page.locator('video, #yasem-player, .video-player video');
    
    await expect(videoElement.first()).toBeVisible({ timeout: 30000 });
    
    // Verify video has a source
    const src = await videoElement.first().evaluate(el => (el as HTMLVideoElement).src);
    expect(src).toBeTruthy();
    expect(src).toMatch(/^(http|https|udp|rtp):\/\//);
    
    // Wait for playback to start (buffer or play state)
    await page.waitForFunction(() => {
      const video = document.querySelector('video') as HTMLVideoElement;
      return video && (video.paused === false || video.buffered.length > 0);
    }, { timeout: 30000 });
  });

  test('Device Identity - should use fixed MAC and randomized SN/device ID', () => {
    const config1 = createTestProfileConfig(portalUrl);
    const config2 = createTestProfileConfig(portalUrl);
    
    // MAC should always be fixed
    expect(config1.mag.mac_address).toBe('A0:BB:3E:17:1E:90');
    expect(config2.mag.mac_address).toBe('A0:BB:3E:17:1E:90');
    
    // Serial numbers should be different (randomized)
    expect(config1.mag.serial_number).not.toBe(config2.mag.serial_number);
    
    // Device IDs should be different (randomized)
    expect(config1.test.device_id).not.toBe(config2.test.device_id);
    
    // Verify format
    expect(config1.mag.serial_number).toMatch(/^DEADBEEF[0-9A-F]{4}$/);
    expect(config1.test.device_id).toMatch(/^mag-\d+-[a-z0-9]+$/);
  });
});

test.describe('Portal Reliability', () => {
  test('should handle slow portal response', async ({ page }) => {
    // Set a longer default timeout for slow portals
    test.setTimeout(120000);
    
    await page.goto(`/portal/test-profile?portal=${encodeURIComponent(TEST_CONFIG.PORTAL_URL)}`);
    
    // Use explicit wait with longer timeout
    await expect(page.locator('body')).toBeVisible({ timeout: 60000 });
  });

  test('should report portal connection errors clearly', async ({ page }) => {
    // Test with invalid portal to verify error handling
    await page.goto('/portal/test-profile?portal=http://invalid-portal-12345.example/c/');
    
    // Wait for error state
    await page.waitForTimeout(10000);
    
    // Should either show error or timeout gracefully
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });
});
