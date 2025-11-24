import React, { useState } from 'react';
import { Transaction } from '../types';
import { format } from 'date-fns';
import { Search, Tag, Briefcase, ArrowLeftRight, Trash2, AlertTriangle, Pencil } from 'lucide-react';
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

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getAnalyticsBadge = (type: string) => {
    switch (type) {
      case 'WORK':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-700 uppercase tracking-wide"><Briefcase className="w-3 h-3 mr-1"/>Lavoro</span>;
      case 'FALSE':
        return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide"><ArrowLeftRight className="w-3 h-3 mr-1"/>Transfer</span>;
      default:
        return null;
    }
  };

  const handleDeleteClick = (id: number) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteId !== null && apiKey) {
      const id = confirmDeleteId;
      setConfirmDeleteId(null);
      setDeletingId(id);
      await onDelete(id);
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden relative">
      <div className="px-6 py-5 border-b border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-slate-800">Ultimi Movimenti</h3>
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cerca..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-200 text-slate-700 transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/50 text-slate-500 font-bold uppercase text-xs tracking-wider">
            <tr>
              <th className="px-6 py-4 rounded-tl-2xl">Data</th>
              <th className="px-6 py-4">Dettagli</th>
              <th className="px-6 py-4">Categoria</th>
              <th className="px-6 py-4 text-right">Importo</th>
              <th className="px-6 py-4 text-right text-violet-700 rounded-tr-2xl">CHF</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {paginatedData.map((t) => (
              <tr key={t.id} className="group hover:bg-slate-50/80 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center w-10 h-10 bg-slate-100 rounded-xl">
                          <span className="font-bold text-slate-700 text-sm">
                              {format(new Date(t.date), 'dd')}
                          </span>
                      </div>
                      <span className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                          {format(new Date(t.date), 'MMM yy')}
                      </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <div className="flex flex-col gap-1.5">
                       <span className="font-bold text-slate-700">{t.account}</span>
                       <div className="flex flex-wrap gap-2 items-center">
                           {t.flag && (
                            <span className="inline-flex items-center text-[10px] font-bold tracking-wide text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md uppercase border border-orange-100">
                                <Tag className="w-3 h-3 mr-1" />{t.flag}
                            </span>
                           )}
                           {getAnalyticsBadge(t.analytics)}
                       </div>
                       {t.note && <p className="text-xs text-slate-500 line-clamp-1 italic max-w-[200px]">{t.note}</p>}
                   </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${getCategoryColor(t.category)}`}>
                          {getCategoryIcon(t.category, "w-4 h-4")}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                            {t.category}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">{t.subcategory}</span>
                      </div>
                  </div>
                </td>
                <td className={`px-6 py-4 text-right whitespace-nowrap font-medium ${t.movement < 0 ? 'text-slate-500' : 'text-emerald-600'}`}>
                  {formatCurrency(t.movement, t.curr)}
                </td>
                <td className={`px-6 py-4 text-right whitespace-nowrap font-bold text-base ${t.valueChf < 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                  {formatCurrency(t.valueChf, 'CHF')}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(t)}
                      className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full transition-all"
                      title="Modifica"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(t.id)}
                      disabled={deletingId === t.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all disabled:opacity-50"
                      title="Elimina"
                    >
                      {deletingId === t.id ? (
                        <div className="w-4 h-4 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin"></div>
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="w-8 h-8 opacity-20" />
                    <p className="text-sm font-medium">Nessun movimento trovato.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="p-4 border-t border-slate-50 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Precedente
          </button>
          <span className="text-sm font-medium text-slate-500">
            Pagina {currentPage} di {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors"
          >
            Successiva
          </button>
        </div>
      )}

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-center w-12 h-12 bg-rose-100 rounded-full mx-auto mb-4">
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 text-center mb-2">Elimina Movimento</h3>
                <p className="text-sm text-slate-500 text-center mb-8 leading-relaxed">
                    Sei sicuro di voler eliminare questo movimento? <br/>L'operazione è irreversibile.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="flex-1 px-4 py-3 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition-colors"
                    >
                        Annulla
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        className="flex-1 px-4 py-3 text-white bg-rose-600 hover:bg-rose-700 rounded-xl font-bold transition-colors shadow-lg shadow-rose-200"
                    >
                        Elimina
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};