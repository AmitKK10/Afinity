/**
 * Afinity Security & Passcode Lock Context
 * Manages PWA background auto-locking, PIN verification, and session state.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useFinancialData } from './FinancialDataContext';
import {
  generateSalt,
  hashPasscode,
  verifyPasscode,
  checkBiometricsSupport,
  registerBiometricCredential,
  verifyBiometricsCredential,
  isBiometricCredentialRegistered,
  getRegisteredBiometricCredentialId,
  clearRegisteredBiometricCredential,
} from '../utils/security';

interface SecurityContextType {
  isLocked: boolean;
  isPasscodeConfigured: boolean;
  passcodeLength: 4 | 6;
  lockOnBackground: boolean;
  lockTimeoutSeconds: number;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  hasBiometricCredential: boolean;
  failedAttempts: number;
  isRateLimited: boolean;
  lockoutRemainingSeconds: number;
  lockVault: () => void;
  unlockWithPasscode: (enteredPin: string) => Promise<{ success: boolean; error?: string }>;
  unlockWithBiometrics: () => Promise<{ success: boolean; error?: string; noCredential?: boolean }>;
  enableBiometrics: () => Promise<{ success: boolean; error?: string }>;
  disableBiometrics: () => Promise<void>;
  setupPasscode: (
    pin: string,
    length: 4 | 6,
    options?: {
      lockOnBackground?: boolean;
      lockTimeoutSeconds?: number;
      biometricEnabled?: boolean;
    }
  ) => Promise<void>;
  disablePasscode: (currentPin: string) => Promise<{ success: boolean; error?: string }>;
  changePasscode: (
    currentPin: string,
    newPin: string,
    length: 4 | 6
  ) => Promise<{ success: boolean; error?: string }>;
  emergencyResetPasscode: () => Promise<void>;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

const PASSHASH_ACTIVE_KEY = 'afinity_passcode_active';
const SESSION_UNLOCKED_KEY = 'afinity_vault_unlocked_session';
const LAST_ACTIVE_KEY = 'afinity_vault_last_active_ts';
const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
const LOCKOUT_DURATION_SECONDS = 30;

export const SecurityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, updateUserSettings } = useFinancialData();

  const isPasscodeConfigured = Boolean(
    settings.passcodeEnabled && settings.passcodeHash && settings.passcodeSalt
  );

  const passcodeLength: 4 | 6 = settings.passcodeLength === 6 ? 6 : 4;
  const lockOnBackground = settings.lockOnBackground ?? true;
  const lockTimeoutSeconds = settings.lockTimeoutSeconds ?? 0;
  const biometricEnabled = settings.biometricEnabled ?? false;

  // Initialize lock state: Check if passcode is active and if not yet unlocked in this session
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const isLocallyActive = localStorage.getItem(PASSHASH_ACTIVE_KEY) === 'true';
      const isConfiguredInSettings = Boolean(
        settings.passcodeEnabled && settings.passcodeHash && settings.passcodeSalt
      );
      const isArmed = isLocallyActive || isConfiguredInSettings;
      if (!isArmed) return false;

      const sessionUnlocked = sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
      return !sessionUnlocked;
    } catch {
      return false;
    }
  });

  const [biometricAvailable, setBiometricAvailable] = useState<boolean>(false);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemainingSeconds, setLockoutRemainingSeconds] = useState<number>(0);

  const hasBiometricCredential = Boolean(
    isBiometricCredentialRegistered(settings.biometricCredentialId)
  );

  const backgroundTimestampRef = useRef<number | null>(null);
  const lockoutTimerRef = useRef<any>(null);

  // Check WebAuthn Biometrics hardware capability
  useEffect(() => {
    let isMounted = true;
    checkBiometricsSupport().then((supported) => {
      if (isMounted) {
        setBiometricAvailable(supported);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync lock state when settings change from database
  useEffect(() => {
    if (isPasscodeConfigured) {
      try {
        localStorage.setItem(PASSHASH_ACTIVE_KEY, 'true');
      } catch (e) {
        console.warn('Could not cache passcode status:', e);
      }

      const sessionUnlocked = sessionStorage.getItem(SESSION_UNLOCKED_KEY) === 'true';
      if (!sessionUnlocked) {
        setIsLocked(true);
      }
    } else {
      try {
        localStorage.removeItem(PASSHASH_ACTIVE_KEY);
        sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
      } catch (e) {
        console.warn('Could not clear passcode cache:', e);
      }
      setIsLocked(false);
    }
  }, [isPasscodeConfigured]);

  // Rate limiting cooldown timer
  useEffect(() => {
    if (lockoutRemainingSeconds > 0) {
      lockoutTimerRef.current = setTimeout(() => {
        setLockoutRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else {
      clearTimeout(lockoutTimerRef.current);
    }
    return () => clearTimeout(lockoutTimerRef.current);
  }, [lockoutRemainingSeconds]);

  /**
   * Lock Vault immediately
   */
  const lockVault = useCallback(() => {
    if (isPasscodeConfigured) {
      try {
        sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
        localStorage.removeItem(LAST_ACTIVE_KEY);
      } catch (e) {
        console.warn('Failed to clear session storage:', e);
      }
      setIsLocked(true);
    }
  }, [isPasscodeConfigured]);

  /**
   * Unlock with entered PIN
   */
  const unlockWithPasscode = useCallback(
    async (enteredPin: string): Promise<{ success: boolean; error?: string }> => {
      if (lockoutRemainingSeconds > 0) {
        return {
          success: false,
          error: `Too many failed attempts. Please wait ${lockoutRemainingSeconds}s.`,
        };
      }

      if (!isPasscodeConfigured || !settings.passcodeSalt || !settings.passcodeHash) {
        setIsLocked(false);
        try {
          sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
        } catch {}
        return { success: true };
      }

      const isValid = await verifyPasscode(
        enteredPin,
        settings.passcodeSalt,
        settings.passcodeHash
      );

      if (isValid) {
        setIsLocked(false);
        setFailedAttempts(0);
        try {
          sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
          localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        } catch {}
        return { success: true };
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);

        if (nextAttempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
          setLockoutRemainingSeconds(LOCKOUT_DURATION_SECONDS);
          return {
            success: false,
            error: `Incorrect PIN. Lockout active for ${LOCKOUT_DURATION_SECONDS}s.`,
          };
        }

        const remaining = MAX_ATTEMPTS_BEFORE_LOCKOUT - nextAttempts;
        return {
          success: false,
          error: `Incorrect PIN (${remaining} attempt${remaining > 1 ? 's' : ''} left)`,
        };
      }
    },
    [
      isPasscodeConfigured,
      settings.passcodeSalt,
      settings.passcodeHash,
      failedAttempts,
      lockoutRemainingSeconds,
    ]
  );

  /**
   * Unlock with Biometrics (WebAuthn Platform Authenticator)
   */
  const unlockWithBiometrics = useCallback(async (): Promise<{
    success: boolean;
    error?: string;
    noCredential?: boolean;
  }> => {
    try {
      const res = await verifyBiometricsCredential(settings.biometricCredentialId);
      if (res.success) {
        setIsLocked(false);
        setFailedAttempts(0);
        try {
          sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
          localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
        } catch {}
        return { success: true };
      }
      return {
        success: false,
        noCredential: res.noCredential,
        error: res.error || 'Biometric verification failed',
      };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Biometric authentication failed' };
    }
  }, [settings.biometricCredentialId]);

  /**
   * Enable Biometrics with explicit credential registration
   */
  const enableBiometrics = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      let credId = getRegisteredBiometricCredentialId(settings.biometricCredentialId);
      if (!credId) {
        const regRes = await registerBiometricCredential();
        if (!regRes.success || !regRes.credentialId) {
          return {
            success: false,
            error: regRes.error || 'Biometric registration was not completed',
          };
        }
        credId = regRes.credentialId;
      }

      await updateUserSettings({
        biometricEnabled: true,
        biometricCredentialId: credId,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to activate biometric unlock' };
    }
  }, [settings.biometricCredentialId, updateUserSettings]);

  /**
   * Disable Biometrics
   */
  const disableBiometrics = useCallback(async () => {
    clearRegisteredBiometricCredential();
    await updateUserSettings({
      biometricEnabled: false,
      biometricCredentialId: undefined,
    });
  }, [updateUserSettings]);

  /**
   * Set up new passcode and security settings
   */
  const setupPasscode = useCallback(
    async (
      pin: string,
      length: 4 | 6,
      options?: {
        lockOnBackground?: boolean;
        lockTimeoutSeconds?: number;
        biometricEnabled?: boolean;
      }
    ) => {
      const salt = generateSalt(16);
      const hash = await hashPasscode(pin, salt);

      let credId: string | undefined = undefined;
      if (options?.biometricEnabled) {
        try {
          const regRes = await registerBiometricCredential();
          if (regRes.success && regRes.credentialId) {
            credId = regRes.credentialId;
          }
        } catch (e) {
          console.warn('Biometric registration optional fallback:', e);
        }
      }

      await updateUserSettings({
        passcodeEnabled: true,
        passcodeHash: hash,
        passcodeSalt: salt,
        passcodeLength: length,
        lockOnBackground: options?.lockOnBackground ?? true,
        lockTimeoutSeconds: options?.lockTimeoutSeconds ?? 0,
        biometricEnabled: options?.biometricEnabled ?? false,
        biometricCredentialId: credId,
      });

      try {
        localStorage.setItem(PASSHASH_ACTIVE_KEY, 'true');
        sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      } catch {}

      setIsLocked(false);
      setFailedAttempts(0);
    },
    [updateUserSettings]
  );

  /**
   * Disable passcode (requires verifying current PIN)
   */
  const disablePasscode = useCallback(
    async (currentPin: string): Promise<{ success: boolean; error?: string }> => {
      if (!settings.passcodeSalt || !settings.passcodeHash) {
        await updateUserSettings({
          passcodeEnabled: false,
          passcodeHash: undefined,
          passcodeSalt: undefined,
          biometricEnabled: false,
          biometricCredentialId: undefined,
        });
        try {
          localStorage.removeItem(PASSHASH_ACTIVE_KEY);
          sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
          localStorage.removeItem(LAST_ACTIVE_KEY);
        } catch {}
        setIsLocked(false);
        return { success: true };
      }

      const isValid = await verifyPasscode(
        currentPin,
        settings.passcodeSalt,
        settings.passcodeHash
      );

      if (!isValid) {
        return { success: false, error: 'Current PIN is incorrect' };
      }

      await updateUserSettings({
        passcodeEnabled: false,
        passcodeHash: undefined,
        passcodeSalt: undefined,
        biometricEnabled: false,
        biometricCredentialId: undefined,
      });

      try {
        localStorage.removeItem(PASSHASH_ACTIVE_KEY);
        sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
        localStorage.removeItem(LAST_ACTIVE_KEY);
      } catch {}

      setIsLocked(false);
      return { success: true };
    },
    [settings.passcodeSalt, settings.passcodeHash, updateUserSettings]
  );

  /**
   * Change passcode (requires verifying current PIN first)
   */
  const changePasscode = useCallback(
    async (
      currentPin: string,
      newPin: string,
      length: 4 | 6
    ): Promise<{ success: boolean; error?: string }> => {
      if (settings.passcodeSalt && settings.passcodeHash) {
        const isValid = await verifyPasscode(
          currentPin,
          settings.passcodeSalt,
          settings.passcodeHash
        );
        if (!isValid) {
          return { success: false, error: 'Current PIN is incorrect' };
        }
      }

      const salt = generateSalt(16);
      const hash = await hashPasscode(newPin, salt);

      await updateUserSettings({
        passcodeEnabled: true,
        passcodeHash: hash,
        passcodeSalt: salt,
        passcodeLength: length,
      });

      try {
        localStorage.setItem(PASSHASH_ACTIVE_KEY, 'true');
        sessionStorage.setItem(SESSION_UNLOCKED_KEY, 'true');
        localStorage.setItem(LAST_ACTIVE_KEY, Date.now().toString());
      } catch {}

      setIsLocked(false);
      setFailedAttempts(0);
      return { success: true };
    },
    [settings.passcodeSalt, settings.passcodeHash, updateUserSettings]
  );

  /**
   * Emergency reset passcode only
   */
  const emergencyResetPasscode = useCallback(async () => {
    clearRegisteredBiometricCredential();
    await updateUserSettings({
      passcodeEnabled: false,
      passcodeHash: undefined,
      passcodeSalt: undefined,
      biometricEnabled: false,
      biometricCredentialId: undefined,
    });
    try {
      localStorage.removeItem(PASSHASH_ACTIVE_KEY);
      sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
      localStorage.removeItem(LAST_ACTIVE_KEY);
    } catch {}
    setIsLocked(false);
    setFailedAttempts(0);
  }, [updateUserSettings]);

  // ==========================================
  // PWA BACKGROUND DETECTION & AUTO-LOCK LOGIC
  // ==========================================
  useEffect(() => {
    if (!isPasscodeConfigured || !lockOnBackground) {
      return;
    }

    const checkAndLockIfElapsed = () => {
      const lastActive = backgroundTimestampRef.current || Number(localStorage.getItem(LAST_ACTIVE_KEY) || 0);
      if (lastActive > 0) {
        const elapsedSeconds = (Date.now() - lastActive) / 1000;
        if (elapsedSeconds >= lockTimeoutSeconds) {
          try {
            sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
          } catch {}
          setIsLocked(true);
        }
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const now = Date.now();
        backgroundTimestampRef.current = now;
        try {
          localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
        } catch {}

        if (lockTimeoutSeconds === 0) {
          try {
            sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
          } catch {}
          setIsLocked(true);
        }
      } else if (document.visibilityState === 'visible') {
        checkAndLockIfElapsed();
        backgroundTimestampRef.current = null;
      }
    };

    const handleWindowBlur = () => {
      const now = Date.now();
      if (!backgroundTimestampRef.current) {
        backgroundTimestampRef.current = now;
      }
      try {
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      } catch {}

      if (lockTimeoutSeconds === 0) {
        try {
          sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
        } catch {}
        setIsLocked(true);
      }
    };

    const handleWindowFocus = () => {
      checkAndLockIfElapsed();
      backgroundTimestampRef.current = null;
    };

    const handlePageHide = () => {
      const now = Date.now();
      backgroundTimestampRef.current = now;
      try {
        localStorage.setItem(LAST_ACTIVE_KEY, now.toString());
      } catch {}

      if (lockTimeoutSeconds === 0) {
        try {
          sessionStorage.removeItem(SESSION_UNLOCKED_KEY);
        } catch {}
        setIsLocked(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isPasscodeConfigured, lockOnBackground, lockTimeoutSeconds]);

  return (
    <SecurityContext.Provider
      value={{
        isLocked,
        isPasscodeConfigured,
        passcodeLength,
        lockOnBackground,
        lockTimeoutSeconds,
        biometricAvailable,
        biometricEnabled,
        hasBiometricCredential,
        failedAttempts,
        isRateLimited: lockoutRemainingSeconds > 0,
        lockoutRemainingSeconds,
        lockVault,
        unlockWithPasscode,
        unlockWithBiometrics,
        enableBiometrics,
        disableBiometrics,
        setupPasscode,
        disablePasscode,
        changePasscode,
        emergencyResetPasscode,
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = (): SecurityContextType => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
};
