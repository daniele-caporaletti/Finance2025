import React, { useState, useEffect } from 'react';
import { X, Loader2, Save, ArrowRightLeft, CreditCard, Pencil, Tag, FileText } from 'lucide-react';
import { AccountTuple, CreateTransactionPayload, Transaction, UpdateTransactionPayload } from '../types';
import { createTransaction, updateTransaction, fetchExchangeRate } from '../services/api';
import { getCategoryIcon } from './CategoryIcons';
import { CustomSelect } from './CustomSelect';
import { CustomDatePicker } from './CustomDatePicker';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: AccountTuple[];
  categories: Record<string, string[]>;
  initialData?: Transaction | null;
  // FIX: Add token to props for API calls
  token: string | null;
}

type Mode = 'SINGLE' | 'TRANSFER';
type TransactionType = 'EXPENSE' | 'INCOME';

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onSuccess, accounts, categories, initialData, token }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('SINGLE');
  const [transactionType, setTransactionType] = useState<TransactionType>('EXPENSE');

  // Shared State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Single Transaction State
  const [account, setAccount] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [amountValue, setAmountValue] = useState<string>(''); // Pure positive number string
  const [analytics, setAnalytics] = useState<'TRUE' | 'FALSE' | 'WORK'>('TRUE');
  const [flag, setFlag] = useState('');

  // Transfer State
  const [fromAccount, setFromAccount] = useState('');
  const [toAccount, setToAccount] = useState('');
  const [amountOut, setAmountOut] = useState<string>('');
  const [amountIn, setAmountIn] = useState<string>('');

  // Options Helpers
  const accountOptions = accounts.map(([acc, curr]) => ({ label: `${acc} (${curr})`, value: acc }));
  const categoryOptions = Object.keys(categories).map(cat => ({ label: cat, value: cat }));
  const subcategoryOptions = category ? (categories[category] || []).map(sub => ({ label: sub, value: sub })) : [];

  // Initialization
  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            // EDIT MODE
            setMode('SINGLE');
            setDate(new Date(initialData.date).toISOString().split('T')[0]);
            setNote(initialData.note || '');
            setAccount(initialData.account);
            setCategory(initialData.category);
            setSubcategory(initialData.subcategory || '');
            setAnalytics(initialData.analytics as any);
            setFlag(initialData.flag || '');
            
            // Determine Type and Amount
            if (initialData.movement < 0) {
                setTransactionType('EXPENSE');
                setAmountValue(String(Math.abs(initialData.movement)));
            } else {
                setTransactionType('INCOME');
                setAmountValue(String(initialData.movement));
            }
        } else {
            // CREATE MODE
            setDate(new Date().toISOString().split('T')[0]);
            resetForms();
            // Defaults
            if (accounts.length > 0 && !account) {
                setAccount(accounts[0][0]);
                setFromAccount(accounts[0][0]);
                setToAccount(accounts[1]?.[0] || accounts[0][0]);
            }
            if (Object.keys(categories).length > 0 && !category) {
                setCategory(Object.keys(categories)[0]);
            }
        }
    }
  }, [isOpen, initialData, accounts, categories]);

  // Derived Values
  const currentCurrency = accounts.find(a => a[0] === account)?.[1] || 'CHF';
  const fromCurrency = accounts.find(a => a[0] === fromAccount)?.[1] || 'CHF';
  const toCurrency = accounts.find(a => a[0] === toAccount)?.[1] || 'CHF';

  // Subcategory Update
  useEffect(() => {
    if (mode === 'SINGLE' && category && isOpen && !initialData) {
      const subs = categories[category] || [];
      setSubcategory(subs.length > 0 ? subs[0] : '');
    }
  }, [category, mode, categories, isOpen, initialData]);

  // Transfer Currency Sync
  useEffect(() => {
    if (mode === 'TRANSFER' && fromCurrency === toCurrency) {
      setAmountIn(amountOut);
    }
  }, [amountOut, fromCurrency, toCurrency, mode]);

  const calculateValueChf = async (amount: number, currency: string, dateStr: string): Promise<number> => {
    if (currency === 'CHF') return amount;
    const rate = await fetchExchangeRate(dateStr, currency);
    return amount * rate;
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountValue || !token) return;

    setError(null);
    setLoading(true);

    try {
      // Calculate final movement based on Type (Expense = negative)
      const absAmount = parseFloat(amountValue);
      const finalMovement = transactionType === 'EXPENSE' ? -absAmount : absAmount;
      const valueChf = await calculateValueChf(finalMovement, currentCurrency, date);

      if (initialData) {
        // UPDATE
        const payload: UpdateTransactionPayload = {
            id: initialData.id,
            date,
            account,
            category,
            subcategory,
            curr: currentCurrency,
            movement: finalMovement,
            analytics,
            flag,
            note,
            valueChf
        };
        // FIX: Pass token to updateTransaction
        await updateTransaction(payload, token);
      } else {
        // CREATE
        const payload: CreateTransactionPayload = {
            date,
            account,
            category,
            subcategory,
            curr: currentCurrency,
            movement: finalMovement,
            analytics,
            flag,
            note,
            valueChf
        };
        // FIX: Pass token to createTransaction
        await createTransaction(payload, token);
      }

      onSuccess();
      onClose();
      resetForms();
    } catch (err) {
      console.error(err);
      setError("Errore durante il salvataggio. Controlla i dati.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountOut || !amountIn || !token) return;
    if (fromAccount === toAccount) {
        setError("I conti devono essere diversi.");
        return;
    }

    setError(null);
    setLoading(true);

    try {
      const numOut = Math.abs(parseFloat(amountOut));
      const numIn = Math.abs(parseFloat(amountIn));

      // Outflow
      const outflowVal = -numOut;
      const outflowValueChf = await calculateValueChf(outflowVal, fromCurrency, date);
      
      const payloadOut: CreateTransactionPayload = {
        date,
        account: fromAccount,
        category: 'TRANSFER',
        subcategory: '',
        curr: fromCurrency,
        movement: outflowVal,
        analytics: 'FALSE', 
        flag: 'Transfer Out',
        note: note ? `To ${toAccount}: ${note}` : `Transfer to ${toAccount}`,
        valueChf: outflowValueChf
      };

      // Inflow
      const inflowVal = numIn;
      const inflowValueChf = await calculateValueChf(inflowVal, toCurrency, date);

      const payloadIn: CreateTransactionPayload = {
        date,
        account: toAccount,
        category: 'TRANSFER',
        subcategory: '',
        curr: toCurrency,
        movement: inflowVal,
        analytics: 'FALSE', 
        flag: 'Transfer In',
        note: note ? `From ${fromAccount}: ${note}` : `Transfer from ${fromAccount}`,
        valueChf: inflowValueChf
      };

      // FIX: Pass token to createTransaction
      await createTransaction(payloadOut, token);
      // FIX: Pass token to createTransaction
      await createTransaction(payloadIn, token);

      onSuccess();
      onClose();
      resetForms();
    } catch (err) {
      console.error(err);
      setError("Errore durante il trasferimento.");
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setAmountValue('');
    setNote('');
    setFlag('');
    setAmountOut('');
    setAmountIn('');
    setAnalytics('TRUE');
    setTransactionType('EXPENSE');
    if (Object.keys(categories).length > 0) {
        setCategory(Object.keys(categories)[0]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-50 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {initialData ? <Pencil className="w-5 h-5 text-violet-500"/> : (mode === 'SINGLE' ? <CreditCard className="w-5 h-5 text-violet-500"/> : <ArrowRightLeft className="w-5 h-5 text-violet-500"/>)}
            {initialData ? 'Modifica' : (mode === 'SINGLE' ? 'Nuovo Movimento' : 'Trasferimento')}
          </h2>
          <button onClick={onClose} className="bg-slate-50 hover:bg-slate-100 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher (Only if NOT editing) */}
        {!initialData && (
            <div className="px-6 pt-4 pb-0 bg-white">
                <div className="flex p-1 bg-slate-100 rounded-xl">
                    <button
                        onClick={() => setMode('SINGLE')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                            mode === 'SINGLE' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                    Movimento
                    </button>
                    <button
                        onClick={() => setMode('TRANSFER')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${
                            mode === 'TRANSFER' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                    >
                    Trasferimento
                    </button>
                </div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {error && (
            <div className="mb-4 p-4 bg-rose-50 text-rose-700 rounded-2xl text-sm border border-rose-100 font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500"/>{error}
            </div>
          )}

          {mode === 'SINGLE' ? (
            <form id="single-form" onSubmit={handleSingleSubmit} className="space-y-6">
              
              {/* 1. Transaction Type Toggle */}
              <div className="flex justify-center">
                  <div className="inline-flex bg-slate-50 p-1 rounded-full border border-slate-100">
                      <button
                        type="button"
                        onClick={() => setTransactionType('EXPENSE')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                            transactionType === 'EXPENSE' ? 'bg-rose-100 text-rose-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                          Uscita
                      </button>
                      <button
                        type="button"
                        onClick={() => setTransactionType('INCOME')}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                            transactionType === 'INCOME' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                        }`}
                      >
                          Entrata
                      </button>
                  </div>
              </div>

              {/* 2. Amount Big Input */}
              <div className="text-center relative">
                  <span className={`absolute top-1/2 -translate-y-1/2 left-4 text-lg font-bold ${transactionType === 'EXPENSE' ? 'text-rose-200' : 'text-emerald-200'}`}>
                    {transactionType === 'EXPENSE' ? '-' : '+'}
                  </span>
                  <input 
                      type="number"
                      step="0.01"
                      required
                      placeholder="0.00"
                      value={amountValue}
                      onChange={(e) => setAmountValue(e.target.value)}
                      className={`w-full text-center text-5xl font-bold bg-transparent border-none focus:ring-0 placeholder:text-slate-200 ${
                          transactionType === 'EXPENSE' ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                  />
                  <div className={`mt-2 inline-block px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                      transactionType === 'EXPENSE' ? 'bg-rose-50 text-rose-400' : 'bg-emerald-50 text-emerald-400'
                  }`}>
                      {currentCurrency}
                  </div>
              </div>

              {/* 3. Account & Date */}
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Data</label>
                      <CustomDatePicker
                        value={date}
                        onChange={setDate}
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase ml-1">Conto</label>
                      <CustomSelect
                        value={account}
                        onChange={setAccount}
                        options={accountOptions}
                        icon={<CreditCard className="w-4 h-4"/>}
                        placeholder="Seleziona Conto"
                      />
                  </div>
              </div>

              {/* 4. Category & Sub */}
              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Categoria</label>
                  <div className="grid grid-cols-2 gap-4">
                       <CustomSelect
                         value={category}
                         onChange={setCategory}
                         options={categoryOptions}
                         icon={getCategoryIcon(category, "w-4 h-4")}
                         placeholder="Categoria"
                       />
                       <CustomSelect
                         value={subcategory}
                         onChange={setSubcategory}
                         options={subcategoryOptions}
                         placeholder="Sottocategoria"
                       />
                  </div>
              </div>

              {/* 5. Extras: Tag & Work Checkbox */}
              <div className="grid grid-cols-2 gap-4 items-center">
                   <div className="space-y-1">
                       <label className="text-xs font-bold text-slate-400 uppercase ml-1">Tag / Evento</label>
                       <div className="relative">
                           <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10"/>
                           <input 
                                type="text"
                                placeholder="Es. Viaggio"
                                value={flag}
                                onChange={(e) => setFlag(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-violet-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-200 text-slate-700"
                            />
                       </div>
                   </div>
                   <div className="pt-5">
                        <label className="flex items-center gap-3 cursor-pointer group p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${analytics === 'WORK' ? 'bg-purple-600 border-purple-600' : 'border-slate-300 bg-white'}`}>
                                {analytics === 'WORK' && <div className="w-2 h-2 bg-white rounded-full" />}
                            </div>
                            <input 
                                type="checkbox"
                                checked={analytics === 'WORK'}
                                onChange={(e) => setAnalytics(e.target.checked ? 'WORK' : 'TRUE')}
                                className="hidden"
                            />
                            <span className={`text-sm font-bold ${analytics === 'WORK' ? 'text-purple-700' : 'text-slate-500'}`}>
                                Spesa Lavoro
                            </span>
                        </label>
                   </div>
              </div>

              {/* 6. Note */}
              <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Note</label>
                  <div className="relative">
                      <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400 z-10"/>
                      <textarea 
                          rows={2}
                          placeholder="Aggiungi una descrizione..."
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 hover:border-violet-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-200 text-slate-700 resize-none"
                      />
                  </div>
              </div>

            </form>
          ) : (
            /* --- TRANSFER FORM --- */
            <form id="transfer-form" onSubmit={handleTransferSubmit} className="space-y-6">
               
               <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase ml-1">Data</label>
                    <CustomDatePicker
                        value={date}
                        onChange={setDate}
                    />
               </div>

               <div className="relative grid gap-4">
                 {/* Connector Line */}
                 <div className="absolute left-[19px] top-10 bottom-10 w-0.5 bg-slate-100 hidden md:block"></div>

                 {/* FROM */}
                 <div className="relative pl-0 md:pl-10">
                     <div className="hidden md:flex absolute left-0 top-3 w-10 h-10 bg-rose-50 rounded-full items-center justify-center z-10 border-4 border-white">
                         <ArrowRightLeft className="w-4 h-4 text-rose-500 rotate-45"/>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                         <div className="flex justify-between mb-2">
                             <span className="text-xs font-bold text-slate-400 uppercase">Da (Uscita)</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <CustomSelect
                                value={fromAccount}
                                onChange={setFromAccount}
                                options={accountOptions}
                                placeholder="Da Conto"
                            />
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={amountOut}
                                    onChange={(e) => setAmountOut(e.target.value)}
                                    className="w-full px-3 py-3 bg-white rounded-2xl text-sm font-bold text-rose-600 border border-rose-100 focus:ring-2 focus:ring-rose-200 outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">{fromCurrency}</span>
                            </div>
                         </div>
                     </div>
                 </div>

                 {/* TO */}
                 <div className="relative pl-0 md:pl-10">
                     <div className="hidden md:flex absolute left-0 top-3 w-10 h-10 bg-emerald-50 rounded-full items-center justify-center z-10 border-4 border-white">
                         <ArrowRightLeft className="w-4 h-4 text-emerald-500 -rotate-45"/>
                     </div>
                     <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                         <div className="flex justify-between mb-2">
                             <span className="text-xs font-bold text-slate-400 uppercase">A (Entrata)</span>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <CustomSelect
                                value={toAccount}
                                onChange={setToAccount}
                                options={accountOptions}
                                placeholder="A Conto"
                            />
                            <div className="relative">
                                <input 
                                    type="number" 
                                    placeholder="0.00"
                                    value={amountIn}
                                    onChange={(e) => setAmountIn(e.target.value)}
                                    className="w-full px-3 py-3 bg-white rounded-2xl text-sm font-bold text-emerald-600 border border-emerald-100 focus:ring-2 focus:ring-emerald-200 outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-300">{toCurrency}</span>
                            </div>
                         </div>
                     </div>
                 </div>
               </div>

               <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase ml-1">Note</label>
                  <textarea 
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 hover:border-violet-300 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-violet-200 text-slate-700 resize-none"
                  />
               </div>

            </form>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-50 bg-white flex justify-end gap-3 z-10">
          <button 
            type="button" 
            onClick={onClose}
            className="px-6 py-3 text-slate-500 hover:text-slate-700 font-bold transition-colors text-sm"
          >
            Annulla
          </button>
          <button 
            type="submit" 
            form={mode === 'SINGLE' ? 'single-form' : 'transfer-form'}
            disabled={loading}
            className="flex items-center gap-2 px-8 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 font-bold transition-all shadow-lg shadow-violet-200 disabled:opacity-70 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {initialData ? 'Aggiorna' : (mode === 'SINGLE' ? 'Salva Movimento' : 'Esegui Transfer')}
          </button>
        </div>

      </div>
    </div>
  );
};
