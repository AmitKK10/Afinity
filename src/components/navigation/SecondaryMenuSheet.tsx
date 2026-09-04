import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Banknote,
  Building2,
  Smartphone,
  BookOpen,
  Sparkles,
  Settings,
  Database,
  History,
  Shield,
  Download,
  Info,
  ChevronRight,
  Lock,
  UploadCloud,
  FileText,
  Calendar,
} from 'lucide-react';
import { BottomSheet } from '../ui/BottomSheet';
import { AfinityLogo } from '../brand/AfinityLogo';
import { useSecurity } from '../../context/SecurityContext';
import { SECONDARY_NAV_ITEMS } from '../../utils/constants';

interface SecondaryMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
  onExportData?: () => void;
  onImportData?: () => void;
  onOpenPdfModal?: () => void;
}

export const SecondaryMenuSheet: React.FC<SecondaryMenuSheetProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
  onExportData,
  onImportData,
  onOpenPdfModal,
}) => {
  const navigate = useNavigate();
  const { isPasscodeConfigured, lockVault } = useSecurity();

  const handleItemClick = (key: string) => {
    onClose();
    switch (key) {
      case 'sips':
        navigate('/investments?tab=sips');
        break;
      case 'pdf_export':
        onOpenPdfModal?.();
        break;
      case 'cash':
        navigate('/cash-denominations');
        break;
      case 'banks':
        navigate('/banks');
        break;
      case 'wallets':
        navigate('/wallets');
        break;
      case 'khatabook':
        navigate('/dues-receivables');
        break;
      case 'ipo':
        navigate('/ipo-tracker');
        break;
      case 'widgets':
        navigate('/widgets');
        break;
      case 'snapshots':
        navigate('/analysis');
        break;
      case 'import_data':
        onImportData?.();
        break;
      case 'settings':
        onOpenSettings?.();
        break;
      case 'backup':
        onExportData?.();
        break;
      default:
        break;
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Calendar': return <Calendar className="w-5 h-5 text-cyan-400" />;
      case 'FileText': return <FileText className="w-5 h-5 text-cyan-400" />;
      case 'Banknote': return <Banknote className="w-5 h-5 text-amber-400" />;
      case 'Building2': return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'Smartphone': return <Smartphone className="w-5 h-5 text-cyan-400" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5 text-purple-400" />;
      case 'Sparkles': return <Sparkles className="w-5 h-5 text-emerald-400" />;
      case 'History': return <History className="w-5 h-5 text-teal-400" />;
      case 'UploadCloud': return <UploadCloud className="w-5 h-5 text-cyan-400" />;
      case 'Settings': return <Settings className="w-5 h-5 text-slate-300" />;
      case 'Database': return <Database className="w-5 h-5 text-indigo-400" />;
      default: return <Info className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Financial Modules & Tools"
      subtitle="Explore secondary ledgers, vault tools, and settings"
    >
      <div className="space-y-4">
        {/* Brand Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#141f38] via-[#0d162b] to-[#080d1a] border border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AfinityLogo size="sm" showWordmark={true} showTagline={true} />
          </div>
          <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            PWA v1.0.0
          </span>
        </div>

        {/* Modules List */}
        <div className="space-y-1.5">
          {SECONDARY_NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              id={`secondary-menu-${item.key}`}
              onClick={() => handleItemClick(item.key)}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all text-left cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700/60 flex-shrink-0 group-hover:scale-105 transition-transform">
                  {getIcon(item.iconName)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100 group-hover:text-white font-heading">
                    {item.label}
                  </h4>
                  <p className="text-xs text-slate-400 font-normal">
                    {item.desc}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          ))}
        </div>

        {/* Security & Backup info footer */}
        {isPasscodeConfigured && (
          <button
            type="button"
            onClick={() => {
              onClose();
              lockVault();
            }}
            className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/50 transition-all text-left cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-rose-900/50 border border-rose-700/50 text-rose-400">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-rose-200 group-hover:text-rose-100 font-heading">
                  Lock Financial Vault Now
                </h4>
                <p className="text-xs text-rose-400/80 font-normal">
                  Immediate screen lock protection
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-rose-400" />
          </button>
        )}

        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>Single-user private offline-first ledger. Ready for Cloud Sync.</span>
        </div>
      </div>
    </BottomSheet>
  );
};
