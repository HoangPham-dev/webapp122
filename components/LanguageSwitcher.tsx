import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../lib/i18n';
import { GlobeIcon } from './Icons';

const languages = {
    en: 'English',
    vi: 'Tiếng Việt',
    nl: 'Nederlands',
};

const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);
    
    const handleLanguageChange = (lang: 'en' | 'vi' | 'nl') => {
        setLanguage(lang);
        setIsOpen(false);
    }

    return (
        <div className="relative" ref={wrapperRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-900 focus:ring-indigo-500"
                aria-label="Change language"
                aria-haspopup="true"
                aria-expanded={isOpen}
            >
                <GlobeIcon className="w-6 h-6" />
            </button>
            {isOpen && (
                <div 
                  className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="language-menu-button"
                >
                    {Object.entries(languages).map(([code, name]) => (
                         <button
                            key={code}
                            onClick={() => handleLanguageChange(code as 'en' | 'vi' | 'nl')}
                            className={`w-full text-left block px-4 py-2 text-sm ${language === code ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-gray-700`}
                            role="menuitem"
                        >
                            {name}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LanguageSwitcher;
