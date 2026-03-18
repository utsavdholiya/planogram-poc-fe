import React from "react";

function Badge({ children, className = "" }) {
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${className}`}
    >
      {children}
    </span>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex justify-between items-start py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 shrink-0 mr-3">{label}</span>
      <span className="text-xs text-gray-800 font-medium text-right">{children}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function SKUDetailPanel({ sku, placementReasons, explanations, onClose }) {
  if (!sku) return null;

  const placement = placementReasons?.[sku.sku_id] ?? null;

  const zoneExplanation =
    explanations?.zone_explanations?.find(
      (ze) => ze.zone_id === placement?.zone_id
    ) ?? null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-96 max-w-full bg-white shadow-xl z-50 flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-base font-bold text-gray-800 truncate pr-3">
            {sku.sku_name || sku.sku_id}
          </h2>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-0">
          {/* SKU Info */}
          <Section title="SKU Info">
            <div className="bg-gray-50 rounded-lg p-3 space-y-0">
              <InfoRow label="Category">{sku.category || "—"}</InfoRow>
              <InfoRow label="Price">
                {sku.price != null ? `$${Number(sku.price).toFixed(2)}` : "—"}
              </InfoRow>
              <InfoRow label="Margin">
                {sku.margin_pct != null ? `${sku.margin_pct}%` : "—"}
              </InfoRow>
              <InfoRow label="Display Type">{sku.display_type || "—"}</InfoRow>
              <InfoRow label="Floor Space">
                {sku.floor_space != null ? `${sku.floor_space} sqft` : "—"}
              </InfoRow>
            </div>
          </Section>

          {/* Placement Data */}
          <Section title="Placement Data">
            {placement ? (
              <div className="bg-gray-50 rounded-lg p-3 space-y-0">
                <InfoRow label="Zone">{placement.zone_name || "—"}</InfoRow>
                <InfoRow label="Zone Type">{placement.zone_type || "—"}</InfoRow>
                <InfoRow label="Conv Rate">
                  {placement.conv_rate_pct != null ? (
                    <span>
                      {placement.conv_rate_pct}%
                      {placement.avg_conv_rate_pct != null && (
                        <span className="text-gray-400 ml-1">
                          (avg {placement.avg_conv_rate_pct}%)
                        </span>
                      )}
                      <Badge className="ml-1.5 bg-purple-100 text-purple-700">AI</Badge>
                    </span>
                  ) : (
                    "—"
                  )}
                </InfoRow>
                <InfoRow label="Seasonal Boost">
                  {placement.seasonal_boost != null
                    ? `${placement.seasonal_boost > 0 ? "+" : ""}${placement.seasonal_boost}`
                    : "—"}
                </InfoRow>
                <InfoRow label="Hero Zone">
                  {placement.is_hero_zone != null ? (
                    placement.is_hero_zone ? (
                      <Badge className="bg-green-100 text-green-700">Yes</Badge>
                    ) : (
                      <Badge className="bg-gray-100 text-gray-500">No</Badge>
                    )
                  ) : (
                    "—"
                  )}
                </InfoRow>
                <InfoRow label="Priority Score">
                  {placement.priority_score != null ? (
                    <span className="font-bold text-gray-900">
                      {placement.priority_score}
                    </span>
                  ) : (
                    "—"
                  )}
                </InfoRow>

                {/* Co-purchase Pairs */}
                {placement.co_purchase_pairs && placement.co_purchase_pairs.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <span className="text-xs text-gray-500 block mb-1.5">Co-purchase Pairs</span>
                    <div className="flex flex-wrap gap-1.5">
                      {placement.co_purchase_pairs.map((pair, idx) => (
                        <Badge key={idx} className="bg-indigo-100 text-indigo-700">
                          {pair}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No placement data available for this SKU.
              </p>
            )}
          </Section>

          {/* Zone Explanation */}
          <Section title="Zone Explanation">
            {zoneExplanation ? (
              <div className="bg-blue-50 rounded-lg p-3 space-y-3">
                {zoneExplanation.headline && (
                  <p className="text-sm font-semibold text-blue-900">
                    {zoneExplanation.headline}
                  </p>
                )}
                {zoneExplanation.explanation && (
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {zoneExplanation.explanation}
                  </p>
                )}
                {zoneExplanation.data_cited && (
                  <div className="text-xs text-blue-600 bg-blue-100 rounded p-2">
                    <span className="font-medium">Data: </span>
                    {zoneExplanation.data_cited}
                  </div>
                )}
                {zoneExplanation.action_for_manager && (
                  <div className="text-xs text-blue-700 bg-white/60 rounded p-2 border border-blue-200">
                    <span className="font-medium">Action: </span>
                    {zoneExplanation.action_for_manager}
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">
                No explanation available for this placement.
              </p>
            )}
          </Section>
        </div>
      </div>

      {/* Slide-in animation keyframe (injected once) */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.25s ease-out;
        }
      `}</style>
    </>
  );
}
