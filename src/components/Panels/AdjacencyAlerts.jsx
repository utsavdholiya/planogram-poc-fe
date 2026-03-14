import React from "react";

function CheckIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.86A1 1 0 002.56 20h18.88a1 1 0 00.87-1.28l-8.6-14.86a1 1 0 00-1.72 0z"
      />
    </svg>
  );
}

function AlertItem({ alert }) {
  const isSatisfied = alert.type === "satisfied";

  return (
    <div
      className={`flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-xs ${
        isSatisfied
          ? "bg-green-50 text-green-800 border border-green-200"
          : "bg-amber-50 text-amber-800 border border-amber-200"
      }`}
    >
      <span className={`mt-0.5 ${isSatisfied ? "text-green-500" : "text-amber-500"}`}>
        {isSatisfied ? <CheckIcon /> : <WarningIcon />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold truncate">{alert.pair || "Unknown pair"}</span>
          {alert.frequency_pct != null && (
            <span
              className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ${
                isSatisfied
                  ? "bg-green-200 text-green-700"
                  : "bg-amber-200 text-amber-700"
              }`}
            >
              {alert.frequency_pct}%
            </span>
          )}
        </div>
        {alert.message && (
          <p className="mt-0.5 text-[11px] opacity-80 leading-snug">{alert.message}</p>
        )}
      </div>
    </div>
  );
}

export default function AdjacencyAlerts({ alerts }) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-sm text-gray-400 text-center py-3">
          No adjacency rules active.
        </p>
      </div>
    );
  }

  const satisfied = alerts.filter((a) => a.type === "satisfied");
  const violated = alerts.filter((a) => a.type === "violated");

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 space-y-3">
      {/* Summary */}
      <div className="flex items-center gap-3 text-xs font-medium">
        {satisfied.length > 0 && (
          <span className="flex items-center gap-1 text-green-600">
            <CheckIcon />
            {satisfied.length} satisfied
          </span>
        )}
        {violated.length > 0 && (
          <span className="flex items-center gap-1 text-amber-600">
            <WarningIcon />
            {violated.length} violated
          </span>
        )}
      </div>

      {/* Alert List */}
      <div className="space-y-1.5">
        {/* Violated first for visibility */}
        {violated.map((alert, idx) => (
          <AlertItem key={`v-${idx}`} alert={alert} />
        ))}
        {satisfied.map((alert, idx) => (
          <AlertItem key={`s-${idx}`} alert={alert} />
        ))}
      </div>
    </div>
  );
}
