/**
 * Afinity Security & Cryptographic Utilities
 * Provides offline SHA-256 hashing, salt generation, and biometric verification
 */

/**
 * Generate a random cryptographic hex salt
 */
export function generateSalt(length = 16): string {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  // Fallback random string
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * Hash a passcode with a salt using Web Crypto SHA-256 (with pure JS fallback)
 */
export async function hashPasscode(passcode: string, salt: string): Promise<string> {
  const combined = `${passcode}::afinity_salt::${salt}`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(combined);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // If subtle crypto fails (e.g. non-secure context in old browser), use fallback
    }
  }

  // Pure JS fallback hash implementation
  return simpleSha256Fallback(combined);
}

/**
 * Verify an entered passcode against stored hash and salt
 */
export async function verifyPasscode(
  inputPasscode: string,
  salt: string,
  storedHash: string
): Promise<boolean> {
  if (!inputPasscode || !salt || !storedHash) return false;
  const computedHash = await hashPasscode(inputPasscode, salt);
  return computedHash === storedHash;
}

/**
 * Check if the current device/browser supports WebAuthn Biometrics safely
 */
export async function checkBiometricsSupport(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    // WebAuthn requires a secure context (HTTPS or localhost)
    if (window.isSecureContext === false) {
      return false;
    }

    if (
      window.PublicKeyCredential &&
      typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
    ) {
      const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      return Boolean(available);
    }
  } catch (err) {
    console.warn('Biometric support check notice:', err);
  }
  return false;
}

/**
 * Get current origin / RP ID for WebAuthn scoping
 */
export function getWebAuthnRpId(): string {
  if (typeof window === 'undefined') return 'localhost';
  return window.location.hostname || 'localhost';
}

/**
 * Retrieve registered credential ID for the current origin/device
 */
export function getRegisteredBiometricCredentialId(savedCredentialId?: string): string | null {
  if (typeof window === 'undefined') return null;
  const rpId = getWebAuthnRpId();
  try {
    // 1. Check origin-scoped storage
    const originCred = localStorage.getItem(`afinity_biometric_cred_${rpId}`);
    if (originCred) return originCred;

    // 2. Check explicitly provided credential ID from user settings if valid
    if (savedCredentialId && typeof savedCredentialId === 'string' && savedCredentialId.trim().length > 0) {
      return savedCredentialId.trim();
    }

    // 3. Fallback check for legacy storage key
    const legacyCred = localStorage.getItem('afinity_biometric_cred_id');
    if (legacyCred) return legacyCred;
  } catch {
    // Storage access blocked or restricted
  }
  return null;
}

/**
 * Check if a valid biometric credential is registered for this device and origin
 */
export function isBiometricCredentialRegistered(savedCredentialId?: string): boolean {
  return Boolean(getRegisteredBiometricCredentialId(savedCredentialId));
}

/**
 * Clear stored biometric credential metadata for this origin
 */
export function clearRegisteredBiometricCredential(): void {
  if (typeof window === 'undefined') return;
  const rpId = getWebAuthnRpId();
  try {
    localStorage.removeItem(`afinity_biometric_cred_${rpId}`);
    localStorage.removeItem('afinity_biometric_cred_id');
  } catch {
    // Storage access fallback
  }
}

/**
 * Helper to encode ArrayBuffer to Base64
 */
export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Helper to decode Base64 to ArrayBuffer
 */
export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Register a local WebAuthn platform biometric credential for the vault
 */
export async function registerBiometricCredential(): Promise<{
  success: boolean;
  credentialId?: string;
  rpId?: string;
  error?: string;
}> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return { success: false, error: 'WebAuthn passkeys are not supported on this browser' };
  }

  if (window.isSecureContext === false) {
    return { success: false, error: 'Biometric passkeys require a secure connection (HTTPS)' };
  }

  try {
    const challenge = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
    } else {
      for (let i = 0; i < 32; i++) challenge[i] = Math.floor(Math.random() * 256);
    }

    const userId = new Uint8Array(16);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(userId);
    } else {
      for (let i = 0; i < 16; i++) userId[i] = Math.floor(Math.random() * 256);
    }

    const rpId = getWebAuthnRpId();

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Afinity Financial Vault',
          id: rpId,
        },
        user: {
          id: userId,
          name: 'afinity_vault_owner',
          displayName: 'Afinity Vault Owner',
        },
        pubKeyCredParams: [
          { type: 'public-key', alg: -7 },   // ES256
          { type: 'public-key', alg: -257 }, // RS256
          { type: 'public-key', alg: -8 },   // Ed25519
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
          residentKey: 'preferred',
        },
        timeout: 60000,
        attestation: 'none',
      },
    })) as PublicKeyCredential | null;

    if (credential && credential.rawId) {
      const credIdBase64 = bufferToBase64(credential.rawId);
      try {
        localStorage.setItem(`afinity_biometric_cred_${rpId}`, credIdBase64);
        localStorage.setItem('afinity_biometric_cred_id', credIdBase64);
      } catch {
        // LocalStorage fallback
      }
      return { success: true, credentialId: credIdBase64, rpId };
    }

    return { success: false, error: 'Authenticator did not return a credential' };
  } catch (err: any) {
    console.warn('Biometric credential registration info:', err);
    if (err?.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric registration was cancelled or timed out' };
    }
    if (err?.name === 'InvalidStateError') {
      return { success: false, error: 'A biometric passkey is already registered on this device' };
    }
    if (err?.name === 'SecurityError') {
      return { success: false, error: 'Biometrics blocked by browser or iframe security policy' };
    }
    return { success: false, error: err?.message || 'Failed to initialize biometric hardware' };
  }
}

