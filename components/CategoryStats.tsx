
import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieChartIcon, List as ListIcon } from 'lucide-react';
import { getCategoryColor } from './CategoryIcons';

interface CategoryStatsProps { transactions: Transaction[]; }
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const CategoryStats: React.FC<CategoryStatsProps> = ({ transactions }) => {
  const [viewMode, setViewMode] = useState<'CHART' | 'LIST'>('CHART');

  const { data, totalExpenses } = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;
    transactions.forEach(t => {
      if (t.analytics !== 'FALSE' && t.analytics !== 'WORK' && t.valueChf < 0) {
        const val = Math.abs(t.valueChf);
        map.set(t.category, (map.get(t.category) || 0) + val);
        total += val;
      }
    });
    const entries = Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return { data: entries, totalExpenses: total };
  }, [transactions]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 flex flex-col h-[420px] overflow-hidden">
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
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="45%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />)}
                            </Pie>
                            <Tooltip formatter={(val: number) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val)}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="absolute bottom-4 left-0 w-full flex justify-center gap-2 flex-wrap px-4 max-h-[80px] overflow-y-auto custom-scrollbar">
                    {data.slice(0, 6).map((d, i) => (
                        <div key={d.name} className="flex items-center gap-1.5 text-[10px] font-medium text-slate-600 bg-white/60 px-2.5 py-1 rounded-full border border-slate-100">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}/> 
                            {d.name}
                        </div>
                    ))}
                </div>
             </>
         )}

         {/* LIST VIEW */}
         {viewMode === 'LIST' && (
             <div className="h-full overflow-y-auto custom-scrollbar pr-2 space-y-3">
                 {data.map((d, i) => {
                     const percentage = totalExpenses > 0 ? (d.value / totalExpenses) * 100 : 0;
                     return (
                         <div key={d.name} className="space-y-1">
                             <div className="flex justify-between items-end text-xs">
                                 <span className="font-bold text-slate-700">{d.name}</span>
                                 <div className="text-right">
                                     <span className="font-mono font-bold text-slate-800 block">
                                         {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(d.value)}
                                     </span>
                                 </div>
                             </div>
                             <div className="relative h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                 <div 
                                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${percentage}%`, backgroundColor: COLORS[i % COLORS.length] }}
                                 />
                             </div>
                             <div className="text-right text-[9px] font-bold text-slate-400">{percentage.toFixed(1)}%</div>
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
