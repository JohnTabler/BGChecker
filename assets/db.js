// ============================================================
// db.js — All Supabase database interactions
// ============================================================

const DB = (() => {

  // ----------------------------------------------------------
  // RECORDS
  // ----------------------------------------------------------

  async function getRecords(filters = {}) {
    let query = supabaseClient
      .from('records')
      .select('*')
      .order('expiration_date', { ascending: true });

    if (filters.project)       query = query.ilike('project', `%${filters.project}%`);
    if (filters.employee_name) query = query.ilike('employee_name', `%${filters.employee_name}%`);
    if (filters.vendor)        query = query.ilike('vendor', `%${filters.vendor}%`);
    if (filters.status)        query = query.eq('status', filters.status);
    if (filters.date_from)     query = query.gte('date_ordered', filters.date_from);
    if (filters.date_to)       query = query.lte('date_ordered', filters.date_to);
    if (filters.expiring_before) query = query.lte('expiration_date', filters.expiring_before);

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async function getRecordById(id) {
    const { data, error } = await supabaseClient
      .from('records')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async function createRecord(record) {
    const payload = _buildPayload(record);
    const { data, error } = await supabaseClient
      .from('records')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateRecord(id, record) {
    const payload = _buildPayload(record);
    const { data, error } = await supabaseClient
      .from('records')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function deleteRecord(id) {
    const { error } = await supabaseClient.from('records').delete().eq('id', id);
    if (error) throw error;
  }

  // Bulk insert — used by bulk upload flow
  async function bulkCreateRecords(records) {
    const payloads = records.map(_buildPayload);
    const { data, error } = await supabaseClient
      .from('records')
      .insert(payloads)
      .select();
    if (error) throw error;
    return data;
  }

  // Compute expiration from date_processed (+ 6 months)
  function _buildPayload(record) {
    const payload = { ...record };
    if (payload.date_processed) {
      const d = new Date(payload.date_processed);
      d.setMonth(d.getMonth() + 6);
      payload.expiration_date = d.toISOString().split('T')[0];
    }
    return payload;
  }

  // ----------------------------------------------------------
  // REMINDERS
  // ----------------------------------------------------------

  async function getExpiringRecords() {
    const settings = await getSettings();
    const days = settings?.reminder_days ?? 20;

    const today = new Date();
    const cutoff = new Date();
    cutoff.setDate(today.getDate() + days);

    const todayStr  = today.toISOString().split('T')[0];
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const { data, error } = await supabaseClient
      .from('records')
      .select('*')
      .gte('expiration_date', todayStr)   // not already expired
      .lte('expiration_date', cutoffStr)  // expiring within window
      .order('expiration_date', { ascending: true });

    if (error) throw error;
    return { records: data, days };
  }

  async function getExpiredRecords() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabaseClient
      .from('records')
      .select('*')
      .lt('expiration_date', today)
      .order('expiration_date', { ascending: false });
    if (error) throw error;
    return data;
  }

  // ----------------------------------------------------------
  // SETTINGS
  // ----------------------------------------------------------

  async function getSettings() {
    const { data, error } = await supabaseClient
      .from('settings')
      .select('*')
      .limit(1)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data;
  }

  async function updateSettings(reminder_days, updated_by) {
    const existing = await getSettings();
    if (existing) {
      const { data, error } = await supabaseClient
        .from('settings')
        .update({ reminder_days, updated_by, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabaseClient
        .from('settings')
        .insert([{ reminder_days, updated_by }])
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }

  // ----------------------------------------------------------
  // USERS (admin only)
  // ----------------------------------------------------------

  async function getUsers() {
    const { data, error } = await supabaseClient
      .from('users')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async function updateUserRole(userId, role) {
    const { data, error } = await supabaseClient
      .from('users')
      .update({ role })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
// ----------------------------------------------------------
  // AUDIT LOG (admin only)
  // ----------------------------------------------------------

  async function getAuditLog(limit = 100) {
    const { data, error } = await supabaseClient
      .from('audit_log')
      .select(`
        id, action, table_name, record_id, old_data, new_data, created_at,
        users ( email, full_name )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  }

  // Filtered + paginated — used by audit-log.html
  async function getAuditLogFiltered(filters = {}, page = 1, pageSize = 50) {
    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;

    let query = supabaseClient
      .from('audit_log')
      .select(`
        id, action, table_name, record_id, old_data, new_data, created_at,
        users ( email, full_name )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filters.action)   query = query.eq('action', filters.action);
    if (filters.userId)   query = query.eq('user_id', filters.userId);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo)   query = query.lte('created_at', filters.dateTo + 'T23:59:59');

    const { data, count, error } = await query;
    if (error) throw error;
    return { data, count };
  }

  // Full export (no pagination) — used by CSV download
  async function getAuditLogAll(filters = {}) {
    let query = supabaseClient
      .from('audit_log')
      .select(`
        id, action, table_name, record_id, old_data, new_data, created_at,
        users ( email, full_name )
      `)
      .order('created_at', { ascending: false });

    if (filters.action)   query = query.eq('action', filters.action);
    if (filters.userId)   query = query.eq('user_id', filters.userId);
    if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
    if (filters.dateTo)   query = query.lte('created_at', filters.dateTo + 'T23:59:59');

    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async function deleteUser(userId) {
    // Deletes from users table; auth record requires server-side admin API
    const { error } = await supabaseClient.from('users').delete().eq('id', userId);
    if (error) throw error;
  }

  return {
    getRecords,
    getRecordById,
    createRecord,
    updateRecord,
    deleteRecord,
    bulkCreateRecords,
    getExpiringRecords,
    getExpiredRecords,
    getSettings,
    updateSettings,
    getUsers,
    updateUserRole,
    deleteUser,
    getAuditLog,
    getAuditLogFiltered,
    getAuditLogAll,
  };
})();