/**
 * Verify Biometrics using WebAuthn Assertion
 * Safe execution: only calls navigator.credentials.get if a credential has previously been registered.
 */
export async function verifyBiometricsCredential(
  savedCredentialId?: string
): Promise<{ success: boolean; error?: string; noCredential?: boolean }> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential || !navigator.credentials) {
    return {
      success: false,
      error: 'Biometric authentication is not supported on this device/browser',
    };
  }

  // Pre-check: Ensure a credential ID exists for this origin before invoking WebAuthn
  const credId = getRegisteredBiometricCredentialId(savedCredentialId);
  if (!credId) {
    return {
      success: false,
      noCredential: true,
      error:
        'No biometric passkey is registered on this device. Use your 6-digit passcode or set up biometric unlock in Security Settings.',
    };
  }

  try {
    const challenge = new Uint8Array(32);
    if (window.crypto && window.crypto.getRandomValues) {
      window.crypto.getRandomValues(challenge);
    } else {
      for (let i = 0; i < 32; i++) challenge[i] = Math.floor(Math.random() * 256);
    }

    const rpId = getWebAuthnRpId();

    const allowCredentials = [
      {
        type: 'public-key' as const,
        id: base64ToBuffer(credId),
        transports: ['internal' as const],
      },
    ];

    const assertion = await navigator.credentials.get({
      publicKey: {
        challenge,
        rpId,
        allowCredentials,
        userVerification: 'preferred',
        timeout: 60000,
      },
    });

    if (assertion) {
      return { success: true };
    }
    return { success: false, error: 'Biometric verification did not return assertion' };
  } catch (err: any) {
    console.warn('Biometric assertion attempt:', err);
    if (err?.name === 'NotAllowedError') {
      return { success: false, error: 'Biometric scan was cancelled or timed out' };
    }
    if (err?.name === 'InvalidStateError') {
      return {
        success: false,
        noCredential: true,
        error:
          'No matching passkey found on this device. Use your passcode or re-register biometrics in Settings.',
      };
    }
    if (err?.name === 'SecurityError') {
      return { success: false, error: 'Biometrics restricted by browser security policy' };
    }
    return { success: false, error: err?.message || 'Biometric verification failed' };
  }
}

/**
 * Fallback SHA-256 implementation for environments without WebCrypto subtle
 */
function simpleSha256Fallback(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0, j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii[lengthProperty] * 8;

  let hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5,
    0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
    0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc,
    0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7,
    0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
    0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3,
    0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5,
    0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
    0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  let compositeClear = false;
  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (i = 0; i < ascii[lengthProperty]; i++) {
    const charCode = ascii.charCodeAt(i);
    words[i >> 2] |= charCode << ((3 - (i % 4)) * 8);
  }

  const w: number[] = new Array(64);

  for (let block = 0; block < words.length; block += 16) {
    const oldHash = hash.slice(0);

    for (i = 0; i < 64; i++) {
      if (i < 16) {
        w[i] = words[block + i] | 0;
      } else {
        const gamma0 =
          rightRotate(w[i - 15], 7) ^
          rightRotate(w[i - 15], 18) ^
          (w[i - 15] >>> 3);
        const gamma1 =
          rightRotate(w[i - 2], 17) ^
          rightRotate(w[i - 2], 19) ^
          (w[i - 2] >>> 10);
        w[i] = ((w[i - 16] + gamma0 + w[i - 7] + gamma1) | 0);
      }

      const s1 =
        rightRotate(hash[4], 6) ^
        rightRotate(hash[4], 11) ^
        rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1 + ch + k[i] + w[i]) | 0;
      const s0 =
        rightRotate(hash[0], 2) ^
        rightRotate(hash[0], 13) ^
        rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0 + maj) | 0;

      hash = [
        (temp1 + temp2) | 0,
        hash[0],
        hash[1],
        hash[2],
        (hash[3] + temp1) | 0,
        hash[4],
        hash[5],
        hash[6],
      ];
    }

    for (j = 0; j < 8; j++) {
      hash[j] = (hash[j] + oldHash[j]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }

  return result;
}
