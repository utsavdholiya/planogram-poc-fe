import React, { useMemo } from "react";
import { DndContext } from "@dnd-kit/core";
import ZoneCell from "./ZoneCell";

const CATEGORY_BORDER_COLORS = {
  cat_ac: "border-l-red-400",
  cat_flw: "border-l-teal-400",
  cat_tlw: "border-l-teal-400",
  cat_dry: "border-l-teal-400",
  cat_wdr: "border-l-teal-400",
  cat_ddf: "border-l-blue-400",
  cat_sdf: "border-l-blue-400",
  cat_dish: "border-l-amber-400",
  cat_mwo: "border-l-amber-400",
  cat_wp: "border-l-cyan-400",
  cat_tv: "border-l-violet-400",
  cat_chim: "border-l-orange-400",
};

const CATEGORY_DOT_COLORS = {
  cat_ac: "bg-red-400",
  cat_flw: "bg-teal-400",
  cat_tlw: "bg-teal-400",
  cat_dry: "bg-teal-400",
  cat_wdr: "bg-teal-400",
  cat_ddf: "bg-blue-400",
  cat_sdf: "bg-blue-400",
  cat_dish: "bg-amber-400",
  cat_mwo: "bg-amber-400",
  cat_wp: "bg-cyan-400",
  cat_tv: "bg-violet-400",
  cat_chim: "bg-orange-400",
};

export default function StoreCanvas({
  layout,
  zones,
  skus,
  scores,
  derivedParams,
  config,
  onDragEnd,
  showBefore,
  onToggleBefore,
  onSKUClick,
  beforeScores,
}) {
  // Group SKUs by category for the sidebar
  const categoryGroups = useMemo(() => {
    const groups = {};
    skus.forEach((sku) => {
      if (!groups[sku.cat_id]) {
        groups[sku.cat_id] = {
          cat_id: sku.cat_id,
          cat_name: sku.cat_name || sku.cat_id,
          skus: [],
          totalFloorSpace: 0,
        };
      }
      groups[sku.cat_id].skus.push(sku);
      groups[sku.cat_id].totalFloorSpace += Number(sku.floor_space) || 0;
    });
    return Object.values(groups).sort((a, b) => b.skus.length - a.skus.length);
  }, [skus]);

  // Build zone map for quick lookup
  const zoneMap = useMemo(
    () => Object.fromEntries(zones.map((z) => [z.zone_id, z])),
    [zones],
  );

  // Score delta for before/after toggle badge
  const scoreDelta = useMemo(() => {
    if (!scores || !beforeScores) return null;
    return scores.overall - beforeScores.overall;
  }, [scores, beforeScores]);

  // Assign zones to grid positions:
  // z1 (entry) => top full-width, z2+z3 => middle row, z4+z5 => bottom row
  const zoneIds = zones.map((z) => z.zone_id);
  const topZone = zoneIds[0] || null; // z1 - Entry Zone
  const midLeft = zoneIds[1] || null; // z2
  const midRight = zoneIds[2] || null; // z3
  const botLeft = zoneIds[3] || null; // z4
  const botRight = zoneIds[4] || null; // z5

  return (
    <DndContext onDragEnd={onDragEnd}>
      <div className="flex h-full">
        {/* ===== Left Sidebar: Categories ===== */}
        <aside className="w-[200px] shrink-0 border-r border-gray-200 bg-gray-50 overflow-y-auto p-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
            Categories
          </h2>
          <div className="space-y-2">
            {categoryGroups.map((group) => {
              const border =
                CATEGORY_BORDER_COLORS[group.cat_id] || "border-l-gray-300";
              const dot = CATEGORY_DOT_COLORS[group.cat_id] || "bg-gray-300";
              return (
                <div
                  key={group.cat_id}
                  className={`border-l-4 ${border} bg-white rounded-md px-2.5 py-2 shadow-sm`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${dot}`} />
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      {group.cat_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
                    <span>{group.skus.length} SKUs</span>
                    <span>{group.totalFloorSpace} sq ft</span>
                  </div>
                  {derivedParams?.conversion_rates?.[group.cat_id] != null && (
                    <div className="mt-1 text-[10px] text-blue-500 font-medium">
                      {Math.round(
                        derivedParams.conversion_rates[group.cat_id] * 100,
                      )}
                      % conversion
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ===== Center Canvas ===== */}
        <main className="flex-1 overflow-y-auto p-4 bg-gray-100">
          {/* Canvas header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                {config?.store_name || "Store Layout"}
              </h1>
              {config && (
                <p className="text-xs text-gray-500 mt-0.5">
                  {config.season} /{" "}
                  {config.business_objective?.replace(/_/g, " ")}
                </p>
              )}
            </div>
          </div>

          {/* Zone grid */}
          <div className="space-y-3">
            {/* Top row: Entry Zone (full width) */}
            {topZone && zoneMap[topZone] && (
              <ZoneCell
                zone={zoneMap[topZone]}
                skuIds={layout[topZone] || []}
                skus={skus}
                derivedParams={derivedParams}
                onSKUClick={onSKUClick}
              />
            )}

            {/* Middle row: z2 + z3 side by side */}
            <div className="grid grid-cols-2 gap-3">
              {midLeft && zoneMap[midLeft] && (
                <ZoneCell
                  zone={zoneMap[midLeft]}
                  skuIds={layout[midLeft] || []}
                  skus={skus}
                  derivedParams={derivedParams}
                  onSKUClick={onSKUClick}
                />
              )}
              {midRight && zoneMap[midRight] && (
                <ZoneCell
                  zone={zoneMap[midRight]}
                  skuIds={layout[midRight] || []}
                  skus={skus}
                  derivedParams={derivedParams}
                  onSKUClick={onSKUClick}
                />
              )}
            </div>

            {/* Bottom row: z4 + z5 side by side */}
            <div className="grid grid-cols-2 gap-3">
              {botLeft && zoneMap[botLeft] && (
                <ZoneCell
                  zone={zoneMap[botLeft]}
                  skuIds={layout[botLeft] || []}
                  skus={skus}
                  derivedParams={derivedParams}
                  onSKUClick={onSKUClick}
                />
              )}
              {botRight && zoneMap[botRight] && (
                <ZoneCell
                  zone={zoneMap[botRight]}
                  skuIds={layout[botRight] || []}
                  skus={skus}
                  derivedParams={derivedParams}
                  onSKUClick={onSKUClick}
                />
              )}
            </div>
          </div>
        </main>
      </div>
    </DndContext>
  );
}
