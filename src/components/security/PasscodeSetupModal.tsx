import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  KeyRound,
  Fingerprint,
  Clock,
  CheckCircle2,
  AlertCircle,
  Delete,
  X,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useSecurity } from '../../context/SecurityContext';
import { cn } from '../../utils/cn';

interface PasscodeSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'setup' | 'change' | 'disable';
  onSuccess: (message: string) => void;
}

export const PasscodeSetupModal: React.FC<PasscodeSetupModalProps> = ({
  isOpen,
  onClose,
  mode = 'setup',
  onSuccess,
}) => {
  const {
    isPasscodeConfigured,
    passcodeLength: currentPasscodeLength,
    lockOnBackground: initialLockOnBackground,
    lockTimeoutSeconds: initialTimeout,
    biometricAvailable,
    biometricEnabled: initialBiometric,
    setupPasscode,
    changePasscode,
    disablePasscode,
  } = useSecurity();

  // Mode & step state
  // Steps: 'verify_current' | 'choose_length' | 'enter_new' | 'confirm_new' | 'options'
  const [step, setStep] = useState<'verify_current' | 'enter_new' | 'confirm_new' | 'options'>(
    mode === 'setup' ? 'enter_new' : 'verify_current'
  );

  const [pinLength, setPinLength] = useState<4 | 6>(currentPasscodeLength || 4);
  const [currentPin, setCurrentPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [lockTimeout, setLockTimeout] = useState<number>(initialTimeout ?? 0);
  const [lockOnBg, setLockOnBg] = useState<boolean>(initialLockOnBackground ?? true);
  const [biometricOn, setBiometricOn] = useState<boolean>(initialBiometric ?? false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Reset state on open/mode change
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setPinLength(currentPasscodeLength || 4);
      setLockTimeout(initialTimeout ?? 0);
      setLockOnBg(initialLockOnBackground ?? true);
      setBiometricOn(initialBiometric ?? false);

      if (mode === 'setup') {
        setStep('enter_new');
      } else {
        setStep('verify_current');
      }
    }
  }, [isOpen, mode, currentPasscodeLength, initialTimeout, initialLockOnBackground, initialBiometric]);

  // Active PIN being edited based on current step
  const activePinValue =
    step === 'verify_current'
      ? currentPin
      : step === 'enter_new'
      ? newPin
      : step === 'confirm_new'
      ? confirmPin
      : '';

  const targetLength = step === 'verify_current' ? currentPasscodeLength : pinLength;

  const handleDigitInput = (digit: string) => {
    setErrorMsg(null);
    if (step === 'verify_current') {
      if (currentPin.length < targetLength) {
        const next = currentPin + digit;
        setCurrentPin(next);
        if (next.length === targetLength) {
          handleVerifyCurrentSubmit(next);
        }
      }
    } else if (step === 'enter_new') {
      if (newPin.length < targetLength) {
        const next = newPin + digit;
        setNewPin(next);
        if (next.length === targetLength) {
          setTimeout(() => {
            setStep('confirm_new');
          }, 150);
        }
      }
    } else if (step === 'confirm_new') {
      if (confirmPin.length < targetLength) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === targetLength) {
          handleConfirmNewSubmit(next);
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    if (step === 'verify_current') {
      setCurrentPin((prev) => prev.slice(0, -1));
    } else if (step === 'enter_new') {
      setNewPin((prev) => prev.slice(0, -1));
    } else if (step === 'confirm_new') {
      setConfirmPin((prev) => prev.slice(0, -1));
    }
  };

  const handleVerifyCurrentSubmit = async (pinToCheck: string) => {
    if (mode === 'disable') {
      setIsSubmitting(true);
      const res = await disablePasscode(pinToCheck);
      setIsSubmitting(false);
      if (res.success) {
        onSuccess('✓ Passcode lock disabled successfully');
        onClose();
      } else {
        setErrorMsg(res.error || 'Current PIN is incorrect');
        setCurrentPin('');
      }
    } else {
      // Changing passcode
      setStep('enter_new');
    }
  };

  const handleConfirmNewSubmit = (confirmed: string) => {
    if (confirmed !== newPin) {
      setErrorMsg('PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }

    if (mode === 'change') {
      handleFinalChange(confirmed);
    } else {
      // Step to options customization
      setStep('options');
    }
  };

  const handleFinalChange = async (finalPin: string) => {
    setIsSubmitting(true);
    const res = await changePasscode(currentPin, finalPin, pinLength);
    setIsSubmitting(false);
    if (res.success) {
      onSuccess('✓ Passcode changed successfully');
      onClose();
    } else {
      setErrorMsg(res.error || 'Failed to update passcode');
      setStep('verify_current');
      setCurrentPin('');
    }
  };

  const handleFinalSetup = async () => {
    setIsSubmitting(true);
    try {
      await setupPasscode(newPin, pinLength, {
        lockOnBackground: lockOnBg,
        lockTimeoutSeconds: lockTimeout,
        biometricEnabled: biometricOn,
      });
      onSuccess(`✓ ${pinLength}-Digit PIN Lock activated`);
      onClose();
    } catch {
      setErrorMsg('Failed to enable passcode lock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        mode === 'disable'
          ? 'Turn Off Passcode Lock'
          : mode === 'change'
          ? 'Change Vault Passcode'
          : 'Set Up Security Passcode'
      }
      subtitle={
        mode === 'disable'
          ? 'Verify your current PIN to remove lock protection'
          : 'Protect your financial vault when backgrounded or switched'
      }
    >
      <div className="space-y-5 py-2 text-slate-200">
        {step !== 'options' ? (
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Header Icon */}
            <div className="p-3 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
              <KeyRound className="w-6 h-6" />
            </div>

            {/* Step Heading */}
            <div>
              <h4 className="text-base font-bold text-white font-heading">
                {step === 'verify_current'
                  ? 'Enter Current Passcode'
                  : step === 'enter_new'
                  ? 'Choose New Passcode'
                  : 'Confirm New Passcode'}
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                {step === 'verify_current'
                  ? 'Enter your existing PIN to continue'
                  : step === 'enter_new'
                  ? `Enter a ${pinLength}-digit PIN code`
                  : 'Re-enter the same PIN code to confirm'}
              </p>
            </div>

            {/* Length Switcher if entering new PIN */}
            {step === 'enter_new' && mode === 'setup' && (
              <div className="flex items-center gap-2 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setPinLength(4);
                    setNewPin('');
                  }}
                  className={cn(
                    'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                    pinLength === 4
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  4 Digits
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPinLength(6);
                    setNewPin('');
                  }}
                  className={cn(
                    'px-3 py-1 rounded-lg font-bold transition-all cursor-pointer',
                    pinLength === 6
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  )}
                >
                  6 Digits
                </button>
              </div>
            )}

            {/* PIN Bubble Displays */}
            <div className="flex items-center justify-center gap-3.5 py-2">
              {Array.from({ length: targetLength }).map((_, idx) => {
                const isFilled = idx < activePinValue.length;
                return (
                  <div
                    key={idx}
                    className={cn(
                      'w-4 h-4 rounded-full border-2 transition-all duration-150',
                      isFilled
                        ? 'bg-cyan-400 border-cyan-400 shadow-md shadow-cyan-500/40 scale-110'
                        : 'border-slate-700 bg-slate-900/60'
                    )}
                  />
                );
              })}
            </div>

            {/* Error Feedback */}
            <div className="h-5 flex items-center justify-center">
              {errorMsg ? (
                <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5 animate-pulse">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMsg}</span>
                </span>
              ) : null}
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3 w-full max-w-[260px] pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => handleDigitInput(d)}
                  disabled={isSubmitting}
                  className="h-12 sm:h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-950 border border-slate-800 hover:border-slate-700 text-lg font-bold font-mono text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
                >
                  {d}
                </button>
              ))}
              <div className="h-12 sm:h-14" />
              <button
                type="button"
                onClick={() => handleDigitInput('0')}
                disabled={isSubmitting}
                className="h-12 sm:h-14 rounded-2xl bg-slate-900 hover:bg-slate-800 active:bg-cyan-950 border border-slate-800 hover:border-slate-700 text-lg font-bold font-mono text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all shadow-sm"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                disabled={isSubmitting || activePinValue.length === 0}
                className="h-12 sm:h-14 rounded-2xl bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer active:scale-95 transition-all disabled:opacity-30"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          /* Step 3: Options & Auto-Lock Configuration */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/50 flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-white block">PIN Configured</span>
                <span>Your {pinLength}-digit passcode has been confirmed. Customize auto-lock triggers below.</span>
              </div>
            </div>

            {/* Auto-Lock Trigger Options */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Auto-Lock on Background / App Switch</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { seconds: 0, label: 'Immediately', desc: 'Locks as soon as you switch apps' },
                  { seconds: 30, label: 'After 30 seconds', desc: 'Allows quick multi-tasking' },
                  { seconds: 60, label: 'After 1 minute', desc: 'Locks after 1m inactivity' },
                  { seconds: 300, label: 'After 5 minutes', desc: 'Extended vault session' },
                ].map((opt) => {
                  const isSelected = lockTimeout === opt.seconds;
                  return (
                    <button
                      key={opt.seconds}
                      type="button"
                      onClick={() => setLockTimeout(opt.seconds)}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col',
                        isSelected
                          ? 'bg-cyan-950/50 border-cyan-500/80 text-white shadow-inner'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                      )}
                    >
                      <span className="text-xs font-bold font-heading">{opt.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Biometric Toggle if supported */}
            {biometricAvailable && (
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-cyan-400" />
                  <div>
                    <span className="text-xs font-bold text-white block">Biometric Fast Unlock</span>
                    <span className="text-[11px] text-slate-400">Unlock via Face ID, Touch ID, or Windows Hello</span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={biometricOn}
                  onChange={(e) => setBiometricOn(e.target.checked)}
                  className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                />
              </div>
            )}

            {/* Final Action Button */}
            <div className="pt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setStep('enter_new')}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFinalSetup}
                disabled={isSubmitting}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-900/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSubmitting ? 'Activating Lock...' : 'Activate Passcode Protection'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
