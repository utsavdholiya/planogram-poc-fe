import React, { useMemo } from "react";

function TruncatedCell({ text, maxLen = 80 }) {
  if (!text) return <span className="text-gray-300">--</span>;
  const truncated = text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
  return (
    <span title={text} className="cursor-default">
      {truncated}
    </span>
  );
}

function MobileCard({ zoneExplanation, skuCount }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900">
          {zoneExplanation.zone_name || zoneExplanation.zone_id}
        </h4>
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
          {skuCount} SKU{skuCount !== 1 ? "s" : ""}
        </span>
      </div>

      {zoneExplanation.headline && (
        <div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Headline
          </span>
          <p className="text-xs text-gray-800 mt-0.5">
            {zoneExplanation.headline}
          </p>
        </div>
      )}

      {zoneExplanation.explanation && (
        <div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Explanation
          </span>
          <p className="text-xs text-gray-600 mt-0.5">
            {zoneExplanation.explanation}
          </p>
        </div>
      )}

      {zoneExplanation.data_cited && (
        <div>
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Data Cited
          </span>
          <p className="text-xs text-gray-500 mt-0.5 font-mono">
            {zoneExplanation.data_cited}
          </p>
        </div>
      )}

      {zoneExplanation.manager_action && (
        <div className="pt-2 border-t border-gray-100">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
            Manager Action
          </span>
          <p className="text-xs text-gray-700 mt-0.5 font-medium">
            {zoneExplanation.manager_action}
          </p>
        </div>
      )}
    </div>
  );
}

export default function RationaleTable({ explanations, layout, skus }) {
  const zoneExplanations = explanations?.zone_explanations || [];

  const skuCountByZone = useMemo(() => {
    if (!layout) return {};
    const counts = {};
    Object.entries(layout).forEach(([zoneId, skuIds]) => {
      counts[zoneId] = Array.isArray(skuIds) ? skuIds.length : 0;
    });
    return counts;
  }, [layout]);

  if (!explanations || zoneExplanations.length === 0) {
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-gray-400">
          Generate a planogram to see zone rationale and explanations.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop: Table view */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Zone
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide text-center">
                SKUs Placed
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Headline
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Explanation
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Data Cited
              </th>
              <th className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Manager Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {zoneExplanations.map((ze, idx) => {
              const zoneId = ze.zone_id;
              const skuCount = skuCountByZone[zoneId] ?? 0;
              const rowBg = idx % 2 === 0 ? "bg-white" : "bg-gray-50/50";

              return (
                <tr key={zoneId || idx} className={`${rowBg} hover:bg-blue-50/30 transition-colors`}>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 whitespace-nowrap">
                    {ze.zone_name || zoneId}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center tabular-nums">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                      {skuCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-800 max-w-[180px]">
                    <TruncatedCell text={ze.headline} maxLen={60} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[220px]">
                    <TruncatedCell text={ze.explanation} maxLen={100} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 font-mono max-w-[180px]">
                    <TruncatedCell text={ze.data_cited} maxLen={80} />
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700 font-medium max-w-[200px]">
                    <TruncatedCell text={ze.manager_action} maxLen={80} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile: Stacked cards */}
      <div className="md:hidden space-y-3">
        {zoneExplanations.map((ze, idx) => {
          const zoneId = ze.zone_id;
          const skuCount = skuCountByZone[zoneId] ?? 0;
          return (
            <MobileCard
              key={zoneId || idx}
              zoneExplanation={ze}
              skuCount={skuCount}
            />
          );
        })}
      </div>
    </div>
  );
}
