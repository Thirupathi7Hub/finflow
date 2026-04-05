/* ════════════════════════════════════════════
   FinFlow Dashboard — Main Application JS
   State Management + Rendering + Interactions
   ════════════════════════════════════════════ */

// ── State ──────────────────────────────────────
const state = {
  transactions: [],
  role: 'admin',         // 'admin' | 'viewer'
  theme: 'dark',
  filters: {
    search: '',
    type: 'all',
    category: 'all',
    month: 'all',
    sortBy: 'date',
    sortDir: 'desc',
  },
  currentPage: 1,
  perPage: 8,
  editingId: null,
  charts: {},
};

// ── Category config ─────────────────────────────
const CATEGORY_ICONS = {
  Income: '💰', Food: '🍜', Shopping: '🛍️', Transport: '🚗',
  Utilities: '⚡', Entertainment: '🎬', Health: '💊', Education: '📚',
};

const CATEGORY_COLORS = {
  Income: '#34D399', Food: '#FBBF24', Shopping: '#A78BFA', Transport: '#2DD4BF',
  Utilities: '#6C8EFF', Entertainment: '#F472B6', Health: '#F87171', Education: '#FB923C',
};

// ── Init ────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  initNav();
  initRoleSelector();
  initThemeToggle();
  initHamburger();
  initModal();
  renderAll();
});

// ── Storage ─────────────────────────────────────
function loadFromStorage() {
  try {
    const saved = localStorage.getItem('finflow_transactions');
    state.transactions = saved ? JSON.parse(saved) : [...TRANSACTIONS];
    const savedTheme = localStorage.getItem('finflow_theme');
    if (savedTheme) {
      state.theme = savedTheme;
      document.documentElement.setAttribute('data-theme', savedTheme);
      updateThemeToggleUI();
    }
    const savedRole = localStorage.getItem('finflow_role');
    if (savedRole) state.role = savedRole;
  } catch {
    state.transactions = [...TRANSACTIONS];
  }
}

function saveTransactions() {
  localStorage.setItem('finflow_transactions', JSON.stringify(state.transactions));
}

// ── Navigation ──────────────────────────────────
function initNav() {
  document.querySelectorAll('.nav-item[data-section]').forEach(item => {
    item.addEventListener('click', () => {
      const target = item.dataset.section;
      navigateTo(target);
      closeSidebar();
    });
  });
}

