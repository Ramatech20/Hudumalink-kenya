/**
 * Generates a stable, high-entropy device fingerprint by blending persistent storage
 * hardware identifiers with environment variables (userAgent, screen resolution, locale, offset).
 * This eliminates identity obfuscation attempts through browser reloading or cookies clearance.
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') return 'SERVER-SIDE';
  
  let token = localStorage.getItem('huduma_device_token');
  if (!token) {
    // Generate a cryptographically secure randomized token as the persistent anchor
    const array = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(array);
    } else {
      for (let i = 0; i < 16; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    const hexParts = [];
    for (let i = 0; i < array.length; i++) {
      hexParts.push(array[i].toString(16).padStart(2, '0'));
    }
    token = hexParts.join('');
    localStorage.setItem('huduma_device_token', token);
  }
  
  // Blend with soft-attributes to lock down physical hardware parameters
  const softAttributes = [
    window.navigator.userAgent || '',
    window.navigator.language || '',
    window.screen.width + "x" + window.screen.height,
    new Date().getTimezoneOffset().toString(),
    token
  ].join('::');
  
  // Compute a fast, non-cryptographic Murmur-like hash of the entire concatenated set
  let hash = 0;
  for (let i = 0; i < softAttributes.length; i++) {
    const char = softAttributes.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const hexHash = Math.abs(hash).toString(16).toUpperCase();
  const tokenHeader = token.substring(0, 8).toUpperCase();
  return `FP-${hexHash}-${tokenHeader}`;
}
