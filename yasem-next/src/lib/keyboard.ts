// Keyboard utilities for consistent key handling across components

/**
 * Normalizes key detection across browsers.
 * Prefer e.code for function keys (more reliable across layouts),
 * fall back to e.key for compatibility.
 */
export function normalizeKey(e: KeyboardEvent): { key: string; code: string } {
  return {
    key: e.key,
    code: e.code,
  };
}

/**
 * Checks if the keyboard event is a function key (F1-F12).
 * Uses e.code as primary detection (e.g., "F1", "F2") with e.key fallback.
 */
export function isFunctionKey(e: KeyboardEvent, fnNumber?: number): boolean {
  const { code, key } = normalizeKey(e);

  if (fnNumber !== undefined) {
    const expectedCode = `F${fnNumber}`;
    return code === expectedCode || key === expectedCode;
  }

  // Check if it's any F1-F12 key
  return /^F(1[0-2]|[1-9])$/i.test(code) || /^F(1[0-2]|[1-9])$/i.test(key);
}

/**
 * Gets the function key number (1-12) from a keyboard event, or null if not a function key.
 */
export function getFunctionKeyNumber(e: KeyboardEvent): number | null {
  const { code, key } = normalizeKey(e);

  const match = code.match(/^F(1[0-2]|[1-9])$/i) || key.match(/^F(1[0-2]|[1-9])$/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  return null;
}

/**
 * Prevents default browser behavior for function keys.
 * Call this early in your handler to ensure browser defaults don't trigger.
 */
export function preventFunctionKeyDefaults(e: KeyboardEvent, fnNumbers?: number[]): boolean {
  const fnKey = getFunctionKeyNumber(e);

  if (fnKey === null) {
    return false;
  }

  if (fnNumbers === undefined || fnNumbers.includes(fnKey)) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }

  return false;
}

/**
 * Keyboard event listener options for capture phase.
 * Use this to ensure your listeners run before browser defaults.
 */
export const CAPTURE_LISTENER_OPTIONS: AddEventListenerOptions = {
  capture: true,
};