function navigateTo(section) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-section="${section}"]`);
  const sectionEl = document.getElementById(`section-${section}`);
  if (navItem) navItem.classList.add('active');
  if (sectionEl) sectionEl.classList.add('active');
  const titles = { overview: 'Dashboard', transactions: 'Transactions', insights: 'Insights' };
  document.getElementById('topbar-title').textContent = titles[section] || 'FinFlow';
  if (section === 'overview') renderOverview();
  if (section === 'transactions') renderTransactions();
  if (section === 'insights') renderInsights();
}

// ── Role Selector ────────────────────────────────
function initRoleSelector() {
  const sel = document.getElementById('role-select');
  if (sel) {
    sel.value = state.role;
    sel.addEventListener('change', () => {
      state.role = sel.value;
      localStorage.setItem('finflow_role', state.role);
      updateRoleBadge();
      renderAll();
      showToast(`Switched to ${state.role === 'admin' ? '🔑 Admin' : '👁️ Viewer'} mode`, 'info');
    });
  }
  updateRoleBadge();
}

function updateRoleBadge() {
  const badge = document.getElementById('role-badge');
  if (!badge) return;
  badge.className = `role-badge ${state.role}`;
  badge.innerHTML = state.role === 'admin' ? '🔑 Admin' : '👁️ Viewer';
}

// ── Theme Toggle ─────────────────────────────────
function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', state.theme);
  localStorage.setItem('finflow_theme', state.theme);
  updateThemeToggleUI();
  // Refresh charts for new colors
  setTimeout(() => renderCharts(), 50);
}

function updateThemeToggleUI() {
  const sw = document.getElementById('toggle-switch');
  const label = document.getElementById('theme-label');
  if (sw) sw.className = `toggle-switch ${state.theme === 'light' ? 'on' : ''}`;
  if (label) label.textContent = state.theme === 'light' ? '☀️ Light' : '🌙 Dark';
}

// ── Hamburger ────────────────────────────────────
function initHamburger() {
  document.getElementById('hamburger')?.addEventListener('click', openSidebar);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeSidebar);
}

function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebar-overlay').classList.add('open');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('open');
}

// ── Helpers ──────────────────────────────────────
function formatCurrency(n) {
  return '₹' + Math.abs(n).toLocaleString('en-IN');
}

function formatDate(str) {
  const d = new Date(str + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getMonthName(str) {
  const d = new Date(str + '-01T00:00:00');
  return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
}

function genId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// ── Compute Stats ─────────────────────────────────
function computeStats(txs) {
  const totalIncome  = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance      = totalIncome - totalExpense;
  const savings      = balance > 0 ? balance : 0;
  return { totalIncome, totalExpense, balance, savings };
}

// ── Render All ────────────────────────────────────
function renderAll() {
  renderOverview();
  renderTransactions();
  renderInsights();
  updateRoleBadge();
}

// ══════════════════════════════════════════════════
// OVERVIEW SECTION
// ══════════════════════════════════════════════════
function renderOverview() {
  const txs = state.transactions;
  const { totalIncome, totalExpense, balance, savings } = computeStats(txs);

  document.getElementById('stat-balance').textContent  = formatCurrency(balance);
  document.getElementById('stat-income').textContent   = formatCurrency(totalIncome);
  document.getElementById('stat-expense').textContent  = formatCurrency(totalExpense);
  document.getElementById('stat-savings').textContent  = formatCurrency(savings);

  const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100).toFixed(1) : '0.0';
  document.getElementById('stat-savings-rate').textContent = `${savingsRate}% savings rate`;

  renderCharts();
}

function renderCharts() {
  renderTrendChart();
  renderDonutChart();
}

function renderTrendChart() {
  // Group by month
  const monthMap = {};
  state.transactions.forEach(t => {
    const m = t.date.slice(0, 7);
    if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 };
    if (t.type === 'income')  monthMap[m].income  += t.amount;
    if (t.type === 'expense') monthMap[m].expense += t.amount;
  });

  const months  = Object.keys(monthMap).sort();
  const labels  = months.map(m => { const d = new Date(m + '-01'); return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }); });
  const incomes  = months.map(m => monthMap[m].income);
  const expenses = months.map(m => monthMap[m].expense);
  const balances = months.map((m, i) => incomes[i] - expenses[i]);

  const ctx = document.getElementById('trend-chart');
  if (!ctx) return;

  if (state.charts.trend) { state.charts.trend.destroy(); }

  const isLight = state.theme === 'light';
  const gridColor  = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';
  const tickColor  = isLight ? '#6B7280' : '#7B82A0';

  state.charts.trend = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Income',
          data: incomes,
          backgroundColor: 'rgba(52,211,153,0.7)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Expenses',
          data: expenses,
          backgroundColor: 'rgba(248,113,113,0.7)',
          borderRadius: 6,
          borderSkipped: false,
        },
        {
          label: 'Balance',
          data: balances,
          type: 'line',
          borderColor: '#6C8EFF',
          backgroundColor: 'rgba(108,142,255,0.08)',
          borderWidth: 2.5,
          pointBackgroundColor: '#6C8EFF',
          pointRadius: 4,
          pointHoverRadius: 6,
          tension: 0.4,
          fill: true,
          yAxisID: 'y',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight ? '#fff' : '#1F2333',
          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: tickColor,
          bodyColor: isLight ? '#111827' : '#E8EAF0',
          padding: 12,
          callbacks: {
            label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.raw)}`,
          }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: tickColor, font: { family: 'DM Sans', size: 12 } },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: 'DM Sans', size: 12 },
            callback: v => '₹' + (v >= 1000 ? (v/1000).toFixed(0) + 'k' : v),
          }
        }
      }
    }
  });
}

