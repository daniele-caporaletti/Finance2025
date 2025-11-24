import React, { useMemo } from 'react';
import { Transaction } from '../types';
import { Tag, ChevronRight } from 'lucide-react';

interface TagStatsProps {
  transactions: Transaction[];
  onTagClick: (tagName: string) => void;
}

export const TagStats: React.FC<TagStatsProps> = ({ transactions, onTagClick }) => {
  
  const tagData = useMemo(() => {
    const tags: Record<string, number> = {};
    
    transactions.forEach(t => {
      if (t.flag && t.flag.trim() !== '' && t.analytics !== 'FALSE') {
        const tagName = t.flag.trim();
        tags[tagName] = (tags[tagName] || 0) + t.valueChf;
      }
    });

    return Object.entries(tags)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  }, [transactions]);

  const formatCHF = (val: number) => 
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[500px] overflow-hidden">
      {/* Widget Header */}
      <div className="px-6 py-4 bg-orange-50 border-b border-orange-100 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl text-orange-600 shadow-sm">
             <Tag className="w-5 h-5" />
          </div>
          <div>
              <h3 className="font-bold text-orange-900">Eventi & Tag</h3>
              <p className="text-xs font-medium text-orange-700/70 uppercase tracking-wide">Analisi per Etichetta</p>
          </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white">
        {tagData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <Tag className="w-10 h-10 opacity-20"/>
                <p className="text-sm font-medium">Nessun evento nel periodo.</p>
            </div>
        ) : (
            <div className="space-y-2 pr-1">
                {tagData.map((tag) => (
                <button
                    key={tag.name}
                    onClick={() => onTagClick(tag.name)}
                    className="w-full flex items-center justify-between p-3 bg-white hover:bg-orange-50 border border-slate-100 hover:border-orange-200 rounded-2xl transition-all group shadow-sm hover:shadow-md"
                >
                    <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border border-orange-100">
                        {tag.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-700 text-sm truncate">{tag.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                    <span className={`text-sm font-bold ${tag.value < 0 ? 'text-slate-600' : 'text-emerald-600'}`}>
                        {formatCHF(tag.value)}
                    </span>
                    <div className="bg-slate-50 p-1.5 rounded-lg group-hover:bg-white transition-colors">
                         <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400" />
                    </div>
                    </div>
                </button>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};