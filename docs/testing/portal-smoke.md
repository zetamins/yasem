# Portal Smoke Tests

This document describes the automated smoke tests for validating portal compatibility with the YASEM Next.js application.

## Test Scope

The smoke tests verify three core functionalities:
1. **Portal Load**: The portal URL loads successfully
2. **Channel Listing**: The portal returns and displays channel data
3. **Playback**: Video playback initiates for a selected channel

## Test Configuration

### Device Parameters

| Parameter | Value | Notes |
|-----------|-------|-------|
| Portal URL | `http://tres.4vps.info:80/c/` | Target portal |
| MAC Address | `A0:BB:3E:17:1E:90` | Fixed - never randomized |
| Serial Number | Random 12-digit hex | Generated per test run |
| Device ID | Random string | Generated per test run |
| Device Model | MAG250 | Fixed for this test |
| Firmware | 2.18.18-r11-pub-250 | Standard MAG250 firmware |

### Randomization Strategy

Only the following parameters are randomized per test run:
- **Serial Number**: `DEADBEEF` + 4 random hex digits (e.g., `DEADBEEF1A2B`)
- **Device ID**: `mag-` + timestamp + random suffix (e.g., `mag-1700000000-abc12`)

The MAC address is **always fixed** to `A0:BB:3E:17:1E:90` to ensure consistent device identification with the portal.

## Test Execution

### Prerequisites

1. Node.js 18 or higher installed
2. Dependencies installed: `npm install`
3. Playwright browsers installed: `npx playwright install chromium`

### Running Tests

```bash
# Start the development server
cd yasem-next
npm run dev

# In another terminal, run the smoke tests
npx playwright test tests/portal-smoke.spec.ts
```

### Running with Custom Portal

```bash
TEST_PORTAL_URL=http://your-portal:80/c/ npx playwright test
```

## Test Details

### Test 1: Portal Load

**File**: `tests/portal-smoke.spec.ts`

**Flow**:
1. Create a new test profile with the portal URL
2. Set the MAC address to `A0:BB:3E:17:1E:90`
3. Generate and set random SN and device ID
4. Navigate to the portal page
5. Wait for the portal iframe to load
6. Verify no critical errors

**Expected Results**:
- Portal loads within 30 seconds
- HTTP response is 200
- No JavaScript errors in console

### Test 2: Channel Listing

**Flow**:
1. Wait for portal to fully load (additional 30 seconds)
2. Wait for channel list to appear in the DOM
3. Query for channel elements
4. Verify at least one channel is visible

**Expected Results**:
- Channel list container is present
- At least 1 channel is displayed
- Channel names are readable

### Test 3: Playback

**Flow**:
1. Click on the first available channel
2. Wait for video element to be created
3. Verify video source URL is set
4. Wait for playback to start (or buffer)
5. Check for playback errors

**Expected Results**:
- Video element exists in DOM
- Video source is a valid URL (http/https/udp/rtp)
- Playback state is "playing" or "buffering" within 30 seconds

## Troubleshooting

### Portal Load Fails

- Verify the portal URL is accessible from the test environment
- Check network connectivity
- Verify portal accepts connections from the test server IP

### Channel List Empty

- Portal may require authentication (MAC registration)
- Some portals require specific headers or cookies
- Check portal's response in browser DevTools

### Playback Errors

- Video stream may be behind a firewall
- Multicast streams require network configuration
- Some streams require specific codecs (H.264 usually required)

## CI Integration

The tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
name: Portal Smoke Tests

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run dev
        background: true
      - run: npx playwright install chromium
      - run: npx playwright test
        env:
          TEST_PORTAL_URL: http://tres.4vps.info:80/c/
          TEST_MAC: A0:BB:3E:17:1E:90
```

## Maintenance Notes

- Update the portal URL if the test target changes
- Adjust timeouts if the portal is slow to respond
- Review and update selectors if the portal UI changes
- Monitor test flakiness and adjust retry logic as needed
