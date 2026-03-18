import { useState, useEffect, useCallback } from 'react';
import CSVUploader from './CSVUploader';
import ManualEntryForm from './ManualEntryForm';
import UploadHistory from './UploadHistory';
import {
  getOrdersSummary,
  getFootfall,
  submitFootfall,
  trainModels,
  getMLStatus,
} from '../../services/api';

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

function SectionHeading({ children }) {
  return (
    <h3 className="text-base font-semibold text-gray-900 mb-3">{children}</h3>
  );
}

// ─── Data Summary Card ──────────────────────────────────────────────────────

function DataSummaryCard({ summary, loading, error }) {
  if (loading) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading data summary...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-5">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  const hasData = summary && (summary.total_rows > 0 || summary.total_bills > 0);

  if (!hasData) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-5 text-center">
        <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
        </svg>
        <p className="mt-2 text-sm text-gray-500">No orders data. Upload a CSV to get started.</p>
      </div>
    );
  }

  const stats = [
    { label: 'Total Bills', value: summary.total_bills ?? 0 },
    { label: 'Total Rows', value: summary.total_rows ?? 0 },
    { label: 'Categories', value: summary.categories_count ?? 0 },
    {
      label: 'Date Range',
      value:
        summary.date_from && summary.date_to
          ? `${formatDate(summary.date_from)} - ${formatDate(summary.date_to)}`
          : '--',
    },
  ];

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Data Summary</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{stat.label}</p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Footfall Section ───────────────────────────────────────────────────────

