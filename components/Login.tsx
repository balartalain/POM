
import React, { useState } from 'react';
import { LockClosedIcon, UserIcon } from './Icons';

interface LoginProps {
  onLogin: (username: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onLogin(username)) {
      setError('Usuario inválido. Intenta con "supervisor" o "worker1".');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-8">
        <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Gestor de POA</h1>
            <p className="mt-2 text-dark-gray">Inicia sesión en tu cuenta</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="appearance-none rounded-md relative block w-full px-3 py-3 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                    placeholder="Usuario (ej: supervisor, worker1, worker2)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            </div>
            
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
                <button
                    type="submit"
                    className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
                >
                    <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                        <LockClosedIcon className="h-5 w-5 text-indigo-300 group-hover:text-indigo-200" />
                    </span>
                    Iniciar sesión
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
