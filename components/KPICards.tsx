import React, { useMemo } from 'react';
import { Transaction, PeriodType } from '../types';
import { Wallet, TrendingDown, TrendingUp, Briefcase, Info, X, Tag } from 'lucide-react';
import { DetailType } from './KPIDetailView';

interface KPICardsProps {
  periodTransactions: Transaction[];
  balanceTransactions: Transaction[];
  activeView: DetailType | null;
  onCardClick: (type: DetailType) => void;
  periodType: PeriodType;
}

export const KPICards: React.FC<KPICardsProps> = ({ periodTransactions, balanceTransactions, activeView, onCardClick, periodType }) => {
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
    let events = 0;

    periodTransactions.forEach(t => {
      const val = t.valueChf;
      
      // Events/Tags (Sum of all tagged transactions, regardless of analytics type usually, or following filtering?)
      // Assuming we sum everything that has a tag for the "Eventi" KPI
      if (t.flag && t.flag.trim() !== '' && t.analytics !== 'FALSE') {
          events += val;
      }

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

    return { income, expenses, work, totalBalance, events };
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
      relative overflow-hidden rounded-3xl p-5 sm:p-6 flex flex-col justify-between h-36 sm:h-40 transition-all duration-300 cursor-pointer group
      ${isActive ? `ring-4 ${activeRing} scale-[1.02] shadow-xl z-10` : 'hover:scale-[1.02] hover:shadow-lg'}
      ${isInactive ? 'opacity-40 grayscale-[0.5] scale-95' : 'opacity-100'}
      ${baseColor}
    `;
  };

  const handleToggle = (type: DetailType) => {
    onCardClick(type);
  };

  // Dynamic Label Suffixes
  const suffix = periodType === 'MONTH' ? 'MESE' : 'TOTALI';
  const eventsSuffix = periodType === 'MONTH' ? 'MENSILI' : 'TOTALI';

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
      
      {/* Saldo Totale (Primary - Purple/Blue) - Spans 2 cols on mobile if needed, or 1 */}
      <div 
        onClick={() => handleToggle('BALANCE')}
        className={`${getCardClasses('BALANCE', 'bg-violet-100', 'ring-violet-300')} col-span-2 md:col-span-1 lg:col-span-1`}
      >
        <div className="absolute -right-4 -bottom-4 opacity-10">
            <Wallet className="w-32 h-32 text-violet-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'BALANCE' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-violet-700">
                {activeView === 'BALANCE' ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Info className="w-3 h-3 sm:w-4 sm:h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 bg-white/60 rounded-full text-violet-700">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-violet-900 uppercase tracking-wide opacity-70">Saldo Attuale</span>
        </div>
        <h3 className="text-2xl sm:text-2xl font-bold text-violet-950 z-10 truncate">
          {formatCHF(stats.totalBalance)}
        </h3>
      </div>

      {/* Uscite */}
      <div 
        onClick={() => handleToggle('EXPENSE')}
        className={getCardClasses('EXPENSE', 'bg-rose-100', 'ring-rose-300')}
      >
        <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingDown className="w-32 h-32 text-rose-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'EXPENSE' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-rose-700">
                {activeView === 'EXPENSE' ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Info className="w-3 h-3 sm:w-4 sm:h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 bg-white/60 rounded-full text-rose-700">
                <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-rose-900 uppercase tracking-wide opacity-70">Uscite {suffix}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-rose-950 z-10 truncate">
          {formatCHF(stats.expenses)}
        </h3>
      </div>

      {/* Entrate */}
      <div 
        onClick={() => handleToggle('INCOME')}
        className={getCardClasses('INCOME', 'bg-emerald-100', 'ring-emerald-300')}
      >
        <div className="absolute -right-4 -bottom-4 opacity-10">
            <TrendingUp className="w-32 h-32 text-emerald-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'INCOME' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-emerald-700">
                {activeView === 'INCOME' ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Info className="w-3 h-3 sm:w-4 sm:h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 bg-white/60 rounded-full text-emerald-700">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-emerald-900 uppercase tracking-wide opacity-70">Entrate {suffix}</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-emerald-950 z-10 truncate">
          +{formatCHF(stats.income)}
        </h3>
      </div>

      {/* Lavoro */}
      <div 
        onClick={() => handleToggle('WORK')}
        className={getCardClasses('WORK', 'bg-indigo-50 border border-indigo-100', 'ring-indigo-200')}
      >
         <div className="absolute -right-4 -bottom-4 opacity-5">
            <Briefcase className="w-32 h-32 text-indigo-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'WORK' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-indigo-700">
                {activeView === 'WORK' ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Info className="w-3 h-3 sm:w-4 sm:h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 bg-white rounded-full text-indigo-600 shadow-sm">
                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-indigo-900 uppercase tracking-wide opacity-70">Lavoro {suffix}</span>
        </div>
        <h3 className={`text-xl sm:text-2xl font-bold z-10 truncate ${stats.work >= 0 ? 'text-indigo-900' : 'text-indigo-900'}`}>
          {stats.work > 0 ? '+' : ''}{formatCHF(stats.work)}
        </h3>
      </div>

       {/* Eventi & Tag (New) */}
       <div 
        onClick={() => handleToggle('TAGS_SUMMARY')}
        className={getCardClasses('TAGS_SUMMARY', 'bg-orange-50 border border-orange-100', 'ring-orange-200')}
      >
         <div className="absolute -right-4 -bottom-4 opacity-5">
            <Tag className="w-32 h-32 text-orange-900" />
        </div>
        <div className={`absolute top-4 right-4 transition-all duration-300 ${activeView === 'TAGS_SUMMARY' ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-100 group-hover:scale-100'}`}>
             <div className="bg-white/50 p-1.5 rounded-full text-orange-700">
                {activeView === 'TAGS_SUMMARY' ? <X className="w-3 h-3 sm:w-4 sm:h-4" /> : <Info className="w-3 h-3 sm:w-4 sm:h-4" />}
             </div>
        </div>
        <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 sm:p-2 bg-white rounded-full text-orange-600 shadow-sm">
                <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-orange-900 uppercase tracking-wide opacity-70">Eventi {eventsSuffix}</span>
        </div>
        <h3 className={`text-xl sm:text-2xl font-bold z-10 truncate ${stats.events >= 0 ? 'text-orange-900' : 'text-orange-900'}`}>
          {formatCHF(stats.events)}
        </h3>
      </div>

    </div>
  );
};