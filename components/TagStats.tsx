import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Tag, ChevronRight } from 'lucide-react';

interface TagStatsProps { transactions: Transaction[]; onTagClick: (tag: string) => void; }

export const TagStats: React.FC<TagStatsProps> = ({ transactions, onTagClick }) => {
  const { tags } = useMemo(() => {
    const t: Record<string, number> = {};
    transactions.forEach(tr => { if(tr.flag && tr.analytics !== 'FALSE') t[tr.flag] = (t[tr.flag] || 0) + tr.valueChf; });
    
    const sorted = Object.entries(t).map(([name, value]) => ({ name, value })).sort((a,b) => Math.abs(b.value) - Math.abs(a.value));
    
    return { tags: sorted };
  }, [transactions]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 flex flex-col min-h-[200px] max-h-[500px] h-auto overflow-hidden transition-all duration-300">
      <div className="px-6 py-4 border-b border-slate-100/50 flex items-center gap-2 shrink-0">
          <Tag className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-slate-800 text-sm">Top Eventi</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-2">
         {tags.map((tag, index) => {
             return (
                 <button 
                    key={tag.name} 
                    onClick={() => onTagClick(tag.name)} 
                    className="w-full flex items-center justify-between p-3 rounded-2xl bg-white/40 hover:bg-white/80 border border-transparent hover:border-orange-100 transition-all hover:shadow-sm group"
                 >
                     {/* Left: Rank & Name */}
                     <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-6 h-6 rounded-full bg-white text-orange-600 flex items-center justify-center text-[10px] font-bold shadow-sm border border-orange-50 shrink-0">
                             {index + 1}
                         </div>
                         <span className="text-xs font-bold text-slate-700 truncate">{tag.name}</span>
                     </div>
                     
                     {/* Right: Amount & Arrow */}
                     <div className="flex items-center gap-3 shrink-0">
                         <span className={`text-xs font-bold font-mono ${tag.value < 0 ? 'text-slate-600' : 'text-emerald-600'}`}>
                             {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(tag.value)}
                         </span>
                         <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-orange-400 transition-colors" />
                     </div>
                 </button>
             );
         })}
         
         {tags.length === 0 && (
             <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs italic">
                 <Tag className="w-8 h-8 mb-2 opacity-20" />
                 Nessun evento registrato.
             </div>
         )}
      </div>
    </div>
  );
};