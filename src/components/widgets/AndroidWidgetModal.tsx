import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Smartphone, RefreshCw, Eye, EyeOff, ExternalLink, Sparkles } from 'lucide-react';
import { useWidgetSync } from '../../hooks/useWidgetSync';
import { WidgetSize } from '../../types/widget';
import { SmallWidgetView } from './SmallWidgetView';
import { MediumWidgetView } from './MediumWidgetView';
import { LargeWidgetView } from './LargeWidgetView';

interface AndroidWidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidWidgetModal: React.FC<AndroidWidgetModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    snapshot,
    previewDataSource,
    setPreviewDataSource,
    isSyncing,
    lastSyncedTime,
    isNative,
    syncNow,
  } = useWidgetSync();

  const [selectedSize, setSelectedSize] = useState<WidgetSize>('medium');
  const [maskValues, setMaskValues] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleWidgetNavigate = (route: string) => {
    showToast(`Widget deep-linked to ${route}`);
    setTimeout(() => {
      onClose();
      navigate(route);
    }, 500);
  };

  const handleSync = async () => {
    const res = await syncNow();
    if (res.success) {
      showToast('Android widgets synchronized!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#080c16] border border-slate-800 p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col justify-between overflow-y-auto">
        {/* Toast */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-300 text-xs font-bold flex items-center gap-1.5 shadow-xl">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold font-heading text-white">
                Android Home Screen Widgets
              </h2>
              <p className="text-[11px] text-slate-400">
                Live Afinity companion for your phone home screen
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Size Selector & Controls */}
        <div className="py-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Size tabs */}
            <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold">
              <button
                onClick={() => setSelectedSize('small')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedSize === 'small'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Small (2×2)
              </button>
              <button
                onClick={() => setSelectedSize('medium')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedSize === 'medium'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Medium (4×2)
              </button>
              <button
                onClick={() => setSelectedSize('large')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  selectedSize === 'large'
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Large (4×3)
              </button>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMaskValues(!maskValues)}
                className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
                title="Mask figures"
              >
                {maskValues ? <EyeOff className="w-3.5 h-3.5 text-amber-400" /> : <Eye className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync</span>
              </button>
            </div>
          </div>

          {/* Interactive Widget Display Box */}
          <div className="p-6 rounded-2xl bg-[#040810] border border-slate-800/80 flex items-center justify-center min-h-[220px]">
            {selectedSize === 'small' && (
              <SmallWidgetView
                snapshot={snapshot}
                maskValues={maskValues}
                onNavigate={handleWidgetNavigate}
              />
            )}
            {selectedSize === 'medium' && (
              <MediumWidgetView
                snapshot={snapshot}
                maskValues={maskValues}
                onNavigate={handleWidgetNavigate}
              />
            )}
            {selectedSize === 'large' && (
              <LargeWidgetView
                snapshot={snapshot}
                maskValues={maskValues}
                onNavigate={handleWidgetNavigate}
              />
            )}
          </div>
          <p className="text-[10px] text-slate-500 text-center">
            Tap inside the widget to trigger deep-linking to dashboard, investments, accounts or credit!
          </p>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-400">
            {isNative ? 'Native Android' : 'PWA / Web Bridge'}{' '}
            {lastSyncedTime && <span>• Synced: {lastSyncedTime}</span>}
          </div>

          <button
            onClick={() => {
              onClose();
              navigate('/widgets');
            }}
            className="text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 hover:underline"
          >
            <span>Open Full Widget Studio</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
