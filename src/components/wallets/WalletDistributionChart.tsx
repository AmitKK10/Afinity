import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DigitalWallet } from '../../types';
import { Layers, EyeOff, Gift } from 'lucide-react';

interface WalletDistributionChartProps {
  wallets: DigitalWallet[];
}

const WalletTooltip: React.FC<any> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    const formatCurrency = (val: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(val);
    };

    return (
      <div className="bg-neutral-900 border border-neutral-700 p-2.5 rounded-xl shadow-xl text-xs">
        <p className="font-semibold text-white">{item.name}</p>
        <p className="font-mono text-indigo-400 mt-0.5">{formatCurrency(item.balance)} ({item.percentage}%)</p>
      </div>
    );
  }
  return null;
};

export const WalletDistributionChart: React.FC<WalletDistributionChartProps> = ({ wallets }) => {
  const activeWallets = wallets.filter((w) => w.status !== 'archived' && w.status !== 'closed');
  const positiveWallets = activeWallets.filter((w) => (w.balance || 0) > 0);

  const totalPositive = positiveWallets.reduce((acc, w) => acc + (w.balance || 0), 0);

  const COLORS = [
    '#f59e0b', // Amazon Gold
    '#3b82f6', // Bajaj Blue
    '#0ea5e9', // SBI Sky
    '#10b981', // Emerald Cashback
    '#a855f7', // Purple PhonePe
    '#06b6d4', // Cyan Paytm
    '#ec4899', // Pink
    '#8b5cf6', // Indigo
  ];

  const data = positiveWallets.map((w, idx) => {
    const bal = Number(w.balance || 0);
    const pct = totalPositive > 0 ? (bal / totalPositive) * 100 : 0;
    return {
      id: w.id,
      name: w.displayName || w.name,
      balance: bal,
      percentage: pct.toFixed(1),
      color: COLORS[idx % COLORS.length],
      walletType: w.walletType,
      includeInNetWorth: w.includeInNetWorth !== false,
    };
  });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (activeWallets.length === 0) {
    return null;
  }

  return (
    <div
      id="wallet-distribution-section"
      className="rounded-2xl bg-neutral-900/60 border border-neutral-800/80 p-5 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-semibold text-white">Wallet Allocation & Breakdown</h3>
        </div>
        <span className="text-xs text-neutral-400">
          Total: <strong className="text-white font-mono">{formatCurrency(totalPositive)}</strong>
        </span>
      </div>

      {totalPositive === 0 ? (
        <div className="py-6 text-center text-xs text-neutral-500">
          No positive wallet balance to distribute.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart visualization */}
          <div className="md:col-span-4 h-44 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="balance"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<WalletTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-neutral-400 uppercase tracking-widest font-semibold">
                Wallets
              </span>
              <span className="text-xs font-bold text-white font-mono mt-0.5">
                {positiveWallets.length}
              </span>
            </div>
          </div>

          {/* Breakdown bars / chips */}
          <div className="md:col-span-8 space-y-2.5">
            {data.map((item) => (
              <div key={item.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-medium text-neutral-200">{item.name}</span>
                    {!item.includeInNetWorth && (
                      <span className="text-[10px] text-amber-400/90 inline-flex items-center gap-0.5">
                        <EyeOff className="w-2.5 h-2.5" />
                        (Excluded)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-neutral-400">{item.percentage}%</span>
                    <strong className="text-white">{formatCurrency(item.balance)}</strong>
                  </div>
                </div>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