function FootfallSection({ storeId, footfallData, setFootfallData, loadingFootfall }) {
  const [showForm, setShowForm] = useState(false);
  const [weekStart, setWeekStart] = useState('');
  const [weeklyCount, setWeeklyCount] = useState('');
  const [enteredBy, setEnteredBy] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const resetForm = useCallback(() => {
    setWeekStart('');
    setWeeklyCount('');
    setEnteredBy('');
    setSubmitError('');
  }, []);

  const handleAdd = useCallback(async () => {
    if (!weekStart || !weeklyCount || !enteredBy.trim()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      await submitFootfall(storeId, weekStart, Number(weeklyCount), enteredBy.trim());

      // Refresh footfall list
      const response = await getFootfall(storeId);
      const data = response.data;
      setFootfallData(Array.isArray(data) ? data : data.footfall || []);

      resetForm();
      setShowForm(false);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to save footfall.';
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }, [storeId, weekStart, weeklyCount, enteredBy, setFootfallData, resetForm]);

  const isFormValid = weekStart && weeklyCount && Number(weeklyCount) > 0 && enteredBy.trim();

  if (loadingFootfall) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading footfall data...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {footfallData.length === 0 ? (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-5 text-center">
          <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">
            No footfall entered. Add weekly footfall to enable planogram generation.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Week Start</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Weekly Count</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entered By</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {footfallData.map((entry, idx) => (
                  <tr key={entry.id || idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                      {formatDate(entry.week_start || entry.SK)}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900 tabular-nums whitespace-nowrap">
                      {Number(entry.weekly_count)?.toLocaleString() ?? '--'}
                    </td>
                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">
                      {entry.entered_by || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Footfall Toggle / Form */}
      {!showForm ? (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Footfall
        </button>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-blue-900">New Footfall Entry</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Week Start</label>
              <input
                type="date"
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Weekly Count</label>
              <input
                type="number"
                min="1"
                value={weeklyCount}
                onChange={(e) => setWeeklyCount(e.target.value)}
                placeholder="e.g. 450"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Entered By</label>
              <input
                type="text"
                value={enteredBy}
                onChange={(e) => setEnteredBy(e.target.value)}
                placeholder="Your name"
                className="block w-full rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {submitError && (
            <p className="text-sm text-red-600">{submitError}</p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!isFormValid || submitting}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ML Training Section ─────────────────────────────────────────────────────

function MLStatusCard({ label, model, status }) {
  const trained = status?.trained;
  return (
    <div className={`rounded-lg border p-3 ${trained ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-700">{label}</span>
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${trained ? 'bg-green-200 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
          {trained ? 'Complete' : 'Not Run'}
        </span>
      </div>
      <p className="text-[11px] text-gray-500">{model}</p>
      {trained && status.trained_at && (
        <p className="text-[10px] text-gray-400 mt-1">
          {formatDate(status.trained_at)}
        </p>
      )}
      {trained && status.pairs_count != null && (
        <p className="text-[10px] text-gray-400">{status.pairs_count} pairs</p>
      )}
      {trained && status.categories_count != null && (
        <p className="text-[10px] text-gray-400">{status.categories_count} categories</p>
      )}
    </div>
  );
}

function MLTrainingSection({ storeId, hasOrders, hasFootfall }) {
  const [mlStatus, setMlStatus] = useState(null);
  const [training, setTraining] = useState(false);
  const [trainError, setTrainError] = useState('');
  const [trainSuccess, setTrainSuccess] = useState('');
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchMLStatus = useCallback(async () => {
    if (!storeId) return;
    setLoadingStatus(true);
    try {
      const response = await getMLStatus(storeId);
      setMlStatus(response.data);
    } catch {
      setMlStatus(null);
    } finally {
      setLoadingStatus(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchMLStatus();
  }, [fetchMLStatus]);

  const handleTrain = useCallback(async () => {
    setTraining(true);
    setTrainError('');
    setTrainSuccess('');
    try {
      const response = await trainModels(storeId);
      const data = response.data;
      setTrainSuccess(
        `Analysis complete: ${data.adjacency_pairs} purchase patterns, ` +
        `${data.seasonal_categories} seasonal trends, ` +
        `${data.conversion_categories} conversion categories.`
      );
      fetchMLStatus();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        err.message ||
        'Training failed.';
      setTrainError(message);
    } finally {
      setTraining(false);
    }
  }, [storeId, fetchMLStatus]);

  const canTrain = hasOrders && hasFootfall;
  const allTrained = mlStatus?.adjacency?.trained && mlStatus?.seasonal?.trained && mlStatus?.conversion?.trained;

  return (
    <div className="space-y-3">
      {/* Status Cards */}
      {loadingStatus ? (
        <div className="flex items-center gap-2 py-4 text-sm text-gray-500">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading analysis status...
        </div>
      ) : mlStatus ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <MLStatusCard label="Adjacency" model="Purchase Pattern Analysis" status={mlStatus.adjacency} />
          <MLStatusCard label="Seasonal" model="Seasonal Trend Analysis" status={mlStatus.seasonal} />
          <MLStatusCard label="Conversion" model="Sales Prediction" status={mlStatus.conversion} />
        </div>
      ) : (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-5 text-center">
          <p className="text-sm text-gray-500">
            Sales data not analysed. Upload data then run analysis to enable planogram generation.
          </p>
        </div>
      )}

      {/* Success / Error */}
      {trainSuccess && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm text-green-700">{trainSuccess}</p>
        </div>
      )}
      {trainError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{trainError}</p>
        </div>
      )}

      {/* Train Button */}
      <button
        type="button"
        onClick={handleTrain}
        disabled={!canTrain || training}
        className="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {training ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analysing Sales Data...
          </>
        ) : allTrained ? (
          'Re-analyse Sales Data'
        ) : (
          'Analyse Sales Data'
        )}
      </button>
      {!canTrain && (
        <p className="text-xs text-gray-400">Upload orders and footfall data before running analysis.</p>
      )}
    </div>
  );
}

// ─── Main Screen ────────────────────────────────────────────────────────────

const TAB_CSV = 'csv';
const TAB_MANUAL = 'manual';

export default function DataUploadScreen({ storeId, onContinue }) {
  const [activeTab, setActiveTab] = useState(TAB_CSV);

  // Orders summary
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Footfall
  const [footfallData, setFootfallData] = useState([]);
  const [footfallLoading, setFootfallLoading] = useState(false);

  // History refresh key
  const [historyKey, setHistoryKey] = useState(0);

  const fetchSummary = useCallback(async () => {
    if (!storeId) return;
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const response = await getOrdersSummary(storeId);
      setSummary(response.data);
    } catch (err) {
      const message =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to load data summary.';
      setSummaryError(message);
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [storeId]);

  const fetchFootfall = useCallback(async () => {
    if (!storeId) return;
    setFootfallLoading(true);
    try {
      const response = await getFootfall(storeId);
      const data = response.data;
      setFootfallData(Array.isArray(data) ? data : data.footfall || []);
    } catch {
      setFootfallData([]);
    } finally {
      setFootfallLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    fetchSummary();
    fetchFootfall();
  }, [fetchSummary, fetchFootfall]);

  const handleUploadSuccess = useCallback(() => {
    fetchSummary();
    setHistoryKey((k) => k + 1);
  }, [fetchSummary]);

  const handleManualSuccess = useCallback(() => {
    fetchSummary();
    setHistoryKey((k) => k + 1);
  }, [fetchSummary]);

  // ML status
  const [mlStatus, setMlStatus] = useState(null);

  const fetchMLStatus = useCallback(async () => {
    if (!storeId) return;
    try {
      const response = await getMLStatus(storeId);
      setMlStatus(response.data);
    } catch {
      setMlStatus(null);
    }
  }, [storeId]);

  useEffect(() => {
    fetchMLStatus();
  }, [fetchMLStatus]);

  const hasOrders = summary && (summary.total_rows > 0 || summary.total_bills > 0);
  const hasFootfall = footfallData.length > 0;
  const mlTrained = mlStatus?.adjacency?.trained && mlStatus?.seasonal?.trained && mlStatus?.conversion?.trained;
  const canContinue = hasOrders && hasFootfall && mlTrained;

  const tabs = [
    { key: TAB_CSV, label: 'Upload CSV' },
    { key: TAB_MANUAL, label: 'Manual Entry' },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Data Management</h2>
        <p className="mt-1 text-sm text-gray-500">
          Upload order data and weekly footfall to generate your planogram.
        </p>
      </div>

      {/* Data Summary Card */}
      <DataSummaryCard summary={summary} loading={summaryLoading} error={summaryError} />

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-6" aria-label="Data input tabs">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-5">
          {activeTab === TAB_CSV ? (
            <CSVUploader storeId={storeId} onUploadSuccess={handleUploadSuccess} />
          ) : (
            <ManualEntryForm storeId={storeId} onSubmitSuccess={handleManualSuccess} />
          )}
        </div>
      </div>

      {/* Footfall Section */}
      <div>
        <SectionHeading>Weekly Footfall</SectionHeading>
        <FootfallSection
          storeId={storeId}
          footfallData={footfallData}
          setFootfallData={setFootfallData}
          loadingFootfall={footfallLoading}
        />
      </div>

      {/* Sales Analysis */}
      <div>
        <SectionHeading>Sales Analysis</SectionHeading>
        <MLTrainingSection storeId={storeId} hasOrders={hasOrders} hasFootfall={hasFootfall} />
      </div>

      {/* Upload History */}
      <div>
        <SectionHeading>Upload History</SectionHeading>
        <UploadHistory key={historyKey} storeId={storeId} />
      </div>

      {/* Continue Button */}
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div>
          {!canContinue && (
            <p className="text-sm text-gray-500">
              {!hasOrders && !hasFootfall
                ? 'Upload orders and add footfall to continue.'
                : !hasOrders
                ? 'Upload orders data to continue.'
                : !hasFootfall
                ? 'Add footfall data to continue.'
                : !mlTrained
                ? 'Run sales analysis to continue.'
                : 'Complete all steps to continue.'}
            </p>
          )}
          {canContinue && (
            <p className="text-sm text-green-700 font-medium">
              All data ready. You can proceed to planogram setup.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onContinue}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Continue
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </button>
      </div>
    </div>
  );
}
