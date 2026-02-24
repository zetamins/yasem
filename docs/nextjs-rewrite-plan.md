# Next.js Rewrite Plan

## Overview

This document outlines the plan for rewriting YASEM (Yet Another STB Emulator) from Qt/C++ to a modern Next.js web application. The rewrite aims to maintain compatibility with existing IPTV portals while providing a more accessible, maintainable, and feature-rich application.

## Project Structure

```
yasem-next/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── app-info/      # Application info endpoint
│   │   │   ├── portal-proxy/  # Portal request proxy
│   │   │   ├── portal-script/ # STB API script injection
│   │   │   ├── profiles/     # Profile management API
│   │   │   └── stb-types/    # STB type definitions
│   │   ├── portal/[profileId]/ # Portal viewer page
│   │   └── profiles/         # Profile management pages
│   ├── components/           # React components
│   │   ├── HelpPanel.tsx
│   │   ├── NewProfileModal.tsx
│   │   ├── PortalViewer.tsx
│   │   ├── ProfileCard.tsx
│   │   ├── ProfileConfigPage.tsx
│   │   ├── ProfilesPage.tsx
│   │   ├── ShortcutsBar.tsx
│   │   └── VideoPlayer.tsx
│   └── lib/                  # Core libraries
│       ├── dunehd/           # Dune HD API implementation
│       ├── mag/              # MAG (Infomir) API implementation
│       ├── samsung/          # Samsung SmartTV API implementation
│       ├── pluginRegistry.ts # Plugin registration system
│       └── profileStore.ts   # Profile persistence layer
├── public/                   # Static assets
└── package.json              # Dependencies
```

## STB API Emulation

The rewrite emulates the JavaScript STB API used by IPTV portals. Currently supported:

### MAG (Infomir) Devices
- Full `gSTB` API implementation
- Device serial number, MAC address, model configuration
- Media player controls (play, pause, stop, seek)
- Video info, audio tracks, subtitles
- Environment variables and configuration

### Dune HD Devices
- Basic Dune HD API stubs
- Device identification

### Samsung SmartTV
- Tizen platform support
- Samsung API stubs

## Profile System

Profiles store device configuration including:
- **Device Model**: MAG250, MAG255, MAG256, MAG275, AuraHD, Dune HD, Samsung SmartTV
- **MAC Address**: Device network identifier
- **Serial Number**: Device serial number
- **Portal URL**: IPTV portal address
- **Network Settings**: Multicast proxy configuration

Profile configuration is stored in `data/profiles.json`.

## Automated Portal Testing

This section defines the automated testing strategy for validating portal compatibility.

### Test Configuration

| Parameter | Value |
|-----------|-------|
| Portal URL | `http://tres.4vps.info:80/c/` |
| MAC Address | `A0:BB:3E:17:1E:90` (fixed) |
| Serial Number | Randomly generated per test run |
| Device ID | Randomly generated per test run |
| STB Type | MAG250 |

### Device Identity Rules

- **MAC Address**: Always fixed to `A0:BB:3E:17:1E:90` - never randomized
- **Serial Number (SN)**: Randomly generated per test run using format `XXXXXXXXXXXX` (12 hex digits)
- **Device ID**: Randomly generated per test run, injected via profile config

#### Serial Number Generation

```typescript
function generateSerialNumber(): string {
  const prefix = 'DEADBEEF'; // Stable prefix
  const random = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `${prefix}${random.padStart(4, '0')}`;
}
```

#### Device ID Generation

```typescript
function generateDeviceId(): string {
  return `mag-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
```

### Test Environment Setup

1. Create a test profile with the portal URL
2. Inject the fixed MAC address: `A0:BB:3E:17:1E:90`
3. Generate and inject random SN and device ID for the test run
4. Store test profile configuration in `data/profiles.json`

### Test Workflow

#### 1. Portal Load Test

**Objective**: Verify the portal loads successfully and returns expected content.

**Steps**:
1. Start the Next.js development server
2. Navigate to `/portal/[profileId]` with the test profile
3. Wait for page load (timeout: 30 seconds)
4. Verify HTTP 200 response
5. Check for presence of portal content container

**Assertions**:
- Portal iframe or content loads without error
- No critical console errors
- Portal responds within 30 seconds

#### 2. Channel Listing Test

**Objective**: Verify the portal returns a valid channel list.

**Steps**:
1. After portal load, wait for channel data to load (timeout: 60 seconds)
2. Look for channel list elements in the DOM
3. Count available channels

**Assertions**:
- Channel list is non-empty
- At least one channel is displayed
- Channel names/titles are visible

#### 3. Playback Test

**Objective**: Verify video playback initiates correctly.

**Steps**:
1. Select the first available channel
2. Click to play the channel
3. Wait for video to start (timeout: 30 seconds)
4. Check video element state

**Assertions**:
- Video element exists in DOM
- Video source URL is set (not empty)
- Video is playing or has buffered content
- No playback errors in console

### Reliability Measures

#### Timeouts
- Page navigation: 30 seconds
- Portal load: 30 seconds
- Channel list fetch: 60 seconds
- Video playback start: 30 seconds

#### Retries
- Automatic retry on transient failures (max 3 attempts)
- Retry delay: 5 seconds between attempts

#### Cleanup
- Delete test profile after each test run
- Clear browser state between tests
- Release video resources properly

### How to Run Tests

#### Prerequisites
- Node.js 18+
- Playwright installed (`npm install -D @playwright/test`)

#### Running Tests

```bash
# Start development server
cd yasem-next
npm run dev

# In another terminal, run Playwright tests
npx playwright test
```

#### Test File Location
Tests should be placed in: `yasem-next/tests/portal-smoke.spec.ts`

#### Example Test Configuration (playwright.config.ts)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120000,
  expect: {
    timeout: 30000,
  },
  fullyParallel: true,
  retries: 2,
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

#### Environment Variables

```bash
# Optional: Override portal URL for testing
export TEST_PORTAL_URL=http://tres.4vps.info:80/c/

# Optional: Use fixed MAC for debugging
export TEST_MAC_ADDRESS=A0:BB:3E:17:1E:90
```

### Test Isolation

- Each test run uses a unique profile ID
- Tests clean up their own profiles after completion
- Parallel test execution uses different profile IDs
- No shared state between test runs

## Future Enhancements

- [ ] Add support for more STB types (additional MAG models, other manufacturers)
- [ ] Implement full EPG (Electronic Program Guide) support
- [ ] Add recording functionality
- [ ] Support for multi-profile management
- [ ] Cloud deployment configuration
- [ ] Mobile-responsive UI improvements
