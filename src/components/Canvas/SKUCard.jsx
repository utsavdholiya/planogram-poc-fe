import React from 'react'
import { useDraggable } from '@dnd-kit/core'

const CATEGORY_BORDER_COLORS = {
  cat_ac: 'border-l-red-400',
  cat_flw: 'border-l-teal-400',
  cat_tlw: 'border-l-teal-400',
  cat_dry: 'border-l-teal-400',
  cat_wdr: 'border-l-teal-400',
  cat_ddf: 'border-l-blue-400',
  cat_sdf: 'border-l-blue-400',
  cat_dish: 'border-l-amber-400',
  cat_oven: 'border-l-amber-400',
}

const TIER_STYLES = {
  premium: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Premium' },
  mid: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Mid' },
  budget: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Budget' },
}

export default function SKUCard({ sku, isInHeroZone, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sku.sku_id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const borderColor = CATEGORY_BORDER_COLORS[sku.cat_id] || 'border-l-gray-300'
  const bgColor = sku.display_type === 'hero' ? 'bg-green-50' : 'bg-yellow-50'
  const tier = TIER_STYLES[sku.price_tier] || TIER_STYLES.budget

  const truncatedName =
    sku.sku_name && sku.sku_name.length > 18
      ? sku.sku_name.slice(0, 18) + '...'
      : sku.sku_name

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        if (!isDragging && onClick) {
          e.stopPropagation()
          onClick(sku)
        }
      }}
      className={[
        'border-l-4 rounded-md shadow-sm px-2 py-1.5 cursor-grab select-none',
        'text-xs leading-tight w-[130px]',
        borderColor,
        bgColor,
        isDragging ? 'opacity-50 z-50' : 'hover:shadow-md',
      ].join(' ')}
    >
      {/* Top row: name + tier badge */}
      <div className="flex items-start justify-between gap-1">
        <span className="font-medium text-gray-800 break-words" title={sku.sku_name}>
          {truncatedName}
        </span>
        <span
          className={`shrink-0 text-[10px] font-semibold px-1 py-0.5 rounded ${tier.bg} ${tier.text}`}
        >
          {tier.label}
        </span>
      </div>

      {/* Bottom row: margin + campaign tag */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-gray-500">{sku.margin_pct}%</span>
        {sku.campaign_tag && (
          <span className="text-[10px] font-medium bg-orange-100 text-orange-700 px-1 py-0.5 rounded">
            {sku.campaign_tag}
          </span>
        )}
      </div>
    </div>
  )
}
