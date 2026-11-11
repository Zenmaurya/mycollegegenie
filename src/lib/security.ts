// Copyright (c) Meta Platforms, Inc. and affiliates / Astryx Design System Standards
// Adapted for MyCollegeGenie platform security and input smoothness

/**
 * Sentinel keyCode 229 is reported by browsers while an IME (Input Method Editor)
 * processes a key event before compositionend.
 */
const IME_PROCESSING_KEY_CODE = 229;

/**
 * Determines whether a keyboard event is part of an IME composition.
 * Must be used in onKeyDown handlers to guard Enter, Escape, and arrow keys
 * from triggering premature commands while the user is composing text.
 */
export function isImeKeyEvent(event: {
  isComposing?: boolean;
  keyCode?: number;
}): boolean {
  return event.isComposing === true || event.keyCode === IME_PROCESSING_KEY_CODE;
}

/**
 * Validates that a URL strictly uses safe web protocols (http: or https:).
 * Blocks dangerous schemes like javascript:, data:, and vbscript:.
 */
export function isSafeUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  try {
    const formatted = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(formatted);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Safely opens an external link in a new browser tab with strict
 * rel="noopener noreferrer" protection to prevent reverse tabnabbing and window hijacking.
 */
export function openSafeExternalUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;

  try {
    const formatted = (trimmed.startsWith('http://') || trimmed.startsWith('https://'))
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(formatted);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
    window.open(parsed.href, '_blank', 'noopener,noreferrer');
    return true;
  } catch {
    return false;
  }
}

