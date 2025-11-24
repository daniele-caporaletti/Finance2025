
import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Tag } from 'lucide-react';

interface TagStatsProps { transactions: Transaction[]; onTagClick: (tag: string) => void; }

export const TagStats: React.FC<TagStatsProps> = ({ transactions, onTagClick }) => {
  const tags = useMemo(() => {
    const t: Record<string, number> = {};
    transactions.forEach(tr => { if(tr.flag && tr.analytics !== 'FALSE') t[tr.flag] = (t[tr.flag] || 0) + tr.valueChf; });
    return Object.entries(t).map(([name, value]) => ({ name, value })).sort((a,b) => Math.abs(b.value) - Math.abs(a.value));
  }, [transactions]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 flex flex-col min-h-[200px] max-h-[500px] h-auto overflow-hidden transition-all duration-300">
      <div className="px-6 py-4 border-b border-slate-100/50 flex items-center gap-2 shrink-0">
          <Tag className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-slate-800 text-sm">Top Eventi</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
         {tags.map(tag => (
             <button key={tag.name} onClick={() => onTagClick(tag.name)} className="w-full flex items-center justify-between p-3 bg-white/50 hover:bg-white rounded-2xl transition-all group border border-transparent hover:border-orange-100 shadow-sm hover:shadow">
                 <span className="text-xs font-bold text-slate-700">{tag.name}</span>
                 <span className={`text-xs font-bold ${tag.value < 0 ? 'text-slate-500' : 'text-emerald-600'}`}>
                     {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(tag.value)}
                 </span>
             </button>
         ))}
         {tags.length === 0 && <div className="text-center text-xs text-slate-400 py-8 italic">Nessun evento registrato.</div>}
      </div>
    </div>
  );
};
