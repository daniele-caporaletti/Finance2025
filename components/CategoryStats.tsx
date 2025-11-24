import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChevronDown, ChevronRight, PieChart as PieChartIcon } from 'lucide-react';
import { getCategoryColor, getCategoryIcon } from './CategoryIcons';

interface CategoryStatsProps {
  transactions: Transaction[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#a855f7', '#3b82f6'];

export const CategoryStats: React.FC<CategoryStatsProps> = ({ transactions }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const data = useMemo(() => {
    const categories: Record<string, { total: number; subs: Record<string, number> }> = {};

    transactions.forEach(t => {
      if (t.analytics !== 'FALSE' && t.analytics !== 'WORK' && t.valueChf < 0) {
        const cat = t.category;
        const sub = t.subcategory || 'Altro';
        const amount = Math.abs(t.valueChf);

        if (!categories[cat]) {
          categories[cat] = { total: 0, subs: {} };
        }
        categories[cat].total += amount;
        categories[cat].subs[sub] = (categories[cat].subs[sub] || 0) + amount;
      }
    });

    return Object.entries(categories)
      .map(([name, { total, subs }]) => ({
        name,
        value: total,
        subs: Object.entries(subs)
          .map(([subName, subValue]) => ({ name: subName, value: subValue }))
          .sort((a, b) => b.value - a.value)
      }))
      .sort((a, b) => b.value - a.value);

  }, [transactions]);

  const toggleExpand = (name: string) => {
    setExpandedCategory(expandedCategory === name ? null : name);
  };

  const formatCHF = (val: number) => 
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-[500px] overflow-hidden">
      {/* Widget Header */}
      <div className="px-6 py-4 bg-sky-50 border-b border-sky-100 flex items-center gap-3">
          <div className="p-2 bg-white rounded-xl text-sky-600 shadow-sm">
             <PieChartIcon className="w-5 h-5" />
          </div>
          <div>
              <h3 className="font-bold text-sky-900">Analisi Spese</h3>
              <p className="text-xs font-medium text-sky-700/70 uppercase tracking-wide">Breakdown Categorie</p>
          </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-white flex flex-col">
          
        {data.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                <PieChartIcon className="w-10 h-10 opacity-20"/>
                <p className="text-sm font-medium">Nessuna spesa nel periodo.</p>
            </div>
        ) : (
            <>
                {/* Chart Section */}
                <div className="h-48 min-h-[190px] relative mb-4 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={data}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        >
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => formatCHF(value)} />
                    </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="text-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Totale</span>
                            <div className="text-base font-bold text-slate-700">
                                {formatCHF(data.reduce((acc, curr) => acc + curr.value, 0))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* List Section */}
                <div className="space-y-2 pr-1 pb-2">
                    {data.map((cat, index) => (
                    <div key={cat.name} className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                        <button
                        onClick={() => toggleExpand(cat.name)}
                        className="w-full flex items-center justify-between p-3 bg-white hover:bg-slate-50 transition-colors text-left group"
                        >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(cat.name)}`}>
                                {getCategoryIcon(cat.name, "w-4 h-4")}
                            </div>
                            <span className="font-bold text-slate-700 text-sm">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-slate-700">{formatCHF(cat.value)}</span>
                            {expandedCategory === cat.name ? (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                        </div>
                        </button>
                        
                        {expandedCategory === cat.name && (
                        <div className="bg-slate-50 p-2 space-y-1 border-t border-slate-100">
                            {cat.subs.map((sub) => (
                            <div key={sub.name} className="flex justify-between items-center px-4 py-2 text-xs text-slate-600 bg-white/50 rounded-lg">
                                <span className="font-medium">{sub.name}</span>
                                <span className="font-mono">{formatCHF(sub.value)}</span>
                            </div>
                            ))}
                        </div>
                        )}
                    </div>
                    ))}
                </div>
            </>
        )}
      </div>
    </div>
  );
};