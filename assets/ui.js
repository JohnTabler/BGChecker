// ============================================================
// ui.js — Shared sidebar nav, toasts, modals, formatting
// ============================================================

const UI = (() => {

  // Inject nav hover styles once
  (() => {
    if (document.getElementById('bgtrack-ui-styles')) return;
    const s = document.createElement('style');
    s.id = 'bgtrack-ui-styles';
    s.textContent = `
      .nav-item {
        display:flex;align-items:center;gap:9px;
        padding:7px 10px;border-radius:7px;
        font-size:0.8125rem;font-weight:500;
        color:#7a9cbf;text-decoration:none;
        transition:background 0.12s,color 0.12s;
        letter-spacing:-0.01em;
      }
      .nav-item:hover { background:rgba(255,255,255,0.07); color:#c8dcf0; }
      .nav-item.is-active { background:#4f46e5; color:#fff; font-weight:600; }
      .profile-name { display:none; }
      @media(min-width:640px){ .profile-name { display:block; } }
      .profile-btn { display:flex;align-items:center;gap:8px;padding:5px 8px 5px 5px;border-radius:9px;border:none;background:transparent;cursor:pointer;transition:background 0.12s; }
      .profile-btn:hover { background:#f0efe9; }
      .dropdown-item { width:100%;text-align:left;padding:9px 13px;font-size:0.8125rem;background:none;border:none;cursor:pointer;display:flex;align-items:center;gap:8px;transition:background 0.1s; }
      .dropdown-item:hover { background:#f7f6f3; }
      .dropdown-item.danger { color:#ef4444; }
      .dropdown-item.danger:hover { background:#fff5f5; }
    `;
    document.head.appendChild(s);
  })();

  const ICON = {
    shield:    `<svg width="17" height="17" fill="none" stroke="white" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>`,
    dashboard: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>`,
    records:   `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>`,
    reminders: `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>`,
    admin:     `<svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>`,
    key:       `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/></svg>`,
    signout:   `<svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.7" style="flex-shrink:0"><path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>`,
    chevron:   `<svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5" style="flex-shrink:0;color:#9ca3af"><path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/></svg>`,
  };

  // ----------------------------------------------------------
  // Sidebar + header profile
  // ----------------------------------------------------------
  function renderNav(user) {
    const nav = document.getElementById('sidebar');
    if (!nav) return;

    const isAdmin   = Auth.isAdmin(user);
    const isManager = Auth.isManager(user);
    const page      = window.location.pathname.split('/').pop().replace('.html', '') || 'index';

    const link = (href, iconKey, label, pageName) => {
      const active = page === pageName;
      return `<a href="${href}" class="nav-item${active ? ' is-active' : ''}">${ICON[iconKey]}<span>${label}</span></a>`;
    };

    const sectionLabel = (text) =>
      `<p style="font-size:0.6rem;font-weight:700;color:#2e4a6a;text-transform:uppercase;letter-spacing:0.1em;padding:0 8px;margin:14px 0 4px;">${text}</p>`;

    nav.innerHTML = `
      <div style="padding:18px 14px 15px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <div style="display:flex;align-items:center;gap:9px;">
          <div style="width:30px;height:30px;background:#4f46e5;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
            ${ICON.shield}
          </div>
          <span style="color:#fff;font-weight:800;font-size:0.9375rem;letter-spacing:-0.025em;">BGTrack</span>
        </div>
      </div>
      <nav style="flex:1;padding:10px 10px 16px;overflow-y:auto;">
        ${sectionLabel('Main')}
        ${link('dashboard.html', 'dashboard', 'Dashboard', 'dashboard')}
        ${link('records.html',   'records',   'Records',   'records')}
        ${isManager ? link('reminders.html', 'reminders', 'Reminders', 'reminders') : ''}
        ${isAdmin ? `
          ${sectionLabel('Admin')}
          ${link('admin.html', 'admin', 'Settings & Users', 'admin')}
        ` : ''}
      </nav>
    `;

    const profileArea = document.getElementById('profile-area');
    if (!profileArea) return;

    const initials  = (user.full_name || user.email || '?')[0].toUpperCase();
    const roleLabel = Auth.ROLES[user.role]?.label || user.role;

    profileArea.innerHTML = `
      <div style="position:relative;" id="profile-menu-wrap">
        <button id="profile-menu-btn" class="profile-btn">
          <div style="width:28px;height:28px;border-radius:8px;background:#4f46e5;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.6875rem;font-weight:700;flex-shrink:0;">${initials}</div>
          <div class="profile-name" style="text-align:left;">
            <p style="font-size:0.75rem;font-weight:600;color:#111827;line-height:1.3;max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${user.full_name || user.email}</p>
            <p style="font-size:0.6875rem;color:#9ca3af;line-height:1.3;text-transform:capitalize;">${roleLabel}</p>
          </div>
          ${ICON.chevron}
        </button>
        <div id="profile-menu-dropdown"
          class="hidden"
          style="position:absolute;right:0;top:calc(100% + 5px);width:192px;background:#fff;border-radius:11px;box-shadow:0 8px 24px rgba(0,0,0,0.11),0 2px 6px rgba(0,0,0,0.05);border:1px solid #ece9e3;z-index:50;padding:3px 0;overflow:hidden;">
          <button onclick="UI.showChangePasswordModal()" class="dropdown-item" style="color:#374151;">
            ${ICON.key} Change Password
          </button>
          <div style="border-top:1px solid #f0ede8;margin:3px 0;"></div>
          <button onclick="Auth.signOut()" class="dropdown-item danger">
            ${ICON.signout} Sign out
          </button>
        </div>
      </div>
    `;

    const btn      = document.getElementById('profile-menu-btn');
    const dropdown = document.getElementById('profile-menu-dropdown');
    btn.addEventListener('click', (e) => { e.stopPropagation(); dropdown.classList.toggle('hidden'); });
    document.addEventListener('click', () => dropdown.classList.add('hidden'));
  }

  // ----------------------------------------------------------
  // Toast notifications
  // ----------------------------------------------------------
  function toast(message, type = 'success') {
    const cfg = {
      success: { bg: '#10b981', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>` },
      error:   { bg: '#ef4444', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/>` },
      warning: { bg: '#f59e0b', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v4m0 4h.01"/>` },
      info:    { bg: '#6366f1', icon: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01"/>` },
    };
    const { bg, icon } = cfg[type] || cfg.info;
    const t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:20px;right:20px;z-index:9999;display:flex;align-items:center;gap:10px;padding:11px 16px;border-radius:11px;background:${bg};color:#fff;font-size:0.875rem;font-weight:500;letter-spacing:-0.01em;box-shadow:0 12px 28px rgba(0,0,0,0.18);transform:translateY(10px);opacity:0;transition:all 0.22s cubic-bezier(0.34,1.5,0.64,1);max-width:320px;font-family:inherit;`;
    t.innerHTML = `<svg style="flex-shrink:0;width:17px;height:17px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">${icon}</svg><span>${message}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.transform = 'translateY(0)'; t.style.opacity = '1'; });
    setTimeout(() => {
      t.style.transform = 'translateY(10px)'; t.style.opacity = '0';
      setTimeout(() => t.remove(), 220);
    }, 3500);
  }

  // ----------------------------------------------------------
  // Page loader
  // ----------------------------------------------------------
  function showLoader() { const el = document.getElementById('page-loader'); if (el) el.classList.remove('hidden'); }
  function hideLoader() { const el = document.getElementById('page-loader'); if (el) el.classList.add('hidden'); }

  // ----------------------------------------------------------
  // Confirm dialog
  // ----------------------------------------------------------
  function confirm({ title, message, confirmLabel = 'Confirm', danger = false }) {
    return new Promise(resolve => {
      const existing = document.getElementById('confirm-modal');
      if (existing) existing.remove();
      const modal = document.createElement('div');
      modal.id = 'confirm-modal';
      modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.45);backdrop-filter:blur(3px);';
      const okBg   = danger ? '#ef4444' : '#4f46e5';
      const okHov  = danger ? '#dc2626' : '#4338ca';
      modal.innerHTML = `
        <div style="background:#fff;border-radius:14px;padding:24px;width:100%;max-width:400px;margin:0 16px;box-shadow:0 24px 48px rgba(0,0,0,0.14),0 6px 12px rgba(0,0,0,0.06);">
          <h3 style="font-size:0.9375rem;font-weight:700;color:#111827;margin:0 0 8px;letter-spacing:-0.02em;">${title}</h3>
          <p style="font-size:0.875rem;color:#6b7280;margin:0 0 22px;line-height:1.55;">${message}</p>
          <div style="display:flex;gap:10px;">
            <button id="confirm-cancel" style="flex:1;padding:9px 16px;font-size:0.875rem;font-weight:600;color:#374151;background:#f3f2ef;border:none;border-radius:8px;cursor:pointer;font-family:inherit;">Cancel</button>
            <button id="confirm-ok"     style="flex:1;padding:9px 16px;font-size:0.875rem;font-weight:600;color:#fff;background:${okBg};border:none;border-radius:8px;cursor:pointer;font-family:inherit;">${confirmLabel}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('confirm-cancel').addEventListener('click', () => { modal.remove(); resolve(false); });
      document.getElementById('confirm-ok').addEventListener('click',     () => { modal.remove(); resolve(true); });
      modal.addEventListener('click', e => { if (e.target === modal) { modal.remove(); resolve(false); } });
    });
  }

  // ----------------------------------------------------------
  // Change password modal
  // ----------------------------------------------------------
  function showChangePasswordModal() {
    document.getElementById('profile-menu-dropdown')?.classList.add('hidden');
    const existing = document.getElementById('change-pw-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'change-pw-modal';
    modal.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,0.45);backdrop-filter:blur(3px);';
    modal.innerHTML = `
      <div style="background:#fff;border-radius:14px;padding:24px;width:100%;max-width:400px;margin:0 16px;box-shadow:0 24px 48px rgba(0,0,0,0.14);">
        <h3 style="font-size:0.9375rem;font-weight:700;color:#111827;margin:0 0 4px;letter-spacing:-0.02em;">Change Password</h3>
        <p style="font-size:0.75rem;color:#9ca3af;margin:0 0 18px;">Confirm your current password to proceed.</p>
        <div style="display:flex;flex-direction:column;gap:13px;">
          ${['cpw-current:Current Password:current-password','cpw-new:New Password:new-password','cpw-confirm:Confirm New Password:new-password'].map(f => {
            const [id, lbl, ac] = f.split(':');
            return `<div>
              <label style="display:block;font-size:0.6875rem;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:5px;">${lbl}</label>
              <input id="${id}" type="password" autocomplete="${ac}" style="width:100%;padding:9px 12px;border:1.5px solid #e5e3de;border-radius:8px;font-size:0.875rem;outline:none;transition:border-color 0.15s,box-shadow 0.15s;font-family:inherit;box-sizing:border-box;" onfocus="this.style.borderColor='#4f46e5';this.style.boxShadow='0 0 0 3px rgba(79,70,229,0.1)'" onblur="this.style.borderColor='#e5e3de';this.style.boxShadow='none'"/>
            </div>`;
          }).join('')}
          <p id="cpw-error" style="display:none;font-size:0.75rem;color:#ef4444;margin:0;"></p>
        </div>
        <div style="display:flex;gap:10px;margin-top:18px;">
          <button id="cpw-cancel" style="flex:1;padding:9px 16px;font-size:0.875rem;font-weight:600;color:#374151;background:#f3f2ef;border:none;border-radius:8px;cursor:pointer;font-family:inherit;">Cancel</button>
          <button id="cpw-save"   style="flex:1;padding:9px 16px;font-size:0.875rem;font-weight:600;color:#fff;background:#4f46e5;border:none;border-radius:8px;cursor:pointer;font-family:inherit;">Update Password</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('cpw-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    document.getElementById('cpw-save').addEventListener('click', async () => {
      const current = document.getElementById('cpw-current').value;
      const newPw   = document.getElementById('cpw-new').value;
      const conf    = document.getElementById('cpw-confirm').value;
      const errEl   = document.getElementById('cpw-error');
      errEl.style.display = 'none';

      if (!current || !newPw || !conf) {
        errEl.textContent = 'All fields are required.'; errEl.style.display = 'block'; return;
      }
      if (newPw.length < 8) {
        errEl.textContent = 'New password must be at least 8 characters.'; errEl.style.display = 'block'; return;
      }
      if (newPw !== conf) {
        errEl.textContent = 'New passwords do not match.'; errEl.style.display = 'block'; return;
      }

      const saveBtn = document.getElementById('cpw-save');
      saveBtn.textContent = 'Updating…'; saveBtn.disabled = true;

      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        const { error: reAuthError } = await supabaseClient.auth.signInWithPassword({ email: session.user.email, password: current });
        if (reAuthError) throw new Error('Current password is incorrect.');
        const { error: updateError } = await supabaseClient.auth.updateUser({ password: newPw });
        if (updateError) throw updateError;
        modal.remove();
        toast('Password updated successfully.', 'success');
      } catch(err) {
        errEl.textContent = err.message || 'Failed to update password.';
        errEl.style.display = 'block';
        saveBtn.textContent = 'Update Password'; saveBtn.disabled = false;
      }
    });
  }

  // ----------------------------------------------------------
  // Formatters
  // ----------------------------------------------------------
  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
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
      'Pending':   { dot:'#f59e0b', bg:'#fffbeb', text:'#92400e', border:'#fde68a' },
      'Cleared':   { dot:'#10b981', bg:'#ecfdf5', text:'#065f46', border:'#6ee7b7' },
      'Failed':    { dot:'#ef4444', bg:'#fef2f2', text:'#991b1b', border:'#fca5a5' },
      'Cancelled': { dot:'#9ca3af', bg:'#f9fafb', text:'#4b5563', border:'#e5e7eb' },
    };
    const c = map[status];
    if (!c) return `<span style="font-size:0.75rem;color:#9ca3af;">—</span>`;
    return `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 7px;border-radius:999px;font-size:0.6875rem;font-weight:600;background:${c.bg};color:${c.text};border:1px solid ${c.border};white-space:nowrap;">
      <span style="width:5px;height:5px;border-radius:50%;background:${c.dot};flex-shrink:0;"></span>${status}
    </span>`;
  }

  function expirationBadge(dateStr) {
    const days = daysUntil(dateStr);
    if (days === null) return '<span style="color:#9ca3af;font-size:0.875rem;">—</span>';
    if (days < 0)
      return `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 7px;border-radius:999px;font-size:0.6875rem;font-weight:600;background:#fef2f2;color:#991b1b;border:1px solid #fca5a5;white-space:nowrap;"><span style="width:5px;height:5px;border-radius:50%;background:#ef4444;flex-shrink:0;"></span>Expired ${Math.abs(days)}d ago</span>`;
    if (days <= 20)
      return `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 9px 3px 7px;border-radius:999px;font-size:0.6875rem;font-weight:600;background:#fffbeb;color:#92400e;border:1px solid #fde68a;white-space:nowrap;"><span style="width:5px;height:5px;border-radius:50%;background:#f59e0b;flex-shrink:0;"></span>${days}d left</span>`;
    return `<span style="font-size:0.875rem;color:#374151;">${formatDate(dateStr)}</span>`;
  }

  return { renderNav, toast, showLoader, hideLoader, confirm, showChangePasswordModal, formatDate, daysUntil, statusBadge, expirationBadge };
})();
