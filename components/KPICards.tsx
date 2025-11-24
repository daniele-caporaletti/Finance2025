import React, { useMemo } from 'react';
import { Transaction, PeriodType } from '../types';
import { Wallet, TrendingDown, TrendingUp, Briefcase, Tag } from 'lucide-react';
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

  const formatCHF = (num: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);

  const getCardClasses = (type: DetailType, isActive: boolean) => `
    flex-none w-40 sm:w-auto sm:flex-1 p-5 rounded-3xl border transition-all duration-300 cursor-pointer select-none flex flex-col justify-between h-36 shadow-sm
    ${isActive 
        ? 'bg-slate-800 border-slate-800 text-white ring-4 ring-slate-200' 
        : 'bg-white/70 border-white/40 hover:bg-white hover:shadow-md text-slate-600 backdrop-blur-md'
    }
  `;

  const cards = [
      { type: 'BALANCE' as const, title: 'Saldo', amount: stats.totalBalance, icon: <Wallet className="w-5 h-5"/>, color: 'text-violet-600', bg: 'bg-violet-50' },
      { type: 'EXPENSE' as const, title: 'Uscite', amount: stats.expenses, icon: <TrendingDown className="w-5 h-5"/>, color: 'text-rose-600', bg: 'bg-rose-50' },
      { type: 'INCOME' as const, title: 'Entrate', amount: stats.income, icon: <TrendingUp className="w-5 h-5"/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { type: 'WORK' as const, title: 'Lavoro', amount: stats.work, icon: <Briefcase className="w-5 h-5"/>, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { type: 'TAGS_SUMMARY' as const, title: 'Eventi', amount: stats.events, icon: <Tag className="w-5 h-5"/>, color: 'text-orange-600', bg: 'bg-orange-50' },
  ];

  return (
    // Mobile: Horizontal Scroll with Snap. Desktop: Grid.
    <div className="flex overflow-x-auto sm:grid sm:grid-cols-5 gap-3 sm:gap-4 pb-4 sm:pb-0 snap-x snap-mandatory no-scrollbar">
      {cards.map((c) => {
          const isActive = activeView === c.type;
          return (
            <div 
                key={c.type}
                onClick={() => onCardClick(c.type)}
                className={`${getCardClasses(c.type, isActive)} snap-start`}
            >
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-2.5 rounded-2xl ${isActive ? 'bg-white/10 text-white' : `${c.bg} ${c.color}`}`}>
                        {c.icon}
                    </div>
                    {isActive && <div className="w-2 h-2 bg-white rounded-full animate-pulse"/>}
                </div>
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isActive ? 'opacity-70' : 'opacity-50'}`}>{c.title}</p>
                    <h3 className={`text-xl font-bold truncate ${isActive ? 'text-white' : 'text-slate-800'}`}>
                        {c.amount > 0 && c.type !== 'EXPENSE' && c.type !== 'BALANCE' ? '+' : ''}{formatCHF(c.amount)}
                    </h3>
                </div>
            </div>
          );
      })}
    </div>
  );
};