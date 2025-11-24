import React, { useState } from 'react';
import { LayoutDashboard, KeyRound, ArrowRight, Loader2 } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (apiKey: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [keyInput, setKeyInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;
    setLoading(true);
    // Simulate a small delay for UX
    setTimeout(() => {
        onLogin(keyInput.trim());
        setLoading(false);
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-2xl shadow-violet-100 text-center w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
        
        <div className="inline-flex items-center justify-center w-20 h-20 bg-violet-600 rounded-2xl text-white shadow-xl shadow-violet-200 mb-8 rotate-3 hover:rotate-6 transition-transform">
          <LayoutDashboard className="w-10 h-10" />
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-3">
          Finance 2025
        </h1>
        <p className="text-slate-500 mb-8 font-medium">
          Dashboard finanziaria personale
        </p>

        <form onSubmit={handleSubmit} className="text-left space-y-4">
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Password (API Key)</label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <KeyRound className="h-5 w-5 text-slate-300" />
                    </div>
                    <input
                        type="password"
                        value={keyInput}
                        onChange={(e) => setKeyInput(e.target.value)}
                        placeholder="Inserisci la chiave segreta"
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 transition-all font-mono text-sm"
                        autoFocus
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={!keyInput || loading}
                className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-bold shadow-lg shadow-violet-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                        Accedi alla Dashboard
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                )}
            </button>
        </form>
        
        <p className="text-xs text-slate-400 mt-8">
          Utilizza la chiave configurata nel tuo Google Apps Script.
        </p>
      </div>
    </div>
  );
};