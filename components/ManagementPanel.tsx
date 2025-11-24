import React, { useState, useMemo } from 'react';
import { AccountTuple, Transaction, CreateTransactionPayload } from '../types';
import { Wallet, Layers, Plus, Trash2, Check, X, Database, Loader2, Save, Info, Settings } from 'lucide-react';
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
  accounts,
  setAccounts,
  categories,
  setCategories,
  allTransactions,
  onDataChange,
  apiKey,
}) => {
  const [activeTab, setActiveTab] = useState<'ACCOUNTS' | 'CATEGORIES'>('ACCOUNTS');

  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountCurr, setNewAccountCurr] = useState('CHF');
  const [addingAccount, setAddingAccount] = useState(false);

  const [showInit, setShowInit] = useState(false);
  const [initDate, setInitDate] = useState(new Date().toISOString().split('T')[0]);
  const [initBalances, setInitBalances] = useState<Record<string, string>>({});
  const [isInitializing, setIsInitializing] = useState(false);

  const accountBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    accounts.forEach(([name]) => balances[name] = 0);
    allTransactions.forEach(t => {
      if (balances[t.account] !== undefined) {
        balances[t.account] += t.movement;
      }
    });
    return balances;
  }, [accounts, allTransactions]);

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    if (accounts.some(([name]) => name === newAccountName)) {
        setAlertMessage("Account già esistente");
        return;
    }
    setAccounts(prev => [...prev, [newAccountName, newAccountCurr]]);
    setNewAccountName('');
    setAddingAccount(false);
  };

  const handleDeleteAccount = (name: string) => {
    const balance = accountBalances[name];
    if (Math.abs(balance) > 0.01) {
        setAlertMessage(`Impossibile eliminare. Il saldo deve essere zero.`);
        return;
    }
    setConfirmModal({
        title: "Elimina Conto",
        message: `Vuoi eliminare "${name}"?`,
        onConfirm: () => {
            setAccounts(prev => prev.filter(([n]) => n !== name));
            setConfirmModal(null);
        }
    });
  };

  const executeInitSave = async () => {
      if (!apiKey) {
          setAlertMessage("Sessione scaduta, ricarica la pagina.");
          setIsInitializing(false);
          return;
      }
      setIsInitializing(true);
      try {
          const promises = accounts.map(async ([name, curr]) => {
             const valStr = initBalances[name];
             if (!valStr || valStr.trim() === '') return;
             
             const amount = parseFloat(valStr);
             if (isNaN(amount)) return;

             const valueChf = await fetchExchangeRate(initDate, curr).then(rate => amount * rate).catch(() => amount);

             const payload: CreateTransactionPayload = {
                 date: initDate, account: name, curr: curr, movement: amount, category: 'TRANSFER',
                 subcategory: '', analytics: 'FALSE', flag: 'INIT', note: 'Saldo Iniziale', valueChf
             };
             await createTransaction(payload, apiKey);
          });
          await Promise.all(promises);
          setInitBalances({});
          setShowInit(false);
          setConfirmModal(null);
          onDataChange();
      } catch (err) {
          setAlertMessage("Errore durante l'inizializzazione.");
      } finally {
          setIsInitializing(false);
      }
  };

  const handleInitSaveClick = () => {
      setConfirmModal({
          title: "Inizializza Saldi",
          message: "Creare i movimenti di saldo iniziale?",
          onConfirm: executeInitSave
      });
  };

  const [newCatName, setNewCatName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [targetCatForSub, setTargetCatForSub] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');

  const handleAddCategory = () => {
      if (!newCatName.trim()) return;
      if (categories[newCatName]) return;
      setCategories(prev => ({ ...prev, [newCatName]: [] }));
      setNewCatName('');
      setAddingCat(false);
  };

  const handleDeleteCategory = (name: string) => {
      setConfirmModal({
          title: "Elimina Categoria",
          message: `Eliminare "${name}" e tutte le sottocategorie?`,
          onConfirm: () => {
            setCategories(prev => {
                const copy = { ...prev };
                delete copy[name];
                return copy;
            });
            setConfirmModal(null);
          }
      });
  };

  const handleAddSub = (catName: string) => {
      if (!newSubName.trim()) return;
      setCategories(prev => ({
          ...prev,
          [catName]: [...(prev[catName] || []), newSubName].sort()
      }));
      setNewSubName('');
      setTargetCatForSub(null);
  };

  const handleDeleteSub = (catName: string, subName: string) => {
      setCategories(prev => ({
          ...prev,
          [catName]: prev[catName].filter(s => s !== subName)
      }));
  };

  const formatMoney = (val: number, curr: string) => 
    new Intl.NumberFormat('de-CH', { style: 'currency', currency: curr }).format(val);

  const currencyOptions = ['CHF', 'EUR', 'USD', 'GBP'].map(c => ({ label: c, value: c }));

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden relative">
      
      <div className="px-6 py-4 bg-violet-50 border-b border-violet-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-xl text-violet-600 shadow-sm">
                <Settings className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold text-violet-900">Gestione</h3>
                <p className="text-xs font-medium text-violet-700/70 uppercase tracking-wide">Conti & Categorie</p>
            </div>
          </div>
          <div className="flex p-1 bg-white rounded-xl border border-violet-100 shadow-sm">
            <button
                onClick={() => setActiveTab('ACCOUNTS')}
                className={`p-2 rounded-lg transition-all ${activeTab === 'ACCOUNTS' ? 'bg-violet-100 text-violet-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Conti"
            ><Wallet className="w-4 h-4" /></button>
            <button
                onClick={() => setActiveTab('CATEGORIES')}
                className={`p-2 rounded-lg transition-all ${activeTab === 'CATEGORIES' ? 'bg-violet-100 text-violet-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                title="Categorie"
            ><Layers className="w-4 h-4" /></button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
        {activeTab === 'ACCOUNTS' && (
          <div className="space-y-3 pb-8">
            {accounts.map(([name, curr]) => (
              <div key={name} className="bg-white p-3 rounded-2xl border border-slate-100 hover:border-violet-200 transition-colors shadow-sm flex items-center justify-between group">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{name}</h4>
                  <div className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500">{curr}</div>
                </div>
                <div className="text-right">
                   <div className={`font-mono text-sm font-bold ${accountBalances[name] < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {formatMoney(accountBalances[name] || 0, curr)}
                   </div>
                   <button 
                      onClick={() => handleDeleteAccount(name)}
                      disabled={Math.abs(accountBalances[name] || 0) > 0.01}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-bold uppercase text-rose-400 hover:text-rose-600 disabled:hidden mt-0.5 ml-auto block"
                   >Elimina</button>
                </div>
              </div>
            ))}
            {addingAccount ? (
                <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100 animate-in fade-in zoom-in-95">
                    <input type="text" placeholder="Nome Conto" value={newAccountName} onChange={e => setNewAccountName(e.target.value)} className="w-full text-sm p-3 border border-violet-200 rounded-xl mb-3 focus:ring-2 focus:ring-violet-300" />
                    <div className="mb-3"><CustomSelect value={newAccountCurr} onChange={setNewAccountCurr} options={currencyOptions} placeholder="Valuta" /></div>
                    <div className="flex gap-2">
                        <button onClick={handleAddAccount} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold uppercase">Salva</button>
                        <button onClick={() => setAddingAccount(false)} className="flex-1 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold uppercase">Annulla</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setAddingAccount(true)} className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all text-sm font-bold flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Aggiungi Conto
                </button>
            )}
            <div className="flex justify-center mt-4">
               <button onClick={() => setShowInit(true)} className="p-2 text-slate-200 hover:text-violet-400 hover:bg-violet-50 rounded-full transition-all" title="Inizializza Saldi"><Database className="w-4 h-4" /></button>
            </div>
          </div>
        )}
        {activeTab === 'CATEGORIES' && (
          <div className="space-y-3">
            {(Object.entries(categories) as [string, string[]][]).map(([catName, subs]) => (
                <div key={catName} className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between p-3 bg-white">
                        <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => setExpandedCat(expandedCat === catName ? null : catName)}>
                           <span className="text-sm font-bold text-slate-700">{catName}</span>
                           <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] text-slate-500 font-bold">{subs.length} sub</span>
                        </div>
                        <div className="flex items-center gap-1">
                             <button onClick={() => setTargetCatForSub(catName)} className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-full"><Plus className="w-4 h-4" /></button>
                             <button onClick={() => handleDeleteCategory(catName)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-full"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </div>
                    {targetCatForSub === catName && (
                        <div className="px-3 pb-3 flex gap-2">
                            <input autoFocus type="text" placeholder="Nuova sottocategoria..." value={newSubName} onChange={e => setNewSubName(e.target.value)} className="flex-1 text-sm px-3 py-2 border-none bg-slate-50 rounded-xl focus:ring-2 focus:ring-violet-300" />
                            <button onClick={() => handleAddSub(catName)} className="p-2 bg-violet-600 text-white rounded-xl"><Check className="w-4 h-4"/></button>
                            <button onClick={() => setTargetCatForSub(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl"><X className="w-4 h-4"/></button>
                        </div>
                    )}
                    {expandedCat === catName && (
                        <div className="bg-slate-50 p-3 grid grid-cols-1 gap-2">
                            {subs.length === 0 && <p className="text-xs text-slate-400 italic text-center">Nessuna sottocategoria.</p>}
                            {subs.map(sub => (
                                <div key={sub} className="flex items-center justify-between px-3 py-2 bg-white rounded-xl text-xs font-medium text-slate-600 shadow-sm">
                                    <span>{sub}</span>
                                    <button onClick={() => handleDeleteSub(catName, sub)} className="text-slate-300 hover:text-rose-500"><X className="w-3 h-3" /></button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
             {addingCat ? (
                <div className="bg-violet-50 p-4 rounded-2xl border border-violet-100 mt-2">
                    <input type="text" placeholder="Nome Categoria" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full text-sm p-3 border-none rounded-xl mb-3 focus:ring-2 focus:ring-violet-300" />
                    <div className="flex gap-2">
                        <button onClick={handleAddCategory} className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold uppercase">Salva</button>
                        <button onClick={() => setAddingCat(false)} className="flex-1 py-2 bg-white text-slate-600 rounded-xl text-xs font-bold uppercase">Annulla</button>
                    </div>
                </div>
            ) : (
                <button onClick={() => setAddingCat(true)} className="w-full py-3 mt-2 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all text-sm font-bold flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" /> Aggiungi Categoria
                </button>
            )}
          </div>
        )}
      </div>
      {showInit && (
          <div className="absolute inset-0 bg-white z-20 flex flex-col animate-in slide-in-from-bottom-10 duration-300">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Database className="w-4 h-4 text-violet-600"/> Setup Saldi</h3>
                  <button onClick={() => setShowInit(false)} className="bg-white p-1 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"><X className="w-4 h-4"/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase">Data Saldi Iniziali</label>
                    <CustomDatePicker value={initDate} onChange={setInitDate} />
                  </div>
                  <div className="space-y-3">
                      {accounts.map(([name, curr]) => (
                          <div key={name}>
                              <label className="block text-[10px] font-bold text-slate-500 mb-1 ml-1 uppercase">{name} ({curr})</label>
                              <input type="number" placeholder="0.00" value={initBalances[name] || ''} onChange={e => setInitBalances(prev => ({...prev, [name]: e.target.value}))} className="w-full text-sm font-mono p-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-violet-500" />
                          </div>
                      ))}
                  </div>
              </div>
              <div className="p-4 bg-white border-t border-slate-100">
                  <button onClick={handleInitSaveClick} disabled={isInitializing} className="w-full py-3 bg-violet-600 text-white rounded-xl text-sm font-bold hover:bg-violet-700 flex items-center justify-center gap-2 shadow-lg shadow-violet-200">
                      {isInitializing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>} Salva Configurazione
                  </button>
              </div>
          </div>
      )}
      {confirmModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[2px]">
           <div className="bg-white rounded-3xl shadow-xl w-64 p-6 animate-in zoom-in-95 duration-200">
              <h3 className="text-center font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
              <p className="text-center text-xs text-slate-500 mb-6">{confirmModal.message}</p>
              <div className="flex flex-col gap-2">
                 <button onClick={confirmModal.onConfirm} className="w-full py-2 bg-violet-600 text-white rounded-xl font-bold text-xs uppercase">Conferma</button>
                 <button onClick={() => setConfirmModal(null)} className="w-full py-2 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-xs uppercase">Annulla</button>
              </div>
           </div>
        </div>
      )}
      {alertMessage && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/10 backdrop-blur-[2px]">
           <div className="bg-white rounded-3xl shadow-xl w-64 p-6 text-center">
              <Info className="w-8 h-8 text-amber-500 mx-auto mb-3"/>
              <p className="text-sm font-medium text-slate-700 mb-4">{alertMessage}</p>
              <button onClick={() => setAlertMessage(null)} className="w-full py-2 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs uppercase">OK</button>
           </div>
        </div>
      )}
    </div>
  );
};