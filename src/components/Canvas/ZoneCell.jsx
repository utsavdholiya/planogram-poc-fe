import React from 'react'
import { useDroppable } from '@dnd-kit/core'
import SKUCard from './SKUCard'

const ZONE_TYPE_STYLES = {
  hero: { bg: 'bg-blue-600', label: 'Hero' },
  aisle: { bg: 'bg-gray-500', label: 'Aisle' },
  back: { bg: 'bg-slate-600', label: 'Back' },
}

export default function ZoneCell({ zone, skuIds, skus, derivedParams, onSKUClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: zone.zone_id })

  const skuMap = Object.fromEntries(skus.map((s) => [s.sku_id, s]))
  const zoneSKUs = (skuIds || []).map((id) => skuMap[id]).filter(Boolean)
  const isHero = zone.zone_type === 'hero'

  // Calculate used floor space (sum of each SKU's floor_space)
  const usedSqFt = zoneSKUs.reduce((sum, s) => sum + (Number(s.floor_space) || 0), 0)
  const totalSqFt = Number(zone.sq_ft) || 0
  const usagePct = totalSqFt > 0 ? Math.min(100, Math.round((usedSqFt / totalSqFt) * 100)) : 0
  const isFull = totalSqFt > 0 && usedSqFt >= totalSqFt

  const zoneStyle = ZONE_TYPE_STYLES[zone.zone_type] || ZONE_TYPE_STYLES.aisle

  return (
    <div
      ref={setNodeRef}
      className={[
        'rounded-lg border p-3 min-h-[140px] transition-colors',
        isOver && isFull
          ? 'bg-red-50 border-red-300'
          : isOver
            ? 'bg-blue-50 border-blue-300'
            : isFull
              ? 'bg-white border-red-200'
              : 'bg-white border-gray-200',
      ].join(' ')}
    >
      {/* Zone header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-800">{zone.zone_name}</h3>
          <span
            className={`text-[10px] font-semibold text-white px-1.5 py-0.5 rounded ${zoneStyle.bg}`}
          >
            {zoneStyle.label}
          </span>
        </div>
        <span className="flex items-center gap-1.5">
          {isFull && (
            <span className="text-[9px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded">
              FULL
            </span>
          )}
          <span className="text-[11px] text-gray-400">{totalSqFt} sq ft</span>
        </span>
      </div>

      {/* Capacity progress bar */}
      <div className="mb-2">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-0.5">
          <span>
            {usedSqFt} / {totalSqFt} sq ft used
          </span>
          <span>{usagePct}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={[
              'h-full rounded-full transition-all',
              usagePct > 90 ? 'bg-red-400' : usagePct > 70 ? 'bg-amber-400' : 'bg-emerald-400',
            ].join(' ')}
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>

      {/* SKU cards */}
      {zoneSKUs.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {zoneSKUs.map((sku) => (
            <SKUCard
              key={sku.sku_id}
              sku={sku}
              isInHeroZone={isHero}
              convRate={derivedParams?.conversion_rates?.[sku.cat_id]}
              onClick={onSKUClick}
            />
          ))}
        </div>
      ) : (
        <div className={`flex items-center justify-center h-16 text-xs italic border border-dashed rounded ${
          isFull ? 'text-red-400 border-red-200' : 'text-gray-400 border-gray-200'
        }`}>
          {isFull ? 'Zone full — no space left' : 'Drop SKUs here'}
        </div>
      )}
    </div>
  )
}
