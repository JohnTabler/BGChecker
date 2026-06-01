// ============================================================
// config.js — Supabase connection
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values
// from: https://supabase.com/dashboard → Project Settings → API
// ============================================================

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY_HERE';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
