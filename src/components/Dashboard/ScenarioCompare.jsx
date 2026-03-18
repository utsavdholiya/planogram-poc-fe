import React, { useState } from "react";

const dimensionLabels = {
  conversion: "Conversion",
  margin: "Margin",
  experience: "CX Flow",
  brand_visibility: "Brand",
};

const dimensionColors = {
  conversion: "bg-blue-500",
  margin: "bg-emerald-500",
  experience: "bg-violet-500",
  brand_visibility: "bg-orange-500",
};

function MiniBar({ label, value, colorKey }) {
  const color = dimensionColors[colorKey] || "bg-gray-400";
  const clamped = Math.max(0, Math.min(100, value ?? 0));

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-16 text-right shrink-0">
        {label}
      </span>
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-[10px] font-semibold text-gray-700 w-6 tabular-nums">
        {value ?? 0}
      </span>
    </div>
  );
}

function DeltaBadge({ delta }) {
  if (delta == null || isNaN(delta)) return null;
  const rounded = Math.round(delta);
  if (rounded === 0) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
        0
      </span>
    );
  }
  const isPositive = rounded > 0;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        isPositive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
      }`}
    >
      {isPositive ? "+" : ""}
      {rounded}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "--";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

const overallColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

function SavedLayoutCard({ saved, currentOverall }) {
  const scores = saved.scores || {};
  const overall = scores.overall ?? 0;
  const delta = overall - (currentOverall ?? 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-gray-900 truncate">
            {saved.layout_name || "Untitled Layout"}
          </h4>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {formatDate(saved.created_at)}
          </p>
        </div>
        <DeltaBadge delta={delta} />
      </div>

      {/* Overall Score */}
      {/* <div className="text-center py-2">
        <div className={`text-3xl font-extrabold tabular-nums ${overallColor(overall)}`}>
          {Math.round(overall)}
        </div>
        <div className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">
          Overall Score
        </div>
      </div> */}

      {/* Sub-score Bars */}
      <div className="space-y-1.5">
        <MiniBar
          label={dimensionLabels.conversion}
          value={scores.conversion}
          colorKey="conversion"
        />
        <MiniBar
          label={dimensionLabels.margin}
          value={scores.margin}
          colorKey="margin"
        />
        <MiniBar
          label={dimensionLabels.experience}
          value={scores.experience}
          colorKey="experience"
        />
        <MiniBar
          label={dimensionLabels.brand_visibility}
          value={scores.brand_visibility}
          colorKey="brand_visibility"
        />
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {saved.season && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-indigo-50 text-indigo-600 border border-indigo-100">
            {saved.season}
          </span>
        )}
        {saved.business_objective && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 border border-gray-200">
            {saved.business_objective.replace(/_/g, " ")}
          </span>
        )}
      </div>
    </div>
  );
}

export default function ScenarioCompare({
  savedLayouts,
  currentScores,
  onSave,
}) {
  const [saving, setSaving] = useState(false);

  const handleSave = () => {
    const name = window.prompt("Enter a name for this layout:");
    if (name && name.trim()) {
      setSaving(true);
      Promise.resolve(onSave(name.trim())).finally(() => setSaving(false));
    }
  };

  const currentOverall = currentScores?.overall ?? 0;
  const layouts = (savedLayouts || []).slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Save Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900">Scenario Comparison</h3>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            saving
              ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
              : "bg-blue-600 text-white border-blue-600 hover:bg-blue-700 active:bg-blue-800"
          }`}
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
            />
          </svg>
          {saving ? "Saving..." : "Save Current Layout"}
        </button>
      </div>

      {/* Saved Layout Cards */}
      {layouts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {layouts.map((saved, idx) => (
            <SavedLayoutCard
              key={saved.id || saved.layout_name || idx}
              saved={saved}
              currentOverall={currentOverall}
            />
          ))}
        </div>
      ) : (
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="text-sm text-gray-400">
            No saved layouts yet. Generate and save a layout to compare.
          </p>
        </div>
      )}
    </div>
  );
}
