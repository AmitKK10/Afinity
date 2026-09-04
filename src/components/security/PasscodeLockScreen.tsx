import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Lock,
  Delete,
  Fingerprint,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
  AlertTriangle,
} from 'lucide-react';
import { useSecurity } from '../../context/SecurityContext';
import { AfinityLogo } from '../brand/AfinityLogo';
import { cn } from '../../utils/cn';

export const PasscodeLockScreen: React.FC = () => {
  const {
    isLocked,
    passcodeLength,
    unlockWithPasscode,
    unlockWithBiometrics,
    biometricEnabled,
    biometricAvailable,
    hasBiometricCredential,
    isRateLimited,
    lockoutRemainingSeconds,
    emergencyResetPasscode,
  } = useSecurity();

  const [enteredPin, setEnteredPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isBiometricVerifying, setIsBiometricVerifying] = useState<boolean>(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState<boolean>(false);
  const [resetConfirmed, setResetConfirmed] = useState<boolean>(false);

  // Trigger PIN verification when all digits are entered
  const handleVerify = useCallback(
    async (pinToVerify: string) => {
      if (isSubmitting || isRateLimited) return;
      setIsSubmitting(true);
      setErrorMsg(null);

      try {
        const result = await unlockWithPasscode(pinToVerify);
        if (!result.success) {
          setErrorMsg(result.error || 'Incorrect PIN');
          setIsShaking(true);
          setEnteredPin('');
          setTimeout(() => setIsShaking(false), 500);
        } else {
          setEnteredPin('');
          setErrorMsg(null);
        }
      } catch (err: any) {
        setErrorMsg('Authentication error. Try again.');
        setIsShaking(true);
        setEnteredPin('');
        setTimeout(() => setIsShaking(false), 500);
      } finally {
        setIsSubmitting(false);
      }
    },
    [unlockWithPasscode, isSubmitting, isRateLimited]
  );

  // Handle Biometric unlock click - EXPLICIT USER TAP ONLY (never automated on mount)
  const handleBiometricClick = useCallback(async () => {
    if (isRateLimited || isSubmitting || isBiometricVerifying) return;
    setIsBiometricVerifying(true);
    setErrorMsg(null);

    try {
      const res = await unlockWithBiometrics();
      if (!res.success) {
        if (res.noCredential) {
          setErrorMsg(
            res.error ||
              `No biometric passkey is registered on this device. Use your ${passcodeLength}-digit passcode or set up biometric unlock in Security Settings.`
          );
        } else {
          setErrorMsg(res.error || 'Biometric verification failed');
        }
      } else {
        setEnteredPin('');
        setErrorMsg(null);
      }
    } catch (err: any) {
      setErrorMsg('Biometric authentication failed. Please enter your passcode.');
    } finally {
      setIsBiometricVerifying(false);
    }
  }, [isRateLimited, isSubmitting, isBiometricVerifying, unlockWithBiometrics, passcodeLength]);

  // Handle digit click or keypress
  const handleDigit = useCallback(
    (digit: string) => {
      if (isRateLimited || isSubmitting) return;
      if (enteredPin.length < passcodeLength) {
        const nextPin = enteredPin + digit;
        setEnteredPin(nextPin);
        setErrorMsg(null);

        if (nextPin.length === passcodeLength) {
          handleVerify(nextPin);
        }
      }
    },
    [enteredPin, passcodeLength, isRateLimited, isSubmitting, handleVerify]
  );

  // Handle backspace
  const handleBackspace = useCallback(() => {
    if (enteredPin.length > 0) {
      setEnteredPin((prev) => prev.slice(0, -1));
      setErrorMsg(null);
    }
  }, [enteredPin]);

  // Physical keyboard listener
  useEffect(() => {
    if (!isLocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        setEnteredPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked, handleDigit, handleBackspace]);

  if (!isLocked) return null;

  return (
    <div
      id="afinity-passcode-lock-screen"
      className="fixed inset-0 z-[9999] bg-[#050811] text-slate-100 flex flex-col justify-between items-center px-4 py-8 sm:py-12 select-none overflow-y-auto antialiased"
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
      </div>

      {/* Top Header / Branding */}
      <div className="relative z-10 flex flex-col items-center text-center space-y-3 pt-2">
        <AfinityLogo size="md" showWordmark={true} />

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs font-semibold text-cyan-300 shadow-inner">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span>Vault Locked</span>
        </div>
      </div>

      {/* Center PIN Display and Feedback */}
      <div className="relative z-10 flex flex-col items-center text-center my-auto py-4 max-w-sm w-full">
        <h2 className="text-xl sm:text-2xl font-black text-white font-heading tracking-tight mb-1">
          Enter Passcode
        </h2>
        <p className="text-xs text-slate-400 font-normal mb-6">
          Unlock your personal financial command center
        </p>

        {/* PIN Bubble Indicators */}
        <div
          className={cn(
            'flex items-center justify-center gap-4 sm:gap-5 mb-5 transition-transform duration-200',
            isShaking && 'animate-bounce text-rose-500'
          )}
        >
          {Array.from({ length: passcodeLength }).map((_, index) => {
            const isFilled = index < enteredPin.length;
            const isCurrent = index === enteredPin.length;

            return (
              <div
                key={index}
                className={cn(
                  'w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
                  isFilled
                    ? 'bg-gradient-to-tr from-cyan-400 to-blue-500 border-cyan-400 shadow-md shadow-cyan-500/40 scale-110'
                    : isCurrent
                    ? 'border-cyan-500/80 bg-slate-900/60 scale-105'
                    : 'border-slate-700 bg-slate-900/40'
                )}
              >
                {isFilled && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                )}
              </div>
            );
          })}
        </div>

        {/* Error / Rate Limit Feedback */}
        <div className="min-h-6 h-auto flex items-center justify-center mb-3 px-2 text-center">
          {isRateLimited ? (
            <span className="text-xs font-bold text-amber-400 font-mono flex items-center gap-1.5 animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Lockout active: {lockoutRemainingSeconds}s remaining</span>
            </span>
          ) : errorMsg ? (
            <span className="text-xs font-medium text-rose-300 flex items-center justify-center gap-1.5 leading-snug">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </span>
          ) : (
            <span className="text-[11px] text-slate-400">
              {passcodeLength}-digit security code
            </span>
          )}
        </div>

        {/* Prominent Biometric Indicator & Action Button when Biometrics are Detected */}
        {biometricAvailable && (
          <button
            type="button"
            id="lock-screen-use-biometrics-btn"
            onClick={handleBiometricClick}
            disabled={isRateLimited || isSubmitting || isBiometricVerifying}
            className={cn(
              'w-full max-w-[280px] mb-4 py-2.5 px-3 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center justify-between group select-none shadow-lg relative overflow-hidden',
              isBiometricVerifying
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/40 animate-pulse'
                : 'bg-slate-900/90 hover:bg-slate-800/95 border-cyan-500/50 hover:border-cyan-400 text-cyan-300 shadow-cyan-950/50 hover:shadow-cyan-500/25 active:scale-[0.98] ring-1 ring-cyan-500/20 hover:ring-cyan-400/40 animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]'
            )}
            title="Authenticate using platform biometric hardware"
          >
            {/* Ambient subtle background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-cyan-400/10 to-transparent pointer-events-none" />

            <div className="flex items-center gap-2.5 text-left relative z-10">
              <div className="relative">
                {/* Soft ambient glowing pulse halo */}
                <span className="absolute -inset-1 rounded-2xl bg-cyan-400/25 blur-md animate-pulse pointer-events-none" />

                <div
                  className={cn(
                    'relative p-2 rounded-xl border transition-all duration-300 shadow-[0_0_14px_rgba(6,182,212,0.35)]',
                    isBiometricVerifying
                      ? 'bg-cyan-500/25 border-cyan-300 text-cyan-200 animate-bounce shadow-[0_0_20px_rgba(6,182,212,0.6)]'
                      : 'bg-cyan-950/90 border-cyan-600/70 text-cyan-300 group-hover:border-cyan-400 group-hover:text-cyan-100 group-hover:scale-105 group-hover:shadow-[0_0_18px_rgba(6,182,212,0.5)]'
                  )}
                >
                  <Fingerprint className="w-5 h-5 animate-[pulse_2s_ease-in-out_infinite] drop-shadow-[0_0_6px_rgba(6,182,212,0.7)]" />
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-white font-heading flex items-center gap-1.5">
                  <span>
                    {isBiometricVerifying ? 'Scanning Biometrics...' : 'Use Biometrics'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Touch ID • Face ID • Windows Hello
                </p>
              </div>
            </div>

            <div className="flex items-center relative z-10">
              <span
                className={cn(
                  'text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border tracking-wide flex items-center gap-1.5 transition-colors',
                  isBiometricVerifying
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 animate-pulse'
                    : 'bg-emerald-950/90 text-emerald-300 border-emerald-700/70 shadow-xs'
                )}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                {isBiometricVerifying ? 'Scanning' : 'Detected'}
              </span>
            </div>
          </button>
        )}

        {/* Numeric Touch Keypad */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              id={`lock-keypad-${digit}`}
              onClick={() => handleDigit(digit)}
              disabled={isRateLimited || isSubmitting}
              className="h-14 sm:h-16 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 active:bg-cyan-950 border border-slate-800 hover:border-slate-700 active:border-cyan-500 text-xl font-bold font-mono text-white shadow-md flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 select-none active:scale-95"
            >
              {digit}
            </button>
          ))}

          {/* Biometric Button or Empty Space */}
          {biometricAvailable ? (
            <button
              type="button"
              id="lock-keypad-biometric"
              onClick={handleBiometricClick}
              disabled={isRateLimited || isSubmitting || isBiometricVerifying}
              title="Unlock with Biometrics (Touch ID / Face ID / Windows Hello)"
              className={cn(
                'h-14 sm:h-16 rounded-2xl bg-slate-900/60 hover:bg-slate-800/90 active:bg-cyan-950 border border-cyan-500/40 hover:border-cyan-400 text-cyan-400 flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 select-none active:scale-95',
                isBiometricVerifying
                  ? 'animate-pulse bg-cyan-950/60 border-cyan-400 text-cyan-300'
                  : 'animate-[pulse_2.5s_cubic-bezier(0.4,0,0.6,1)_infinite]'
              )}
            >
              <Fingerprint
                className={cn(
                  'w-6 h-6 drop-shadow-[0_0_6px_rgba(6,182,212,0.6)]',
                  isBiometricVerifying ? 'animate-bounce text-cyan-300' : 'text-cyan-400'
                )}
              />
            </button>
          ) : (
            <div className="h-14 sm:h-16" />
          )}

          {/* 0 Key */}
          <button
            type="button"
            id="lock-keypad-0"
            onClick={() => handleDigit('0')}
            disabled={isRateLimited || isSubmitting}
            className="h-14 sm:h-16 rounded-2xl bg-slate-900/70 hover:bg-slate-800/90 active:bg-cyan-950 border border-slate-800 hover:border-slate-700 active:border-cyan-500 text-xl font-bold font-mono text-white shadow-md flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 select-none active:scale-95"
          >
            0
          </button>

          {/* Backspace Key */}
          <button
            type="button"
            id="lock-keypad-backspace"
            onClick={handleBackspace}
            disabled={isRateLimited || isSubmitting || enteredPin.length === 0}
            title="Delete digit"
            className="h-14 sm:h-16 rounded-2xl bg-slate-900/40 hover:bg-slate-800/80 active:bg-slate-800 border border-slate-800/60 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer disabled:opacity-30 select-none active:scale-95"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Actions: Forgot PIN / Emergency Assistance */}
      <div className="relative z-10 flex flex-col items-center gap-2 pt-4">
        <button
          type="button"
          onClick={() => setIsResetDialogOpen(true)}
          className="text-xs text-slate-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-3 rounded-lg hover:bg-slate-900/60"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Forgot Passcode?</span>
        </button>

        <p className="text-[10px] text-slate-400 text-center max-w-xs">
          Passcode verification executes 100% offline within your local device enclave.
        </p>
      </div>

      {/* Emergency Reset Dialog */}
      {isResetDialogOpen && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 text-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-amber-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold font-heading text-white">
                  Reset Passcode Lock
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetDialogOpen(false);
                  setResetConfirmed(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Afinity encrypts your passcode salt locally in your browser. If you forgot your passcode, you can clear the PIN lock while preserving your existing financial records.
            </p>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Zero-Knowledge Protection</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Resetting the lock removes the PIN barrier so you can re-enter your dashboard or set a new passcode in Preferences.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsResetDialogOpen(false);
                  setResetConfirmed(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  await emergencyResetPasscode();
                  setIsResetDialogOpen(false);
                  setResetConfirmed(false);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-bold text-xs cursor-pointer shadow-md"
              >
                Reset PIN &amp; Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
