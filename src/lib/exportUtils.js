/**
 * exportUtils.js
 * 
 * Helpers for formatting and downloading data in various formats.
 */

/**
 * today()
 * Returns YYYY-MM-DD for filenames.
 */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * downloadFile(blob, filename)
 * Tries the File System Access API first, falls back to anchor download.
 */
export async function downloadFile(blob, filename) {
  if (window.showSaveFilePicker) {
    try {
      const ext = filename.split('.').pop();
      const mimeMap = {
        json: { description: 'JSON Files', accept: { 'application/json': ['.json'] } },
        csv: { description: 'CSV Files', accept: { 'text/csv': ['.csv'] } },
        xlsx: { description: 'Excel Files', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } },
      };
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: mimeMap[ext] ? [mimeMap[ext]] : [],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return true;
    } catch (e) {
      if (e.name === 'AbortError') return false;
      console.warn('showSaveFilePicker failed, trying fallback:', e);
    }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 2000);
    return true;
  } catch (e) {
    console.error('Download failed:', e);
    return false;
  }
}

/**
 * formatCSV(transactions, categories)
 * Maps data to a CSV string.
 */
export function formatCSV(transactions, categories) {
  const catMap = Object.fromEntries((categories || []).map(c => [c.id, c.name]));
  const rows = [
    ['Date', 'Type', 'Category', 'Amount', 'Notes', 'Added By', 'Recurring'],
    ...transactions.map(t => [
      t.date,
      t.type,
      catMap[t.categoryId] || t.categoryId,
      t.amount,
      t.notes ?? '',
      t.addedBy ?? '',
      t.isRecurring ? 'Yes' : 'No',
    ]),
  ];
  const csv = rows.map(r =>
    r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ).join('\r\n');
  return '\uFEFF' + csv; // BOM for Excel compat
}

/**
 * mapExcelData(transactions, categories)
 * Prepares data for XLSX.
 */
export function mapExcelData(transactions, categories) {
  const catMap = Object.fromEntries((categories || []).map(c => [c.id, c]));

  const txRows = transactions.map(t => {
    const cat = catMap[t.categoryId];
    return {
      Date: t.date,
      Type: t.type?.charAt(0).toUpperCase() + t.type?.slice(1),
      Category: cat?.name || 'Unknown',
      Amount: t.amount,
      Notes: t.notes || '',
      'Added By': t.addedBy || '',
      Recurring: t.isRecurring ? 'Yes' : 'No',
      'Created At': t.createdAt || '',
    };
  });

  const catRows = categories.map(c => ({
    Name: c.name,
    Emoji: c.emoji,
    Type: c.type?.charAt(0).toUpperCase() + c.type?.slice(1),
    Color: c.color,
    'Budget Limit': c.budgetLimit || '',
    'Is Bank': c.isBank ? 'Yes' : 'No',
    'Bank Name': c.bankName || '',
    'APR (%)': c.apr || '',
    'Daily Interest': c.isDailyInterest ? 'Yes' : 'No',
  }));

  const totals = transactions.reduce((acc, t) => {
    if (t.type === 'income') acc.income += t.amount;
    if (t.type === 'expense') acc.expenses += t.amount;
    if (t.type === 'savings') acc.savings += t.amount;
    return acc;
  }, { income: 0, expenses: 0, savings: 0 });

  const summaryRows = [
    { Metric: 'Total Income', Value: totals.income },
    { Metric: 'Total Expenses', Value: totals.expenses },
    { Metric: 'Total Savings', Value: totals.savings },
    { Metric: 'Money on Hand', Value: totals.income - totals.expenses - totals.savings },
    { Metric: 'Net Worth', Value: totals.income - totals.expenses },
    { Metric: 'Total Transactions', Value: transactions.length },
    { Metric: 'Total Categories', Value: categories.length },
    { Metric: 'Export Date', Value: new Date().toLocaleDateString() },
  ];

  return { txRows, catRows, summaryRows };
}
