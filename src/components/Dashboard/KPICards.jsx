import React, { useMemo } from "react";

const scoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-500";
  return "text-red-500";
};

const scoreBg = (score) => {
  if (score >= 80) return "bg-green-50 border-green-200";
  if (score >= 60) return "bg-amber-50 border-amber-200";
  return "bg-red-50 border-red-200";
};

function formatNumber(num) {
  if (num == null || isNaN(num)) return "0";
  return Math.round(num).toLocaleString("en-US");
}

function Card({ icon, label, value, valueClass, subtitle }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-lg">{icon}</span>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className={`text-3xl font-extrabold tabular-nums ${valueClass || "text-gray-900"}`}>
        {value}
      </div>
      {subtitle && (
        <span className="text-xs text-gray-400">{subtitle}</span>
      )}
    </div>
  );
}

export default function KPICards({ scores, derivedParams, layout, alerts }) {
  const overallScore = scores?.overall ?? 0;

  const weeklyConversions = useMemo(() => {
    if (!derivedParams?.weekly_units_sold) return 0;
    const vals = Object.values(derivedParams.weekly_units_sold);
    return vals.reduce((sum, v) => sum + (Number(v) || 0), 0);
  }, [derivedParams]);

  const categoriesPlaced = useMemo(() => {
    if (!layout) return 0;
    return Object.values(layout).filter(
      (skuIds) => Array.isArray(skuIds) && skuIds.length > 0
    ).length;
  }, [layout]);

  const activeAlerts = useMemo(() => {
    if (!alerts || !Array.isArray(alerts)) return 0;
    return alerts.filter((a) => a.type === "violated").length;
  }, [alerts]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Card 1: Layout Score */}
      <div
        className={`rounded-lg shadow-sm border p-6 flex flex-col items-start gap-2 ${scoreBg(overallScore)}`}
      >
        <div className="flex items-center gap-2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Layout Score
          </span>
        </div>
        <div className={`text-4xl font-extrabold tabular-nums ${scoreColor(overallScore)}`}>
          {Math.round(overallScore)}
        </div>
        <span className="text-xs text-gray-400">out of 100</span>
      </div>

      {/* Card 2: Est. Weekly Conversions */}
      <Card
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
        }
        label="Est. Weekly Conversions"
        value={formatNumber(weeklyConversions)}
        valueClass="text-gray-900"
        subtitle="units / week"
      />

      {/* Card 3: Categories Placed */}
      <Card
        icon={
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        }
        label="Categories Placed"
        value={categoriesPlaced}
        valueClass="text-gray-900"
        subtitle="zones with SKUs"
      />

      {/* Card 4: Active Alerts */}
      <Card
        icon={
          <svg
            className="w-5 h-5"
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
        }
        label="Active Alerts"
        value={activeAlerts}
        valueClass={activeAlerts > 0 ? "text-red-500" : "text-green-600"}
        subtitle={activeAlerts > 0 ? "adjacency violations" : "no violations"}
      />
    </div>
  );
}
