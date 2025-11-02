import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Invoice, LineItem } from '../types';
import InvoiceField from './InvoiceField';
import { TrashIcon, PlusIcon, DownloadIcon } from './Icons';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { Session } from '@supabase/supabase-js';


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

interface InvoiceFormProps {
    invoiceData: Invoice;
    session: Session | null;
    onSaveSuccess: () => void;
    onBack: () => void;
    onRequestAuth: (mode: 'signin' | 'signup') => void;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ invoiceData, session, onSaveSuccess, onBack, onRequestAuth }) => {
    const { t, language } = useTranslation();
    const [invoice, setInvoice] = useState<Invoice>(invoiceData);
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    
    useEffect(() => {
        setInvoice(invoiceData);
    }, [invoiceData]);


    const handleSaveInvoice = async () => {
        setIsSaving(true);
        setMessage(null);
        
        if (!session?.user) {
            setMessage({ type: 'error', text: t('mustBeLoggedInToSave') });
            setIsSaving(false);
            return;
        }

        const invoiceToSave = { ...invoice, id: invoice.id || crypto.randomUUID() };

        const { error } = await supabase.from('invoices').upsert({
            id: invoiceToSave.id,
            user_id: session.user.id,
            invoice_data: invoiceToSave
        });

        if (error) {
            console.error('Error saving invoice:', error);
            setMessage({ type: 'error', text: t('failedToSaveInvoice') });
            setTimeout(() => setMessage(null), 3000);
        } else {
            setMessage({ type: 'success', text: t('invoiceSavedSuccess', {invoiceNumber: invoiceToSave.invoiceNumber}) });
            setTimeout(() => {
                setMessage(null);
                onSaveSuccess();
            }, 1500);
        }
        setIsSaving(false);
    };
    
    const handleInputChange = useCallback((section: keyof Invoice | null, field: string, value: any) => {
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
    
    const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB limit
                alert(t('logoSizeError'));
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                handleInputChange('from', 'logo', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, [handleInputChange, t]);


    const subtotal = invoice.items.reduce((acc, item) => acc + item.quantity * item.price, 0);
    const taxAmount = (subtotal * invoice.taxRate) / 100;
    const total = subtotal + taxAmount;

    const formatCurrency = (amount: number) => {
        const locale = { 'en': 'en-US', 'vi': 'vi-VN', 'nl': 'nl-NL' }[language] || 'en-US';
        return new Intl.NumberFormat(locale, { style: 'currency', currency: invoice.currency }).format(amount);
    };

    const downloadPdf = async () => {
        const invoicePreview = document.getElementById('invoice-preview');
        if (!invoicePreview || !jsPDF || !html2canvas) {
            alert(t('pdfLibraryNotFound'));
            return;
        }
        setIsGenerating(true);
        try {
            const canvas = await html2canvas(invoicePreview, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff' // Updated dark bg
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
            alert(t('pdfGenerationError'));
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Form Section */}
                <div className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                     <div className="flex flex-wrap items-center justify-between gap-4">
                        <h2 className="text-xl font-bold">
                          {invoice.id ? t('editingInvoice', {invoiceNumber: invoice.invoiceNumber}) : t('newInvoice')}
                        </h2>
                        <div className="flex items-center gap-2">
                           {invoiceData.id && (
                             <button
                                onClick={onBack}
                                className="px-4 py-2 bg-gray-600 text-white font-semibold rounded-md hover:bg-gray-700"
                              >
                                {t('backToList')}
                              </button>
                           )}
                            <button
                                onClick={handleSaveInvoice}
                                disabled={isSaving || !session}
                                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
                            >
                                {isSaving ? t('saving') : (invoice.id ? t('updateInvoice') : t('saveInvoice'))}
                            </button>
                        </div>
                    </div>
                     {!session && (
                        <p className="text-sm text-center text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 p-3 rounded-md">
                            <button onClick={() => onRequestAuth('signin')} className="font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none">{t('signInToSaveActionSignIn')}</button>
                            {t('signInToSaveOr')}
                            <button onClick={() => onRequestAuth('signup')} className="font-medium text-blue-600 dark:text-blue-400 hover:underline focus:outline-none">{t('signInToSaveActionCreate')}</button>
                            {t('signInToSaveSuffix')}
                        </p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <h3 className="font-bold mb-2 text-lg">{t('from')}</h3>
                            <div className="space-y-3">
                                <InvoiceField label={t('name')} id="from.name" value={invoice.from.name} onChange={e => handleInputChange('from', 'name', e.target.value)} />
                                <InvoiceField label={t('address')} id="from.address" value={invoice.from.address} onChange={e => handleInputChange('from', 'address', e.target.value)} isTextArea/>
                                <InvoiceField label={t('email')} id="from.email" type="email" value={invoice.from.email} onChange={e => handleInputChange('from', 'email', e.target.value)} />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('logo')}</label>
                                    <input type="file" accept="image/png, image/jpeg" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" />
                                    <div className="mt-1 flex items-center gap-4">
                                        <button onClick={() => logoInputRef.current?.click()} className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">{t('uploadLogo')}</button>
                                        {invoice.from.logo && <button onClick={() => handleInputChange('from', 'logo', undefined)} className="text-sm text-red-600 dark:text-red-400 hover:underline">{t('removeLogo')}</button>}
                                    </div>
                                    {invoice.from.logo && <img src={invoice.from.logo} alt="logo preview" className="mt-2 w-24 h-auto object-contain rounded-md border border-gray-200 dark:border-gray-700"/>}
                                    {invoice.from.logo && (
                                        <div className="mt-2">
                                            <label htmlFor="logoWidth" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('logoSize')} ({invoice.from.logoWidth}px)</label>
                                            <input
                                                id="logoWidth"
                                                type="range"
                                                min="50"
                                                max="300"
                                                value={invoice.from.logoWidth || 150}
                                                onChange={e => handleInputChange('from', 'logoWidth', parseInt(e.target.value, 10))}
                                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-600"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                            <h3 className="font-bold mb-2 text-lg">{t('to')}</h3>
                             <div className="space-y-3">
                                <InvoiceField label={t('name')} id="to.name" value={invoice.to.name} onChange={e => handleInputChange('to', 'name', e.target.value)} />
                                <InvoiceField label={t('address')} id="to.address" value={invoice.to.address} onChange={e => handleInputChange('to', 'address', e.target.value)} isTextArea/>
                                <InvoiceField label={t('email')} id="to.email" type="email" value={invoice.to.email} onChange={e => handleInputChange('to', 'email', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <InvoiceField label={t('invoiceNumber')} id="invoiceNumber" value={invoice.invoiceNumber} onChange={e => handleInputChange(null, 'invoiceNumber', e.target.value)} />
                        <InvoiceField label={t('date')} id="date" type="date" value={invoice.date} onChange={e => handleInputChange(null, 'date', e.target.value)} />
                        <InvoiceField label={t('dueDate')} id="dueDate" type="date" value={invoice.dueDate} onChange={e => handleInputChange(null, 'dueDate', e.target.value)} />
                    </div>

                    {/* Line Items */}
                    <div>
                        <h3 className="font-bold text-lg mb-2">{t('items')}</h3>
                        <div className="space-y-4">
                            {invoice.items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <div className="col-span-12 sm:col-span-5">
                                        <InvoiceField label={`${t('description')} ${index+1}`} id={`item-desc-${item.id}`} value={item.description} onChange={e => handleLineItemChange(item.id, 'description', e.target.value)} />
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <InvoiceField label={t('quantityShort')} id={`item-qty-${item.id}`} type="number" value={item.quantity} onChange={e => handleLineItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div className="col-span-4 sm:col-span-2">
                                        <InvoiceField label={t('price')} id={`item-price-${item.id}`} type="number" value={item.price} onChange={e => handleLineItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} />
                                    </div>
                                    <div className="col-span-4 sm:col-span-2 text-right self-end pb-2">
                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatCurrency(item.quantity * item.price)}</p>
                                    </div>
                                    <div className="col-span-12 sm:col-span-1 flex justify-end items-end pb-1">
                                         <button onClick={() => removeLineItem(item.id)} className="text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={addLineItem} className="mt-4 flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                           <PlusIcon className="w-5 h-5"/> {t('addItem')}
                        </button>
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <InvoiceField label={t('notes')} id="notes" value={invoice.notes} onChange={e => handleInputChange(null, 'notes', e.target.value)} isTextArea/>
                        <div className="grid grid-cols-2 gap-4">
                            <InvoiceField label={t('taxRate')} id="taxRate" type="number" value={invoice.taxRate} onChange={e => handleInputChange(null, 'taxRate', parseFloat(e.target.value) || 0)} />
                            <div>
                                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {t('currency')}
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
                <div className="relative" id="invoice-preview-wrapper">
                   <div className="sticky top-8 max-h-[calc(100vh-4rem)] flex flex-col">
                        <h2 className="text-xl font-bold mb-4 flex-shrink-0">{t('previewInvoice')}</h2>
                        <div id="invoice-preview" className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg overflow-y-auto flex-grow text-gray-900 dark:text-gray-100">
                             <header className="flex justify-between items-start mb-8">
                                <div className="flex-1">
                                    {invoice.from.logo ? (
                                        <>
                                            <img
                                                src={invoice.from.logo}
                                                alt="Company Logo"
                                                className="object-contain mb-4"
                                                style={{ width: `${invoice.from.logoWidth || 150}px`, height: 'auto' }}
                                            />
                                            <h3 className="font-bold text-lg">{invoice.from.name}</h3>
                                        </>
                                    ) : (
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{invoice.from.name}</h2>
                                    )}
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.from.address.split(',').map((line, i) => <span key={i}>{line.trim()}<br/></span>)}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.from.email}</p>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('invoiceTitle')}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2"># {invoice.invoiceNumber}</p>
                                </div>
                            </header>

                             <section className="flex justify-between mb-8">
                                <div>
                                    <h4 className="font-bold text-gray-500 dark:text-gray-400 mb-1">{t('billTo')}</h4>
                                    <p className="font-bold">{invoice.to.name}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.to.address.split(',').map((line, i) => <span key={i}>{line.trim()}<br/></span>)}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300">{invoice.to.email}</p>
                                </div>
                                <div className="text-right">
                                    <p><span className="font-bold text-gray-500 dark:text-gray-400">{t('date')}:</span> {invoice.date}</p>
                                    <p><span className="font-bold text-gray-500 dark:text-gray-400">{t('dueDate')}:</span> {invoice.dueDate}</p>
                                </div>
                            </section>

                            <table className="w-full mb-8">
                                <thead>
                                    <tr className="border-b-2 border-gray-800 dark:border-gray-200">
                                        <th className="text-left p-2 font-bold text-gray-900 dark:text-white">{t('item')}</th>
                                        <th className="text-center p-2 font-bold text-gray-900 dark:text-white">{t('quantityShort')}</th>
                                        <th className="text-right p-2 font-bold text-gray-900 dark:text-white">{t('price')}</th>
                                        <th className="text-right p-2 font-bold text-gray-900 dark:text-white">{t('total')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {invoice.items.map(item => (
                                        <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100">
                                            <td className="p-2">{item.description}</td>
                                            <td className="p-2 text-center">{item.quantity}</td>
                                            <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                                            <td className="p-2 text-right">{formatCurrency(item.quantity * item.price)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                             <div className="flex justify-end mb-8">
                                <div className="w-full max-w-xs space-y-2 text-gray-900 dark:text-gray-100">
                                    <div className="flex justify-between"><span>{t('subtotal')}:</span><span>{formatCurrency(subtotal)}</span></div>
                                    <div className="flex justify-between"><span>{t('tax')} ({invoice.taxRate}%):</span><span>{formatCurrency(taxAmount)}</span></div>
                                    <div className="flex justify-between font-bold text-xl border-t-2 pt-2 border-gray-800 dark:border-gray-200"><span>{t('total')}:</span><span>{formatCurrency(total)}</span></div>
                                </div>
                            </div>
                            
                            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.notes}</p>
                        </div>
                        <div id="print-download-buttons" className="mt-6 flex-shrink-0">
                            <button 
                                onClick={downloadPdf} 
                                disabled={isGenerating} 
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                                {isGenerating ? t('generating') : <><DownloadIcon className="w-5 h-5"/> {t('downloadPdf')}</>}
                            </button>
                        </div>
                   </div>
                </div>
            </div>
        </div>
    );
};

export default InvoiceForm;