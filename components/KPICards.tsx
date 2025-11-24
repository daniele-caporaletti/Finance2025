
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
      
      {/* HERO CARDS (Expenses & Balance) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Left Hero: Expenses (Violet Theme) */}
        <div 
            onClick={() => onCardClick('EXPENSE')}
            className={`relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md
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
            className={`relative overflow-hidden rounded-[2.5rem] p-8 transition-all duration-300 cursor-pointer group shadow-sm hover:shadow-md
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

      {/* SECONDARY METRICS (Income, Work, Events) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
          
          {/* Income */}
          <div 
            onClick={() => onCardClick('INCOME')}
            className={`relative rounded-3xl p-4 sm:p-6 cursor-pointer transition-all group border border-transparent hover:border-emerald-100 hover:bg-emerald-50/50 hover:shadow-sm bg-white/60 backdrop-blur-md
            ${activeView === 'INCOME' ? 'bg-emerald-50 ring-2 ring-emerald-100' : ''}`}
          >
              <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                      <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Entrate</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-700 group-hover:text-emerald-700 transition-colors">
                  +{formatCHF(stats.income)}
              </div>
          </div>

          {/* Work */}
          <div 
            onClick={() => onCardClick('WORK')}
            className={`relative rounded-3xl p-4 sm:p-6 cursor-pointer transition-all group border border-transparent hover:border-indigo-100 hover:bg-indigo-50/50 hover:shadow-sm bg-white/60 backdrop-blur-md
            ${activeView === 'WORK' ? 'bg-indigo-50 ring-2 ring-indigo-100' : ''}`}
          >
              <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                      <Briefcase className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Lavoro</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-700 group-hover:text-indigo-700 transition-colors">
                  {formatCHF(stats.work)}
              </div>
          </div>

          {/* Events */}
          <div 
            onClick={() => onCardClick('TAGS_SUMMARY')}
            className={`relative rounded-3xl p-4 sm:p-6 cursor-pointer transition-all group border border-transparent hover:border-orange-100 hover:bg-orange-50/50 hover:shadow-sm bg-white/60 backdrop-blur-md
            ${activeView === 'TAGS_SUMMARY' ? 'bg-orange-50 ring-2 ring-orange-100' : ''}`}
          >
              <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 rounded-lg bg-orange-100 text-orange-700">
                      <Tag className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Eventi</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-slate-700 group-hover:text-orange-700 transition-colors">
                  {formatCHF(stats.events)}
              </div>
          </div>

      </div>
    </div>
  );
};
