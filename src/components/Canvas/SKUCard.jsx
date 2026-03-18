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
  cat_mwo: 'border-l-amber-400',
  cat_wp: 'border-l-cyan-400',
  cat_tv: 'border-l-violet-400',
  cat_chim: 'border-l-orange-400',
}

export default function SKUCard({ sku, isInHeroZone, convRate, onClick }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: sku.sku_id,
  })

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  const borderColor = CATEGORY_BORDER_COLORS[sku.cat_id] || 'border-l-gray-300'
  const bgColor = sku.display_type === 'hero' ? 'bg-green-50' : 'bg-yellow-50'

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
        'text-xs leading-tight w-[160px]',
        borderColor,
        bgColor,
        isDragging ? 'opacity-50 z-50' : 'hover:shadow-md',
      ].join(' ')}
    >
      {/* Name */}
      <div className="flex items-start gap-1">
        <span className="font-medium text-gray-800 break-words">
          {sku.sku_name}
        </span>
      </div>

      {/* Margin + Conversion */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-gray-500">{sku.margin_pct}%</span>
        {convRate != null && (
          <span className="text-blue-500">{Math.round(convRate * 100)}% conv</span>
        )}
      </div>
    </div>
  )
}
