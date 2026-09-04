import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption<T = string> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string;
  badgeColor?: 'emerald' | 'cyan' | 'blue' | 'amber' | 'purple' | 'rose' | 'slate' | 'indigo';
  icon?: React.ReactNode;
  iconBg?: string;
  category?: string;
  disabled?: boolean;
  keywords?: string[];
  meta?: any;
}

export interface SelectionCategory {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectionSheetProps<T = string> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  options: SelectOption<T>[];
  selectedValue?: T;
  selectedValues?: T[];
  onSelect?: (value: T, option: SelectOption<T>) => void;
  onMultiSelect?: (values: T[]) => void;
  multiSelect?: boolean;
  showSearch?: boolean;
  searchPlaceholder?: string;
  categories?: SelectionCategory[];
  showDoneButton?: boolean;
  doneLabel?: string;
  allowCustom?: boolean;
  customLabel?: string;
  onCustomSelect?: () => void;
  emptyText?: string;
  footerContent?: React.ReactNode;
  maxHeight?: string;
}

export const getBadgeColorClass = (color?: string) => {
  switch (color) {
    case 'emerald':
      return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    case 'cyan':
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    case 'blue':
      return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    case 'amber':
      return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    case 'purple':
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    case 'rose':
      return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    case 'indigo':
      return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
};

const DEFAULT_EMPTY_ARRAY: any[] = [];

/**
 * Universal Afinity Dark-Glass Selection Sheet & Modal
 */
export function SelectionSheet<T = string>({
  isOpen,
  onClose,
  title,
  description,
  options,
  selectedValue,
  selectedValues = DEFAULT_EMPTY_ARRAY,
  onSelect,
  onMultiSelect,
  multiSelect = false,
  showSearch,
  searchPlaceholder = 'Search options...',
  categories,
  showDoneButton,
  doneLabel = 'Done',
  allowCustom = false,
  customLabel = 'Add custom option...',
  onCustomSelect,
  emptyText = 'No matching options found',
  footerContent,
  maxHeight = 'max-h-[60vh]',
}: SelectionSheetProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [tempMultiSelected, setTempMultiSelected] = useState<T[]>(selectedValues);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto show search if more than 6 options unless explicitly configured
  const shouldShowSearch = showSearch !== undefined ? showSearch : options.length > 5;

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedCategory('all');
      setTempMultiSelected(selectedValues || DEFAULT_EMPTY_ARRAY);
      // Small timeout to focus search if available
      if (shouldShowSearch) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    }
  }, [isOpen, shouldShowSearch]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Derived category list with counts
  const resolvedCategories = useMemo(() => {
    if (!categories || categories.length === 0) return null;
    return [
      { id: 'all', label: 'All', count: options.length },
      ...categories.map((cat) => ({
        id: cat.id,
        label: cat.label,
        count: options.filter((o) => o.category === cat.id).length,
      })),
    ];
  }, [categories, options]);

  // Filtered options
  const filteredOptions = useMemo(() => {
    return options.filter((option) => {
      // Category filter
      if (selectedCategory !== 'all' && option.category && option.category !== selectedCategory) {
        return false;
      }

      // Search query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchLabel = option.label.toLowerCase().includes(q);
      const matchSub = option.sublabel ? option.sublabel.toLowerCase().includes(q) : false;
      const matchBadge = option.badge ? option.badge.toLowerCase().includes(q) : false;
      const matchCategory = option.category ? option.category.toLowerCase().includes(q) : false;
      const matchKeywords = option.keywords ? option.keywords.some((k) => k.toLowerCase().includes(q)) : false;

      return matchLabel || matchSub || matchBadge || matchCategory || matchKeywords;
    });
  }, [options, selectedCategory, searchQuery]);

  const isOptionSelected = (val: T): boolean => {
    if (multiSelect) {
      return tempMultiSelected.includes(val);
    }
    return selectedValue === val;
  };

  const handleOptionClick = (option: SelectOption<T>) => {
    if (option.disabled) return;

    if (multiSelect) {
      const exists = tempMultiSelected.includes(option.value);
      const updated = exists
        ? tempMultiSelected.filter((v) => v !== option.value)
        : [...tempMultiSelected, option.value];
      setTempMultiSelected(updated);
      if (onMultiSelect && !showDoneButton) {
        onMultiSelect(updated);
      }
    } else {
      if (onSelect) {
        onSelect(option.value, option);
      }
      onClose();
    }
  };

  const handleDone = () => {
    if (multiSelect && onMultiSelect) {
      onMultiSelect(tempMultiSelected);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal / Bottom Sheet Window */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.96 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-gradient-to-b from-[#161c28] to-[#0d121c] border border-slate-700/70 rounded-t-[28px] sm:rounded-3xl shadow-2xl shadow-black/90 overflow-hidden flex flex-col z-10 max-h-[88vh] sm:max-h-[82vh]"
        >
          {/* Mobile Handle Pull Bar */}
          <div className="sm:hidden w-full flex items-center justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-slate-700/80" />
          </div>

          {/* Header */}
          <div className="px-5 pt-3 pb-3 border-b border-slate-800/80 flex-shrink-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white font-heading tracking-tight flex items-center gap-2">
                  <span>{title}</span>
                  {multiSelect && tempMultiSelected.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[11px] font-bold">
                      {tempMultiSelected.length} selected
                    </span>
                  )}
                </h3>
                {description && (
                  <p className="text-xs text-slate-400 mt-0.5">{description}</p>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            {shouldShowSearch && (
              <div className="relative mt-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30 transition-all font-sans"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Category Filter Chips */}
            {resolvedCategories && resolvedCategories.length > 1 && (
              <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar pb-1">
                {resolvedCategories.map((cat) => {
                  const isCatActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0',
                        isCatActive
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
                      )}
                    >
                      <span>{cat.label}</span>
                      <span
                        className={cn(
                          'text-[10px] px-1 rounded-full',
                          isCatActive ? 'bg-cyan-500/30 text-cyan-200' : 'bg-slate-800 text-slate-400'
                        )}
                      >
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Options List Body */}
          <div
            className={cn(
              'overflow-y-auto p-3 sm:p-4 space-y-1.5 flex-1',
              maxHeight
            )}
          >
            {filteredOptions.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-2 text-slate-500">
                  <Search className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-slate-300">{emptyText}</p>
                {searchQuery && (
                  <p className="text-xs text-slate-500 mt-1">
                    No results for &ldquo;{searchQuery}&rdquo;. Try another term.
                  </p>
                )}
                {allowCustom && onCustomSelect && (
                  <button
                    type="button"
                    onClick={() => {
                      onCustomSelect();
                      onClose();
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-600/30 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{customLabel}</span>
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredOptions.map((option) => {
                  const selected = isOptionSelected(option.value);
                  return (
                    <motion.button
                      key={String(option.value)}
                      type="button"
                      disabled={option.disabled}
                      onClick={() => handleOptionClick(option)}
                      whileTap={{ scale: 0.985 }}
                      className={cn(
                        'w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group',
                        option.disabled && 'opacity-50 cursor-not-allowed',
                        selected
                          ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900/90 to-slate-900 border-cyan-500/50 shadow-lg shadow-cyan-950/20'
                          : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      {/* Left: Icon / Emblem */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {option.icon ? (
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors border',
                              selected
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                                : option.iconBg || 'bg-slate-800/90 border-slate-700 text-slate-300 group-hover:text-white'
                            )}
                          >
                            {option.icon}
                          </div>
                        ) : (
                          <div
                            className={cn(
                              'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 border',
                              selected
                                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                                : 'bg-slate-800/90 border-slate-700 text-slate-300'
                            )}
                          >
                            {option.label.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        {/* Center: Label, Sublabel, Badge */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={cn(
                                'text-xs sm:text-sm font-bold truncate leading-tight',
                                selected ? 'text-white' : 'text-slate-200 group-hover:text-white'
                              )}
                            >
                              {option.label}
                            </span>
                            {option.badge && (
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded-full text-[10px] font-bold border flex-shrink-0',
                                  getBadgeColorClass(option.badgeColor)
                                )}
                              >
                                {option.badge}
                              </span>
                            )}
                          </div>
                          {option.sublabel && (
                            <p className="text-[11px] sm:text-xs text-slate-400 truncate mt-0.5">
                              {option.sublabel}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right: Selection Indicator */}
                      <div className="flex-shrink-0 pl-1">
                        {selected ? (
                          <div className="w-6 h-6 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-md shadow-cyan-500/40">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-slate-700 bg-slate-900/80 group-hover:border-slate-600 transition-colors" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}

                {/* Custom Item Button if allowed */}
                {allowCustom && onCustomSelect && (
                  <button
                    type="button"
                    onClick={() => {
                      onCustomSelect();
                      onClose();
                    }}
                    className="w-full text-left p-3 rounded-2xl border border-dashed border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 transition-all flex items-center justify-between gap-3 cursor-pointer mt-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
                        <Plus className="w-4 h-4" />
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-cyan-200">
                        {customLabel}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-cyan-400" />
                  </button>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          {(showDoneButton || multiSelect || footerContent) && (
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3 flex-shrink-0 pb-safe">
              <div className="text-xs text-slate-400">
                {footerContent || (
                  multiSelect ? (
                    <span>
                      {tempMultiSelected.length} of {options.length} selected
                    </span>
                  ) : null
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDone}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-lg shadow-cyan-600/30 cursor-pointer"
                >
                  {doneLabel}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Universal Dropdown / Select Field Trigger Component
 * Drop-in replacement for `<select>` tags in any form.
 */
export interface SelectFieldProps<T = string> {
  id?: string;
  label?: string;
  required?: boolean;
  description?: string;
  error?: string;
  placeholder?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T, option?: SelectOption<T>) => void;
  title?: string;
  sheetDescription?: string;
  showSearch?: boolean;
  searchPlaceholder?: string;
  categories?: SelectionCategory[];
  allowCustom?: boolean;
  customLabel?: string;
  onCustomSelect?: () => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  compact?: boolean;
  leadingIcon?: React.ReactNode;
}

export function SelectField<T = string>({
  id,
  label,
  required,
  description,
  error,
  placeholder = 'Select an option...',
  value,
  options,
  onChange,
  title,
  sheetDescription,
  showSearch,
  searchPlaceholder,
  categories,
  allowCustom,
  customLabel,
  onCustomSelect,
  disabled = false,
  className,
  triggerClassName,
  compact = false,
  leadingIcon,
}: SelectFieldProps<T>) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const selectedOption = useMemo(() => {
    return options.find((o) => o.value === value);
  }, [options, value]);

  const handleSelect = (val: T, opt: SelectOption<T>) => {
    onChange(val, opt);
    setIsSheetOpen(false);
  };

  return (
    <div className={cn('space-y-1', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={id}
            className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-heading"
          >
            {label} {required && <span className="text-rose-400">*</span>}
          </label>
          {description && (
            <span className="text-[10px] text-slate-400">{description}</span>
          )}
        </div>
      )}

      {/* Interactive Trigger Box */}
      <button
        id={id}
        type="button"
        disabled={disabled}
        onClick={() => setIsSheetOpen(true)}
        className={cn(
          'w-full text-left rounded-xl border transition-all flex items-center justify-between gap-2.5 cursor-pointer group focus:outline-none',
          compact ? 'px-3 py-2 text-xs' : 'px-3.5 py-2.5 text-xs sm:text-sm',
          disabled
            ? 'opacity-50 cursor-not-allowed bg-slate-900/50 border-slate-800'
            : error
            ? 'bg-rose-950/20 border-rose-500/50 text-white focus:ring-1 focus:ring-rose-500/30'
            : 'bg-slate-900 border-slate-700/90 hover:border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30',
          triggerClassName
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Option Icon or Leading Icon */}
          {selectedOption?.icon ? (
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-slate-300 group-hover:text-cyan-400">
              {selectedOption.icon}
            </div>
          ) : leadingIcon ? (
            <div className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-slate-400">
              {leadingIcon}
            </div>
          ) : null}

          {/* Option Label + Badge */}
          <div className="min-w-0 flex-1 flex items-center gap-2 overflow-hidden">
            {selectedOption ? (
              <>
                <span className="font-semibold text-slate-100 truncate text-xs sm:text-sm">
                  {selectedOption.label}
                </span>
                {selectedOption.badge && (
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-md text-[10px] font-bold border flex-shrink-0 whitespace-nowrap uppercase tracking-wider',
                      getBadgeColorClass(selectedOption.badgeColor)
                    )}
                  >
                    {selectedOption.badge}
                  </span>
                )}
                {selectedOption.sublabel && !compact && (
                  <span className="text-[11px] text-slate-400 truncate hidden md:inline">
                    • {selectedOption.sublabel}
                  </span>
                )}
              </>
            ) : (
              <span className="text-slate-500 text-xs sm:text-sm">{placeholder}</span>
            )}
          </div>
        </div>

        {/* Chevron Indicator */}
        <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors flex-shrink-0" />
      </button>

      {error && <p className="text-[11px] text-rose-400 mt-0.5">{error}</p>}

      {/* Selection Sheet */}
      <SelectionSheet<T>
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={title || label || 'Select Option'}
        description={sheetDescription || description}
        options={options}
        selectedValue={value}
        onSelect={handleSelect}
        showSearch={showSearch}
        searchPlaceholder={searchPlaceholder}
        categories={categories}
        allowCustom={allowCustom}
        customLabel={customLabel}
        onCustomSelect={onCustomSelect}
      />
    </div>
  );
}

/**
 * Inline Segmented Pill Picker
 * Great for 2-4 option toggles like Self / Parent / Spouse, or Billing Cycle types.
 */
export interface SegmentedPickerOption<T = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  badge?: string;
}

export interface SegmentedPickerProps<T = string> {
  id?: string;
  label?: string;
  options: SegmentedPickerOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  disabled?: boolean;
}

export function SegmentedPicker<T = string>({
  id,
  label,
  options,
  value,
  onChange,
  className,
  disabled = false,
}: SegmentedPickerProps<T>) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-heading"
        >
          {label}
        </label>
      )}

      <div
        id={id}
        className="p-1 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-1 w-full overflow-x-auto"
      >
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={String(option.value)}
              type="button"
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap',
                isSelected
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              )}
            >
              {option.icon && (
                <span className="w-3.5 h-3.5 flex-shrink-0 flex items-center justify-center">
                  {option.icon}
                </span>
              )}
              <span>{option.label}</span>
              {option.badge && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-white/20 text-white">
                  {option.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
