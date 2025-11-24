
import React, { useMemo, useState } from 'react';
import { Transaction, PeriodType } from '../types';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Briefcase, Wallet, ArrowLeft, Tag } from 'lucide-react';
import { getCategoryColor, getCategoryIcon } from './CategoryIcons';
import { 
  ResponsiveContainer, 
  ComposedChart, 
  Line, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  BarChart
} from 'recharts';

export type DetailType = 'BALANCE' | 'INCOME' | 'EXPENSE' | 'WORK' | 'TAG' | 'TAGS_SUMMARY';

interface KPIDetailViewProps {
  type: DetailType;
  transactions: Transaction[]; 
  year: number;
  tagName?: string | null; 
  onClose: () => void;
  onTagSelect?: (tagName: string) => void;
  periodType: PeriodType;
  selectedMonth: number;
}

const MONTHS_IT = [
  "Gen", "Feb", "Mar", "Apr", "Mag", "Giu",
  "Lug", "Ago", "Set", "Ott", "Nov", "Dic"
];

const FULL_MONTHS_IT = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"
];

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#a855f7', '#3b82f6'];

// --- CUSTOM TOOLTIP COMPONENT ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur p-4 rounded-2xl shadow-xl border border-slate-100 text-xs">
        <p className="font-bold text-slate-700 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
            <span className="text-slate-500 capitalize">{entry.name}:</span>
            <span className="font-mono font-bold ml-auto">
              {new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const KPIDetailView: React.FC<KPIDetailViewProps> = ({ type, transactions, year, tagName, onClose, onTagSelect, periodType, selectedMonth }) => {
  const [expandedMonth, setExpandedMonth] = useState<number | null>(
    periodType === 'MONTH' ? selectedMonth : null
  );
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null); // "UniqueId"

  const formatMoney = (val: number) => 
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: 'CHF' }).format(val);

  // --- DATA PROCESSING ---
  const data = useMemo(() => {
    if (!type) return null;

    // --- CASE 1: BALANCE TABLE ---
    if (type === 'BALANCE') {
      const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        monthIndex: i,
        name: MONTHS_IT[i],
        expenses: 0,
        income: 0,
        workIn: 0,
        workOut: 0,
        net: 0
      }));

      transactions.forEach(t => {
        const month = new Date(t.date).getMonth();
        const val = t.valueChf;
        if (t.analytics === 'FALSE') return;
        if (t.analytics === 'WORK') {
          if (val >= 0) monthlyData[month].workIn += val;
          else monthlyData[month].workOut += Math.abs(val);
        } else {
          if (val >= 0) monthlyData[month].income += val;
          else monthlyData[month].expenses += Math.abs(val);
        }
      });

      monthlyData.forEach(m => {
        m.net = (m.income + m.workIn) - (m.expenses + m.workOut);
      });

      return { kind: 'TABLE', rows: monthlyData };
    } 
    
    // --- CASE 2: TAGS SUMMARY (List of all tags) ---
    else if (type === 'TAGS_SUMMARY') {
        const tags: Record<string, number> = {};
        transactions.forEach(t => {
            if (t.flag && t.flag.trim() !== '' && t.analytics !== 'FALSE') {
                const tag = t.flag.trim();
                tags[tag] = (tags[tag] || 0) + t.valueChf;
            }
        });

        const sortedTags = Object.entries(tags)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

        return { kind: 'TAG_LIST', tags: sortedTags };
    }

    // --- CASE 3: TAG DETAILS (Category -> Subcategory) ---
    else if (type === 'TAG') {
        const catMap = new Map<string, Map<string, number>>();

        transactions.forEach(t => {
            // Filter by Tag
            if (t.flag !== tagName) return;
            if (t.analytics === 'FALSE') return; // Exclude transfers inside events usually

            const cat = t.category;
            const sub = t.subcategory || 'Altro';
            const amount = t.valueChf; // Keep sign

            if (!catMap.has(cat)) catMap.set(cat, new Map());
            const subMap = catMap.get(cat)!;
            subMap.set(sub, (subMap.get(sub) || 0) + amount);
        });

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

        const totalEvent = categories.reduce((acc, c) => acc + c.total, 0);

        // Chart Data for Tags
        const chartData = categories.map(c => ({
            name: c.name,
            value: Math.abs(c.total)
        })).sort((a, b) => b.value - a.value);

        return { kind: 'TAG_TREE', total: totalEvent, categories, chartData };
    }

    // --- CASE 4: MONTHLY HIERARCHY (Month -> Category -> Subcategory) ---
    else {
      const tree = new Map<number, Map<string, Map<string, number>>>();
      const categoryTotals = new Map<string, number>(); // For Pie Chart
      const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
          monthIndex: i,
          name: MONTHS_IT[i],
          value: 0
      }));

      transactions.forEach(t => {
        if (t.analytics === 'FALSE') return;

        let isValid = false;
        let amount = 0;

        if (type === 'EXPENSE') {
            if (t.analytics !== 'WORK' && t.valueChf < 0) {
                isValid = true;
                amount = Math.abs(t.valueChf);
            }
        } else if (type === 'INCOME') {
            if (t.analytics !== 'WORK' && t.valueChf > 0) {
                isValid = true;
                amount = t.valueChf;
            }
        } else if (type === 'WORK') {
            if (t.analytics === 'WORK') {
                isValid = true;
                amount = t.valueChf; 
            }
        }

        if (isValid) {
            const month = new Date(t.date).getMonth();
            const cat = t.category;
            const sub = t.subcategory || 'Altro';

            // Tree Data
            if (!tree.has(month)) tree.set(month, new Map());
            const monthMap = tree.get(month)!;
            if (!monthMap.has(cat)) monthMap.set(cat, new Map());
            const catMap = monthMap.get(cat)!;
            catMap.set(sub, (catMap.get(sub) || 0) + amount);

            // Chart Data Aggregation
            categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + Math.abs(amount));
            monthlyTotals[month].value += amount; // Keep sign for monthly trend? usually absolute for visual magnitude in charts
        }
      });

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
                monthName: FULL_MONTHS_IT[monthIndex],
                total: categories.reduce((acc, curr) => acc + curr.total, 0),
                categories
            };
        })
        .sort((a, b) => a.monthIndex - b.monthIndex);

      // Pie Chart Data
      const pieData = Array.from(categoryTotals.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Top 6 categories

      // Trend Data (Fix monthly totals sign for chart if needed)
      const trendData = monthlyTotals.map(m => ({ 
          ...m, 
          value: type === 'EXPENSE' ? Math.abs(m.value) : m.value 
      }));

      return { kind: 'MONTH_TREE', nodes: hierarchy, pieData, trendData };
    }
  }, [type, transactions, tagName]);

  // --- RENDER HELPERS ---
  const getHeaderInfo = () => {
    const periodText = periodType === 'MONTH' 
        ? `${FULL_MONTHS_IT[selectedMonth]} ${year}`
        : `Anno ${year}`;

    switch(type) {
        case 'BALANCE': return { title: 'Riepilogo Saldi', subtitle: periodText, color: 'bg-violet-100 text-violet-800', icon: <Wallet className="w-6 h-6"/> };
        case 'EXPENSE': return { title: 'Dettaglio Uscite', subtitle: periodText, color: 'bg-rose-100 text-rose-800', icon: <TrendingDown className="w-6 h-6"/> };
        case 'INCOME': return { title: 'Dettaglio Entrate', subtitle: periodText, color: 'bg-emerald-100 text-emerald-800', icon: <TrendingUp className="w-6 h-6"/> };
        case 'WORK': return { title: 'Dettaglio Lavoro', subtitle: periodText, color: 'bg-indigo-100 text-indigo-800', icon: <Briefcase className="w-6 h-6"/> };
        case 'TAGS_SUMMARY': return { title: 'Tutti gli Eventi', subtitle: periodText, color: 'bg-orange-100 text-orange-800', icon: <Tag className="w-6 h-6"/> };
        case 'TAG': return { title: `Evento: ${tagName}`, subtitle: `Analisi Evento - ${periodText}`, color: 'bg-orange-100 text-orange-800', icon: <Tag className="w-6 h-6"/> };
        default: return { title: 'Dettaglio', subtitle: periodText, color: 'bg-slate-100', icon: null };
    }
  };

  const header = getHeaderInfo();

  if (!data) return null;

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-4">
            <button 
                onClick={onClose}
                className="flex items-center gap-2 px-4 py-2 bg-white/70 backdrop-blur text-slate-600 hover:text-slate-900 rounded-full font-bold shadow-sm hover:shadow transition-all"
            >
                <ArrowLeft className="w-4 h-4"/>
                Torna alla Dashboard
            </button>
            {type === 'TAG' && (
                <button
                    onClick={() => onTagSelect && onTagSelect('')} // Reset to list
                    className="flex items-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 hover:bg-orange-100 rounded-full font-bold transition-all text-xs uppercase"
                >
                    Tutti gli Eventi
                </button>
            )}
        </div>

        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 overflow-hidden flex flex-col min-h-[500px]">
            {/* Header */}
            <div className={`px-8 py-6 border-b border-slate-50/50 flex items-center justify-between ${header.color.split(' ')[0]}`}>
                <div className="flex items-center gap-4">
                    <div className={`p-3 bg-white/60 rounded-2xl shadow-sm ${header.color.split(' ')[1]}`}>
                        {header.icon}
                    </div>
                    <div>
                        <h2 className={`text-2xl font-bold ${header.color.split(' ')[1]}`}>{header.title}</h2>
                        <p className={`text-sm font-medium opacity-70 uppercase tracking-wide ${header.color.split(' ')[1]}`}>
                           {header.subtitle}
                        </p>
                    </div>
                </div>
                {/* Event Total Display */}
                {data.kind === 'TAG_TREE' && (
                    <div className="text-right">
                         <span className="text-sm font-bold opacity-60 uppercase block text-orange-900">Saldo Evento</span>
                         <span className={`text-3xl font-bold ${data.total >= 0 ? 'text-emerald-700' : 'text-slate-800'}`}>
                             {formatMoney(data.total)}
                         </span>
                    </div>
                )}
            </div>

            {/* --- CHARTS SECTION --- */}
            <div className="p-8 pb-0">
              {data.kind === 'TABLE' && (
                <div className="h-64 w-full bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
                   <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={data.rows}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}}/>
                          <YAxis hide/>
                          <Tooltip content={<CustomTooltip />} />
                          <Legend iconType="circle"/>
                          <Bar dataKey="income" name="Entrate" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} stackId="a"/>
                          <Bar dataKey="expenses" name="Uscite" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={12} stackId="a"/>
                          <Line type="monotone" dataKey="net" name="Cash Flow" stroke="#8b5cf6" strokeWidth={3} dot={{r: 4, fill: '#8b5cf6'}} />
                      </ComposedChart>
                   </ResponsiveContainer>
                </div>
              )}

              {data.kind === 'MONTH_TREE' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Trend Area Chart */}
                    <div className="lg:col-span-2 h-64 bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-4 ml-2">Trend Mensile</h4>
                        <ResponsiveContainer width="100%" height="85%">
                            <AreaChart data={data.trendData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor={type === 'EXPENSE' ? '#f43f5e' : '#10b981'} stopOpacity={0.2}/>
                                        <stop offset="95%" stopColor={type === 'EXPENSE' ? '#f43f5e' : '#10b981'} stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}}/>
                                <YAxis hide/>
                                <Tooltip content={<CustomTooltip />} />
                                <Area 
                                  type="monotone" 
                                  dataKey="value" 
                                  name="Totale"
                                  stroke={type === 'EXPENSE' ? '#f43f5e' : '#10b981'} 
                                  fillOpacity={1} 
                                  fill="url(#colorVal)" 
                                  strokeWidth={3}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* Pie Chart Composition */}
                    <div className="h-64 bg-slate-50/50 rounded-3xl p-4 border border-slate-100 flex flex-col items-center justify-center relative">
                        <h4 className="absolute top-4 left-6 text-xs font-bold text-slate-400 uppercase">Top Categorie</h4>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data.pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {data.pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
              )}

              {data.kind === 'TAG_TREE' && (
                  <div className="h-64 w-full bg-slate-50/50 rounded-3xl p-4 border border-slate-100">
                       <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 ml-2">Breakdown Categorie</h4>
                       <ResponsiveContainer width="100%" height="90%">
                          <BarChart layout="vertical" data={data.chartData.slice(0, 5)}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                              <XAxis type="number" hide/>
                              <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 11, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                              <Tooltip content={<CustomTooltip />} />
                              <Bar dataKey="value" name="Importo" fill="#f97316" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                       </ResponsiveContainer>
                  </div>
              )}
            </div>

            {/* Content */}
            <div className="p-6">
                
                {/* --- VIEW: BALANCE TABLE --- */}
                {data.kind === 'TABLE' && (
                    <div className="overflow-hidden rounded-2xl border border-slate-100">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-4">Mese</th>
                                    <th className="px-6 py-4 text-right text-rose-600">Spese</th>
                                    <th className="px-6 py-4 text-right text-emerald-600">Entrate</th>
                                    <th className="px-6 py-4 text-right text-indigo-600">Lavoro (In)</th>
                                    <th className="px-6 py-4 text-right text-indigo-400">Lavoro (Out)</th>
                                    <th className="px-6 py-4 text-right text-slate-700 bg-slate-100/50">Cash Flow</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {data.rows.map(row => (
                                    <tr key={row.monthIndex} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-700">{FULL_MONTHS_IT[row.monthIndex]}</td>
                                        <td className="px-6 py-4 text-right text-rose-600 font-medium">{formatMoney(row.expenses)}</td>
                                        <td className="px-6 py-4 text-right text-emerald-600 font-medium">{formatMoney(row.income)}</td>
                                        <td className="px-6 py-4 text-right text-indigo-600 font-medium">{formatMoney(row.workIn)}</td>
                                        <td className="px-6 py-4 text-right text-indigo-400 font-medium">{formatMoney(row.workOut)}</td>
                                        <td className={`px-6 py-4 text-right font-bold text-base ${row.net >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                            {formatMoney(row.net)}
                                        </td>
                                    </tr>
                                ))}
                                <tr className="bg-violet-50 font-bold border-t-2 border-violet-100">
                                    <td className="px-6 py-5 text-violet-900 text-base">TOTALE</td>
                                    <td className="px-6 py-5 text-right text-rose-700">{formatMoney(data.rows.reduce((a,b) => a + b.expenses, 0))}</td>
                                    <td className="px-6 py-5 text-right text-emerald-700">{formatMoney(data.rows.reduce((a,b) => a + b.income, 0))}</td>
                                    <td className="px-6 py-5 text-right text-indigo-700">{formatMoney(data.rows.reduce((a,b) => a + b.workIn, 0))}</td>
                                    <td className="px-6 py-5 text-right text-indigo-500">{formatMoney(data.rows.reduce((a,b) => a + b.workOut, 0))}</td>
                                    <td className="px-6 py-5 text-right text-violet-900 text-lg">{formatMoney(data.rows.reduce((a,b) => a + b.net, 0))}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- VIEW: TAG LIST (SUMMARY) --- */}
                {data.kind === 'TAG_LIST' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {data.tags.length === 0 && (
                            <div className="col-span-full text-center p-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">Nessun evento trovato nel periodo selezionato.</p>
                            </div>
                        )}
                        {data.tags.map(tag => (
                            <button
                                key={tag.name}
                                onClick={() => onTagSelect && onTagSelect(tag.name)}
                                className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl hover:border-orange-200 hover:bg-orange-50 hover:shadow-md transition-all group"
                            >
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-white group-hover:shadow-sm transition-all border border-orange-100">
                                        {tag.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-slate-700 text-base truncate">{tag.name}</span>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`font-bold ${tag.value < 0 ? 'text-slate-600' : 'text-emerald-600'}`}>
                                        {formatMoney(tag.value)}
                                    </span>
                                    <div className="bg-slate-50 p-1.5 rounded-lg group-hover:bg-white transition-colors">
                                         <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-orange-400" />
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* --- VIEW: TAG TREE (Categories -> Subcategories) --- */}
                {data.kind === 'TAG_TREE' && (
                    <div className="space-y-3 max-w-4xl mx-auto mt-6">
                         {data.categories.length === 0 && (
                            <div className="text-center p-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">Nessuna transazione associata a questo evento.</p>
                            </div>
                         )}
                         {data.categories.map(cat => {
                             const isExpanded = expandedCategory === cat.name;
                             return (
                                 <div key={cat.name} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
                                     <button 
                                         onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                                         className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                                     >
                                         <div className="flex items-center gap-4">
                                             <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getCategoryColor(cat.name)}`}>
                                                 {getCategoryIcon(cat.name, "w-5 h-5")}
                                             </div>
                                             <span className="text-lg font-bold text-slate-700">{cat.name}</span>
                                         </div>
                                         <div className="flex items-center gap-4">
                                             <span className={`text-lg font-bold ${cat.total < 0 ? 'text-slate-700' : 'text-emerald-600'}`}>
                                                 {formatMoney(cat.total)}
                                             </span>
                                             {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-300"/> : <ChevronRight className="w-5 h-5 text-slate-300"/>}
                                         </div>
                                     </button>

                                     {isExpanded && (
                                         <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 space-y-2">
                                             {cat.subcategories.map(sub => (
                                                 <div key={sub.name} className="flex justify-between items-center bg-white px-4 py-3 rounded-xl shadow-sm">
                                                     <span className="font-bold text-slate-600">{sub.name}</span>
                                                     <span className={`font-mono font-bold ${sub.value < 0 ? 'text-slate-500' : 'text-emerald-600'}`}>
                                                         {formatMoney(sub.value)}
                                                     </span>
                                                 </div>
                                             ))}
                                         </div>
                                     )}
                                 </div>
                             );
                         })}
                    </div>
                )}

                {/* --- VIEW: MONTHLY HIERARCHY --- */}
                {data.kind === 'MONTH_TREE' && (
                    <div className="space-y-4 max-w-5xl mx-auto mt-6">
                        {data.nodes.length === 0 && (
                            <div className="text-center p-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                                <p className="text-slate-400 font-medium">Nessun dato trovato per questa tipologia.</p>
                            </div>
                        )}
                        {data.nodes.map(monthNode => (
                            <div key={monthNode.monthIndex} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:shadow-md">
                                {/* Level 1: Month */}
                                <button 
                                    onClick={() => setExpandedMonth(expandedMonth === monthNode.monthIndex ? null : monthNode.monthIndex)}
                                    className="w-full flex items-center justify-between px-6 py-4 bg-white hover:bg-slate-50 transition-colors group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-xl transition-colors ${expandedMonth === monthNode.monthIndex ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400 group-hover:text-slate-600'}`}>
                                            {expandedMonth === monthNode.monthIndex ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}
                                        </div>
                                        <span className="text-lg font-bold text-slate-700">{monthNode.monthName}</span>
                                    </div>
                                    <span className={`text-lg font-bold ${type === 'EXPENSE' || (type === 'WORK' && monthNode.total < 0) ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {formatMoney(monthNode.total)}
                                    </span>
                                </button>

                                {/* Level 2: Categories */}
                                {expandedMonth === monthNode.monthIndex && (
                                    <div className="border-t border-slate-100 bg-slate-50/30 pb-2">
                                        {monthNode.categories.map(cat => {
                                            const uniqueId = `${monthNode.monthIndex}-${cat.name}`;
                                            const isCatExpanded = expandedCategory === uniqueId;
                                            return (
                                                <div key={cat.name} className="border-b border-slate-100 last:border-0">
                                                    <button 
                                                        onClick={() => setExpandedCategory(isCatExpanded ? null : uniqueId)}
                                                        className="w-full flex items-center justify-between px-6 py-3 pl-20 hover:bg-slate-100/80 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm ${getCategoryColor(cat.name)}`}>
                                                                {getCategoryIcon(cat.name, "w-5 h-5")}
                                                            </div>
                                                            <span className="text-base font-bold text-slate-700">{cat.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <span className="text-sm font-bold text-slate-600">{formatMoney(cat.total)}</span>
                                                            {isCatExpanded ? <ChevronDown className="w-4 h-4 text-slate-300"/> : <ChevronRight className="w-4 h-4 text-slate-300"/>}
                                                        </div>
                                                    </button>

                                                    {/* Level 3: Subcategories */}
                                                    {isCatExpanded && (
                                                        <div className="bg-slate-100/50 pl-32 pr-6 py-3 space-y-2 shadow-inner border-y border-slate-100">
                                                            {cat.subcategories.map(sub => (
                                                                <div key={sub.name} className="flex justify-between items-center py-1">
                                                                    <span className="font-medium text-slate-500 text-sm">{sub.name}</span>
                                                                    <span className="font-mono font-medium text-slate-600 text-sm">{formatMoney(sub.value)}</span>
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
