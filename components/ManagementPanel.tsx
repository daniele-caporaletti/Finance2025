
import React, { useState, useMemo } from 'react';
import { AccountTuple, Transaction, CreateTransactionPayload } from '../types';
import { Wallet, Layers, Plus, Trash2, Check, X, Database, Loader2, Save, Info, Settings, ChevronRight, ChevronDown } from 'lucide-react';
import { createTransaction, fetchExchangeRate } from '../services/api';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';

interface ManagementPanelProps {
  accounts: AccountTuple[];
  setAccounts: React.Dispatch<React.SetStateAction<AccountTuple[]>>;
  categories: Record<string, string[]>;
  setCategories: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  allTransactions: Transaction[];
  onDataChange: () => void;
  apiKey: string | null;
}

export const ManagementPanel: React.FC<ManagementPanelProps> = ({
  accounts, setAccounts, categories, setCategories, allTransactions, onDataChange, apiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'CATEGORIES'>('ACCOUNTS');
  
  // Accounts State
  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurr, setNewAccountCurr] = useState('CHF');
  
  // Categories State
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingSubTo, setAddingSubTo] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Init Hidden State
  const [showInitModal, setShowInitModal] = useState(false);
  const [initDate, setInitDate] = useState(new Date().toISOString().split('T')[0]);
  const [initBalances, setInitBalances] = useState<Record<string, string>>({});
  const [initLoading, setInitLoading] = useState(false);

  // Dialogs
  const [confirmModal, setConfirmModal] = useState<{ title: string; msg: string; onConfirm: () => void } | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // --- CALCULATIONS ---
  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(([name]) => balances[name] = 0);
    allTransactions.forEach(t => { if (balances[t.account] !== undefined) balances[t.account] += t.movement; });
    return balances;
  }, [accounts, allTransactions]);

  const formatMoney = (val: number, curr: string) => new Intl.NumberFormat('de-CH', { style: 'currency', currency: curr }).format(val);

  // --- HANDLERS: ACCOUNTS ---
  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    if (accounts.some(a => a[0] === newAccountName)) {
        setAlertMsg("Esiste già un conto con questo nome.");
        return;
    }
    setAccounts(prev => [...prev, [newAccountName, newAccountCurr]]);
    setNewAccountName('');
    setAddingAccount(false);
  };

  const handleDeleteAccount = (name: string) => {
    if (Math.abs(accountBalances[name]) > 0.01) {
        setAlertMsg("Non puoi eliminare un conto con saldo diverso da zero.");
        return;
    }
    setConfirmModal({
        title: "Elimina Conto",
        msg: `Vuoi davvero eliminare ${name}?`,
        onConfirm: () => setAccounts(prev => prev.filter(a => a[0] !== name))
    });
  };

  // --- HANDLERS: CATEGORIES ---
  const handleAddCategory = () => {
      if (!newCategoryName.trim()) return;
      if (categories[newCategoryName]) {
          setAlertMsg("Categoria esistente.");
          return;
      }
      setCategories(prev => ({ ...prev, [newCategoryName]: [] }));
      setNewCategoryName('');
      setAddingCategory(false);
  };

  const handleDeleteCategory = (cat: string) => {
      setConfirmModal({
          title: "Elimina Categoria",
          msg: `Eliminare ${cat} e tutte le sottocategorie?`,
          onConfirm: () => {
              const newCats = { ...categories };
              delete newCats[cat];
              setCategories(newCats);
          }
      });
  };

  const handleAddSubcategory = (cat: string) => {
      if (!newSubName.trim()) return;
      const currentSubs = categories[cat];
      if (currentSubs.includes(newSubName)) {
          setAlertMsg("Sottocategoria esistente.");
          return;
      }
      setCategories(prev => ({
          ...prev,
          [cat]: [...prev[cat], newSubName].sort()
      }));
      setNewSubName('');
      setAddingSubTo(null);
  };

  const handleDeleteSubcategory = (cat: string, sub: string) => {
      setCategories(prev => ({
          ...prev,
          [cat]: prev[cat].filter(s => s !== sub)
      }));
  };

  // --- HANDLERS: INIT ---
  const handleInitSave = async () => {
    if (!apiKey) return;
    setInitLoading(true);
    try {
        for (const [accName, balanceStr] of Object.entries(initBalances)) {
            const balance = parseFloat(balanceStr);
            if (!isNaN(balance) && balance !== 0) {
                const curr = (accounts.find(a => a[0] === accName)?.[1] || 'CHF') as string;
                // Calc CHF value
                let valChf = balance;
                if (curr !== 'CHF') {
                    const rate = await fetchExchangeRate(initDate, curr);
                    valChf = balance * rate;
                }
                
                const payload: CreateTransactionPayload = {
                    date: initDate,
                    account: accName,
                    movement: balance,
                    curr: curr,
                    category: 'TRANSFER',
                    subcategory: '',
                    analytics: 'FALSE',
                    flag: 'INIT',
                    note: 'Saldo Iniziale',
                    valueChf: valChf
                };
                await createTransaction(payload, apiKey);
            }
        }
        onDataChange();
        setShowInitModal(false);
        setInitBalances({});
    } catch (e) {
        setAlertMsg("Errore durante il salvataggio dei saldi iniziali.");
    } finally {
        setInitLoading(false);
    }
  };

  return (
    <>
    <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] shadow-sm border border-white/20 flex flex-col h-[500px] overflow-hidden relative">
      
      {/* Header & Tabs */}
      <div className="px-6 py-4 border-b border-slate-100/50 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-800 text-sm">Gestione</h3>
          <div className="flex p-1 bg-slate-100/50 rounded-xl">
            <button onClick={() => setActiveTab('ACCOUNTS')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${activeTab === 'ACCOUNTS' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <Wallet className="w-3.5 h-3.5" /> Conti
            </button>
            <button onClick={() => setActiveTab('CATEGORIES')} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-xs font-bold ${activeTab === 'CATEGORIES' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}>
                <Layers className="w-3.5 h-3.5" /> Categorie
            </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {/* --- ACCOUNTS TAB --- */}
        {activeTab === 'ACCOUNTS' && (
          <div className="space-y-3 pb-10">
            {accounts.map(([name, curr]) => (
              <div key={name} className="bg-white/50 p-3 rounded-2xl border border-white/40 flex items-center justify-between group hover:bg-white transition-colors shadow-sm">
                <div>
                  <h4 className="font-bold text-slate-700 text-sm">{name}</h4>
                  <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded w-fit mt-1">{curr}</div>
                </div>
                <div className="text-right flex items-center gap-3">
                   <div className={`font-mono text-sm font-bold ${accountBalances[name] < 0 ? 'text-slate-800' : 'text-emerald-600'}`}>
                      {formatMoney(accountBalances[name] || 0, curr)}
                   </div>
                   <button onClick={() => handleDeleteAccount(name)} className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                       <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
            
            {/* Add Account UI */}
            {!addingAccount ? (
                <button onClick={() => setAddingAccount(true)} className="w-full py-3 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/50 transition-all text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wide">
                    <Plus className="w-4 h-4" /> Aggiungi Conto
                </button>
            ) : (
                <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 animate-in fade-in slide-in-from-bottom-2">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Nuovo Conto</h4>
                    <div className="space-y-3">
                        <input 
                            type="text" 
                            placeholder="Nome Conto"
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-100"
                            autoFocus
                        />
                        <CustomSelect 
                            value={newAccountCurr}
                            onChange={setNewAccountCurr}
                            options={['CHF','EUR','USD','GBP'].map(c => ({label: c, value: c}))}
                            className="text-sm"
                        />
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setAddingAccount(false)} className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-100 rounded-xl hover:bg-slate-200">Annulla</button>
                            <button onClick={handleAddAccount} className="flex-1 py-2 text-xs font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 shadow-lg shadow-violet-200">Salva</button>
                        </div>
                    </div>
                </div>
            )}
          </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'CATEGORIES' && (
             <div className="space-y-2 pb-10">
                 {Object.entries(categories).sort().map(([catName, rawSubs]) => {
                     const subs = rawSubs as string[];
                     const isExpanded = expandedCat === catName;
                     const isAddingSub = addingSubTo === catName;

                     return (
                         <div key={catName} className="bg-white/40 border border-white/40 rounded-2xl overflow-hidden transition-all hover:bg-white/80">
                             <div className="flex items-center justify-between p-3">
                                 <button onClick={() => setExpandedCat(isExpanded ? null : catName)} className="flex items-center gap-2 flex-1 text-left">
                                     {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400"/> : <ChevronRight className="w-4 h-4 text-slate-400"/>}
                                     <span className="font-bold text-slate-700 text-sm">{catName}</span>
                                     <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 rounded">{subs.length}</span>
                                 </button>
                                 <div className="flex items-center gap-1">
                                     <button onClick={() => { setAddingSubTo(catName); setExpandedCat(catName); }} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg">
                                         <Plus className="w-3.5 h-3.5" />
                                     </button>
                                     <button onClick={() => handleDeleteCategory(catName)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg">
                                         <Trash2 className="w-3.5 h-3.5" />
                                     </button>
                                 </div>
                             </div>

                             {isExpanded && (
                                 <div className="bg-slate-50/50 border-t border-slate-100/50 p-3 space-y-1">
                                     {subs.map(sub => (
                                         <div key={sub} className="flex items-center justify-between pl-6 pr-2 py-1.5 rounded-lg hover:bg-white group">
                                             <span className="text-xs font-medium text-slate-600">{sub}</span>
                                             <button onClick={() => handleDeleteSubcategory(catName, sub)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500">
                                                 <X className="w-3 h-3" />
                                             </button>
                                         </div>
                                     ))}
                                     
                                     {/* Add Subcategory Input */}
                                     {isAddingSub ? (
                                         <div className="pl-6 mt-2 flex gap-2">
                                             <input 
                                                 type="text"
                                                 placeholder="Nuova Sottocategoria"
                                                 value={newSubName}
                                                 onChange={e => setNewSubName(e.target.value)}
                                                 className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-lg outline-none focus:border-violet-400"
                                                 autoFocus
                                                 onKeyDown={e => e.key === 'Enter' && handleAddSubcategory(catName)}
                                             />
                                             <button onClick={() => handleAddSubcategory(catName)} className="p-1 bg-violet-600 text-white rounded-lg"><Check className="w-3 h-3"/></button>
                                             <button onClick={() => setAddingSubTo(null)} className="p-1 bg-slate-200 text-slate-500 rounded-lg"><X className="w-3 h-3"/></button>
                                         </div>
                                     ) : (
                                         <button onClick={() => setAddingSubTo(catName)} className="w-full text-left pl-6 py-1 text-[10px] font-bold text-violet-500 hover:underline">
                                             + Aggiungi Sottocategoria
                                         </button>
                                     )}
                                 </div>
                             )}
                         </div>
                     );
                 })}

                 {/* Add Category Button */}
                 {!addingCategory ? (
                    <button onClick={() => setAddingCategory(true)} className="w-full py-3 rounded-2xl border border-dashed border-slate-300 text-slate-400 hover:border-violet-400 hover:text-violet-600 hover:bg-violet-50/50 transition-all text-xs font-bold flex items-center justify-center gap-2 uppercase tracking-wide mt-4">
                        <Plus className="w-4 h-4" /> Nuova Categoria
                    </button>
                 ) : (
                    <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 animate-in fade-in mt-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Nuova Categoria</h4>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="Nome Categoria"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-violet-100"
                                autoFocus
                            />
                            <button onClick={handleAddCategory} className="p-2 bg-violet-600 text-white rounded-xl shadow-lg shadow-violet-200"><Check className="w-5 h-5"/></button>
                            <button onClick={() => setAddingCategory(false)} className="p-2 bg-slate-100 text-slate-500 rounded-xl"><X className="w-5 h-5"/></button>
                        </div>
                    </div>
                 )}
             </div>
        )}
      </div>

      {/* Hidden Init Button */}
      <div className="absolute bottom-2 right-2">
          <button onClick={() => setShowInitModal(true)} className="p-2 text-slate-300 hover:text-slate-500 transition-colors">
              <Database className="w-3 h-3" />
          </button>
      </div>

    </div>

    {/* --- INIT MODAL --- */}
    {showInitModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-slate-800">Inizializza Saldi</h3>
                    <button onClick={() => setShowInitModal(false)}><X className="w-5 h-5 text-slate-400"/></button>
                </div>
                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">Data Iniziale</label>
                        <CustomDatePicker value={initDate} onChange={setInitDate} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Saldi per Conto</label>
                        {accounts.map(([name, curr]) => (
                            <div key={name} className="flex items-center gap-3">
                                <span className="text-sm font-medium text-slate-600 w-1/3 truncate">{name}</span>
                                <div className="relative flex-1">
                                    <input 
                                        type="number" 
                                        placeholder="0.00"
                                        value={initBalances[name] || ''}
                                        onChange={e => setInitBalances(prev => ({...prev, [name]: e.target.value}))}
                                        className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-violet-400"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">{curr}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 flex justify-end gap-3">
                    <button onClick={() => setShowInitModal(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl">Annulla</button>
                    <button onClick={handleInitSave} disabled={initLoading} className="px-6 py-2 text-sm font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-lg flex items-center gap-2">
                        {initLoading && <Loader2 className="w-4 h-4 animate-spin" />} Salva Saldi
                    </button>
                </div>
            </div>
        </div>
    )}

    {/* --- CONFIRM / ALERT MODALS --- */}
    {confirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95">
                <h4 className="text-lg font-bold text-slate-800 mb-2">{confirmModal.title}</h4>
                <p className="text-sm text-slate-500 mb-6 font-medium">{confirmModal.msg}</p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => setConfirmModal(null)} className="flex-1 px-5 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition-colors">Annulla</button>
                    <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="flex-1 px-5 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all">Conferma</button>
                </div>
            </div>
        </div>
    )}

    {alertMsg && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in-95">
                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600"><Info className="w-6 h-6"/></div>
                <p className="text-sm font-medium text-slate-600 mb-6">{alertMsg}</p>
                <button onClick={() => setAlertMsg(null)} className="w-full px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 transition-colors">Ho capito</button>
            </div>
        </div>
    )}
    </>
  );
};
