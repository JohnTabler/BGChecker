// ============================================================
// export.js — CSV export (full list or filtered results)
// ============================================================

const Exporter = (() => {

  const RECORD_COLUMNS = [
    { key: 'project',         label: 'Project' },
    { key: 'employee_name',   label: 'Employee Name' },
    { key: 'date_ordered',    label: 'Date Ordered' },
    { key: 'date_processed',  label: 'Date Processed' },
    { key: 'vendor',          label: 'Vendor' },
    { key: 'status',          label: 'Status' },
    { key: 'expiration_date', label: 'Expiration Date' },
  ];

  const REMINDER_COLUMNS = [
    { key: 'project',         label: 'Project' },
    { key: 'employee_name',   label: 'Employee Name' },
    { key: 'vendor',          label: 'Vendor' },
    { key: 'status',          label: 'Status' },
    { key: 'expiration_date', label: 'Expiration Date' },
    { key: 'days_remaining',  label: 'Days Remaining' },
  ];

  // ----------------------------------------------------------
  // Core CSV builder
  // ----------------------------------------------------------
  function buildCSV(rows, columns) {
    const header = columns.map(c => `"${c.label}"`).join(',');
    const body = rows.map(row =>
      columns.map(c => {
        const val = row[c.key] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    );
    return [header, ...body].join('\r\n');
  }

  // ----------------------------------------------------------
  // Trigger browser download
  // ----------------------------------------------------------
  function download(csvString, filename) {
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ----------------------------------------------------------
  // Export records (records.html)
  // ----------------------------------------------------------
  function exportRecords(rows, scope = 'filtered') {
    const filename = `background-checks-${scope}-${_today()}.csv`;
    const csv = buildCSV(rows, RECORD_COLUMNS);
    download(csv, filename);
  }

  // ----------------------------------------------------------
  // Export reminders (reminders.html)
  // ----------------------------------------------------------
  function exportReminders(rows, scope = 'filtered') {
    // Attach days_remaining if not already present
    const today = new Date();
    const enriched = rows.map(r => {
      const exp = new Date(r.expiration_date);
      const diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
      return { ...r, days_remaining: diff };
    });
    const filename = `reminders-${scope}-${_today()}.csv`;
    const csv = buildCSV(enriched, REMINDER_COLUMNS);
    download(csv, filename);
  }

  // ----------------------------------------------------------
  // Show export modal
  // Call this with allRows (unfiltered) and filteredRows
  // onExport(rows) will be called with the chosen set
  // ----------------------------------------------------------
  function showExportModal({ allRows, filteredRows, type = 'records' }) {
    // Remove existing modal if any
    const existing = document.getElementById('export-modal');
    if (existing) existing.remove();

    const isFiltered = filteredRows.length !== allRows.length;

    const modal = document.createElement('div');
    modal.id = 'export-modal';
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/50';
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-1">Export to CSV</h3>
        <p class="text-sm text-gray-500 mb-5">Choose which records to export.</p>

        <div class="space-y-3 mb-6">
          <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${!isFiltered ? 'opacity-40 pointer-events-none' : ''}">
            <input type="radio" name="export-scope" value="filtered" class="accent-indigo-600" ${isFiltered ? 'checked' : 'disabled'}>
            <div>
              <div class="text-sm font-medium text-gray-800">Filtered results</div>
              <div class="text-xs text-gray-500">${filteredRows.length} record${filteredRows.length !== 1 ? 's' : ''}</div>
            </div>
          </label>

          <label class="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
            <input type="radio" name="export-scope" value="all" class="accent-indigo-600" ${!isFiltered ? 'checked' : ''}>
            <div>
              <div class="text-sm font-medium text-gray-800">All records</div>
              <div class="text-xs text-gray-500">${allRows.length} record${allRows.length !== 1 ? 's' : ''}</div>
            </div>
          </label>
        </div>

        <div class="flex gap-3">
          <button id="export-cancel" class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
          <button id="export-confirm" class="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Download</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('export-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

    document.getElementById('export-confirm').addEventListener('click', () => {
      const scope = modal.querySelector('input[name="export-scope"]:checked')?.value || 'all';
      const rows  = scope === 'filtered' ? filteredRows : allRows;
      if (type === 'reminders') exportReminders(rows, scope);
      else exportRecords(rows, scope);
      modal.remove();
    });
  }

  function _today() {
    return new Date().toISOString().split('T')[0];
  }

  return { exportRecords, exportReminders, showExportModal };
})();
