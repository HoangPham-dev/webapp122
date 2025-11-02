import React from 'react';
import { Invoice } from '../types';
import { PlusIcon, TrashIcon } from './Icons';

interface InvoiceListProps {
  invoices: Invoice[];
  activeInvoiceId?: string | null;
  onSelectInvoice: (invoice: Invoice) => void;
  onNewInvoice: () => void;
  onDeleteInvoice: (invoiceId: string) => void;
  isDeleting: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, activeInvoiceId, onSelectInvoice, onNewInvoice, onDeleteInvoice, isDeleting }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg h-full">
      <h2 className="text-xl font-bold mb-4">My Invoices</h2>
      <button
        onClick={onNewInvoice}
        className="w-full flex items-center justify-center gap-2 mb-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        aria-label="Create new invoice"
      >
        <PlusIcon className="w-5 h-5" /> New Invoice
      </button>
      <div className="space-y-2 overflow-y-auto" style={{maxHeight: 'calc(100vh - 250px)'}}>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No saved invoices yet.</p>
        ) : (
          invoices.map((inv) => (
            <div
              key={inv.id}
              className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${
                activeInvoiceId === inv.id
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 ring-2 ring-indigo-500'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <div onClick={() => onSelectInvoice(inv)} className="flex-grow truncate pr-2">
                <p className="font-semibold truncate">{inv.invoiceNumber}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{inv.to.name}</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (inv.id && window.confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) {
                    onDeleteInvoice(inv.id);
                  }
                }}
                disabled={isDeleting}
                className="ml-2 flex-shrink-0 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                aria-label={`Delete invoice ${inv.invoiceNumber}`}
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InvoiceList;
