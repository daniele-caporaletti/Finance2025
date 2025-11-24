import React, { useMemo, useState } from 'react';
import { Transaction } from '../types';
import { X, ChevronDown, ChevronRight, TrendingUp, TrendingDown, Briefcase, Wallet } from 'lucide-react';
import { getCategoryColor, getCategoryIcon } from './CategoryIcons';

export type DetailType = 'BALANCE' | 'INCOME' | 'EXPENSE' | 'WORK';

interface KPIDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: DetailType | null;
  transactions: Transaction[]; // Should be full year transactions
  year: number;
}

const MONTHS_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

export const KPIDetailModal: React.FC<KPIDetailModalProps> = ({ isOpen, onClose, type, transactions, year }) => {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null); // "MonthIndex-CategoryName"

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val);

  // --- DATA PROCESSING ---
  const data = useMemo(() => {
    if (!type) return null;

    if (type === 'BALANCE') {
      // Structure: Array of 12 months with columns
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        monthIndex: i,
        expenses: 0,
        income: 0,
        workIn: 0,
        workOut: 0,
        net: 0
      }));

      transactions.forEach(t => {
        const month = new Date(t.date).getMonth();
        const val = t.valueChf;

        if (t.analytics === 'FALSE') return; // Skip transfers

        if (t.analytics === 'WORK') {
          if (val >= 0) monthlyData[month].workIn += val;
          else monthlyData[month].workOut += Math.abs(val);
        } else {
          if (val >= 0) monthlyData[month].income += val;
          else monthlyData[month].expenses += Math.abs(val);
        }
      });

      // Calculate Net
      monthlyData.forEach(m => {
        m.net = (m.income + m.workIn) - (m.expenses + m.workOut);
      });

      return { kind: 'TABLE', rows: monthlyData };
    } 
    else {
      // Structure: Hierarchical Tree (Month -> Category -> Subcategory)
      // We use a nested Map for easier aggregation
      const tree = new Map<number, Map<string, Map<string, number>>>();

      transactions.forEach(t => {
        if (t.analytics === 'FALSE') return;

        // Filtering logic based on type
        let isValid = false;
        let amount = 0;

        if (type === 'EXPENSE') {
            // Only Negative, Non-Work
            if (t.analytics !== 'WORK' && t.valueChf < 0) {
                isValid = true;
                amount = Math.abs(t.valueChf);
            }
        } else if (type === 'INCOME') {
            // Only Positive, Non-Work
            if (t.analytics !== 'WORK' && t.valueChf > 0) {
                isValid = true;
                amount = t.valueChf;
            }
        } else if (type === 'WORK') {
            // Only Work (Both signs, but usually we want to see flow)
            // User asked for "Entrate e Uscite divise...". 
            // We'll sum them algebraically or absolute? Usually breakdown implies sums.
            // Let's keep sign significant or separate? 
            // Requirement: "vedere entrate e uscite... con totali".
            // Let's aggregate by value (keep sign) to show net, OR absolute.
            // For breakdown lists, absolute values usually look better, but let's allow negative for expenses.
            if (t.analytics === 'WORK') {
                isValid = true;
                amount = t.valueChf; // Keep sign for Work to distinguish In/Out in list
            }
        }

        if (isValid) {
            const month = new Date(t.date).getMonth();
            const cat = t.category;
            const sub = t.subcategory || 'Altro';

            if (!tree.has(month)) tree.set(month, new Map());
            const monthMap = tree.get(month)!;

            if (!monthMap.has(cat)) monthMap.set(cat, new Map());
            const catMap = monthMap.get(cat)!;

            catMap.set(sub, (catMap.get(sub) || 0) + amount);
        }
      });

      // Convert Map to Sorted Array
      const hierarchy = Array.from(tree.entries())
        .map(([monthIndex, catMap]) => {
            const categories = Array.from(catMap.entries()).map(([catName, subMap]) => {
                const subcategories = Array.from(subMap.entries()).map(([subName, val]) => ({
                    name: subName,
                    value: val
                })).sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
                
                return {
                    name: catName,
                    total: subcategories.reduce((acc, curr) => acc + curr.value, 0),
                    subcategories
                };
            }).sort((a, b) => Math.abs(b.total) - Math.abs(a.total));

            return {
                monthIndex,
                monthName: MONTHS_IT[monthIndex],
                total: categories.reduce((acc, curr) => acc + curr.total, 0),
                categories
            };
        })
        .sort((a, b) => a.monthIndex - b.monthIndex);

      return { kind: 'TREE', nodes: hierarchy };
    }
  }, [type, transactions]);

  // --- RENDER HELPERS ---
  const getHeaderInfo = () => {
    switch(type) {
        case 'BALANCE': return { title: 'Riepilogo Annuale', color: 'bg-violet-100 text-violet-800', icon: <Wallet className="w-6 h-6"/> };
        case 'EXPENSE': return { title: 'Dettaglio Uscite', color: 'bg-rose-100 text-rose-800', icon: <TrendingDown className="w-6 h-6"/> };
        case 'INCOME': return { title: 'Dettaglio Entrate', color: 'bg-emerald-100 text-emerald-800', icon: <TrendingUp className="w-6 h-6"/> };
        case 'WORK': return { title: 'Dettaglio Lavoro', color: 'bg-indigo-100 text-indigo-800', icon: <Briefcase className="w-6 h-6"/> };
        default: return { title: 'Dettaglio', color: 'bg-slate-100', icon: null };
    }
  };

  const header = getHeaderInfo();

  if (!isOpen || !type || !data) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className={`px-6 py-5 border-b border-slate-50 flex items-center justify-between ${header.color.split(' ')[0]}`}>
           <div className="flex items-center gap-3">
              <div className={`p-2 bg-white/60 rounded-xl ${header.color.split(' ')[1]}`}>
                  {header.icon}
              </div>
              <div>
                  <h2 className={`text-xl font-bold ${header.color.split(' ')[1]}`}>{header.title}</h2>
                  <p className={`text-xs font-medium opacity-70 uppercase tracking-wide ${header.color.split(' ')[1]}`}>Anno {year}</p>
              </div>
           </div>
           <button onClick={onClose} className="bg-white/50 hover:bg-white p-2 rounded-full transition-colors">
             <X className="w-5 h-5 opacity-70" />
           </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto custom-scrollbar p-6 bg-slate-50/50">
            
            {/* --- VIEW: BALANCE TABLE --- */}
            {data.kind === 'TABLE' && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Mese</th>
                                    <th className="px-4 py-3 text-right text-rose-600">Spese</th>
                                    <th className="px-4 py-3 text-right text-emerald-600">Entrate</th>
                                    <th className="px-4 py-3 text-right text-indigo-600">Lavoro (In)</th>
                                    <th className="px-4 py-3 text-right text-indigo-400">Lavoro (Out)</th>
                                    <th className="px-4 py-3 text-right text-slate-700 bg-slate-100/50">Cash Flow</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.rows.map(row => (
                                    <tr key={row.monthIndex} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="px-4 py-3 font-bold text-slate-700">{MONTHS_IT[row.monthIndex]}</td>
                                        <td className="px-4 py-3 text-right text-rose-600 font-medium">{formatMoney(row.expenses)}</td>
                                        <td className="px-4 py-3 text-right text-emerald-600 font-medium">{formatMoney(row.income)}</td>
                                        <td className="px-4 py-3 text-right text-indigo-600 font-medium">{formatMoney(row.workIn)}</td>
                                        <td className="px-4 py-3 text-right text-indigo-400 font-medium">{formatMoney(row.workOut)}</td>
                                        <td className={`px-4 py-3 text-right font-bold bg-slate-50/30 ${row.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {formatMoney(row.net)}
                                        </td>
                                    </tr>
                                ))}
                                {/* Total Row */}
                                <tr className="bg-violet-50 font-bold border-t-2 border-violet-100">
                                    <td className="px-4 py-3 text-violet-900">TOTALE</td>
                                    <td className="px-4 py-3 text-right text-rose-700">{formatMoney(data.rows.reduce((a,b) => a + b.expenses, 0))}</td>
                                    <td className="px-4 py-3 text-right text-emerald-700">{formatMoney(data.rows.reduce((a,b) => a + b.income, 0))}</td>
                                    <td className="px-4 py-3 text-right text-indigo-700">{formatMoney(data.rows.reduce((a,b) => a + b.workIn, 0))}</td>
                                    <td className="px-4 py-3 text-right text-indigo-500">{formatMoney(data.rows.reduce((a,b) => a + b.workOut, 0))}</td>
                                    <td className="px-4 py-3 text-right text-violet-900">{formatMoney(data.rows.reduce((a,b) => a + b.net, 0))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- VIEW: HIERARCHICAL TREE --- */}
            {data.kind === 'TREE' && (
                <div className="space-y-4">
                    {data.nodes.length === 0 && (
                        <div className="text-center p-10 text-slate-400 italic">Nessun dato trovato per questa tipologia.</div>
                    )}
                    {data.nodes.map(monthNode => (
                        <div key={monthNode.monthIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            {/* Level 1: Month */}
                            <button 
                                onClick={() => setExpandedMonth(expandedMonth === monthNode.monthIndex ? null : monthNode.monthIndex)}
                                className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-slate-50 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-1.5 rounded-lg ${expandedMonth === monthNode.monthIndex ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {expandedMonth === monthNode.monthIndex ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                                    </div>
                                    <span className="text-lg font-bold text-slate-700">{monthNode.monthName}</span>
                                </div>
                                <span className={`text-base font-bold ${type === 'EXPENSE' || (type === 'WORK' && monthNode.total < 0) ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {formatMoney(monthNode.total)}
                                </span>
                            </button>

                            {/* Level 2: Categories */}
                            {expandedMonth === monthNode.monthIndex && (
                                <div className="border-t border-slate-100 bg-slate-50/30">
                                    {monthNode.categories.map(cat => {
                                        const uniqueId = `${monthNode.monthIndex}-${cat.name}`;
                                        const isCatExpanded = expandedCategory === uniqueId;
                                        return (
                                            <div key={cat.name} className="border-b border-slate-50 last:border-0">
                                                <button 
                                                    onClick={() => setExpandedCategory(isCatExpanded ? null : uniqueId)}
                                                    className="w-full flex items-center justify-between px-6 py-3 pl-14 hover:bg-slate-100/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(cat.name)}`}>
                                                            {getCategoryIcon(cat.name, "w-4 h-4")}
                                                        </div>
                                                        <span className="text-sm font-bold text-slate-700">{cat.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-sm font-bold text-slate-600">{formatMoney(cat.total)}</span>
                                                        {isCatExpanded ? <ChevronDown className="w-4 h-4 text-slate-300"/> : <ChevronRight className="w-4 h-4 text-slate-300"/>}
                                                    </div>
                                                </button>

                                                {/* Level 3: Subcategories */}
                                                {isCatExpanded && (
                                                    <div className="bg-slate-50 pl-24 pr-6 py-2 space-y-1 shadow-inner">
                                                        {cat.subcategories.map(sub => (
                                                            <div key={sub.name} className="flex justify-between items-center py-1.5 text-xs">
                                                                <span className="font-medium text-slate-500">{sub.name}</span>
                                                                <span className="font-mono text-slate-600">{formatMoney(sub.value)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};