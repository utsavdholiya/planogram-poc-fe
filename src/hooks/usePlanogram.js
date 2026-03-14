import { useState, useCallback } from 'react'

export function usePlanogram() {
  const [layout, setLayout] = useState({})
  const [originalLayout, setOriginalLayout] = useState({})
  const [placementReasons, setPlacementReasons] = useState({})
  const [explanations, setExplanations] = useState(null)
  const [derivedParams, setDerivedParams] = useState(null)
  const [config, setConfig] = useState(null)
  const [skippedSKUs, setSkippedSKUs] = useState([])
  const [showBefore, setShowBefore] = useState(false)

  const initFromResponse = useCallback((response) => {
    setLayout(response.layout)
    setOriginalLayout(response.layout)
    setPlacementReasons(response.placement_reasons)
    setExplanations(response.explanations)
    setDerivedParams(response.derived_params)
    setConfig(response.config)
    setSkippedSKUs(response.skipped_skus || [])
  }, [])

  const buildBeforeLayout = useCallback((zones, skus) => {
    const before = {}
    zones.forEach(z => { before[z.zone_id] = [] })
    const sortedZones = [...zones].sort((a, b) => {
      const rank = { hero: 3, aisle: 2, back: 1 }
      return (rank[a.zone_type] || 0) - (rank[b.zone_type] || 0)
    })
    let zIdx = 0
    skus.forEach(sku => {
      const z = sortedZones[zIdx % sortedZones.length]
      before[z.zone_id].push(sku.sku_id)
      zIdx++
    })
    return before
  }, [])

  const handleDragEnd = useCallback((event, zones, skus) => {
    const { active, over } = event
    if (!over || !active) return

    const skuId = active.id
    const targetZoneId = over.id

    // Capacity check: does the SKU fit in the target zone?
    const skuMap = Object.fromEntries((skus || []).map(s => [s.sku_id, s]))
    const zoneMap = Object.fromEntries((zones || []).map(z => [z.zone_id, z]))
    const targetZone = zoneMap[targetZoneId]
    const draggedSku = skuMap[skuId]

    if (targetZone && draggedSku) {
      const zoneCap = Number(targetZone.sq_ft) || 0
      const skuSpace = Number(draggedSku.floor_space) || 0

      if (zoneCap > 0) {
        setLayout(prev => {
          // Calculate what the zone currently holds, excluding the dragged SKU
          const currentIds = (prev[targetZoneId] || []).filter(id => id !== skuId)
          const usedSqFt = currentIds.reduce(
            (sum, id) => sum + (Number(skuMap[id]?.floor_space) || 0), 0
          )
          const remaining = zoneCap - usedSqFt

          if (skuSpace > remaining) {
            // No room — don't move
            return prev
          }

          // Move the SKU
          const next = {}
          for (const [zid, sids] of Object.entries(prev)) {
            next[zid] = sids.filter(id => id !== skuId)
          }
          if (!next[targetZoneId]) next[targetZoneId] = []
          next[targetZoneId].push(skuId)
          return next
        })
        return
      }
    }

    // Fallback: no zone metadata available, allow the move
    setLayout(prev => {
      const next = {}
      for (const [zid, sids] of Object.entries(prev)) {
        next[zid] = sids.filter(id => id !== skuId)
      }
      if (!next[targetZoneId]) next[targetZoneId] = []
      next[targetZoneId].push(skuId)
      return next
    })
  }, [])

  return {
    layout, setLayout,
    originalLayout,
    placementReasons,
    explanations,
    derivedParams,
    config,
    showBefore, setShowBefore,
    skippedSKUs,
    initFromResponse,
    buildBeforeLayout,
    handleDragEnd
  }
}
