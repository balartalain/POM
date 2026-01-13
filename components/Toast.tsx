
import React, { useEffect, useState } from 'react';
import { ToastType } from '../contexts/ToastContext';
import { SuccessIcon, InfoIcon, ErrorIcon, CloseIcon } from './Icons';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: SuccessIcon,
    bgClass: 'bg-green-500',
    iconClass: 'text-green-500',
  },
  error: {
    icon: ErrorIcon,
    bgClass: 'bg-red-500',
    iconClass: 'text-red-500',
  },
  info: {
    icon: InfoIcon,
    bgClass: 'bg-blue-500',
    iconClass: 'text-blue-500',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Start exit animation, then call onClose after animation finishes
      setIsExiting(true);
      const exitTimer = setTimeout(onClose, 400); // Match animation duration
      return () => clearTimeout(exitTimer);
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, [onClose]);
  
  const handleClose = () => {
      setIsExiting(true);
      setTimeout(onClose, 400);
  }

  const { icon: Icon, bgClass, iconClass } = toastConfig[type];

  return (
    <div
      className={`relative w-full max-w-sm p-4 bg-white rounded-lg shadow-2xl flex items-start gap-3 overflow-hidden animate-toast-in ${isExiting ? 'opacity-0 transition-opacity duration-300' : ''}`}
      role="alert"
      aria-live="assertive"
    >
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${bgClass}`}></div>
      <div className="flex-shrink-0 pt-0.5">
          <Icon className={`w-6 h-6 ${iconClass}`} />
      </div>
      <div className="flex-grow">
        <p className="text-sm font-medium text-gray-800">{message}</p>
      </div>
      <div className="flex-shrink-0">
          <button onClick={handleClose} className="p-1 text-gray-400 rounded-full hover:bg-gray-100 hover:text-gray-600">
              <CloseIcon className="w-5 h-5"/>
          </button>
      </div>
    </div>
  );
};

export default Toast;
