import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const OnlineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
      isOnline
        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        isOnline ? 'bg-emerald-400' : 'bg-slate-400'
      }`} />
      <span className="hidden sm:inline">{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
};

export default OnlineIndicator;
