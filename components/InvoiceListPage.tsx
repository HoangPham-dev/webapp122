
import React, { useState, useEffect, useCallback } from 'react';
import { Invoice } from '../types';
import { supabase } from '../lib/supabase';
import InvoiceList from './InvoiceList';
import { PlusIcon } from './Icons';

interface InvoiceListPageProps {
  onSelectInvoice: (invoice: Invoice) => void;
  onNewInvoice: () => void;
}

const InvoiceListPage: React.FC<InvoiceListPageProps> = ({ onSelectInvoice, onNewInvoice }) => {
    const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const fetchInvoices = useCallback(async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('invoices')
            .select('invoice_data')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching invoices:', error);
            if (error.message.includes('relation "public.invoices" does not exist')) {
                setMessage({ type: 'error', text: 'Database not set up. Please run the SQL script provided in InvoiceForm.tsx.' });
            } else {
                 setMessage({ type: 'error', text: 'Could not fetch invoices.' });
            }
        } else {
            const fetchedInvoices = data.map((item: any) => item.invoice_data);
            setSavedInvoices(fetchedInvoices);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const handleDeleteInvoice = async (invoiceId: string) => {
        setIsDeleting(true);
        setMessage(null);
        const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
        
        if (error) {
            setMessage({ type: 'error', text: 'Failed to delete invoice.' });
        } else {
            setMessage({ type: 'success', text: 'Invoice deleted.' });
            await fetchInvoices();
        }
        setIsDeleting(false);
        setTimeout(() => setMessage(null), 3000);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                    <h1 className="text-2xl font-bold">My Invoices</h1>
                    <button
                        onClick={onNewInvoice}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        aria-label="Create new invoice"
                    >
                        <PlusIcon className="w-5 h-5" /> New Invoice
                    </button>
                </div>
                {message && (
                    <div className={`mb-4 p-4 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`} role="alert">
                        {message.text}
                    </div>
                )}
                 {isLoading ? (
                    <div className="text-center p-8">Loading invoices...</div>
                 ) : (
                     <InvoiceList
                        invoices={savedInvoices}
                        onSelectInvoice={onSelectInvoice}
                        onDeleteInvoice={handleDeleteInvoice}
                        isDeleting={isDeleting}
                     />
                 )}
            </div>
        </div>
    );
};

export default InvoiceListPage;
