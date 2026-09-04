/**
 * Afinity PWA Installation Banner
 * Responsive, dark-themed bottom install banner matching Afinity design system.
 * Uses native beforeinstallprompt flow, respects dismissal cooldowns,
 * and includes iOS Home Screen guidance.
 */

import React, { useState } from 'react';
import {
  Download,
  X,
  Zap,
  ShieldCheck,
  Share,
  PlusSquare,
  Sparkles,
  Smartphone,
} from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

interface PwaInstallBannerProps {
  forceShowForTesting?: boolean;
}

export const PwaInstallBanner: React.FC<PwaInstallBannerProps> = ({
  forceShowForTesting = false,
}) => {
  const {
    canInstall,
    isInstalled,
    isDismissed,
    isIOS,
    promptInstall,
    dismissPrompt,
    hasNativePrompt,
  } = usePwaInstall();

  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // If already installed or dismissed (and not forced), do not render
  if (isInstalled && !forceShowForTesting) {
    return null;
  }

  if (isDismissed && !forceShowForTesting) {
    return null;
  }

  // Only show if browser supports native prompt OR if on iOS Safari where manual home screen install is possible
  const shouldDisplay = canInstall || (isIOS && !isInstalled) || forceShowForTesting;

  if (!shouldDisplay) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isIOS && !hasNativePrompt) {
      setShowIosGuide(true);
      return;
    }

    setIsInstalling(true);
    try {
      const result = await promptInstall();
      if (result === 'unsupported' && isIOS) {
        setShowIosGuide(true);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    dismissPrompt(5); // Dismiss for 5 days
  };

  return (
    <>
      {/* Responsive Bottom Floating Install Banner */}
      <div
        id="afinity-pwa-install-banner"
        role="region"
        aria-label="Install Afinity PWA"
        className="fixed z-40 transition-all duration-300 ease-out left-3 right-3 bottom-[74px] md:bottom-6 md:left-auto md:right-6 md:max-w-md animate-in slide-in-from-bottom-5 fade-in duration-300"
      >
        <div className="relative overflow-hidden rounded-2xl bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700/80 shadow-[0_16px_45px_rgba(0,0,0,0.85)] p-3.5 sm:p-4 text-slate-100 ring-1 ring-white/5">
          {/* Subtle gold/cyan ambient accent glow */}
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Section: App Emblem + Title + Description + Dismiss 'X' */}
          <div className="flex items-start gap-3 relative z-10">
            {/* App Emblem Icon with Amber Border */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-slate-900/90 border border-amber-400/40 p-1 flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/10">
              <img
                src="/icon.svg"
                alt="Afinity Emblem"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Header Text & Description */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-extrabold tracking-wider text-xs sm:text-sm text-white uppercase font-heading">
                  INSTALL AFINITY
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase font-mono">
                  PWA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 font-normal leading-relaxed mt-0.5">
                Install for instant home-screen access and a faster app-like experience.
              </p>
            </div>

            {/* Dismiss Close 'X' Button */}
            <button
              type="button"
              id="pwa-banner-close-btn"
              onClick={handleDismiss}
              aria-label="Dismiss install prompt"
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors flex-shrink-0 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom Section: Feature Badges & Action Buttons */}
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2 relative z-10">
            {/* Perks / Badges */}
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium select-none">
              <span className="flex items-center gap-1 text-amber-300 font-semibold">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>Faster</span>
              </span>
              <span className="text-slate-600">•</span>
              <span className="flex items-center gap-1 text-emerald-300 font-semibold">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>Offline</span>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                id="pwa-banner-later-btn"
                onClick={handleDismiss}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-200 tracking-wider uppercase px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                LATER
              </button>

              <button
                type="button"
                id="pwa-banner-install-btn"
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-extrabold text-xs tracking-wider uppercase shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer font-heading disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{isInstalling ? 'INSTALLING...' : 'INSTALL'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Safari Manual Add to Home Screen Instructions Modal */}
      {showIosGuide && (
        <div
          id="ios-pwa-guide-overlay"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 animate-in fade-in duration-200"
          onClick={() => setShowIosGuide(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-[#0f172a] border border-slate-700 p-4 text-slate-100 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs uppercase tracking-wider font-heading">
                  Install Afinity on iOS
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  1
                </div>
                <div>
                  <span>Tap the </span>
                  <strong className="text-white inline-flex items-center gap-1">
                    <Share className="w-3.5 h-3.5 text-blue-400" /> Share
                  </strong>
                  <span> button at the bottom of Safari.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  2
                </div>
                <div>
                  <span>Scroll down and tap </span>
                  <strong className="text-white inline-flex items-center gap-1">
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400" /> Add to Home Screen
                  </strong>
                  <span>.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="w-6 h-6 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  3
                </div>
                <div>
                  <span>Tap </span>
                  <strong className="text-white">Add</strong>
                  <span> in the top right to launch Afinity as a full-screen app.</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowIosGuide(false);
                dismissPrompt(7);
              }}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
