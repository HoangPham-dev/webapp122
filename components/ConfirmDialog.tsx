
import React, { useEffect, useCallback } from 'react';
import { useTranslation } from '../lib/i18n';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  children: React.ReactNode;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ isOpen, onClose, onConfirm, title, children }) => {
    const { t } = useTranslation();

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        } else {
            document.removeEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);


  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center p-4" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="dialog-title"
        onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside the modal
      >
        <h3 id="dialog-title" className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          {children}
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <button 
            type="button"
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
            {t('cancel')}
          </button>
          <button 
            type="button"
            onClick={onConfirm} 
            className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
            {t('delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
