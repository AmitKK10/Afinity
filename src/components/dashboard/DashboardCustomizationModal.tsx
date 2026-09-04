import React, { useState, useEffect } from 'react';
import {
  GripVertical,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  RotateCcw,
  Sparkles,
  Zap,
  Layers,
  PieChart,
  LineChart,
  TrendingUp,
  CreditCard,
  Building2,
  BookOpen,
  Check,
  SlidersHorizontal,
  LayoutGrid,
  Info,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Shield,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';
import { useFinancialData } from '../../context/FinancialDataContext';
import {
  ALL_DASHBOARD_CARDS,
  DEFAULT_DASHBOARD_ORDER,
  DASHBOARD_PRESETS,
  getResolvedDashboardLayout,
  getCardDefinition,
} from '../../services/dashboardConfig';
import { DashboardCardId, DashboardPresetKey } from '../../types';
import { cn } from '../../utils/cn';

interface DashboardCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessToast?: (msg: string) => void;
}

const CARD_ICONS: Record<DashboardCardId, React.ElementType> = {
  quick_financial_snapshot: Shield,
  financial_health_summary: Activity,
  action_required: AlertTriangle,
  safe_cash_commitments: ShieldCheck,
  net_worth_hero: Sparkles,
  upcoming_30_days: Calendar,
  quick_actions: Zap,
  asset_liability_grid: Layers,
  asset_distribution: PieChart,
  net_worth_trend: LineChart,
  investments_summary: TrendingUp,
  credit_cards_summary: CreditCard,
  bank_accounts_summary: Building2,
  khatabook_widget: BookOpen,
};

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  core: { bg: 'bg-cyan-950/50', text: 'text-cyan-400', border: 'border-cyan-800/60' },
  breakdown: { bg: 'bg-emerald-950/50', text: 'text-emerald-400', border: 'border-emerald-800/60' },
  analytics: { bg: 'bg-indigo-950/50', text: 'text-indigo-400', border: 'border-indigo-800/60' },
  accounts: { bg: 'bg-amber-950/50', text: 'text-amber-400', border: 'border-amber-800/60' },
};

