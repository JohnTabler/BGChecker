// ============================================================
// config.js — Supabase connection
// Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project values
// from: https://supabase.com/dashboard → Project Settings → API
// ============================================================

const SUPABASE_URL = https://xoydsofajluqdipfxksu.supabase.co;
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhveWRzb2Zhamx1cWRpcGZ4a3N1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MDc2MjMsImV4cCI6MjA5NTk4MzYyM30.T2PK23JZ5G5xhlOtaQv-wYhXeqpHzJe7CLfn9JSinzc;

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
