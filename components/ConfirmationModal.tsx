
import React, { ReactNode } from 'react';
import Modal from './Modal';
import Spinner from './shared/Spinner';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: ReactNode;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}


const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  children,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-dark-gray">
        {children}
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          aria-label={cancelText}
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          aria-label={confirmText}
        >
          {isLoading && <Spinner />}
          {isLoading ? 'Eliminando...' : confirmText}
        </button>
      </div>
    </Modal>
  );
};

export default ConfirmationModal;
