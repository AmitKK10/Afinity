import React, { useState } from 'react';
import {
  ShieldCheck,
  Wallet,
  Sparkles,
  TrendingUp,
  Download,
  ArrowRight,
  Check,
  CheckCircle2,
  Lock,
  X,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { AfinityLogo } from '../brand/AfinityLogo';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: '100% Local-First & Private',
      subtitle: 'Your data stays strictly on your device',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      description:
        'Afinity stores all accounts, cards, balances, and history locally inside your browser’s IndexedDB vault. No server database is required.',
      highlight: 'Zero registration, zero passwords, and zero tracking.',
    },
    {
      title: 'Organize Accounts & Holdings',
      subtitle: 'Complete financial overview in one place',
      icon: Wallet,
      iconColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      description:
        'Manage Bank accounts, Fixed Deposits, Physical Cash notes, Digital Wallets, Credit Cards, Direct Equities, Mutual Funds, and Khatabook ledgers.',
      highlight: 'All segregated cleanly without double-counting.',
    },
    {
      title: 'Quick Periodic Updates',
      subtitle: 'Update anytime with one tap',
      icon: Sparkles,
      iconColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      description:
        'Use the central "+ Update" action on your bottom bar to quickly recount cash notes, record closing bank balances, or update investment prices.',
      highlight: 'Keep your net worth up-to-date in under 30 seconds.',
    },
    {
      title: 'Automated Net Worth Engine',
      subtitle: 'Precise financial math & analytics',
      icon: TrendingUp,
      iconColor: 'text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20',
      description:
        'Afinity continuously evaluates Net Worth = Total Assets - Total Liabilities. Compare snapshots month-over-month and review credit utilization.',
      highlight: 'Automatic trajectory, historical growth, and asset breakdowns.',
    },
    {
      title: 'Safe Backups & Cold Storage',
      subtitle: 'Export and restore your ledger anytime',
      icon: Download,
      iconColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      description:
        'Export JSON backups regularly to keep your financial history secure across device changes and browser cache clears.',
      highlight: 'Full multi-table atomic import and restore protection.',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('afinity_onboarding_completed', 'true');
      onClose();
    }
  };

  const activeStepData = steps[currentStep];
  const StepIcon = activeStepData.icon;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Welcome to Afinity"
      subtitle="Track • Analyze • Grow — Your Private Financial Command Center"
    >
      <div className="space-y-5 py-1 text-slate-200">
        {/* Step Indicator */}
        <div className="flex items-center justify-between gap-1.5 px-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                idx === currentStep
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-400'
                  : idx < currentStep
                  ? 'bg-cyan-600/50'
                  : 'bg-slate-800'
              }`}
            />
          ))}
        </div>

        {/* Step Content Card */}
        <div className={`p-5 rounded-3xl border ${activeStepData.bgColor} space-y-3.5`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900/90 border border-slate-700/60 flex items-center justify-center flex-shrink-0 shadow-md">
              <StepIcon className={`w-6 h-6 ${activeStepData.iconColor}`} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-heading block">
                Step {currentStep + 1} of {steps.length}
              </span>
              <h3 className="text-base font-bold text-white font-heading">
                {activeStepData.title}
              </h3>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {activeStepData.description}
          </p>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center gap-2 text-xs font-semibold text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{activeStepData.highlight}</span>
          </div>
        </div>

        {/* Privacy Assurance Box */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>Afinity never asks for Bank logins, OTPs, UPI PINs, or broker passwords.</span>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              localStorage.setItem('afinity_onboarding_completed', 'true');
              onClose();
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 px-3 py-2 cursor-pointer"
          >
            Skip Tour
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyan-900/30 transition-all font-heading active:scale-95"
          >
            <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next Step'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};
