// ============================================================
// ui.js — Shared nav, toast notifications, and UI utilities
// ============================================================

const UI = (() => {

  // ----------------------------------------------------------
  // Build the nav (call after Auth.guard resolves)
  // ----------------------------------------------------------
  function renderNav(user) {
    const nav = document.getElementById('main-nav');
    if (!nav) return;

    const isAdmin   = Auth.isAdmin(user);
    const isManager = Auth.isManager(user);

    nav.innerHTML = `
      <div class="flex items-center justify-between h-16 px-6">
        <!-- Logo -->
        <a href="dashboard.html" class="flex items-center gap-2 font-semibold text-indigo-600 text-lg tracking-tight">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02
                 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622
                 0-1.042-.133-2.052-.382-3.016z"/>
          </svg>
          BGTrack
        </a>

        <!-- Nav links -->
        <nav class="hidden md:flex items-center gap-1">
          <a href="dashboard.html"  class="nav-link" data-page="dashboard">Dashboard</a>
          <a href="records.html"    class="nav-link" data-page="records">Records</a>
          ${isManager ? `<a href="reminders.html" class="nav-link" data-page="reminders">Reminders</a>` : ''}
          ${isAdmin   ? `<a href="admin.html"     class="nav-link" data-page="admin">Admin</a>` : ''}
        </nav>

        <!-- User menu -->
        <div class="flex items-center gap-3">
          <div class="text-right hidden sm:block">
            <div class="text-sm font-medium text-gray-800" id="nav-user-name"></div>
            <div class="text-xs text-gray-400 capitalize" id="nav-user-role"></div>
          </div>
          <button onclick="Auth.signOut()"
            class="text-sm text-gray-500 hover:text-red-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50">
            Sign out
          </button>
        </div>
      </div>
    `;

    // Set user info
    const nameEl = document.getElementById('nav-user-name');
    const roleEl = document.getElementById('nav-user-role');
    if (nameEl) nameEl.textContent = user.full_name || user.email;
    if (roleEl) roleEl.textContent = Auth.ROLES[user.role]?.label || user.role;

    // Highlight current page
    const page = window.location.pathname.split('/').pop().replace('.html', '');
    nav.querySelectorAll('.nav-link').forEach(a => {
      if (a.dataset.page === page) {
        a.classList.add('nav-link-active');
      }
    });
  }

  // ----------------------------------------------------------
  // Toast notifications
  // ----------------------------------------------------------
  function toast(message, type = 'success') {
    const colors = {
      success: 'bg-emerald-600',
      error:   'bg-red-600',
      warning: 'bg-amber-500',
      info:    'bg-indigo-600',
    };

    const t = document.createElement('div');
    t.className = `fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl
                   text-white text-sm font-medium shadow-lg transform translate-y-2 opacity-0
                   transition-all duration-300 ${colors[type] || colors.info}`;
    t.textContent = message;
    document.body.appendChild(t);

    requestAnimationFrame(() => {
      t.classList.remove('translate-y-2', 'opacity-0');
    });

    setTimeout(() => {
      t.classList.add('translate-y-2', 'opacity-0');
      setTimeout(() => t.remove(), 300);
    }, 3500);
  }

  // ----------------------------------------------------------
  // Loading spinner (full-page overlay)
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
  // Confirm dialog (replaces browser confirm())
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
            <button id="confirm-ok" class="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}">${confirmLabel}</button>
          </div>
        </div>
      `;
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
    if (days < 0)  return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired ${Math.abs(days)}d ago</span>`;
    if (days <= 20) return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">${days}d left</span>`;
    return `<span class="text-sm text-gray-600">${formatDate(dateStr)}</span>`;
  }

  return { renderNav, toast, showLoader, hideLoader, confirm, formatDate, daysUntil, statusBadge, expirationBadge };
})();
