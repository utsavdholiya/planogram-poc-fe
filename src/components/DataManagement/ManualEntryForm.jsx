import { useState, useMemo, useCallback } from 'react';
import { submitManualOrders } from '../../services/api';
import skus from '../../data/skus.json';

function buildCategoryMap() {
  const map = {};
  skus.forEach((sku) => {
    if (!map[sku.cat_id]) {
      map[sku.cat_id] = {
        cat_id: sku.cat_id,
        category: sku.category,
        skus: [],
      };
    }
    map[sku.cat_id].skus.push(sku);
  });
  return map;
}

const CATEGORY_MAP = buildCategoryMap();
const CATEGORIES = Object.values(CATEGORY_MAP).sort((a, b) =>
  a.category.localeCompare(b.category)
);

function todayString() {
  return new Date().toISOString().split('T')[0];
}

const EMPTY_ROW = {
  cat_id: '',
  sku_id: '',
  units_sold: 1,
};

export default function ManualEntryForm({ storeId, onSubmitSuccess }) {
  const [billNo, setBillNo] = useState('');
  const [date, setDate] = useState(todayString());
  const [rows, setRows] = useState([{ ...EMPTY_ROW }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitResult, setSubmitResult] = useState(null);

  const updateRow = useCallback((index, field, value) => {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };

      // Reset sku_id when category changes
      if (field === 'cat_id') {
        next[index].sku_id = '';
      }
      return next;
    });
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, { ...EMPTY_ROW }]);
  }, []);

  const removeRow = useCallback((index) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const skusForRow = useCallback((catId) => {
    if (!catId || !CATEGORY_MAP[catId]) return [];
    return CATEGORY_MAP[catId].skus;
  }, []);

  const isFormValid = useMemo(() => {
    if (!billNo.trim()) return false;
    if (!date) return false;
    return rows.every(
      (row) =>
        row.cat_id &&
        row.sku_id &&
        row.units_sold >= 1 &&
        Number.isInteger(Number(row.units_sold))
    );
  }, [billNo, date, rows]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid) return;

    setSubmitting(true);
    setSubmitError('');
    setSubmitResult(null);

    const orders = rows.map((row) => ({
      bill_no: billNo.trim(),
      date,
      store_id: storeId,
      cat_id: row.cat_id,
      sku_id: row.sku_id,
      units_sold: Number(row.units_sold),
    }));

    try {
      const response = await submitManualOrders(storeId, orders);
      const result = response.data;
      setSubmitResult(result);

      // Reset form after success
      setBillNo('');
      setDate(todayString());
      setRows([{ ...EMPTY_ROW }]);

      if (onSubmitSuccess) {
        onSubmitSuccess(result);
      }
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to submit orders. Please try again.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }, [isFormValid, billNo, date, storeId, rows, onSubmitSuccess]);

  return (
    <div className="space-y-5">
      {/* Bill Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bill-no" className="block text-sm font-medium text-gray-700 mb-1">
            Bill No.
          </label>
          <input
            id="bill-no"
            type="text"
            value={billNo}
            onChange={(e) => setBillNo(e.target.value)}
            placeholder="e.g. INV-028"
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="bill-date" className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <input
            id="bill-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Line Items</h4>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Row
          </button>
        </div>

        {rows.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-[1fr_1fr_80px_36px] gap-2 items-end rounded-md border border-gray-200 bg-gray-50 p-3"
          >
            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Category
              </label>
              <select
                value={row.cat_id}
                onChange={(e) => updateRow(idx, 'cat_id', e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                <option value="">Select category...</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.cat_id} value={cat.cat_id}>
                    {cat.category}
                  </option>
                ))}
              </select>
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                SKU
              </label>
              <select
                value={row.sku_id}
                onChange={(e) => updateRow(idx, 'sku_id', e.target.value)}
                disabled={!row.cat_id}
                className="block w-full rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
              >
                <option value="">Select SKU...</option>
                {skusForRow(row.cat_id).map((sku) => (
                  <option key={sku.sku_id} value={sku.sku_id}>
                    {sku.sku_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Units */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Units
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={row.units_sold}
                onChange={(e) => updateRow(idx, 'units_sold', e.target.value)}
                className="block w-full rounded-md border border-gray-300 px-2.5 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Remove */}
            <button
              type="button"
              onClick={() => removeRow(idx)}
              disabled={rows.length <= 1}
              title="Remove row"
              className="flex items-center justify-center h-[34px] w-[34px] rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:hover:text-gray-400 disabled:hover:bg-transparent transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Summary Table */}
      {rows.some((r) => r.sku_id) && (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700">Order Summary</h4>
          </div>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows
                .filter((r) => r.sku_id)
                .map((row, idx) => {
                  const sku = skus.find((s) => s.sku_id === row.sku_id);
                  const cat = CATEGORY_MAP[row.cat_id];
                  return (
                    <tr key={idx}>
                      <td className="px-3 py-1.5 text-gray-700">{cat?.category ?? row.cat_id}</td>
                      <td className="px-3 py-1.5 text-gray-900">{sku?.sku_name ?? row.sku_id}</td>
                      <td className="px-3 py-1.5 text-right text-gray-900">{row.units_sold}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isFormValid || submitting}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting...
            </>
          ) : (
            'Submit All'
          )}
        </button>
      </div>

      {/* Submit Error */}
      {submitError && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
            </svg>
            <p className="ml-3 text-sm text-red-700">{submitError}</p>
          </div>
        </div>
      )}

      {/* Submit Success */}
      {submitResult && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">Orders submitted successfully!</p>
              {submitResult.rows_inserted !== undefined && (
                <p className="mt-1 text-sm text-green-700">
                  {submitResult.rows_inserted} row{submitResult.rows_inserted !== 1 ? 's' : ''} inserted.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
