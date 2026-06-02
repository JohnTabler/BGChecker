// ============================================================
// auth.js — Authentication, session management, role guards
// ============================================================

const Auth = (() => {

  // ----------------------------------------------------------
  // Role hierarchy
  // ----------------------------------------------------------
  const ROLES = {
    admin:   { label: 'Admin',   level: 3 },
    manager: { label: 'Manager', level: 2 },
    viewer:  { label: 'Viewer',  level: 1 },
  };

  // Page-level minimum role required
  const PAGE_GUARDS = {
    'dashboard.html':      'viewer',
    'records.html':        'viewer',
    'record-detail.html':  'viewer',
    'reminders.html':      'manager',
    'admin.html':          'admin',
  };

  // ----------------------------------------------------------
  // Get current session user + profile
  // ----------------------------------------------------------
  async function getUser() {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error || !session) return null;

    const { data: profile } = await supabaseClient
      .from('users')
      .select('id, email, role, full_name')
      .eq('id', session.user.id)
      .single();

    return profile || null;
  }

  // ----------------------------------------------------------
  // Guard — call at top of every protected page
  // Redirects to login if not authenticated or insufficient role
  // ----------------------------------------------------------
  async function guard(requiredRole = 'viewer') {
    const user = await getUser();

    if (!user) {
      window.location.href = 'index.html';
      return null;
    }

    const userLevel   = ROLES[user.role]?.level  ?? 0;
    const reqLevel    = ROLES[requiredRole]?.level ?? 1;

    if (userLevel < reqLevel) {
      window.location.href = 'dashboard.html';
      return null;
    }

    return user;
  }

  // ----------------------------------------------------------
  // Convenience role checkers
  // ----------------------------------------------------------
  function isAdmin(user)   { return user?.role === 'admin'; }
  function isManager(user) { return user?.role === 'manager' || isAdmin(user); }
  function isViewer(user)  { return true; } // all roles can view

  // ----------------------------------------------------------
  // Sign in
  // ----------------------------------------------------------
  async function signIn(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  // ----------------------------------------------------------
  // Session timeout — auto sign-out after inactivity
  // ----------------------------------------------------------
  const TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  let _timeoutHandle = null;

  function _resetTimeout() {
    clearTimeout(_timeoutHandle);
    _timeoutHandle = setTimeout(async () => {
      await supabaseClient.auth.signOut();
      window.location.href = 'index.html?reason=timeout';
    }, TIMEOUT_MS);
  }

  function startSessionTimeout() {
    ['mousemove','keydown','click','scroll','touchstart'].forEach(evt =>
      document.addEventListener(evt, _resetTimeout, { passive: true })
    );
    _resetTimeout(); // start the clock immediately
  }

    // ----------------------------------------------------------
  // Sign out
  // ----------------------------------------------------------
  async function signOut() {
    await supabaseClient.auth.signOut();
    window.location.href = 'index.html';
  }

  // ----------------------------------------------------------
  // Populate nav with user info + hide role-restricted items
  // ----------------------------------------------------------
  function applyNavPermissions(user) {
    // Set display name
    const nameEl = document.getElementById('nav-user-name');
    if (nameEl) nameEl.textContent = user.full_name || user.email;

    const roleEl = document.getElementById('nav-user-role');
    if (roleEl) roleEl.textContent = ROLES[user.role]?.label || user.role;

    // Show/hide nav items based on role
    document.querySelectorAll('[data-role-min]').forEach(el => {
      const min = el.getAttribute('data-role-min');
      const minLevel = ROLES[min]?.level ?? 1;
      if ((ROLES[user.role]?.level ?? 0) < minLevel) {
        el.style.display = 'none';
      }
    });
  }

  return { getUser, guard, signIn, signOut, isAdmin, isManager, isViewer, applyNavPermissions, ROLES, startSessionTimeout };
})();
