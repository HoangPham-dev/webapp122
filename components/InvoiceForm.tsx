import React, { useState, ChangeEvent, useCallback, useEffect } from 'react';
import { Invoice, LineItem } from '../types';
import InvoiceField from './InvoiceField';
import InvoiceList from './InvoiceList';
import { TrashIcon, PlusIcon, DownloadIcon } from './Icons';
import { supabase } from '../lib/supabase';


// --- Supabase Database Setup ---
// To enable saving invoices, you need to create a table in your Supabase project.
// 1. Go to your Supabase project dashboard.
// 2. Click on the 'SQL Editor' in the left sidebar.
// 3. Click '+ New query' and paste the entire content of the SQL script below.
// 4. Click 'RUN' to execute the script and create the 'invoices' table with the necessary policies.
/*
  CREATE TABLE public.invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    invoice_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
  );

  CREATE OR REPLACE FUNCTION public.handle_updated_at()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER on_invoices_updated
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

  ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Allow users to view their own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

  CREATE POLICY "Allow users to insert their own invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Allow users to update their own invoices"
    ON public.invoices FOR UPDATE
    USING (auth.uid() = user_id);

  CREATE POLICY "Allow users to delete their own invoices"
    ON public.invoices FOR DELETE
    USING (auth.uid() = user_id);
*/


// Access jspdf and html2canvas from the window object
const jsPDF = (window as any).jspdf.jsPDF;
const html2canvas = (window as any).html2canvas;

const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'JPY', label: 'JPY (¥)' },
    { value: 'VND', label: 'VND (₫)' },
];

const currencyLocaleMap: { [key: string]: string } = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    VND: 'vi-VN',
};

const createDefaultInvoice = (): Invoice => ({
    invoiceNumber: 'INV-001',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    from: { name: 'Your Company', address: '123 Your Street, Your City', email: 'your.email@example.com' },
    to: { name: 'Client Company', address: '456 Client Avenue, Client City', email: 'client.email@example.com' },
    items: [{ id: crypto.randomUUID(), description: 'Web Development Service', quantity: 10, price: 100 }],
    notes: 'Thank you for your business. Please pay within 30 days.',
    taxRate: 5,
    currency: 'EUR',
});


