import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  WalletCards,
  TrendingUp,
  CreditCard,
  PieChart,
  Plus,
} from 'lucide-react';
import { cn } from '../../utils/cn';

interface BottomNavProps {
  onQuickUpdateClick: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ onQuickUpdateClick }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { key: 'home', label: 'Home', path: '/', icon: LayoutDashboard },
    { key: 'accounts', label: 'Accounts', path: '/accounts', icon: WalletCards },
    { key: 'update', label: 'Update', path: '#', icon: Plus, isAction: true },
    { key: 'investments', label: 'Invest', path: '/investments', icon: TrendingUp },
    { key: 'credit', label: 'Credit', path: '/credit', icon: CreditCard },
  ];

  return (
    <nav
      id="afinity-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0a0f1e]/95 backdrop-blur-xl border-t border-slate-800/90 px-3 py-1.5 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.6)]"
    >
      <div className="flex items-center justify-around max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isAction = item.isAction;
          const isActive = !isAction && location.pathname === item.path;

          if (isAction) {
            return (
              <div key={item.key} className="flex flex-col items-center -mt-5">
                <button
                  type="button"
                  id="bottom-nav-quick-update-btn"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('afinity-close-search'));
                    onQuickUpdateClick();
                  }}
                  aria-label="Quick Update Financials"
                  className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center transition-transform active:scale-90 hover:scale-105 cursor-pointer"
                >
                  <div className="w-full h-full rounded-full bg-[#080d1a] flex items-center justify-center text-cyan-300 hover:text-white">
                    <Plus className="w-6 h-6 stroke-[2.8]" />
                  </div>
                </button>
                <span className="text-[10px] font-bold text-cyan-400 mt-1 font-heading">
                  Update
                </span>
              </div>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              id={`bottom-nav-${item.key}`}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('afinity-close-search'));
                navigate(item.path);
              }}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all cursor-pointer select-none',
                isActive
                  ? 'text-cyan-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-transform', isActive && 'scale-110 stroke-[2.4]')} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]" />
                )}
              </div>
              <span className={cn('text-[10px] mt-1 tracking-tight font-heading', isActive ? 'text-cyan-300' : 'text-slate-400')}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
