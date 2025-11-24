import React, { useState } from 'react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { Search, Tag, Briefcase, ArrowLeftRight, Trash2, Pencil } from 'lucide-react';
import { getCategoryColor, getCategoryIcon } from './CategoryIcons';

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (id: number) => Promise<void>;
  onEdit: (transaction: Transaction) => void;
  apiKey: string | null;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({ transactions, onDelete, onEdit, apiKey }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  const itemsPerPage = 20;

  const filteredData = transactions.filter(t => 
    t.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subcategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.account.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.flag.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount: number, currency: string) => 
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: currency }).format(amount);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100/50">
        <h3 className="text-lg font-bold text-slate-800">Ultimi Movimenti</h3>
        <div className="relative w-full sm:w-64 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
          <input
            type="text"
            placeholder="Cerca..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-100 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-violet-100 transition-all outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4">Data</th>
              <th className="px-6 py-4">Conto & Note</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4 text-right">CHF</th>
              <th className="px-6 py-4 text-right w-24">Azioni</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50/50">
            {paginatedData.map((t) => (
              <tr key={t.id} className="group hover:bg-white/60 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-base">
                          {format(new Date(t.date), 'dd')}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">
                          {format(new Date(t.date), 'MMM')}
                      </span>
                  </div>
                </td>
                <td className="px-6 py-4 max-w-[200px]">
                   <div className="flex flex-col gap-1">
                       <span className="font-bold text-slate-700 text-xs">{t.account}</span>
                       <div className="flex flex-wrap gap-1">
                           {t.flag && <span className="inline-flex items-center text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100"><Tag className="w-2 h-2 mr-1" />{t.flag}</span>}
                           {t.analytics === 'WORK' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100"><Briefcase className="w-2 h-2 mr-1"/>Work</span>}
                           {t.analytics === 'FALSE' && <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200"><ArrowLeftRight className="w-2 h-2 mr-1"/>Transfer</span>}
                       </div>
                       {t.note && <p className="text-xs text-slate-400 truncate">{t.note}</p>}
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${getCategoryColor(t.category)}`}>
                          {getCategoryIcon(t.category, "w-4 h-4")}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-700">{t.category}</span>
                        <span className="text-[10px] text-slate-400">{t.subcategory}</span>
                      </div>
                  </div>
                </td>
                <td className={`px-6 py-4 text-right whitespace-nowrap`}>
                  <div className={`font-bold text-base ${t.valueChf < 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                    {formatCurrency(t.valueChf, 'CHF')}
                  </div>
                  {t.curr !== 'CHF' && (
                      <div className="text-[10px] text-slate-400 font-medium">
                          {formatCurrency(t.movement, t.curr)}
                      </div>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if(confirm('Eliminare?')) onDelete(t.id); }} disabled={deletingId === t.id} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                      {deletingId === t.id ? <div className="w-4 h-4 border-2 border-rose-600 rounded-full animate-spin"/> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-50 flex justify-center gap-2">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-50 text-slate-500 disabled:opacity-30 hover:bg-slate-100">Prev</button>
            <span className="text-xs font-bold text-slate-400 py-1">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-50 text-slate-500 disabled:opacity-30 hover:bg-slate-100">Next</button>
        </div>
      )}
    </div>
  );
};