const InvoiceForm: React.FC = () => {
    const [invoice, setInvoice] = useState<Invoice>(createDefaultInvoice());
    const [savedInvoices, setSavedInvoices] = useState<Invoice[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
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

    const handleSaveInvoice = async () => {
        setIsSaving(true);
        setMessage(null);
        
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setMessage({ type: 'error', text: 'You must be logged in to save.' });
            setIsSaving(false);
            return;
        }

        const invoiceToSave = { ...invoice, id: invoice.id || crypto.randomUUID() };

        const { error } = await supabase.from('invoices').upsert({
            id: invoiceToSave.id,
            user_id: user.id,
            invoice_data: invoiceToSave
        });

        if (error) {
            console.error('Error saving invoice:', error);
            setMessage({ type: 'error', text: 'Failed to save invoice. Please try again.' });
        } else {
            setMessage({ type: 'success', text: `Invoice ${invoiceToSave.invoiceNumber} saved!` });
            setInvoice(invoiceToSave);
            await fetchInvoices();
        }
        setIsSaving(false);
        setTimeout(() => setMessage(null), 3000);
    };

    const handleDeleteInvoice = async (invoiceId: string) => {
        setIsDeleting(true);
        setMessage(null);
        const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
        
        if (error) {
            setMessage({ type: 'error', text: 'Failed to delete invoice.' });
        } else {
            setMessage({ type: 'success', text: 'Invoice deleted.' });
            if (invoice.id === invoiceId) {
                setInvoice(createDefaultInvoice());
            }
            await fetchInvoices();
        }
        setIsDeleting(false);
        setTimeout(() => setMessage(null), 3000);
    };
    
    const handleSelectInvoice = (selectedInvoice: Invoice) => {
        setInvoice(selectedInvoice);
    };

    const handleNewInvoice = () => {
        setInvoice(createDefaultInvoice());
    };

    const handleInputChange = useCallback((section: keyof Invoice | null, field: string, value: string | number) => {
        if (section) {
            setInvoice(prev => ({
                ...prev,
                [section]: {
                    ...(prev[section] as object),
                    [field]: value,
                }
            }));
        } else {
             setInvoice(prev => ({ ...prev, [field]: value }));
        }
    }, []);
    
    const handleLineItemChange = useCallback((id: string, field: keyof Omit<LineItem, 'id'>, value: string | number) => {
        setInvoice(prev => ({
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, [field]: value } : item),
        }));
    }, []);

    const addLineItem = useCallback(() => {
        setInvoice(prev => ({
            ...prev,
            items: [...prev.items, { id: crypto.randomUUID(), description: '', quantity: 1, price: 0 }],
        }));
    }, []);

    const removeLineItem = useCallback((id: string) => {
        setInvoice(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id),
        }));
    }, []);

    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const taxAmount = (subtotal * invoice.taxRate) / 100;
    const total = subtotal + taxAmount;

    const formatCurrency = (amount: number) => {
        const locale = currencyLocaleMap[invoice.currency] || 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: invoice.currency }).format(amount);
    };

    const downloadPdf = async () => {
        const invoicePreview = document.getElementById('invoice-preview');
        if (!invoicePreview || !jsPDF || !html2canvas) {
            alert('PDF generation library not found.');
            return;
        }
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(invoicePreview, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#111827' : '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);

        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("An error occurred while generating the PDF.");
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
             {message && (
                <div className={`mb-4 p-4 rounded-md text-center ${message.type === 'success' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200'}`} role="alert">
                    {message.text}
                </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3">
                    {isLoading ? <div className="text-center p-8">Loading invoices...</div> :
                     <InvoiceList
                        invoices={savedInvoices}
                        activeInvoiceId={invoice.id}
                        onSelectInvoice={handleSelectInvoice}
                        onNewInvoice={handleNewInvoice}
                        onDeleteInvoice={handleDeleteInvoice}
                        isDeleting={isDeleting}
                     />
                    }
                </div>
                <div className="lg:col-span-9">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Form Section */}
                        <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                             <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold">Invoice Details</h2>
                                <button
                                    onClick={handleSaveInvoice}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? 'Saving...' : (invoice.id ? 'Update Invoice' : 'Save Invoice')}
                                </button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <h3 className="font-bold mb-2 text-lg">From</h3>
                                    <div className="space-y-3">
                                        <InvoiceField label="Name" id="from.name" value={invoice.from.name} onChange={e => handleInputChange('from', 'name', e.target.value)} />
                                        <InvoiceField label="Address" id="from.address" value={invoice.from.address} onChange={e => handleInputChange('from', 'address', e.target.value)} isTextArea/>
                                        <InvoiceField label="Email" id="from.email" type="email" value={invoice.from.email} onChange={e => handleInputChange('from', 'email', e.target.value)} />
                                    </div>
                                </div>
                                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <h3 className="font-bold mb-2 text-lg">To</h3>
                                     <div className="space-y-3">
                                        <InvoiceField label="Name" id="to.name" value={invoice.to.name} onChange={e => handleInputChange('to', 'name', e.target.value)} />
                                        <InvoiceField label="Address" id="to.address" value={invoice.to.address} onChange={e => handleInputChange('to', 'address', e.target.value)} isTextArea/>
                                        <InvoiceField label="Email" id="to.email" type="email" value={invoice.to.email} onChange={e => handleInputChange('to', 'email', e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <InvoiceField label="Invoice Number" id="invoiceNumber" value={invoice.invoiceNumber} onChange={e => handleInputChange(null, 'invoiceNumber', e.target.value)} />
                                <InvoiceField label="Date" id="date" type="date" value={invoice.date} onChange={e => handleInputChange(null, 'date', e.target.value)} />
                                <InvoiceField label="Due Date" id="dueDate" type="date" value={invoice.dueDate} onChange={e => handleInputChange(null, 'dueDate', e.target.value)} />
                            </div>

                            {/* Line Items */}
                            <div>
                                <h3 className="font-bold text-lg mb-2">Items</h3>
                                <div className="space-y-4">
                                    {invoice.items.map((item, index) => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                                            <div className="col-span-12 sm:col-span-5">
                                                <InvoiceField label={`Description ${index+1}`} id={`item-desc-${item.id}`} value={item.description} onChange={e => handleLineItemChange(item.id, 'description', e.target.value)} />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <InvoiceField label="Qty" id={`item-qty-${item.id}`} type="number" value={item.quantity} onChange={e => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2">
                                                <InvoiceField label="Price" id={`item-price-${item.id}`} type="number" value={item.price} onChange={e => handleLineItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} />
                                            </div>
                                            <div className="col-span-4 sm:col-span-2 text-right self-end pb-2">
                                                <p className="text-sm font-medium">{formatCurrency(item.quantity * item.price)}</p>
                                            </div>
                                            <div className="col-span-12 sm:col-span-1 flex justify-end items-end pb-1">
                                                 <button onClick={() => removeLineItem(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button onClick={addLineItem} className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                   <PlusIcon className="w-5 h-5"/> Add Item
                                </button>
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                                <InvoiceField label="Notes" id="notes" value={invoice.notes} onChange={e => handleInputChange(null, 'notes', e.target.value)} isTextArea/>
                                <div className="grid grid-cols-2 gap-4">
                                    <InvoiceField label="Tax Rate (%)" id="taxRate" type="number" value={invoice.taxRate} onChange={e => handleInputChange(null, 'taxRate', parseFloat(e.target.value) || 0)} />
                                    <div>
                                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Currency
                                        </label>
                                        <select
                                            id="currency"
                                            name="currency"
                                            value={invoice.currency}
                                            onChange={e => handleInputChange(null, 'currency', e.target.value)}
                                            className="mt-1 block w-full rounded-md bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                        >
                                            {currencyOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                     </div>
                                </div>
                            </div>
                        </div>

                        {/* Preview Section */}
                        <div className="relative">
                           <div className="sticky top-8">
                                <div id="invoice-preview" className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg">
                                     <header className="flex justify-between items-start mb-8">
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-800 dark:text-white">INVOICE</h2>
                                            <p className="text-gray-500 dark:text-gray-400"># {invoice.invoiceNumber}</p>
                                        </div>
                                        <div className="text-right">
                                            <h3 className="font-bold text-lg">{invoice.from.name}</h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.from.address.split(',').map((line, i) => <span key={i}>{line.trim()}<br/></span>)}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.from.email}</p>
                                        </div>
                                    </header>

                                     <section className="flex justify-between mb-8">
                                        <div>
                                            <h4 className="font-bold text-gray-500 dark:text-gray-400 mb-1">BILL TO</h4>
                                            <p className="font-bold">{invoice.to.name}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.to.address.split(',').map((line, i) => <span key={i}>{line.trim()}<br/></span>)}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.to.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <p><span className="font-bold text-gray-500 dark:text-gray-400">Date:</span> {invoice.date}</p>
                                            <p><span className="font-bold text-gray-500 dark:text-gray-400">Due Date:</span> {invoice.dueDate}</p>
                                        </div>
                                    </section>

                                    <table className="w-full mb-8">
                                        <thead className="bg-gray-100 dark:bg-gray-700">
                                            <tr>
                                                <th className="text-left p-2 font-bold">Item</th>
                                                <th className="text-center p-2 font-bold">Qty</th>
                                                <th className="text-right p-2 font-bold">Price</th>
                                                <th className="text-right p-2 font-bold">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {invoice.items.map(item => (
                                                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                                                    <td className="p-2">{item.description}</td>
                                                    <td className="p-2 text-center">{item.quantity}</td>
                                                    <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                                                    <td className="p-2 text-right">{formatCurrency(item.quantity * item.price)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                     <div className="flex justify-end mb-8">
                                        <div className="w-full max-w-xs space-y-2">
                                            <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                                            <div className="flex justify-between"><span>Tax ({invoice.taxRate}%):</span><span>{formatCurrency(taxAmount)}</span></div>
                                            <div className="flex justify-between font-bold text-xl border-t-2 pt-2 border-gray-800 dark:border-gray-200"><span>Total:</span><span>{formatCurrency(total)}</span></div>
                                        </div>
                                    </div>
                                    
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.notes}</p>
                                </div>
                                <button onClick={downloadPdf} disabled={isGenerating} className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    {isGenerating ? 'Generating...' : <><DownloadIcon className="w-5 h-5"/> Download PDF</>}
                                </button>
                           </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;
