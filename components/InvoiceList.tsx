
import React from 'react';
import { Invoice } from '../types';
import { TrashIcon, EditIcon } from './Icons';

interface InvoiceListProps {
  invoices: Invoice[];
  onSelectInvoice: (invoice: Invoice) => void;
  onDeleteInvoice: (invoiceId: string) => void;
  isDeleting: boolean;
}

const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, onSelectInvoice, onDeleteInvoice, isDeleting }) => {
  return (
    <div className="space-y-2">
      {invoices.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No saved invoices yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Invoice #</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Client</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Due Date</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{inv.to.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{inv.dueDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-300">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: inv.currency }).format(
                      inv.items.reduce((acc, item) => acc + item.quantity * item.price, 0) * (1 + inv.taxRate / 100)
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => onSelectInvoice(inv)} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200 p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50" aria-label={`Edit invoice ${inv.invoiceNumber}`}>
                        <EditIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inv.id && window.confirm(`Are you sure you want to delete invoice ${inv.invoiceNumber}?`)) {
                            onDeleteInvoice(inv.id);
                          }
                        }}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                        aria-label={`Delete invoice ${inv.invoiceNumber}`}
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
