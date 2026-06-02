// ============================================================
// ui.js — Shared sidebar nav, toasts, modals, formatting
// PPS-style: dark left sidebar, white content area
// ============================================================

const UI = (() => {

  // ----------------------------------------------------------
  // Build the sidebar nav
  // ----------------------------------------------------------
  function renderNav(user) {
    const nav = document.getElementById('sidebar');
    if (!nav) return;

    const isAdmin   = Auth.isAdmin(user);
    const isManager = Auth.isManager(user);
    const page      = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

    const link = (href, icon, label, pageName) => {
      const active = page === pageName ? 'bg-white/10 text-white' : 'text-slate-300 hover:bg-white/10 hover:text-white';
      return `<a href="${href}" class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${active}">
        <span class="text-base">${icon}</span>${label}
      </a>`;
    };

    nav.innerHTML = `
      <!-- Logo -->
      <div class="flex items-center gap-2.5 px-3 py-5 border-b border-white/10 mb-3">
        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618
                 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03
                 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
        </div>
        <span class="text-white font-bold text-lg tracking-tight">BGTrack</span>
      </div>

      <!-- Nav links -->
      <nav class="px-3 space-y-0.5 flex-1">
        <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-2 pb-1">Main</p>
        ${link('dashboard.html',   '📊', 'Dashboard',  'dashboard')}
        ${link('records.html',     '📋', 'Records',    'records')}
        ${isManager ? link('reminders.html', '🔔', 'Reminders', 'reminders') : ''}
        ${isManager ? link('bulk-upload.html', '📤', 'Bulk Upload', 'bulk-upload') : ''}

        ${isAdmin ? `<p class="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 pt-4 pb-1">Admin</p>` : ''}
        ${isAdmin ? link('admin.html', '⚙️', 'Settings & Users', 'admin') : ''}
      </nav>

      <!-- User info at bottom -->
      <div class="px-3 py-4 border-t border-white/10 mt-auto">
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            ${(user.full_name || user.email || '?')[0].toUpperCase()}
          </div>
          <div class="min-w-0">
            <p class="text-white text-xs font-medium truncate">${user.full_name || user.email}</p>
            <p class="text-slate-400 text-xs capitalize">${Auth.ROLES[user.role]?.label || user.role}</p>
          </div>
        </div>
        <button onclick="Auth.signOut()"
          class="w-full text-left text-xs text-slate-400 hover:text-red-300 transition-colors px-1 py-1">
          Sign out →
        </button>
      </div>
    `;
  }

  // ----------------------------------------------------------
  // Toast notifications
  // ----------------------------------------------------------
  function toast(message, type = 'success') {
    const colors = {
      success: 'bg-emerald-600',
      error:   'bg-red-600',
      warning: 'bg-amber-500',
      info:    'bg-blue-600',
    };
    const t = document.createElement('div');
    t.className = `fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
                   text-white text-sm font-medium shadow-xl transform translate-y-2 opacity-0
                   transition-all duration-300 ${colors[type] || colors.info}`;
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(() => t.classList.remove('translate-y-2', 'opacity-0'));
    setTimeout(() => {
      t.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => t.remove(), 300);
    }, 3500);
  }

  // ----------------------------------------------------------
  // Page loader
  // ----------------------------------------------------------
  function showLoader() {
    const el = document.getElementById('page-loader');
    if (el) el.classList.remove('hidden');
  }
  function hideLoader() {
    const el = document.getElementById('page-loader');
    if (el) el.classList.add('hidden');
  }

  // ----------------------------------------------------------
  // Confirm dialog
  // ----------------------------------------------------------
  function confirm({ title, message, confirmLabel = 'Confirm', danger = false }) {
    return new Promise(resolve => {
      const existing = document.getElementById('confirm-modal');
      if (existing) existing.remove();
      const modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
      modal.innerHTML = `
        <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
          <h3 class="text-base font-semibold text-gray-900 mb-2">${title}</h3>
          <p class="text-sm text-gray-500 mb-6">${message}</p>
          <div class="flex gap-3">
            <button id="confirm-cancel" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
            <button id="confirm-ok" class="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}">${confirmLabel}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('confirm-cancel').addEventListener('click', () => { modal.remove(); resolve(false); });
      document.getElementById('confirm-ok').addEventListener('click',     () => { modal.remove(); resolve(true); });
      modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); resolve(false); } });
    });
  }

  // ----------------------------------------------------------
  // Format helpers
  // ----------------------------------------------------------
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function daysUntil(dateStr) {
    if (!dateStr) return null;
    const today = new Date(); today.setHours(0,0,0,0);
    const exp   = new Date(dateStr + 'T00:00:00');
    return Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
  }

  function statusBadge(status) {
    const map = {
      'Pending':   'bg-amber-100 text-amber-800',
      'Cleared':   'bg-emerald-100 text-emerald-800',
      'Failed':    'bg-red-100 text-red-800',
      'Cancelled': 'bg-gray-100 text-gray-600',
    };
    const cls = map[status] || 'bg-gray-100 text-gray-600';
    return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}">${status || '—'}</span>`;
  }

  function expirationBadge(dateStr) {
    const days = daysUntil(dateStr);
    if (days === null) return '—';
    if (days < 0)   return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired ${Math.abs(days)}d ago</span>`;
    if (days <= 20) return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">${days}d left</span>`;
    return `<span class="text-sm text-gray-600">${formatDate(dateStr)}</span>`;
  }

  return { renderNav, toast, showLoader, hideLoader, confirm, formatDate, daysUntil, statusBadge, expirationBadge };
})();