function renderDonutChart() {
  const expenseTxs = state.transactions.filter(t => t.type === 'expense');
  const catMap = {};
  expenseTxs.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + t.amount;
  });

  const sorted  = Object.entries(catMap).sort((a, b) => b[1] - a[1]);
  const labels  = sorted.map(([c]) => c);
  const data    = sorted.map(([, v]) => v);
  const colors  = labels.map(l => CATEGORY_COLORS[l] || '#888');
  const total   = data.reduce((s, v) => s + v, 0);

  const ctx = document.getElementById('donut-chart');
  if (!ctx) return;
  if (state.charts.donut) { state.charts.donut.destroy(); }

  const isLight = state.theme === 'light';

  state.charts.donut = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c => c + 'CC'),
        borderColor:     colors,
        borderWidth: 2,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight ? '#fff' : '#1F2333',
          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: {
            label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.raw)} (${((ctx.raw/total)*100).toFixed(1)}%)`,
          }
        }
      }
    }
  });

  // Custom legend
  const legend = document.getElementById('donut-legend');
  if (!legend) return;
  legend.innerHTML = sorted.map(([cat, val]) => `
    <div class="legend-item" style="display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:6px;">
      <span style="width:10px;height:10px;border-radius:3px;background:${CATEGORY_COLORS[cat]};flex-shrink:0;"></span>
      <span style="flex:1;color:var(--text-muted)">${cat}</span>
      <span style="font-weight:600;color:var(--text)">${formatCurrency(val)}</span>
    </div>
  `).join('');
}

// ══════════════════════════════════════════════════
// TRANSACTIONS SECTION
// ══════════════════════════════════════════════════
function renderTransactions() {
  renderTxControls();
  renderTxTable();
}

function renderTxControls() {
  // Populate month filter
  const months = [...new Set(state.transactions.map(t => t.date.slice(0, 7)))].sort().reverse();
  const monthSel = document.getElementById('filter-month');
  if (monthSel) {
    monthSel.innerHTML = `<option value="all">All Months</option>` +
      months.map(m => `<option value="${m}">${getMonthName(m)}</option>`).join('');
    monthSel.value = state.filters.month;
  }
}

function getFilteredTransactions() {
  let txs = [...state.transactions];
  const { search, type, category, month, sortBy, sortDir } = state.filters;

  if (search) {
    const q = search.toLowerCase();
    txs = txs.filter(t =>
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      String(t.amount).includes(q)
    );
  }
  if (type !== 'all')     txs = txs.filter(t => t.type === type);
  if (category !== 'all') txs = txs.filter(t => t.category === category);
  if (month !== 'all')    txs = txs.filter(t => t.date.startsWith(month));

  txs.sort((a, b) => {
    let valA = a[sortBy], valB = b[sortBy];
    if (sortBy === 'amount') { valA = +valA; valB = +valB; }
    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });

  return txs;
}

function renderTxTable() {
  const filtered = getFilteredTransactions();
  const total    = filtered.length;
  const pages    = Math.max(1, Math.ceil(total / state.perPage));
  if (state.currentPage > pages) state.currentPage = 1;
  const start = (state.currentPage - 1) * state.perPage;
  const page  = filtered.slice(start, start + state.perPage);

  const isMobile = window.innerWidth <= 480;

  // ── Desktop table ──
  const tbody = document.getElementById('tx-tbody');
  if (tbody) {
    if (page.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5">
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No transactions found</h3>
          <p>Try adjusting your filters or add a new transaction.</p>
        </div>
      </td></tr>`;
    } else {
      tbody.innerHTML = page.map(t => `
        <tr>
          <td>
            <div class="tx-desc">${escHtml(t.description)}</div>
            <div class="tx-date">${formatDate(t.date)}</div>
          </td>
          <td class="col-category">
            <span class="cat-badge cat-${t.category}">
              ${CATEGORY_ICONS[t.category] || '📌'} ${t.category}
            </span>
          </td>
          <td class="col-type"><span class="type-pill type-${t.type}">${t.type === 'income' ? '↑' : '↓'} ${t.type}</span></td>
          <td class="col-amount amount-cell amount-${t.type}">
            ${t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}
          </td>
          <td class="col-actions">
            <div class="tx-actions">
              ${state.role === 'admin' ? `
                <button class="btn btn-ghost btn-sm" onclick="openEditModal(${t.id})">✏️</button>
                <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${t.id})">🗑️</button>
              ` : `<span style="font-size:11px;color:var(--text-dim)">View only</span>`}
            </div>
          </td>
        </tr>
      `).join('');
    }
  }

  // ── Mobile card list ──
  const cardList = document.getElementById('tx-card-list');
  if (cardList) {
    if (page.length === 0) {
      cardList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <h3>No transactions found</h3>
          <p>Try adjusting your filters or add a new transaction.</p>
        </div>`;
    } else {
      cardList.innerHTML = page.map(t => `
        <div class="tx-mobile-card">
          <div class="tx-mobile-top">
            <span style="font-size:22px;flex-shrink:0">${CATEGORY_ICONS[t.category] || '💸'}</span>
            <span class="tx-mobile-desc">${escHtml(t.description)}</span>
            <span class="tx-mobile-amount amount-${t.type}">
              ${t.type === 'expense' ? '-' : '+'}${formatCurrency(t.amount)}
            </span>
          </div>
          <div class="tx-mobile-meta">
            <span class="tx-mobile-date">${formatDate(t.date)}</span>
            <span class="cat-badge cat-${t.category}" style="font-size:10px;padding:2px 8px">
              ${t.category}
            </span>
            <span class="type-pill type-${t.type}" style="font-size:10px;padding:2px 8px">
              ${t.type}
            </span>
          </div>
          ${state.role === 'admin' ? `
            <div class="tx-mobile-actions">
              <button class="btn btn-ghost btn-sm" onclick="openEditModal(${t.id})">✏️ Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteTransaction(${t.id})">🗑️ Delete</button>
            </div>` : ''}
        </div>
      `).join('');
    }
  }

  // ── Mobile card pagination ──
  const cardPag = document.getElementById('tx-card-pagination');
  if (cardPag && page.length > 0) {
    cardPag.innerHTML = `
      <span>${total === 0 ? 'No results' : `${start + 1}–${Math.min(start + state.perPage, total)} of ${total}`}</span>
      <div class="page-btns">
        <button class="page-btn" onclick="changePage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''}>&#8249;</button>
        <span style="padding:0 8px;font-size:13px;color:var(--text)">${state.currentPage} / ${pages}</span>
        <button class="page-btn" onclick="changePage(${state.currentPage + 1})" ${state.currentPage === pages ? 'disabled' : ''}>&#8250;</button>
      </div>`;
  } else if (cardPag) {
    cardPag.innerHTML = '';
  }

  // ── Shared info ──
  const countEl = document.getElementById('tx-count');
  if (countEl) countEl.textContent =
    total === 0 ? 'No results' : `Showing ${start + 1}–${Math.min(start + state.perPage, total)} of ${total}`;

  renderPagination(pages);

  const addBtn = document.getElementById('add-tx-btn');
  if (addBtn) addBtn.style.display = state.role === 'admin' ? 'inline-flex' : 'none';
}

function renderPagination(pages) {
  const container = document.getElementById('pagination-btns');
  if (!container) return;
  let html = `<button class="page-btn" onclick="changePage(${state.currentPage - 1})" ${state.currentPage === 1 ? 'disabled' : ''}>‹</button>`;
  for (let i = 1; i <= pages; i++) {
    if (pages > 7 && i > 3 && i < pages - 1 && Math.abs(i - state.currentPage) > 1) {
      if (i === 4 || i === pages - 2) html += `<span style="padding:0 4px;color:var(--text-dim)">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i === state.currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
  }
  html += `<button class="page-btn" onclick="changePage(${state.currentPage + 1})" ${state.currentPage === pages ? 'disabled' : ''}>›</button>`;
  container.innerHTML = html;
}

