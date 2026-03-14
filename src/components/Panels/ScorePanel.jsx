import React, { useState } from "react";

const overallColor = (score) => {
  if (score >= 80) return "text-green-500";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

const overallBg = (score) => {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
};

const dimensionColors = {
  conversion: { bar: "bg-blue-500", text: "text-blue-600" },
  margin: { bar: "bg-emerald-500", text: "text-emerald-600" },
  experience: { bar: "bg-violet-500", text: "text-violet-600" },
  brand_visibility: { bar: "bg-orange-500", text: "text-orange-600" },
};

const dimensionLabels = {
  conversion: "Conversion",
  margin: "Margin",
  experience: "CX Flow",
  brand_visibility: "Brand",
};

function SubScoreBar({ label, value, weight, colorKey }) {
  const colors = dimensionColors[colorKey] || { bar: "bg-gray-400", text: "text-gray-600" };
  const clamped = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          {label}
          {weight != null && (
            <span className="ml-1 text-xs text-gray-400 font-normal">w{weight}</span>
          )}
        </span>
        <span className={`text-sm font-semibold ${colors.text}`}>{value ?? "—"}</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

function ScoreTrace({ traces }) {
  const [open, setOpen] = useState(false);

  if (!traces || traces.length === 0) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        <span>Score Trace ({traces.length})</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
          {traces.map((t, i) => {
            const isPositive = (t.delta ?? 0) >= 0;
            return (
              <div key={i} className="px-4 py-2 text-xs font-mono flex flex-wrap gap-x-3 gap-y-0.5 items-baseline">
                <span className={`font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                  {isPositive ? "+" : ""}
                  {t.delta}
                </span>
                <span className="text-gray-500">{t.dim}</span>
                <span className="text-gray-700 font-semibold">{t.rule}</span>
                <span className="text-gray-400">{t.sku || t.pair || t.zone || ""}</span>
                <span className="text-gray-500 break-all">{t.data}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ScoringCriteria({ criteria }) {
  const [open, setOpen] = useState(false);

  if (!criteria) return null;

  const rows = [
    { label: "Objective", value: criteria.objective },
    { label: "Season", value: criteria.season },
    { label: "Base Conv Score", value: criteria.base_conv_score },
    { label: "Avg Conv Rate", value: criteria.avg_conv_rate_pct != null ? `${criteria.avg_conv_rate_pct}%` : null },
    { label: "Avg Margin", value: criteria.avg_margin_pct != null ? `${criteria.avg_margin_pct}%` : null },
    { label: "High Margin Threshold", value: criteria.high_margin_threshold != null ? `${criteria.high_margin_threshold}%` : null },
    { label: "Low Margin Threshold", value: criteria.low_margin_threshold != null ? `${criteria.low_margin_threshold}%` : null },
    { label: "Avg SKU Footprint", value: criteria.avg_sku_footprint },
    { label: "Hero Conv Bonus", value: criteria.hero_conv_bonus },
    { label: "Bills Analysed", value: criteria.bills_analysed },
    { label: "Date Range", value: criteria.date_range },
  ];

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        <span>Scoring Criteria</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3 space-y-1.5">
          {rows.map(
            (r, i) =>
              r.value != null && (
                <div key={i} className="flex justify-between text-xs">
                  <span className="text-gray-500">{r.label}</span>
                  <span className="text-gray-800 font-medium">{r.value}</span>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}

export default function ScorePanel({ scores, derivedParams, config }) {
  if (!scores) {
    return (
      <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <p className="text-sm text-gray-400 text-center py-6">
          No score data available. Generate a planogram to see scores.
        </p>
      </div>
    );
  }

  const overall = scores.overall ?? scores.total ?? 0;
  const weights = scores.weights_used || {};

  return (
    <div className="p-4 bg-white rounded-xl shadow-sm border border-gray-200 space-y-5">
      {/* Overall Score */}
      <div className="text-center">
        <div className={`text-5xl font-extrabold tabular-nums ${overallColor(overall)}`}>
          {Math.round(overall)}
        </div>
        <div className="mt-1 text-xs text-gray-400 uppercase tracking-wide">Overall Score</div>
        <div className={`mx-auto mt-2 h-1.5 w-24 rounded-full ${overallBg(overall)} opacity-40`} />
      </div>

      {/* Sub-score Bars */}
      <div>
        <SubScoreBar
          label={dimensionLabels.conversion}
          value={scores.conversion}
          weight={weights.conversion}
          colorKey="conversion"
        />
        <SubScoreBar
          label={dimensionLabels.margin}
          value={scores.margin}
          weight={weights.margin}
          colorKey="margin"
        />
        <SubScoreBar
          label={dimensionLabels.experience}
          value={scores.experience}
          weight={weights.experience}
          colorKey="experience"
        />
        <SubScoreBar
          label={dimensionLabels.brand_visibility}
          value={scores.brand_visibility}
          weight={weights.brand_visibility}
          colorKey="brand_visibility"
        />
      </div>

      {/* Score Trace */}
      <ScoreTrace traces={scores.score_trace} />

      {/* Scoring Criteria */}
      <ScoringCriteria criteria={scores.scoring_criteria} />
    </div>
  );
}
