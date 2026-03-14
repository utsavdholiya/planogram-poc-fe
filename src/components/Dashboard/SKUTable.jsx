import React from "react";

function PromoteCard({ sku }) {
  return (
    <div className="bg-white border-l-4 border-l-green-500 rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 truncate">
            {sku.sku_name}
          </h4>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {sku.why}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
          Promote
        </span>
      </div>
      {sku.action && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-start gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            <span className="text-xs text-gray-700 font-medium">
              {sku.action}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewCard({ sku }) {
  return (
    <div className="bg-white border-l-4 border-l-red-400 rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 truncate">
            {sku.sku_name}
          </h4>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {sku.issue}
          </p>
        </div>
        <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-600">
          Review
        </span>
      </div>
      {sku.action && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-start gap-1.5">
            <svg
              className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span className="text-xs text-gray-700 font-medium">
              {sku.action}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SKUTable({ explanations }) {
  if (!explanations) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <svg
          className="mx-auto w-10 h-10 text-gray-300 mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
        <p className="text-sm text-gray-400">
          Generate a planogram to see recommendations
        </p>
      </div>
    );
  }

  const topSKUs = explanations.top_3_skus_to_promote || [];
  const bottomSKUs = explanations.bottom_3_skus_to_review || [];

  return (
    <div className="space-y-6">
      {/* Top 3 SKUs to Promote */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <h3 className="text-sm font-bold text-gray-900">
            Top 3 SKUs to Promote
          </h3>
        </div>
        {topSKUs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {topSKUs.map((sku, idx) => (
              <PromoteCard key={sku.sku_name || idx} sku={sku} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 pl-4">
            No promotion recommendations available.
          </p>
        )}
      </div>

      {/* Bottom 3 SKUs to Review */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-400" />
          <h3 className="text-sm font-bold text-gray-900">
            Bottom 3 SKUs to Review
          </h3>
        </div>
        {bottomSKUs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {bottomSKUs.map((sku, idx) => (
              <ReviewCard key={sku.sku_name || idx} sku={sku} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 pl-4">
            No review recommendations available.
          </p>
        )}
      </div>
    </div>
  );
}