export const DashboardCustomizationModal: React.FC<DashboardCustomizationModalProps> = ({
  isOpen,
  onClose,
  onSuccessToast,
}) => {
  const { settings, updateUserSettings } = useFinancialData();

  const [cardOrder, setCardOrder] = useState<DashboardCardId[]>([]);
  const [hiddenCards, setHiddenCards] = useState<Set<DashboardCardId>>(new Set());
  const [activePreset, setActivePreset] = useState<DashboardPresetKey>('balanced');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with current settings when modal opens
  useEffect(() => {
    if (isOpen) {
      const resolved = getResolvedDashboardLayout(settings);
      setCardOrder(resolved.cardOrder);
      setHiddenCards(resolved.hiddenCards);
      setActivePreset(resolved.preset);
    }
  }, [isOpen, settings]);

  const handleToggleCard = (id: DashboardCardId) => {
    setHiddenCards((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        // Prevent hiding everything if it's the last visible card
        const visibleCount = cardOrder.filter((c) => !next.has(c)).length;
        if (visibleCount <= 1) {
          onSuccessToast?.('At least 1 card must remain visible on your dashboard');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
    setActivePreset('custom');
  };

  const handleMoveCard = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= cardOrder.length) return;

    setCardOrder((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
    setActivePreset('custom');
  };

  const handleApplyPreset = (presetKey: DashboardPresetKey) => {
    const preset = DASHBOARD_PRESETS.find((p) => p.key === presetKey);
    if (!preset) return;

    setCardOrder([...preset.cardOrder]);
    setHiddenCards(new Set(preset.hiddenCards));
    setActivePreset(presetKey);
  };

  const handleShowAll = () => {
    setHiddenCards(new Set());
    setActivePreset('custom');
  };

  const handleResetToDefault = () => {
    setCardOrder([...DEFAULT_DASHBOARD_ORDER]);
    setHiddenCards(new Set());
    setActivePreset('balanced');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    setCardOrder((prev) => {
      const copy = [...prev];
      const [draggedItem] = copy.splice(draggedIndex, 1);
      copy.splice(dropIndex, 0, draggedItem);
      return copy;
    });

    setActivePreset('custom');
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateUserSettings({
        dashboardCardOrder: cardOrder,
        hiddenDashboardCards: Array.from(hiddenCards),
        dashboardPreset: activePreset,
      });
      onSuccessToast?.('✓ Dashboard layout customized and saved');
      onClose();
    } catch {
      onSuccessToast?.('Failed to save dashboard preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const visibleCount = cardOrder.filter((id) => !hiddenCards.has(id)).length;
  const totalCount = cardOrder.length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Customize Dashboard"
      subtitle="Reorder cards & toggle visibility according to your financial focus"
      maxWidth="max-w-xl"
      id="dashboard-customization-modal"
    >
      <div className="space-y-5 py-1">
        {/* Preset Layout Switcher */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-heading flex items-center gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5 text-cyan-400" />
              <span>Layout Presets</span>
            </span>
            <span className="text-[11px] text-cyan-400 font-medium">
              {activePreset === 'custom' ? 'Custom Layout' : `${activePreset.charAt(0).toUpperCase() + activePreset.slice(1)} Active`}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {DASHBOARD_PRESETS.map((preset) => {
              const isSelected = activePreset === preset.key;
              return (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => handleApplyPreset(preset.key)}
                  className={cn(
                    'p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between',
                    isSelected
                      ? 'bg-gradient-to-br from-cyan-950/80 to-blue-950/60 border-cyan-500/80 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30 text-white'
                      : 'bg-slate-900/60 border-slate-800/90 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold font-heading">{preset.label.split(' ')[0]}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </div>
                  <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                    {preset.key === 'balanced' && 'Full comprehensive view'}
                    {preset.key === 'investor' && 'Holdings & growth first'}
                    {preset.key === 'cashflow' && 'Dues & cash reserves first'}
                    {preset.key === 'minimal' && 'Essential summary only'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Status Bar & Bulk Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">
              {visibleCount} of {totalCount} Cards Visible
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[11px] text-slate-400">
              Drag handles or tap arrows to reorder
            </span>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {hiddenCards.size > 0 && (
              <button
                type="button"
                onClick={handleShowAll}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer"
              >
                Show All
              </button>
            )}
            <button
              type="button"
              onClick={handleResetToDefault}
              title="Reset order and visibility to factory defaults"
              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Interactive Cards Reorder & Toggle List */}
        <div className="space-y-2 max-h-[48vh] overflow-y-auto pr-1">
          {cardOrder.map((cardId, index) => {
            const def = getCardDefinition(cardId);
            const Icon = CARD_ICONS[cardId] || Layers;
            const isVisible = !hiddenCards.has(cardId);
            const isDragged = draggedIndex === index;
            const isOver = dragOverIndex === index;
            const style = CATEGORY_STYLES[def.category] || CATEGORY_STYLES.core;

            return (
              <div
                key={cardId}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'group relative flex items-center justify-between p-3 sm:p-3.5 rounded-2xl border transition-all select-none',
                  isVisible
                    ? 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700 text-slate-100'
                    : 'bg-slate-950/60 border-slate-900/60 opacity-60 text-slate-400',
                  isDragged && 'opacity-30 border-dashed border-cyan-500 scale-[0.98]',
                  isOver && 'border-cyan-400 shadow-lg shadow-cyan-950/30 translate-y-0.5'
                )}
              >
                {/* Left: Drag Handle & Order Number & Icon */}
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Drag Handle */}
                  <div
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-300 cursor-grab active:cursor-grabbing flex-shrink-0 touch-none"
                    title="Drag up or down to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>

                  {/* Position Badge */}
                  <span className="w-5 text-[11px] font-bold text-slate-500 font-mono text-center flex-shrink-0">
                    #{index + 1}
                  </span>

                  {/* Icon */}
                  <div
                    className={cn(
                      'p-2 rounded-xl border flex-shrink-0 flex items-center justify-center transition-colors',
                      isVisible ? `${style.bg} ${style.text} ${style.border}` : 'bg-slate-900 border-slate-800 text-slate-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Title & Info */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={cn(
                          'text-xs sm:text-sm font-bold truncate font-heading',
                          isVisible ? 'text-slate-100' : 'text-slate-400 line-through decoration-slate-600'
                        )}
                      >
                        {def.title}
                      </h4>
                      <span
                        className={cn(
                          'hidden sm:inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-md border',
                          style.bg,
                          style.text,
                          style.border
                        )}
                      >
                        {def.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5 max-w-[200px] sm:max-w-xs">
                      {def.subtitle}
                    </p>
                  </div>
                </div>

                {/* Right: Reorder Arrows & Visibility Toggle */}
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {/* Move Up */}
                  <button
                    type="button"
                    onClick={() => handleMoveCard(index, 'up')}
                    disabled={index === 0}
                    title="Move up"
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    onClick={() => handleMoveCard(index, 'down')}
                    disabled={index === cardOrder.length - 1}
                    title="Move down"
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Visibility Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleCard(cardId)}
                    title={isVisible ? 'Hide this card from dashboard' : 'Show this card on dashboard'}
                    className={cn(
                      'ml-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border',
                      isVisible
                        ? 'bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border-cyan-800/60 shadow-inner'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-500 hover:text-slate-300 border-slate-800'
                    )}
                  >
                    {isVisible ? (
                      <>
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span className="hidden sm:inline">Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hidden</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Apply & Save Layout'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
