/**
 * Test utilities for portal smoke tests
 * 
 * Provides helper functions for generating device identities
 * with fixed MAC address and randomized SN/device ID.
 */

export const TEST_CONFIG = {
  /** Fixed MAC address - never randomized */
  MAC_ADDRESS: 'A0:BB:3E:17:1E:90',
  
  /** Portal URL for testing */
  PORTAL_URL: process.env.TEST_PORTAL_URL || 'http://tres.4vps.info:80/c/',
  
  /** Default STB model */
  STB_MODEL: 'MAG250',
  
  /** Serial number prefix for identification */
  SN_PREFIX: 'DEADBEEF',
};

/**
 * Generate a random serial number
 * Format: PREFIX + 4 random hex digits (12 characters total)
 * Example: DEADBEEF1A2B
 */
export function generateSerialNumber(): string {
  const randomHex = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `${TEST_CONFIG.SN_PREFIX}${randomHex.padStart(4, '0')}`;
}

/**
 * Generate a random device ID
 * Format: mag-{timestamp}-{random6chars}
 * Example: mag-1700000000-abc123
 */
export function generateDeviceId(): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).slice(2, 8);
  return `mag-${timestamp}-${randomSuffix}`;
}

/**
 * Generate complete device identity for testing
 * - MAC: Fixed (A0:BB:3E:17:1E:90)
 * - SN: Randomly generated
 * - Device ID: Randomly generated
 */
export function generateTestDeviceIdentity() {
  return {
    mac: TEST_CONFIG.MAC_ADDRESS,
    serialNumber: generateSerialNumber(),
    deviceId: generateDeviceId(),
    model: TEST_CONFIG.STB_MODEL,
  };
}

/**
 * Create a test profile configuration object
 * This can be saved to profiles.json or passed to the STB API
 */
export function createTestProfileConfig(
  portalUrl: string = TEST_CONFIG.PORTAL_URL,
  model: string = TEST_CONFIG.STB_MODEL
) {
  const identity = generateTestDeviceIdentity();
  
  return {
    profile: {
      name: `Test Profile ${Date.now()}`,
      portal: portalUrl,
      submodel: model,
    },
    mag: {
      mac_address: identity.mac,
      serial_number: identity.serialNumber,
    },
    // Device ID is stored under a custom key for test identification
    test: {
      device_id: identity.deviceId,
    },
  };
}

export default {
  TEST_CONFIG,
  generateSerialNumber,
  generateDeviceId,
  generateTestDeviceIdentity,
  createTestProfileConfig,
};
