// This file configures the Supabase client.
// The Supabase library is loaded from a CDN in `index.html`.
// @ts-nocheck

const { createClient } = window.supabase;

// --- IMPORTANT ---
// 1. Create a new project on https://supabase.com/dashboard.
// 2. Go to the API settings for your project.
// 3. Find your Project URL and anon key and update them here.

const supabaseUrl = 'https://xsflrefczbofwlqvaklu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzZmxyZWZjemJvZndscXZha2x1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIwMzY0MjMsImV4cCI6MjA3NzYxMjQyM30.R95KfZn6WXnACXb0rpDMtnGHstdEnQ2isdF1C82xlZI';

// -----------------

export const supabase = createClient(supabaseUrl, supabaseKey);