
import React, { useState, useEffect, useCallback } from 'react';
import InvoiceForm from './components/InvoiceForm';
import ThemeToggle from './components/ThemeToggle';
import { SignOutIcon, InvoicesIcon, UserIcon, UserPlusIcon } from './components/Icons';
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [initialAuthMode, setInitialAuthMode] = useState<'signin' | 'signup'>('signin');
  
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
        setShowAuthModal(false);
        setShowUpdatePassword(true);
      } else if (_event === 'SIGNED_IN') {
        setShowAuthModal(false);
        setView('list'); // Redirect to list view after signing in
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

  const handleAuthRequest = (mode: 'signin' | 'signup') => {
    setInitialAuthMode(mode);
    setShowAuthModal(true);
  };


  const renderContent = () => {
    if (loading) {
      return <div className="text-center p-8">{t('loading')}</div>;
    }
    
    if (view === 'list' && session) {
      return <InvoiceListPage onSelectInvoice={handleSelectInvoice} onNewInvoice={handleNewInvoice} />;
    }
    
    // Default view is the form
    return <InvoiceForm 
              key={activeInvoice.id || 'new-invoice'} 
              invoiceData={activeInvoice}
              session={session}
              onSaveSuccess={handleBackToList}
              onBack={handleBackToList}
              onRequestAuth={handleAuthRequest}
            />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="bg-[#2b2b29] shadow-2xl border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-white">{t('invoiceGenerator')}</h1>
            <div className="flex items-center space-x-2 sm:space-x-4">
              {session ? (
                <>
                  <p className="text-sm text-white hidden sm:block" aria-live="polite">
                    {t('signedInAs')} <span className="font-semibold">{session.user.email}</span>
                  </p>
                  <button
                    onClick={() => setView('list')}
                    className="p-2 rounded-full text-white hover:bg-white/20 focus:outline-none"
                    aria-label={t('myInvoices')}
                  >
                    <InvoicesIcon className="w-6 h-6" />
                  </button>
                </>
              ) : null}

              <LanguageSwitcher />
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />

              {session ? (
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-white hover:bg-white/20 focus:outline-none"
                  aria-label={t('signOut')}
                >
                  <SignOutIcon className="w-6 h-6" />
                </button>
              ) : (
                <>
                  <div className="relative group flex items-center">
                    <button
                        onClick={() => {
                            setInitialAuthMode('signup');
                            setShowAuthModal(true);
                        }}
                        className="p-2 rounded-full text-white hover:bg-white/20 focus:outline-none"
                        aria-label={t('signUpTooltip')}
                    >
                        <UserPlusIcon className="w-6 h-6" />
                    </button>
                    <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-auto min-w-max whitespace-nowrap rounded-md bg-gray-900 dark:bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                        {t('signUpTooltip')}
                    </span>
                  </div>
                  <div className="relative group flex items-center">
                    <button
                        onClick={() => {
                            setInitialAuthMode('signin');
                            setShowAuthModal(true);
                        }}
                        className="p-2 rounded-full text-white hover:bg-white/20 focus:outline-none"
                        aria-label={t('signInTooltip')}
                    >
                        <UserIcon className="w-6 h-6" />
                    </button>
                     <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-auto min-w-max whitespace-nowrap rounded-md bg-gray-900 dark:bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none">
                        {t('signInTooltip')}
                    </span>
                  </div>
                </>
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
      
      {/* Auth Modal */}
      {showAuthModal && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center p-4"
          onClick={() => setShowAuthModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div onClick={e => e.stopPropagation()}>
            <Auth initialMode={initialAuthMode} />
          </div>
        </div>
      )}

      {/* Update Password Modal */}
      {showUpdatePassword && (
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50 flex justify-center items-center p-4"
          onClick={() => setShowUpdatePassword(false)}
          role="dialog"
          aria-modal="true"
        >
          <div onClick={e => e.stopPropagation()}>
            <UpdatePassword onPasswordUpdated={() => setShowUpdatePassword(false)} />
          </div>
        </div>
      )}

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