window.changePage = function(p) {
  const filtered = getFilteredTransactions();
  const pages = Math.ceil(filtered.length / state.perPage);
  if (p < 1 || p > pages) return;
  state.currentPage = p;
  renderTxTable();
};

// Sort columns
window.sortBy = function(col) {
  if (state.filters.sortBy === col) {
    state.filters.sortDir = state.filters.sortDir === 'asc' ? 'desc' : 'asc';
  } else {
    state.filters.sortBy = col;
    state.filters.sortDir = 'desc';
  }
  state.currentPage = 1;
  renderTxTable();
  updateSortIcons();
};

function updateSortIcons() {
  document.querySelectorAll('.tx-table th[data-sort]').forEach(th => {
    const col = th.dataset.sort;
    const icon = th.querySelector('.sort-icon');
    th.classList.toggle('sorted', col === state.filters.sortBy);
    if (icon) icon.textContent = col === state.filters.sortBy
      ? (state.filters.sortDir === 'asc' ? '▲' : '▼') : '⇅';
  });
}

// Filter events wired in HTML via onchange / oninput

window.onSearchChange = function(val) {
  state.filters.search = val;
  state.currentPage = 1;
  renderTxTable();
};

window.onTypeFilter = function(val) {
  state.filters.type = val;
  state.currentPage = 1;
  renderTxTable();
};

