/**
 * Categories.jsx
 *
 * Page for managing transaction categories.
 *
 * Features:
 *   - Filter by type tab (All / Expense / Income / Savings)
 *   - Per-category budget usage bar (expense categories with a budgetLimit set)
 *   - Edit and delete with a confirmation modal for deletes
 *   - Toast notifications that include the category name
 *
 * Props:
 *   categories    - category array from useCategories
 *   transactions  - transaction array (used to compute monthly spend per category)
 *   onAdd(cat)    - creates a new category
 *   onUpdate(cat) - updates an existing category by id
 *   onDelete(id)  - deletes a category by id
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import CategoryForm from '../components/CategoryForm';
import { useToast } from '../components/Toast';
import { useApp } from '../contexts/AppContext';

const TYPE_COLOR  = { expense: 'var(--expense)', income: 'var(--income)', savings: 'var(--savings)' };
const TYPE_LABELS = { expense: '💸 Expense', income: '💰 Income', savings: '🏦 Savings' };

export default function Categories({ categories, transactions, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [editing,  setEditing]  = useState(null);
  const [deleting, setDeleting] = useState(null); // stores the category id to delete
  const [typeTab,  setTypeTab]  = useState('all');
  const toast = useToast();
  const { fmt } = useApp();


  const filtered = typeTab === 'all' ? categories : categories.filter(c => c.type === typeTab);

  async function handleSave(cat) {
    if (cat.id) { await onUpdate(cat); toast(`Category '${cat.name}' updated ✓`, 'success'); }
    else        { await onAdd(cat);    toast(`Category '${cat.name}' created ✓`, 'success'); }
    setShowForm(false); setEditing(null);
  }

  async function handleDeleteConfirm() {
    if (!deleting) return;
    await onDelete(deleting.id);
    toast(`Category '${deleting.name}' deleted`, 'info');
    setDeleting(null);
  }

  // Compute this month's spend per category for budget progress bars.
  const spendByCategory = {};
  const thisMonth = new Date().toISOString().slice(0, 7);
  transactions.filter(t => t.type === 'expense' && t.date.startsWith(thisMonth))
    .forEach(t => { spendByCategory[t.categoryId] = (spendByCategory[t.categoryId] || 0) + t.amount; });

  return (
    <div className="page fade-up">
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Categories</h1>
          <p>Organise your budget with custom icons, colors & limits</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setShowForm(true); }}>
          <Plus size={16} /> New Category
        </button>
      </div>

      <div className="filter-bar" style={{ marginBottom: 20 }}>
        {['all','expense','income','savings'].map(t => (
          <button key={t} className={`filter-chip ${typeTab === t ? 'active' : ''}`} onClick={() => setTypeTab(t)}>
            {t === 'all' ? 'All' : TYPE_LABELS[t]}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} categories</span>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-icon">🏷️</div>
          <p>No categories here yet.</p>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}><Plus size={14} /> Create one</button>
        </div>
      ) : (
        <div className="grid-3">
          {filtered.map(cat => {
            const spent = spendByCategory[cat.id] || 0;
            const limit = cat.budgetLimit;
            const pct   = limit ? Math.min(100, (spent / limit) * 100) : null;
            const budgetCls = pct === null ? '' : pct >= 100 ? 'budget-exceed' : pct >= 80 ? 'budget-warn' : 'budget-ok';

            return (
              <div key={cat.id} className="category-card" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="category-emoji" style={{ background: `${cat.color}22`, border: `1px solid ${cat.color}44` }}>
                    {cat.emoji}
                  </div>
                  <div className="category-info">
                    <div className="category-name">{cat.name}</div>
                    <div className="category-type" style={{ color: TYPE_COLOR[cat.type] }}>
                      {TYPE_LABELS[cat.type] ?? cat.type}
                    </div>
                    {cat.isBank && cat.bankName && <div className="bank-badge" style={{ marginTop: 4 }}>🏦 {cat.bankName}</div>}
                    {cat.isBank && cat.apr > 0 && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{cat.apr}% APR{cat.isDailyInterest ? ' · daily' : ' · monthly'}</div>}
                  </div>
                  <div className="category-actions">
                    <button className="btn-icon" onClick={() => { setEditing(cat); setShowForm(true); }} title="Edit"><Edit2 size={13} /></button>
                    <button className="btn-icon" style={{ color: 'var(--expense)' }} onClick={() => setDeleting(cat)} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Budget limit bar */}
                {limit && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Monthly budget</span>
                      <span className={budgetCls}>{fmt(spent)} / {fmt(limit)}</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{
                        width: `${pct}%`,
                        background: pct >= 100 ? 'var(--expense)' : pct >= 80 ? 'var(--amber)' : 'var(--income)',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <CategoryForm onSave={handleSave} onClose={() => { setShowForm(false); setEditing(null); }} initial={editing} />
      )}

      {deleting && createPortal(
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDeleting(null)}>
          <div className="modal" style={{ maxWidth: 360 }}>
            <div className="modal-header">
              <h3 style={{ color: 'var(--expense)' }}>Delete Category?</h3>
            </div>
            <p style={{ marginBottom: 20 }}>Are you sure you want to delete the category <strong>'{deleting.name}'</strong>? This action cannot be undone.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-ghost" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm}>
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
