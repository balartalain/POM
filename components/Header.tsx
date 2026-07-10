
import React from 'react';
import { User } from '../types';
import { LogoutIcon } from './Icons';
import OnlineIndicator from './OnlineIndicator';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-[#ffffff] shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8" />
          </div>
          <div className="flex-1 flex justify-center">
            <h1 className="hidden sm:block text-lg font-semibold text-gray-500">Plan de Actividades</h1>
          </div>
          <div className="flex items-center space-x-4">
            <OnlineIndicator />
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{user.name}</p>
            </div>
            <button
              onClick={onLogout}
              className="p-2 rounded-full text-indigo-200 hover:text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-white transition-colors"
              aria-label="Cerrar sesión"
            >
              <LogoutIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
