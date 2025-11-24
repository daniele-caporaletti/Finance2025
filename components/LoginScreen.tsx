import React, { useEffect } from 'react';
import { LayoutDashboard, AlertTriangle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (response: any) => void;
}

// Client ID provided by the user
const GOOGLE_CLIENT_ID = '404363320124-ao14lmp11h4nbju4dobielebrd7tgms8.apps.googleusercontent.com';
const isPlaceholderClientId = GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID');

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  useEffect(() => {
    // @ts-ignore
    if (window.google) {
      // @ts-ignore
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: onLoginSuccess,
      });
      // @ts-ignore
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill' }
      );
    }
  }, [onLoginSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-12 rounded-3xl shadow-2xl shadow-violet-100 text-center w-full max-w-md">
        <div className="inline-block bg-violet-600 p-4 rounded-2xl text-white shadow-lg shadow-violet-200 mb-6">
          <LayoutDashboard className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-2">
          Finance 2025
        </h1>
        <p className="text-slate-500 mb-8">
          Accedi con il tuo account Google per visualizzare la dashboard.
        </p>

        {isPlaceholderClientId && (
          <div className="bg-amber-50 border-l-4 border-amber-400 p-4 text-left my-6 rounded-r-lg animate-in fade-in duration-300">
            <div className="flex">
              <div className="py-1">
                <AlertTriangle className="h-6 w-6 text-amber-500 mr-4" />
              </div>
              <div>
                <p className="font-bold text-amber-800">Azione Richiesta per lo Sviluppatore</p>
                <p className="text-sm text-amber-700 mt-1">
                  Per continuare, sostituisci il Client ID placeholder nel file <code>components/LoginScreen.tsx</code> con il tuo ID Cliente OAuth 2.0 per risolvere l'errore <strong>401: invalid_client</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div id="google-signin-button" className={`flex justify-center transition-opacity ${isPlaceholderClientId ? 'opacity-20 pointer-events-none' : ''}`}></div>
        
        <p className="text-xs text-slate-400 mt-8">
          Assicurati che il popup non sia bloccato e di utilizzare l'account Google corretto per accedere ai dati di Apps Script.
        </p>
      </div>
    </div>
  );
};