import React from 'react';
import { motion } from 'motion/react';
import {
  Banknote,
  Building2,
  Smartphone,
  TrendingUp,
  BookOpen,
  CreditCard as CreditCardIcon,
  ReceiptText,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
} from 'lucide-react';
import { FinancialCard } from '../ui/FinancialCard';
import { MoneyDisplay } from '../ui/MoneyDisplay';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

const gridContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
};

const cardItemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface AssetLiabilityGridProps {
  cashTotal: number;
  bankTotal: number;
  walletTotal: number;
  investmentTotal: number;
  receivablesTotal: number;
  creditCardTotal: number;
  payablesTotal: number;
  onSelectCategory?: (category: string) => void;
  className?: string;
}

export const AssetLiabilityGrid: React.FC<AssetLiabilityGridProps> = ({
  cashTotal,
  bankTotal,
  walletTotal,
  investmentTotal,
  receivablesTotal,
  creditCardTotal,
  payablesTotal,
  onSelectCategory,
  className,
}) => {
  const assetItems = [
    {
      id: 'investments',
      label: 'Investments',
      sublabel: 'Stocks • MFs • Gold',
      amount: investmentTotal,
      icon: TrendingUp,
      iconColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      badge: 'Portfolio',
      badgeVariant: 'emerald' as const,
      changeText: '+4.8% MTD',
    },
    {
      id: 'banks',
      label: 'Banks & FDs',
      sublabel: '3 Accounts + 1 FD',
      amount: bankTotal,
      icon: Building2,
      iconColor: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
      badge: 'Liquid',
      badgeVariant: 'blue' as const,
    },
    {
      id: 'cash',
      label: 'Cash in Hand',
      sublabel: 'Locker & Pocket notes',
      amount: cashTotal,
      icon: Banknote,
      iconColor: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      badge: 'Physical',
      badgeVariant: 'gold' as const,
    },
    {
      id: 'wallets',
      label: 'Digital Wallets',
      sublabel: 'Amazon Pay & Paytm',
      amount: walletTotal,
      icon: Smartphone,
      iconColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
      badge: 'UPI/Wallet',
      badgeVariant: 'cyan' as const,
    },
    {
      id: 'receivables',
      label: 'Receivables (Khatabook)',
      sublabel: 'Money owed to you',
      amount: receivablesTotal,
      icon: BookOpen,
      iconColor: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      badge: '2 People',
      badgeVariant: 'slate' as const,
    },
  ];

  const liabilityItems = [
    {
      id: 'credit_cards',
      label: 'Credit Cards Outstanding',
      sublabel: '4 Active Cards',
      amount: creditCardTotal,
      icon: CreditCardIcon,
      iconColor: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      badge: '11.8% Avg Util',
      badgeVariant: 'coral' as const,
      isLiability: true,
    },
    {
      id: 'payables',
      label: 'Payables (Bills & Dues)',
      sublabel: 'Society Maintenance',
      amount: payablesTotal,
      icon: ReceiptText,
      iconColor: 'bg-slate-800 text-slate-300 border-slate-700',
      badge: 'Due Aug 28',
      badgeVariant: 'slate' as const,
      isLiability: true,
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      {/* Assets Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-500/15 text-emerald-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-heading">
              Assets Breakdown
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-400 tabular-nums">
            {assetItems.length} categories
          </span>
        </div>

        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {assetItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.id} variants={cardItemVariants}>
                <FinancialCard
                  id={`asset-card-${item.id}`}
                  hoverEffect
                  onClick={() => onSelectCategory?.(item.id)}
                  className="flex flex-col justify-between p-4 group h-full"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('p-2 rounded-xl border flex-shrink-0 transition-transform group-hover:scale-105', item.iconColor)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors font-heading">
                          {item.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-normal">
                          {item.sublabel}
                        </p>
                      </div>
                    </div>
                    {item.badge && (
                      <Badge variant={item.badgeVariant} size="sm">
                        {item.badge}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between pt-2 mt-1 border-t border-slate-800/60">
                    <MoneyDisplay amount={item.amount} size="lg" />
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </FinancialCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Liabilities Section */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-md bg-rose-500/15 text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 font-heading">
              Liabilities & Dues
            </h3>
          </div>
          <span className="text-xs font-semibold text-rose-400 tabular-nums">
            {liabilityItems.length} categories
          </span>
        </div>

        <motion.div
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {liabilityItems.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div key={item.id} variants={cardItemVariants}>
                <FinancialCard
                  id={`liability-card-${item.id}`}
                  hoverEffect
                  onClick={() => onSelectCategory?.(item.id)}
                  className="flex flex-col justify-between p-4 group border-rose-950/30 hover:border-rose-800/50 h-full"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className={cn('p-2 rounded-xl border flex-shrink-0 transition-transform group-hover:scale-105', item.iconColor)}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors font-heading">
                          {item.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-normal">
                          {item.sublabel}
                        </p>
                      </div>
                    </div>
                    {item.badge && (
                      <Badge variant={item.badgeVariant} size="sm">
                        {item.badge}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-baseline justify-between pt-2 mt-1 border-t border-slate-800/60">
                    <MoneyDisplay amount={item.amount} size="lg" colorOverride="coral" />
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </FinancialCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};