window.onCategoryFilter = function(val) {
  state.filters.category = val;
  state.currentPage = 1;
  renderTxTable();
};

window.onMonthFilter = function(val) {
  state.filters.month = val;
  state.currentPage = 1;
  renderTxTable();
};

// ── CRUD ─────────────────────────────────────────
window.deleteTransaction = function(id) {
  if (!confirm('Delete this transaction?')) return;
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveTransactions();
  renderAll();
  showToast('Transaction deleted', 'error');
};

// ── Modal ─────────────────────────────────────────
function initModal() {
  document.getElementById('modal-overlay')?.addEventListener('click', e => {
    if (e.target.id === 'modal-overlay') closeModal();
  });
}

window.openAddModal = function() {
  if (state.role !== 'admin') return;
  state.editingId = null;
  document.getElementById('modal-title').textContent = 'Add Transaction';
  document.getElementById('tx-form').reset();
  document.getElementById('tx-date').value = new Date().toISOString().slice(0, 10);
  openModal();
};

window.openEditModal = function(id) {
  if (state.role !== 'admin') return;
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  state.editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Transaction';
  document.getElementById('tx-desc').value     = tx.description;
  document.getElementById('tx-amount').value   = tx.amount;
  document.getElementById('tx-date').value     = tx.date;
  document.getElementById('tx-type').value     = tx.type;
  document.getElementById('tx-category').value = tx.category;
  openModal();
};

function openModal() {
  document.getElementById('modal-overlay').classList.add('open');
}

window.closeModal = function() {
  document.getElementById('modal-overlay').classList.remove('open');
  state.editingId = null;
};

window.saveTransaction = function() {
  const desc     = document.getElementById('tx-desc').value.trim();
  const amount   = parseFloat(document.getElementById('tx-amount').value);
  const date     = document.getElementById('tx-date').value;
  const type     = document.getElementById('tx-type').value;
  const category = document.getElementById('tx-category').value;

  if (!desc || !amount || !date || !type || !category) {
    showToast('Please fill all fields', 'error');
    return;
  }
  if (amount <= 0) {
    showToast('Amount must be positive', 'error');
    return;
  }

  if (state.editingId !== null) {
    const idx = state.transactions.findIndex(t => t.id === state.editingId);
    if (idx !== -1) {
      state.transactions[idx] = { ...state.transactions[idx], description: desc, amount, date, type, category };
    }
    showToast('Transaction updated ✓', 'success');
  } else {
    state.transactions.push({ id: genId(), description: desc, amount, date, type, category });
    showToast('Transaction added ✓', 'success');
  }

  saveTransactions();
  closeModal();
  renderAll();
};

