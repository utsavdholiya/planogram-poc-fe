import { useState, useEffect, useCallback } from 'react';
import { getOrdersHistory } from '../../services/api';

function formatDate(dateStr) {
  if (!dateStr) return '--';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function StatusBadge({ status }) {
  const normalized = (status || '').toLowerCase();

  const styles = {
    completed: 'bg-green-100 text-green-800',
    success: 'bg-green-100 text-green-800',
    partial: 'bg-amber-100 text-amber-800',
    failed: 'bg-red-100 text-red-800',
    error: 'bg-red-100 text-red-800',
    processing: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-700',
  };

  const colorClass = styles[normalized] || 'bg-gray-100 text-gray-700';

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}>
      {status || 'Unknown'}
    </span>
  );
}

export default function UploadHistory({ storeId }) {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchHistory = useCallback(async () => {
    if (!storeId) return;

    setLoading(true);
    setError('');

    try {
      const response = await getOrdersHistory(storeId);
      const data = response.data;
      setBatches(Array.isArray(data) ? data : data.batches || []);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load upload history.';
      setError(message);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <svg className="animate-spin h-5 w-5 text-gray-400 mr-2" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm text-gray-500">Loading upload history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <div className="flex">
          <svg className="h-5 w-5 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-700">{error}</p>
            <button
              type="button"
              onClick={fetchHistory}
              className="mt-2 text-sm font-medium text-red-700 underline hover:text-red-800"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 p-6 text-center">
        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="mt-2 text-sm text-gray-500">No upload history</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rejected</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date From</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date To</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {batches.map((batch, idx) => (
              <tr key={batch.id || idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2 text-gray-900 font-medium whitespace-nowrap">
                  {batch.filename || 'Manual Entry'}
                </td>
                <td className="px-4 py-2 text-right text-gray-700 whitespace-nowrap tabular-nums">
                  {batch.rows_uploaded ?? '--'}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap tabular-nums">
                  <span className={(batch.rows_rejected ?? 0) > 0 ? 'text-amber-600 font-medium' : 'text-gray-500'}>
                    {batch.rows_rejected ?? 0}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {formatDate(batch.date_range_from)}
                </td>
                <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                  {formatDate(batch.date_range_to)}
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <StatusBadge status={batch.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
