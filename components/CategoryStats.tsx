
import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, List as ListIcon, ChevronDown, ChevronRight } from 'lucide-react';
import { getCategoryColor } from './CategoryIcons';

interface CategoryStatsProps { transactions: Transaction[]; }
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const CategoryStats: React.FC<CategoryStatsProps> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<'CHART' | 'LIST'>('CHART');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const { data, totalExpenses } = useMemo(() => {
    const catMap = new Map<string, { total: number, subs: Map<string, number> }>();
    let total = 0;

    transactions.forEach(t => {
      if (t.analytics !== 'FALSE' && t.analytics !== 'WORK' && t.valueChf < 0) {
        const val = Math.abs(t.valueChf);
        const sub = t.subcategory || 'Altro';
        
        if (!catMap.has(t.category)) {
            catMap.set(t.category, { total: 0, subs: new Map() });
        }
        
        const entry = catMap.get(t.category)!;
        entry.total += val;
        entry.subs.set(sub, (entry.subs.get(sub) || 0) + val);
        
        total += val;
      }
    });

    const entries = Array.from(catMap.entries()).map(([name, info]) => {
        const subcategories = Array.from(info.subs.entries())
            .map(([subName, subVal]) => ({ name: subName, value: subVal }))
            .sort((a, b) => b.value - a.value);
        
        return {
            name,
            value: info.total,
            subcategories
        };
    }).sort((a, b) => b.value - a.value);

    return { data: entries, totalExpenses: total };
  }, [transactions]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 flex flex-col h-[500px] overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-violet-500" />
              <h3 className="font-bold text-slate-800 text-sm">Breakdown Spese</h3>
          </div>
          <div className="flex bg-slate-100/50 p-1 rounded-lg">
              <button 
                onClick={() => setViewMode('CHART')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'CHART' ? 'bg-white shadow text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <PieChartIcon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('LIST')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'LIST' ? 'bg-white shadow text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                  <ListIcon className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 relative overflow-hidden">
         
         {/* CHART VIEW */}
         {viewMode === 'CHART' && (
             <>
                <div className="h-full w-full pb-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={data} 
                                cx="50%" 
                                cy="50%" 
                                innerRadius={60} 
                                outerRadius={80} 
                                paddingAngle={5} 
                                dataKey="value"
                            >
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                            </Pie>
                            <Tooltip 
                                formatter={(val: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val)}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="absolute bottom-0 left-0 w-full flex justify-center gap-2 flex-wrap px-4 pb-4 max-h-[100px] overflow-y-auto custom-scrollbar">
                    {data.slice(0, 8).map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-white/60 px-2.5 py-1 rounded-full border border-slate-100">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}/> 
                            {d.name}
                        </div>
                    ))}
                </div>
             </>
         )}

         {/* LIST VIEW (ACCORDION) */}
         {viewMode === 'LIST' && (
             <div className="h-full overflow-y-auto custom-scrollbar pr-1 space-y-2">
                 {data.map((d, i) => {
                     const percentage = totalExpenses > 0 ? (d.value / totalExpenses) * 100 : 0;
                     const isExpanded = expandedCat === d.name;
                     const color = COLORS[i % COLORS.length];

                     return (
                         <div key={d.name} className="bg-white/40 rounded-xl border border-transparent hover:border-slate-100 overflow-hidden transition-all">
                             {/* Category Header */}
                             <button 
                                onClick={() => setExpandedCat(isExpanded ? null : d.name)}
                                className="w-full p-2.5 cursor-pointer"
                             >
                                 <div className="flex justify-between items-center mb-1.5">
                                     <div className="flex items-center gap-2">
                                         {isExpanded ? <ChevronDown className="w-3 h-3 text-slate-400"/> : <ChevronRight className="w-3 h-3 text-slate-400"/>}
                                         <span className="text-xs font-bold text-slate-700">{d.name}</span>
                                     </div>
                                     <div className="text-right">
                                         <span className="text-xs font-bold text-slate-800 block">
                                             {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(d.value)}
                                         </span>
                                     </div>
                                 </div>
                                 
                                 {/* Progress Bar */}
                                 <div className="flex items-center gap-2">
                                     <div className="relative h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                         <div 
                                            className="absolute top-0 left-0 h-full rounded-full" 
                                            style={{ width: `${percentage}%`, backgroundColor: color }}
                                         />
                                     </div>
                                     <span className="text-[9px] font-bold text-slate-400 w-8 text-right">{percentage.toFixed(0)}%</span>
                                 </div>
                             </button>

                             {/* Subcategories (Dropdown) */}
                             {isExpanded && (
                                 <div className="bg-slate-50/50 border-t border-slate-100/50 px-3 py-2 space-y-2 shadow-inner">
                                     {d.subcategories.map(sub => {
                                         const subPercent = (sub.value / d.value) * 100;
                                         return (
                                             <div key={sub.name} className="pl-5 relative">
                                                 {/* Connector Line */}
                                                 <div className="absolute left-1.5 top-0 bottom-0 w-px bg-slate-200"></div>
                                                 <div className="absolute left-1.5 top-1/2 w-2 h-px bg-slate-200"></div>

                                                 <div className="flex justify-between items-end text-[10px] mb-0.5">
                                                     <span className="font-medium text-slate-500">{sub.name}</span>
                                                     <span className="font-bold text-slate-600">
                                                         {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(sub.value)}
                                                     </span>
                                                 </div>
                                                 <div className="relative h-1 w-full bg-slate-200/50 rounded-full overflow-hidden">
                                                     <div 
                                                        className="absolute top-0 left-0 h-full rounded-full opacity-50" 
                                                        style={{ width: `${subPercent}%`, backgroundColor: color }}
                                                     />
                                                 </div>
                                             </div>
                                         );
                                     })}
                                 </div>
                             )}
                         </div>
                     );
                 })}
                 {data.length === 0 && <div className="text-center text-slate-400 text-xs mt-10">Nessuna spesa nel periodo.</div>}
             </div>
         )}
      </div>
    </div>
  );
};