// ── Export ───────────────────────────────────────
window.exportCSV = function() {
  const filtered = getFilteredTransactions();
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  const rows = filtered.map(t => [t.date, `"${t.description}"`, t.category, t.type, t.amount]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  downloadFile(csv, 'finflow-transactions.csv', 'text/csv');
  showToast('CSV exported ✓', 'success');
};

window.exportJSON = function() {
  const filtered = getFilteredTransactions();
  downloadFile(JSON.stringify(filtered, null, 2), 'finflow-transactions.json', 'application/json');
  showToast('JSON exported ✓', 'success');
};

window.exportPDF = function() {
  try {
    const { jsPDF } = window.jspdf;
    const filtered = getFilteredTransactions();
    
    if (filtered.length === 0) {
      showToast('No transactions to export', 'error');
      return;
    }
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 10;
    
    // ═══ HEADER SECTION ═══
    doc.setFillColor(52, 211, 153);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont(undefined, 'bold');
    doc.text('FinFlow', 15, 18);
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text('Financial Transaction Report', 15, 26);
    
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | ${new Date().toLocaleTimeString()}`, pageWidth - 15, 26, { align: 'right' });
    
    doc.setTextColor(0, 0, 0);
    yPos = 42;
    
    // ═══ SUMMARY CARDS ═══
    const stats = calculateSummaryStats(filtered);
    const cardWidth = 45;
    const cardHeight = 25;
    const cardX = [12, 65, 118];
    
    // Income Card
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(52, 211, 153);
    doc.rect(cardX[0], yPos, cardWidth, cardHeight, 'FD');
    doc.setTextColor(52, 211, 153);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL INCOME', cardX[0] + 3, yPos + 6);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(formatCurrencyPDF(stats.totalIncome), cardX[0] + 3, yPos + 18);
    
    // Expense Card
    doc.setFillColor(255, 243, 240);
    doc.setDrawColor(248, 113, 113);
    doc.rect(cardX[1], yPos, cardWidth, cardHeight, 'FD');
    doc.setTextColor(248, 113, 113);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('TOTAL EXPENSES', cardX[1] + 3, yPos + 6);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(formatCurrencyPDF(stats.totalExpenses), cardX[1] + 3, yPos + 18);
    
    // Balance Card
    doc.setFillColor(240, 251, 255);
    doc.setDrawColor(59, 130, 246);
    doc.rect(cardX[2], yPos, cardWidth, cardHeight, 'FD');
    doc.setTextColor(59, 130, 246);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(9);
    doc.text('NET BALANCE', cardX[2] + 3, yPos + 6);
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(formatCurrencyPDF(stats.balance), cardX[2] + 3, yPos + 18);
    
    yPos += 35;
    
    // ═══ CATEGORY BREAKDOWN ═══
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Category Breakdown', 15, yPos);
    yPos += 6;
    
    const catStats = {};
    filtered.forEach(t => {
      catStats[t.category] = (catStats[t.category] || 0) + t.amount;
    });
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(8);
    const cats = Object.entries(catStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
    
    cats.forEach((cat, idx) => {
      const pct = ((cat[1] / filtered.reduce((s, t) => s + t.amount, 0)) * 100).toFixed(1);
      doc.text(`• ${cat[0]}`, 15, yPos);
      doc.text(`${formatCurrencyPDF(cat[1])} (${pct}%)`, 80, yPos);
      yPos += 4;
    });
    
    yPos += 4;
    
    // ═══ TRANSACTIONS TABLE ═══
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text('Transaction Details', 15, yPos);
    yPos += 7;
    
    // Table Header
    doc.setFillColor(52, 211, 153);
    doc.setTextColor(255, 255, 255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(8);
    
    const colX = [15, 40, 85, 125, 155];
    const colW = [20, 40, 35, 25, 35];
    
    doc.rect(15, yPos - 4, 180, 5, 'F');
    doc.text('Date', colX[0], yPos);
    doc.text('Description', colX[1], yPos);
    doc.text('Category', colX[2], yPos);
    doc.text('Type', colX[3], yPos);
    doc.text('Amount', colX[4], yPos);
    
    yPos += 6;
    doc.setTextColor(0, 0, 0);
    doc.setFont(undefined, 'normal');
    
    // Table Rows with alternating colors
    filtered.forEach((t, idx) => {
      if (yPos > pageHeight - 15) {
        doc.addPage();
        yPos = 10;
      }
      
      // Alternating row background
      if (idx % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPos - 3, 180, 4.5, 'F');
      }
      
      // Color code by type
      if (t.type === 'income') {
        doc.setTextColor(34, 197, 94);
      } else {
        doc.setTextColor(220, 38, 38);
      }
      
      doc.setFontSize(8);
      doc.text(t.date, colX[0], yPos);
      doc.setTextColor(0, 0, 0);
      doc.text(t.description.substring(0, 20), colX[1], yPos);
      doc.text(t.category.substring(0, 12), colX[2], yPos);
      doc.text(t.type, colX[3], yPos);
      
      if (t.type === 'income') {
        doc.setTextColor(34, 197, 94);
      } else {
        doc.setTextColor(220, 38, 38);
      }
      doc.text(formatCurrencyPDF(t.amount), colX[4], yPos);
      
      yPos += 4.5;
    });
    
    // ═══ FOOTER ═══
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(7);
    doc.setFont(undefined, 'normal');
    doc.text('FinFlow © 2026 - Your Financial Companion', pageWidth / 2, pageHeight - 8, { align: 'center' });
    
    doc.save('finflow-transactions.pdf');
    showToast('PDF exported ✓', 'success');
  } catch (error) {
    console.error('PDF export error:', error);
    showToast('Error exporting PDF', 'error');
  }
};

function calculateSummaryStats(transactions) {
  const stats = {
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0
  };
  
  transactions.forEach(t => {
    if (t.type === 'income') {
      stats.totalIncome += t.amount;
    } else {
      stats.totalExpenses += t.amount;
    }
  });
  
  stats.balance = stats.totalIncome - stats.totalExpenses;
  return stats;
}

function formatCurrencyPDF(n) {
  return 'Rs. ' + Math.abs(n).toLocaleString('en-IN');
}

function downloadFile(content, filename, mime) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: mime }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// ══════════════════════════════════════════════════
// INSIGHTS SECTION
// ══════════════════════════════════════════════════
function renderInsights() {
  const txs = state.transactions;
  const expenses = txs.filter(t => t.type === 'expense');

  // Highest spending category
  const catMap = {};
  expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const topCat = Object.entries(catMap).sort((a, b) => b[1] - a[1])[0];

  setEl('insight-top-cat', topCat ? `${CATEGORY_ICONS[topCat[0]]} ${topCat[0]}` : '—');
  setEl('insight-top-cat-amt', topCat ? formatCurrency(topCat[1]) + ' spent' : '');

  // Avg monthly expense
  const monthExpMap = {};
  expenses.forEach(t => { const m = t.date.slice(0,7); monthExpMap[m] = (monthExpMap[m]||0) + t.amount; });
  const monthVals = Object.values(monthExpMap);
  const avgMonthly = monthVals.length ? Math.round(monthVals.reduce((s,v)=>s+v,0)/monthVals.length) : 0;
  setEl('insight-avg-monthly', formatCurrency(avgMonthly));
  setEl('insight-avg-sub', `across ${monthVals.length} month${monthVals.length!==1?'s':''}`);

  // Total transactions
  setEl('insight-tx-count', txs.length);
  setEl('insight-tx-sub', `${txs.filter(t=>t.type==='income').length} income · ${txs.filter(t=>t.type==='expense').length} expense`);

  // Savings rate
  const { totalIncome, savings } = computeStats(txs);
  const savRate = totalIncome > 0 ? ((savings/totalIncome)*100).toFixed(1) : '0.0';
  setEl('insight-savings-rate', `${savRate}%`);
  setEl('insight-savings-sub', `${formatCurrency(savings)} saved of ${formatCurrency(totalIncome)} earned`);

  // Monthly breakdown table
  renderMonthlyTable();

  // Category breakdown chart
  renderCategoryBarChart();
}

function renderMonthlyTable() {
  const months = [...new Set(state.transactions.map(t => t.date.slice(0,7)))].sort().reverse();
  const tbody = document.getElementById('monthly-tbody');
  if (!tbody) return;

  if (months.length === 0) {
    tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:20px">No data</td></tr>`;
    return;
  }

  const maxExp = Math.max(...months.map(m =>
    state.transactions.filter(t => t.date.startsWith(m) && t.type === 'expense').reduce((s,t)=>s+t.amount,0)
  ));

  tbody.innerHTML = months.map(m => {
    const inc = state.transactions.filter(t => t.date.startsWith(m) && t.type === 'income').reduce((s,t)=>s+t.amount,0);
    const exp = state.transactions.filter(t => t.date.startsWith(m) && t.type === 'expense').reduce((s,t)=>s+t.amount,0);
    const net = inc - exp;
    const pct = maxExp > 0 ? Math.round((exp/maxExp)*100) : 0;
    const label = new Date(m+'-01').toLocaleDateString('en-IN',{month:'short',year:'numeric'});
    return `
      <tr>
        <td style="font-weight:600;color:var(--text)">${label}</td>
        <td style="color:var(--green)">${formatCurrency(inc)}</td>
        <td>
          <div>${formatCurrency(exp)}</div>
          <div class="progress-bar" style="width:120px">
            <div class="progress-fill" style="width:${pct}%;background:var(--red)"></div>
          </div>
        </td>
        <td style="font-weight:700;color:${net>=0?'var(--green)':'var(--red)'}">${net>=0?'+':''}${formatCurrency(net)}</td>
      </tr>
    `;
  }).join('');
}

function renderCategoryBarChart() {
  const catMap = {};
  state.transactions.filter(t=>t.type==='expense').forEach(t => {
    catMap[t.category] = (catMap[t.category]||0)+t.amount;
  });
  const sorted = Object.entries(catMap).sort((a,b)=>b[1]-a[1]);
  const labels = sorted.map(([c])=>c);
  const data   = sorted.map(([,v])=>v);
  const colors = labels.map(l=>CATEGORY_COLORS[l]||'#888');

  const ctx = document.getElementById('cat-bar-chart');
  if (!ctx) return;
  if (state.charts.catBar) state.charts.catBar.destroy();

  const isLight = state.theme === 'light';
  const tickColor = isLight ? '#6B7280' : '#7B82A0';
  const gridColor = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  state.charts.catBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.map(c=>c+'BB'),
        borderColor: colors,
        borderWidth: 1.5,
        borderRadius: 6,
        borderSkipped: false,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isLight ? '#fff' : '#1F2333',
          borderColor: isLight ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          callbacks: { label: c => ` ${formatCurrency(c.raw)}` }
        }
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: {
            color: tickColor,
            font: { family: 'DM Sans', size: 11 },
            callback: v => '₹' + (v>=1000?(v/1000).toFixed(0)+'k':v),
          }
        },
        y: {
          grid: { display: false },
          ticks: { color: tickColor, font: { family: 'DM Sans', size: 12 } }
        }
      }
    }
  });
}

// ── Utilities ────────────────────────────────────
function setEl(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Toast ────────────────────────────────────────
function showToast(msg, type = 'info') {
  const t = document.getElementById('toast');
  if (!t) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}
