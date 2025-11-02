import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Auth: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleAuthAction = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (isForgotPassword) {
                // To implement this feature, you need to create a PostgreSQL function in your Supabase project.
                // Go to the SQL Editor in your Supabase dashboard and run the following query:
                /*
                    create or replace function user_exists(email_to_check text)
                    returns boolean
                    language plpgsql
                    security definer
                    as $$
                    begin
                      return exists (
                        select 1
                        from auth.users
                        where email = email_to_check
                      );
                    end;
                    $$;
                */
                const { data: userExists, error: rpcError } = await supabase.rpc('user_exists', {
                    email_to_check: email,
                });

                if (rpcError) {
                    console.error("Error calling RPC 'user_exists':", rpcError);
                    if (rpcError.message.includes("function user_exists")) {
                         console.error("Hint: The 'user_exists' function is missing or has incorrect parameters. Please create it in the Supabase SQL Editor as per the comment in Auth.tsx.");
                    }
                    // For security, present a generic error to the user
                    throw new Error("An error occurred. Please try again.");
                }

                if (userExists) {
                    const { error } = await supabase.auth.resetPasswordForEmail(email);
                    if (error) throw error;
                    setMessage('Check your email for the password reset link!');
                } else {
                    setError('Email is not registered.');
                }
            } else if (isSignUp) {
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match.");
                }

                // Let Supabase handle the check for existing users.
                // It will return a specific error if the email is already registered,
                // which will be caught and displayed by the catch block.
                const { error } = await supabase.auth.signUp({ email, password });
                
                if (error) {
                    throw error;
                }

                setMessage('Check your email for the confirmation link!');

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
        if (isForgotPassword) return 'Reset your password';
        return isSignUp ? 'Create a new account' : 'Sign in to your account';
    };

    const getDescription = () => {
        if (isForgotPassword) return 'Enter your email to receive a reset link';
        return 'To access the Invoice Generator';
    };
    
    const getButtonText = () => {
        if (loading) return 'Processing...';
        if (isForgotPassword) return 'Send Reset Link';
        return isSignUp ? 'Sign Up' : 'Sign In';
    };

    return (
        <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {getTitle()}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {getDescription()}
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleAuthAction}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        {!isForgotPassword && (
                            <div>
                                <label htmlFor="password" className="sr-only">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete={isSignUp ? "new-password" : "current-password"}
                                    required
                                    minLength={6}
                                    className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        )}
                         {isSignUp && (
                            <div>
                                <label htmlFor="confirm-password" className="sr-only">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirm-password"
                                    name="confirm-password"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    className="relative block w-full appearance-none rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white placeholder-gray-500 focus:z-10 focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
                                    placeholder="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
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
                                    className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 focus:outline-none"
                                >
                                    Forgot your password?
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
                            className="group relative flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-indigo-400 disabled:cursor-not-allowed"
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
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                        {isForgotPassword ? 'Back to Sign In' : (isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up")}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Auth;