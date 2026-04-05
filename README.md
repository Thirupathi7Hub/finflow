# 💹 FinFlow — Finance Dashboard

A clean, interactive, and fully responsive Finance Dashboard built with **vanilla HTML, CSS, and JavaScript** — no frameworks, no build tools, just open and run.

---

## 🚀 Quick Start

No installation needed. Just open the file:

```
finflow/
└── index.html   ← open this in any browser


## 📁 Project Structure

finflow/
├── index.html             
├── css/
│   └── style.css       
├── js/
│   └── app.js             
├── data/
│   └── transactions.js     
└── README.md

## ✨ Features

### 1. Dashboard Overview

- ** summary cards** — Total Balance, Income, Expenses, Net Savings with savings rate
- **Bar + Line combo chart** — Monthly income vs expenses with balance trend line
- **Donut chart** — Spending breakdown by category with custom legend
- **Recent Activity** — Latest 5 transactions with category icons

### 2. Transactions

- **Full transaction table** with date, description, category, type, amount
- **Search** — Live search across description, category, amount
- **Filters** — By type (income/expense), category, and month
- **Sorting** — Click column headers to sort by description or amount (asc/desc)
- **Pagination** — 8 per page with smart page number display
- **Add / Edit / Delete** — Full CRUD (Admin role only)
- **Export** — Download filtered data as CSV or JSON or PDF

### 3. Role-Based UI (RBAC)
Switch roles from the sidebar dropdown:

| Feature           | Admin 🔑 | Viewer 👁️ |

| View all data           | ✅ | ✅ |
| Add transaction         | ✅ | ❌ |
| Edit transaction        | ✅ | ❌ |
| Delete transaction      | ✅ | ❌ |
| Export data             | ✅ | ✅ |

### 4. Insights

- **Top spending category** — Highest expense category by total
- **Average monthly spend** — Mean expense across all months
- **Transaction count** — Total, income count, expense count
- **Savings rate** — Percentage of income saved
- **Monthly breakdown table** — Income, expense, net per month with visual progress
- **Category bar chart** — Horizontal bar chart ranked by spend

### 5. State Management

All state is managed in a single `state` object in `app.js`:

const state = {
  transactions: [],   // Full dataset
  role: 'admin',      // Current role
  theme: 'dark',      // UI theme
  filters: { ... },   // Search, type, category, month, sort
  currentPage: 1,     // Pagination
  editingId: null,    // Modal context
  charts: {},         // Chart.js instances
};


### 6. Optional Enhancements Implemented

- ✅ **Dark / Light mode** — Toggle in sidebar, persisted to localStorage
- ✅ **Data persistence** — All transactions saved to localStorage
- ✅ **Export** — CSV and JSON export of filtered transactions
- ✅ **Animations** — Page transitions, card hover effects, toast notifications, modal animations
- ✅ **Advanced filtering** — Multi-filter (type + category + month + search) with real-time results

## 🎨 Design Decisions

- **Dark-first aesthetic** with a deep navy/slate palette and vivid accent colors
- Category color system used consistently across badges, charts, and icons
- Fully responsive — sidebar collapses on mobile with hamburger menu
- Toast notifications for all user actions (add, edit, delete, export)
- Empty state handling in table and charts

---

## 🛠️ Tech Stack

| Framework | JS (ES6+) |
| Styling | Custom CSS with CSS variables |
| Charts | Chart.js 4.4 (CDN) |
| Fonts | Google Fonts (Sora + DM Sans) |
| Persistence | localStorage |
| Build | None — zero dependencies |

Works in all modern browsers: Chrome, Firefox, Safari, Edge.

