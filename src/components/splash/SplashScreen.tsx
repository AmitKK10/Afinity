import React, { useEffect, useState } from 'react';
import { AfinityLogo } from '../brand/AfinityLogo';
import { ShieldCheck } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [fadeState, setFadeState] = useState<'enter' | 'ready' | 'exit'>('enter');

  useEffect(() => {
    const readyTimer = setTimeout(() => {
      setFadeState('ready');
    }, 800);

    const finishTimer = setTimeout(() => {
      setFadeState('exit');
      setTimeout(onFinish, 400); // Allow fade out
    }, 1800);

    return () => {
      clearTimeout(readyTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      id="afinity-splash-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#080c16] transition-opacity duration-400 ${
        fadeState === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

      {/* Top spacer */}
      <div className="h-10" />

      {/* Center Branded Logo & Tagline */}
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="transform transition-transform duration-700 hover:scale-105">
          <AfinityLogo size="xl" showWordmark={true} showTagline={true} />
        </div>

        {/* Loading Progress Bar */}
        <div className="w-48 h-1 bg-slate-800 rounded-full mt-10 overflow-hidden relative">
          <div className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 rounded-full animate-pulse w-full" />
        </div>

        <p className="text-xs text-slate-400 mt-3 font-medium tracking-wider">
          Initializing Personal Financial Vault...
        </p>
      </div>

      {/* Footer Info */}
      <div className="relative z-10 flex items-center gap-2 text-xs text-slate-400 pb-safe">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Single User Secure PWA</span>
      </div>
    </div>
  );
};
