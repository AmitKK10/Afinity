import React, { useState } from 'react';
import { Wifi, Battery, Search, Smartphone } from 'lucide-react';
import { AfinityWidgetSnapshot, WidgetSize } from '../../types/widget';
import { SmallWidgetView } from './SmallWidgetView';
import { MediumWidgetView } from './MediumWidgetView';
import { LargeWidgetView } from './LargeWidgetView';

interface AndroidWidgetSimulatorProps {
  snapshot: AfinityWidgetSnapshot;
  widgetSize: WidgetSize;
  maskValues?: boolean;
  onNavigate?: (route: string) => void;
}

export const AndroidWidgetSimulator: React.FC<AndroidWidgetSimulatorProps> = ({
  snapshot,
  widgetSize,
  maskValues = false,
  onNavigate,
}) => {
  const [currentTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  });

  return (
    <div className="relative mx-auto w-full max-w-[340px] sm:max-w-[380px] rounded-[42px] p-3.5 bg-gradient-to-b from-slate-900 via-slate-950 to-black border-[6px] border-slate-800 shadow-2xl shadow-cyan-950/40 select-none">
      {/* Device Camera Punch-hole */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-black border border-slate-800 z-30 flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
      </div>

      {/* Screen Frame with Android Wallpaper */}
      <div className="relative w-full rounded-[32px] overflow-hidden bg-gradient-to-br from-[#0b1329] via-[#080d1a] to-[#040810] min-h-[580px] flex flex-col justify-between p-3.5 border border-slate-800/60 shadow-inner">
        {/* Subtle geometric wallpaper lines */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-25 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-cyan-900/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-20 w-64 h-64 bg-blue-900/15 rounded-full blur-3xl pointer-events-none" />

        {/* 1. Android Status Bar */}
        <div className="relative z-20 flex items-center justify-between text-[11px] text-slate-300 font-semibold px-2 pt-0.5">
          <span>{currentTime}</span>
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-[10px] font-bold">5G</span>
            <Battery className="w-3.5 h-3.5 text-slate-300" />
          </div>
        </div>

        {/* 2. Top Android Google Search & Clock Widget */}
        <div className="relative z-20 mt-3 px-1">
          <div className="flex items-center justify-between bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-full px-3.5 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Search className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] text-slate-400">Search apps &amp; finance...</span>
            </div>
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center text-[9px] font-bold text-white">
              A
            </div>
          </div>
        </div>

        {/* 3. The Active Afinity Widget Placed on the Home Screen */}
        <div className="relative z-20 my-auto py-4 flex items-center justify-center">
          {widgetSize === 'small' && (
            <SmallWidgetView
              snapshot={snapshot}
              maskValues={maskValues}
              onNavigate={onNavigate}
            />
          )}

          {widgetSize === 'medium' && (
            <MediumWidgetView
              snapshot={snapshot}
              maskValues={maskValues}
              onNavigate={onNavigate}
            />
          )}

          {widgetSize === 'large' && (
            <LargeWidgetView
              snapshot={snapshot}
              maskValues={maskValues}
              onNavigate={onNavigate}
            />
          )}
        </div>

        {/* 4. Android Home Screen Bottom Dock */}
        <div className="relative z-20 pt-2 pb-1">
          <div className="flex items-center justify-around px-2 py-2.5 rounded-2xl bg-slate-900/40 backdrop-blur-md border border-slate-800/50">
            {/* Afinity App Icon */}
            <button
              onClick={() => onNavigate && onNavigate('/')}
              className="flex flex-col items-center gap-1 group/dock focus:outline-none"
              title="Open Afinity App"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover/dock:scale-105 transition-transform">
                <Smartphone className="w-5 h-5 text-white" />
              </div>
              <span className="text-[9px] font-bold text-slate-300">Afinity</span>
            </button>

            {/* Simulated companion app icons */}
            <div className="flex flex-col items-center gap-1 opacity-70">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                💬
              </div>
              <span className="text-[9px] font-medium text-slate-400">Messages</span>
            </div>

            <div className="flex flex-col items-center gap-1 opacity-70">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                🌐
              </div>
              <span className="text-[9px] font-medium text-slate-400">Chrome</span>
            </div>

            <div className="flex flex-col items-center gap-1 opacity-70">
              <div className="w-10 h-10 rounded-2xl bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                ⚙️
              </div>
              <span className="text-[9px] font-medium text-slate-400">Settings</span>
            </div>
          </div>

          {/* Android Bottom Navigation Pill */}
          <div className="w-28 h-1 rounded-full bg-slate-600/80 mx-auto mt-3" />
        </div>
      </div>
    </div>
  );
};
