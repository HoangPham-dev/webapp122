
import React, { useState, useEffect, useCallback } from 'react';
import InvoiceForm from './components/InvoiceForm';
import ThemeToggle from './components/ThemeToggle';
import { SignOutIcon, InvoicesIcon } from './components/Icons';
import Auth from './components/Auth';
import UpdatePassword from './components/UpdatePassword';
import InvoiceListPage from './components/InvoiceListPage';
import LanguageSwitcher from './components/LanguageSwitcher';
import { supabase } from './lib/supabase';
import { Invoice } from './types';
import { LanguageProvider, useTranslation } from './lib/i18n';


const createDefaultInvoice = (): Invoice => ({
    invoiceNumber: 'INV-001',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0],
    from: { name: 'Your Company', address: '123 Your Street, Your City', email: 'your.email@example.com', logo: undefined, logoWidth: 150 },
    to: { name: 'Client Company', address: '456 Client Avenue, Client City', email: 'client.email@example.com' },
    items: [],
    notes: 'Thank you for your business. Please pay within 30 days.',
    taxRate: 5,
    currency: 'EUR',
});


const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showUpdatePassword, setShowUpdatePassword] = useState(false);
  
  const [view, setView] = useState<'form' | 'list'>('form');
  const [activeInvoice, setActiveInvoice] = useState<Invoice>(createDefaultInvoice());

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setShowUpdatePassword(true);
      }
      setSession(session);
      if (_event === 'SIGNED_OUT') {
        setView('form');
        setActiveInvoice(createDefaultInvoice());
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const handleSignOut = async () => {
    setShowUpdatePassword(false);
    await supabase.auth.signOut();
  };
  
  const handleSelectInvoice = useCallback((invoice: Invoice) => {
    setActiveInvoice(invoice);
    setView('form');
  }, []);

  const handleNewInvoice = useCallback(() => {
    setActiveInvoice(createDefaultInvoice());
    setView('form');
  }, []);

  const handleBackToList = useCallback(() => {
    setView('list');
  }, []);


  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8">{t('loading')}</div>;
    }
    if (showUpdatePassword) {
      return <UpdatePassword onPasswordUpdated={() => setShowUpdatePassword(false)} />;
    }
    if (!session) {
      return <Auth />;
    }

    if (view === 'list') {
      return <InvoiceListPage onSelectInvoice={handleSelectInvoice} onNewInvoice={handleNewInvoice} />;
    }
    
    return <InvoiceForm 
              key={activeInvoice.id || 'new-invoice'} 
              invoiceData={activeInvoice} 
              onSaveSuccess={handleBackToList}
              onBack={handleBackToList}
            />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="bg-[#2b2b29] shadow-2xl border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white">{t('invoiceGenerator')}</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {session && (
                  <p className="text-sm text-white hidden sm:block" aria-live="polite">
                    {t('signedInAs')} <span className="font-semibold">{session.user.email}</span>
                  </p>
              )}
              
              {session && (
                 <button
                    onClick={() => setView('list')}
                    className="p-2 rounded-full text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2b2b29] focus:ring-white"
                    aria-label={t('myInvoices')}
                  >
                    <InvoicesIcon className="w-6 h-6" />
                  </button>
              )}
              <LanguageSwitcher />
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              {session && (
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#2b2b29] focus:ring-white"
                  aria-label={t('signOut')}
                >
                  <SignOutIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>
        {renderContent()}
      </main>
      <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        <p>{t('author')}</p>
      </footer>
    </div>
  );
};


const App: React.FC = () => {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    )
}

export default App;
