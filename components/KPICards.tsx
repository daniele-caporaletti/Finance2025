import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Wallet, TrendingDown, TrendingUp, Briefcase, Info, X } from 'lucide-react';
import { DetailType } from './KPIDetailView';

interface KPICardsProps {
  periodTransactions: Transaction[];
  balanceTransactions: Transaction[];
  activeView: DetailType | null;
  onCardClick: (type: DetailType) => void;
}

export const KPICards: React.FC<KPICardsProps> = ({ periodTransactions, balanceTransactions, activeView, onCardClick }) => {
  const stats = useMemo(() => {
    // 1. Total Balance (From Balance Transactions - typically whole year)
    let totalBalance = 0;
    balanceTransactions.forEach(t => {
      totalBalance += t.valueChf;
    });

    // 2. Period Stats (From Period Transactions)
    let income = 0;
    let expenses = 0;
    let work = 0;

    periodTransactions.forEach(t => {
      const val = t.valueChf;
      
      // Work KPI
      if (t.analytics === 'WORK') {
        work += val;
      } 
      // Standard Income/Expense (Exclude WORK and FALSE)
      else if (t.analytics !== 'FALSE') {
        if (val > 0) {
          income += val;
        } else {
          expenses += val;
        }
      }
    });

    return { income, expenses, work, totalBalance };
  }, [periodTransactions, balanceTransactions]);

  const formatCHF = (num: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
      minimumFractionDigits: 2
    }).format(num);
  };

  const getCardClasses = (type: DetailType, baseColor: string, activeRing: string) => {
    const isActive = activeView === type;
    const isInactive = activeView !== null && !isActive;

    return `
      relative overflow-hidden rounded-3xl p-6 flex flex-col justify-between h-40 transition-all duration-300 cursor-pointer group
      ${isActive ? `ring-4 ${activeRing} scale-[1.02] shadow-xl z-10` : 'hover:scale-[1.02] hover:shadow-lg'}
      ${isInactive ? 'opacity-40 grayscale-[0.5] scale-95' : 'opacity-100'}
      ${baseColor}
    `;
  };

  const handleToggle = (type: DetailType) => {
    // If clicking the already active card, we want to close it (pass same type, parent handles toggle or we pass null? 
    // Parent logic: if (type === activeView) setActive(null)
    onCardClick(type);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      
      {/* Saldo Totale (Primary - Purple/Blue) */}
      <div 
        onClick={() => handleToggle('BALANCE')}
        className={getCardClasses('BALANCE', 'bg-violet-100', 'ring-violet-300')}
      >
        <div className="absolute -right-4 -bottom-4 opacity-10">
            <Wallet className="w-32 h-32 text-violet-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'BALANCE' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-violet-700">
                {activeView === 'BALANCE' ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/60 rounded-full text-violet-700">
                <Wallet className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-violet-900 uppercase tracking-wide opacity-70">Saldo Totale</span>
        </div>
        <h3 className="text-3xl font-bold text-violet-950 z-10">
          {formatCHF(stats.totalBalance)}
        </h3>
      </div>

      {/* Uscite (Error Container - Red/Rose) */}
      <div 
        onClick={() => handleToggle('EXPENSE')}
        className={getCardClasses('EXPENSE', 'bg-rose-100', 'ring-rose-300')}
      >
        <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingDown className="w-32 h-32 text-rose-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'EXPENSE' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-rose-700">
                {activeView === 'EXPENSE' ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/60 rounded-full text-rose-700">
                <TrendingDown className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-rose-900 uppercase tracking-wide opacity-70">Uscite</span>
        </div>
        <h3 className="text-3xl font-bold text-rose-950 z-10">
          {formatCHF(stats.expenses)}
        </h3>
      </div>

      {/* Entrate (Success Container - Green/Emerald) */}
      <div 
        onClick={() => handleToggle('INCOME')}
        className={getCardClasses('INCOME', 'bg-emerald-100', 'ring-emerald-300')}
      >
        <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingUp className="w-32 h-32 text-emerald-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'INCOME' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-emerald-700">
                {activeView === 'INCOME' ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white/60 rounded-full text-emerald-700">
                <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-emerald-900 uppercase tracking-wide opacity-70">Entrate</span>
        </div>
        <h3 className="text-3xl font-bold text-emerald-950 z-10">
          +{formatCHF(stats.income)}
        </h3>
      </div>

      {/* Lavoro (Tertiary Container - Indigo/Blue) */}
      <div 
        onClick={() => handleToggle('WORK')}
        className={getCardClasses('WORK', 'bg-indigo-50 border border-indigo-100', 'ring-indigo-200')}
      >
         <div className="absolute -right-4 -bottom-4 opacity-5">
            <Briefcase className="w-32 h-32 text-indigo-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'WORK' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-indigo-700">
                {activeView === 'WORK' ? <X className="w-4 h-4" /> : <Info className="w-4 h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-white rounded-full text-indigo-600 shadow-sm">
                <Briefcase className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-indigo-900 uppercase tracking-wide opacity-70">Lavoro</span>
        </div>
        <h3 className={`text-3xl font-bold z-10 ${stats.work >= 0 ? 'text-indigo-900' : 'text-indigo-900'}`}>
          {stats.work > 0 ? '+' : ''}{formatCHF(stats.work)}
        </h3>
      </div>

    </div>
  );
};