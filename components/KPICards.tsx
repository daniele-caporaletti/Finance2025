
import React, { useMemo } from 'react';
import { Transaction, PeriodType } from '../types';
import { Wallet, TrendingDown, TrendingUp, Briefcase, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    let totalBalance = 0;
    balanceTransactions.forEach(t => totalBalance += t.valueChf);

    let income = 0;
    let expenses = 0;
    let work = 0;
    let events = 0;

    periodTransactions.forEach(t => {
      const val = t.valueChf;
      if (t.flag && t.flag.trim() !== '' && t.analytics !== 'FALSE') {
          events += val;
      }
      if (t.analytics === 'WORK') {
        work += val;
      } else if (t.analytics !== 'FALSE') {
        if (val > 0) income += val;
        else expenses += val;
      }
    });

    return { income, expenses, work, totalBalance, events };
  }, [periodTransactions, balanceTransactions]);

  const formatCHF = (num: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 2 }).format(num);

  const periodLabel = periodType === 'MONTH' ? 'Mese' : 'Totali';

  return (
    <div className="space-y-4 sm:space-y-6 mb-8">
      
      {/* HERO CARDS ROW 1 (Expenses & Balance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Left Hero: Expenses (Violet Theme) */}
        <div 
            onClick={() => onCardClick('EXPENSE')}
            className={`relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-xl hover:shadow-violet-200/50 hover:-translate-y-1
            ${activeView === 'EXPENSE' ? 'ring-4 ring-violet-200 bg-violet-100' : 'bg-[#E8E6F8]'}`}
        >
            <div className="relative z-10">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-3">
                    Uscite {periodLabel}
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                    {formatCHF(stats.expenses)}
                </h2>
            </div>
            {/* Watermark Icon */}
            <TrendingDown className="absolute -bottom-6 -right-6 w-40 h-40 text-slate-900/5 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500 ease-out" />
            {/* Interactive indicator */}
            <div className="absolute top-8 right-8 p-2 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <ArrowDownRight className="w-5 h-5 text-slate-700" />
            </div>
        </div>

        {/* Right Hero: Balance (Pink Theme) */}
        <div 
            onClick={() => onCardClick('BALANCE')}
            className={`relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-xl hover:shadow-pink-200/50 hover:-translate-y-1
            ${activeView === 'BALANCE' ? 'ring-4 ring-pink-200 bg-pink-100' : 'bg-[#FCE4EC]'}`}
        >
            <div className="relative z-10">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs mb-3">
                    Budget Residuo
                </p>
                <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight">
                    {formatCHF(stats.totalBalance)}
                </h2>
            </div>
            {/* Watermark Icon */}
            <Wallet className="absolute -bottom-6 -right-6 w-40 h-40 text-slate-900/5 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500 ease-out" />
             <div className="absolute top-8 right-8 p-2 bg-white/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                <ArrowUpRight className="w-5 h-5 text-slate-700" />
            </div>
        </div>

      </div>

      {/* HERO CARDS ROW 2 (Secondary Metrics) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6">
          
          {/* Income (Emerald Theme) */}
          <div 
            onClick={() => onCardClick('INCOME')}
            className={`relative overflow-hidden rounded-[2rem] p-5 sm:p-6 cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-emerald-100/50 hover:-translate-y-1 border border-white/50
            ${activeView === 'INCOME' ? 'ring-4 ring-emerald-100 bg-emerald-50' : 'bg-gradient-to-br from-emerald-50 to-white'}`}
          >
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-white/60 text-emerald-600 shadow-sm backdrop-blur-sm">
                          <TrendingUp className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Entrate</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                      +{formatCHF(stats.income)}
                  </div>
              </div>
              {/* Watermark */}
              <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-emerald-600/5 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500" />
          </div>

          {/* Work (Indigo Theme) */}
          <div 
            onClick={() => onCardClick('WORK')}
            className={`relative overflow-hidden rounded-[2rem] p-5 sm:p-6 cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-indigo-100/50 hover:-translate-y-1 border border-white/50
            ${activeView === 'WORK' ? 'ring-4 ring-indigo-100 bg-indigo-50' : 'bg-gradient-to-br from-indigo-50 to-white'}`}
          >
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-white/60 text-indigo-600 shadow-sm backdrop-blur-sm">
                          <Briefcase className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Lavoro</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">
                      {formatCHF(stats.work)}
                  </div>
              </div>
              {/* Watermark */}
              <Briefcase className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-600/5 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500" />
          </div>

          {/* Events (Orange Theme) */}
          <div 
            onClick={() => onCardClick('TAGS_SUMMARY')}
            className={`relative overflow-hidden rounded-[2rem] p-5 sm:p-6 cursor-pointer transition-all duration-300 group shadow-sm hover:shadow-lg hover:shadow-orange-100/50 hover:-translate-y-1 border border-white/50
            ${activeView === 'TAGS_SUMMARY' ? 'ring-4 ring-orange-100 bg-orange-50' : 'bg-gradient-to-br from-orange-50 to-white'}`}
          >
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg bg-white/60 text-orange-600 shadow-sm backdrop-blur-sm">
                          <Tag className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Eventi</span>
                  </div>
                  <div className="text-lg sm:text-2xl font-bold text-slate-800 group-hover:text-orange-700 transition-colors">
                      {formatCHF(stats.events)}
                  </div>
              </div>
              {/* Watermark */}
              <Tag className="absolute -bottom-4 -right-4 w-24 h-24 text-orange-600/5 -rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-transform duration-500" />
          </div>

      </div>
    </div>
  );
};
