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
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">Gestor de PAME</h1>
          <p className="mt-2 text-dark-gray">Inicia sesión con tu cuenta institucional</p>
        </div>
        <div className="flex justify-center">
          <div ref={btnRef} />
        </div>
      </div>
    </div>
  );
};

export default Login;
