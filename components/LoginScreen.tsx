import React, { useEffect } from 'react';
import { LayoutDashboard } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (response: any) => void;
}

// DOVRAI SOSTITUIRE QUESTO CON IL TUO CLIENT ID
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

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
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
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
        <div id="google-signin-button" className="flex justify-center"></div>
         <p className="text-xs text-slate-400 mt-8">
          Assicurati che il popup non sia bloccato e di utilizzare l'account Google corretto per accedere ai dati di Apps Script.
        </p>
      </div>
    </div>
  );
};