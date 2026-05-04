import React, { useEffect, useRef } from 'react';

interface LoginProps {
  onLogin: (credential: string) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    //const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
    const clientId = "478848519153-0tklbkp5d7252099relj297632eka3qg.apps.googleusercontent.com";
    if (!clientId || !window.google) return;

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: ({ credential }) => onLogin(credential),
      use_fedcm_for_prompt: false
    });

    if (btnRef.current) {
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: 'outline',
        size: 'large',
        width: 300,
        text: 'signin_with',
        locale: 'es',
      });
    }
  }, [onLogin]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white border border-slate-200 rounded-xl p-10 w-full max-w-sm space-y-6">

        <div className="text-7xl text-center">🔐</div>

        <div className="text-center">
          <h1 className="text-xl font-medium text-slate-800">Gestor de PAME</h1>
          <p className="mt-1 text-sm text-slate-500">Inicia sesión con tu cuenta institucional</p>
        </div>

        <div className="flex justify-center">
          <div ref={btnRef} />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-xs text-slate-400">acceso seguro</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        <div className="flex justify-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Conexión cifrada
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-400">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            Autenticado por Google
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
