
import React, { useState } from 'react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { Search, Tag, Briefcase, ArrowLeftRight, Trash2, Pencil, TriangleAlert } from 'lucide-react';
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
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null); 
  
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

  const confirmDelete = async () => {
    if (confirmDeleteId !== null) {
        setDeletingId(confirmDeleteId);
        setConfirmDeleteId(null); 
        await onDelete(confirmDeleteId);
        setDeletingId(null);
    }
  };

  return (
    <>
    <div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-white/20 overflow-hidden flex flex-col h-full relative z-0">
      
      {/* Clean Header */}
      <div className="pt-8 px-8 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Movimenti</h3>
        <div className="relative w-full sm:w-72 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-violet-500 transition-colors" />
          <input
            type="text"
            placeholder="Cerca movimento..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-transparent hover:border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-violet-100 focus:border-violet-200 transition-all outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Airy Table */}
      <div className="overflow-x-auto flex-1 px-3 pb-4">
        <table className="w-full text-left text-sm text-slate-600 border-separate border-spacing-y-2">
          <thead className="bg-slate-50/80 backdrop-blur-sm rounded-2xl">
            <tr className="text-slate-400 uppercase text-[10px] font-bold tracking-widest">
              <th className="px-6 py-4 rounded-l-2xl">Data</th>
              <th className="px-6 py-4">Conto</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4 text-right">Importo</th>
              <th className="px-6 py-4 text-right rounded-r-2xl">Azioni</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {paginatedData.map((t) => (
              <tr key={t.id} className="group hover:bg-white/90 transition-all duration-200 hover:shadow-sm hover:scale-[1.005]">
                {/* Data */}
                <td className="px-6 py-4 whitespace-nowrap rounded-l-2xl border-y border-l border-transparent group-hover:border-white/20">
                  <span className="font-bold text-slate-800 tabular-nums text-sm block">
                      {format(new Date(t.date), 'dd/MM')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {format(new Date(t.date), 'yyyy')}
                  </span>
                </td>

                {/* Conto */}
                <td className="px-6 py-4 border-y border-transparent group-hover:border-white/20">
                   <div className="flex flex-col">
                       <span className="font-bold text-slate-700 text-xs mb-1">{t.account}</span>
                       {t.note && <p className="text-[11px] text-slate-400 italic truncate max-w-[150px]">{t.note}</p>}
                       
                       {/* Badges Row */}
                       <div className="flex flex-wrap gap-1 mt-1">
                           {t.flag && <span className="inline-flex items-center text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded-md border border-orange-100/50"><Tag className="w-2 h-2 mr-1" />{t.flag}</span>}
                           {t.analytics === 'WORK' && <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100/50"><Briefcase className="w-2 h-2 mr-1"/>Work</span>}
                           {t.analytics === 'FALSE' && <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-100 text-slate-500 border border-slate-200/50"><ArrowLeftRight className="w-2 h-2 mr-1"/>Transfer</span>}
                       </div>
                   </div>
                </td>

                {/* Categoria */}
                <td className="px-6 py-4 border-y border-transparent group-hover:border-white/20">
                  <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl bg-slate-50/80 border border-slate-100 group-hover:bg-white group-hover:shadow-sm transition-all">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(t.category)}`}>
                          {getCategoryIcon(t.category, "w-3 h-3")}
                      </div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">{t.category}</span>
                  </div>
                </td>

                {/* Importo */}
                <td className="px-6 py-4 text-right whitespace-nowrap border-y border-transparent group-hover:border-white/20">
                  <div className={`font-bold text-lg tabular-nums tracking-tight ${t.valueChf < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {formatCurrency(t.valueChf, 'CHF')}
                  </div>
                  {t.curr !== 'CHF' && (
                      <div className="text-[10px] text-slate-400 font-medium mt-0.5 bg-slate-50 inline-block px-1.5 rounded">
                          {formatCurrency(t.movement, t.curr)}
                      </div>
                  )}
                </td>

                {/* Azioni */}
                <td className="px-6 py-4 text-right rounded-r-2xl border-y border-r border-transparent group-hover:border-white/20">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-xl transition-all">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => setConfirmDeleteId(t.id)} 
                        disabled={deletingId === t.id} 
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all disabled:opacity-50"
                    >
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
        <div className="p-6 border-t border-slate-50 flex justify-center gap-3">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-100 text-slate-500 disabled:opacity-30 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm">Precedente</button>
            <span className="text-xs font-bold text-slate-400 py-2">{currentPage} / {totalPages}</span>
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-4 py-2 text-xs font-bold rounded-xl bg-white border border-slate-100 text-slate-500 disabled:opacity-30 hover:bg-slate-50 hover:text-slate-800 transition-colors shadow-sm">Successiva</button>
        </div>
      )}
    </div>

    {/* DELETE CONFIRMATION MODAL */}
    {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                    <TriangleAlert className="w-8 h-8"/>
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Elimina Movimento</h4>
                <p className="text-sm text-slate-500 mb-8 font-medium px-4">Questa azione è irreversibile. Sei sicuro di voler procedere?</p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => setConfirmDeleteId(null)} 
                        className="flex-1 px-6 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors"
                    >
                        Annulla
                    </button>
                    <button 
                        onClick={confirmDelete} 
                        className="flex-1 px-6 py-3.5 rounded-2xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all"
                    >
                        Elimina
                    </button>
                </div>
            </div>
        </div>
    )}
    </>
  );
};
