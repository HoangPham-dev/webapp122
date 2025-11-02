
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useTranslation } from '../lib/i18n';
import { EyeIcon, EyeOffIcon } from './Icons';

interface AuthProps {
    initialMode?: 'signin' | 'signup';
}

const Auth: React.FC<AuthProps> = ({ initialMode = 'signin' }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        setIsSignUp(initialMode === 'signup');
        // Reset fields when mode changes to provide a clean slate
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setError(null);
        setMessage(null);
    }, [initialMode]);

    const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isForgotPassword) {
                // Supabase's resetPasswordForEmail does not throw an error for non-existent emails for security reasons.
                // It will succeed and the user is told to check their email, preventing email enumeration attacks.
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                setMessage(t('checkEmailReset'));
            } else if (isSignUp) {
                if (password !== confirmPassword) {
                    throw new Error(t('passwordsDoNotMatch'));
                }

                const { data, error } = await supabase.auth.signUp({ email, password });
                
                if (error) {
                    throw error;
                }

                // To prevent email enumeration, Supabase signUp doesn't error if the user already exists.
                // Instead, it returns a user object. For a confirmed existing user, the `identities` array is empty.
                // For a new user, it contains the new identity.
                if (data.user && data.user.identities && data.user.identities.length === 0) {
                     setError(t('emailAlreadyRegistered'));
                } else {
                    // This message is appropriate for both new users and existing but unconfirmed users.
                    setMessage(t('checkEmailConfirm'));
                }

            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            }
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setLoading(false);
        }
    };
    
    const resetFormState = () => {
        setError(null);
        setMessage(null);
        setConfirmPassword('');
    }

    const getTitle = () => {
        if (isForgotPassword) return t('resetPasswordTitle');
        return isSignUp ? t('createAccountTitle') : t('signInTitle');
    };
    
    const getButtonText = () => {
        if (loading) return t('processing');
        if (isForgotPassword) return t('sendResetLink');
        return isSignUp ? t('signUp') : t('signIn');
    };

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {getTitle()}
                    </h2>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                {t('emailAddress')}
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                placeholder={t('emailAddress')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {!isForgotPassword && (
                            <div className="relative">
                                <label htmlFor="password" className="sr-only">
                                    {t('password')}
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete={isSignUp ? "new-password" : "current-password"}
                                    required
                                    minLength={6}
                                    className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                    placeholder={t('password')}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 z-20 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    aria-label={showPassword ? t('hidePassword') : t('showPassword')}
                                >
                                    {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        )}
                         {isSignUp && (
                            <div className="relative">
                                <label htmlFor="confirm-password" className="sr-only">
                                    {t('confirmPassword')}
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                    placeholder={t('confirmPassword')}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                                 <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 z-20 flex items-center pr-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                                    aria-label={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                                >
                                    {showConfirmPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                                </button>
                            </div>
                        )}
                    </div>

                    {!isSignUp && !isForgotPassword && (
                        <div className="flex items-center justify-end">
                            <div className="text-sm">
                                <button
                                    onClick={() => {
                                        setIsForgotPassword(true);
                                        resetFormState();
                                    }}
                                    type="button"
                                    className="font-medium text-[#e96e2f] hover:text-[#d3642a] dark:text-[#e96e2f] dark:hover:text-[#f08a54] focus:outline-none"
                                >
                                    {t('forgotPassword')}
                                </button>
                            </div>
                        </div>
                    )}


                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    {message && <p className="text-sm text-green-500 text-center">{message}</p>}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-[#eb6f2f] py-2 px-4 text-sm font-medium text-white hover:bg-[#d46429] focus:outline-none focus:ring-2 focus:ring-[#eb6f2f] focus:ring-offset-2 disabled:bg-[#eb6f2f]/50 disabled:cursor-not-allowed"
                        >
                            {getButtonText()}
                        </button>
                    </div>
                </form>
                <div className="text-center">
                    <button
                        onClick={() => {
                            if (isForgotPassword) {
                                setIsForgotPassword(false);
                                setIsSignUp(false);
                            } else {
                                setIsSignUp(!isSignUp);
                            }
                            resetFormState();
                        }}
                        className="text-sm font-medium text-[#e96e2f] hover:text-[#d3642a] dark:text-[#e96e2f] dark:hover:text-[#f08a54]"
                    >
                        {isForgotPassword ? t('backToSignIn') : (isSignUp ? t('alreadyHaveAccount') : t('dontHaveAccount'))}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;
