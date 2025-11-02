
import React, { useState, useEffect } from 'react';
import InvoiceForm from './components/InvoiceForm';
import ThemeToggle from './components/ThemeToggle';
import { GithubIcon, SignOutIcon } from './components/Icons';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';

const App: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
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
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Invoice Generator</h1>
            <div className="flex items-center space-x-4">
              {session && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 hidden sm:block" aria-live="polite">
                    Signed in as <span className="font-semibold">{session.user.email}</span>
                  </p>
              )}
              <a 
                href="https://github.com/your-repo/invoice-generator" // Replace with your actual repo link
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                aria-label="GitHub Repository"
              >
                <GithubIcon className="w-6 h-6" />
              </a>
              <ThemeToggle theme={theme} toggleTheme={toggleTheme} />
              {session && (
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Sign out"
                >
                  <SignOutIcon className="w-6 h-6" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      <main>
        {loading ? (
            <div className="text-center p-8">Loading...</div>
        ) : session ? (
            <InvoiceForm key={session.user.id} />
        ) : (
            <Auth />
        )}
      </main>
      <footer className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
        <p>Author:HoangPham</p>
      </footer>
    </div>
  );
};

export default App;