import { useState, useCallback } from 'react'

export function usePlanogram() {
  const [layout, setLayout] = useState({})
  const [originalLayout, setOriginalLayout] = useState({})
  const [placementReasons, setPlacementReasons] = useState({})
  const [explanations, setExplanations] = useState(null)
  const [derivedParams, setDerivedParams] = useState(null)
  const [config, setConfig] = useState(null)
  const [showBefore, setShowBefore] = useState(false)

  const initFromResponse = useCallback((response) => {
    setLayout(response.layout)
    setOriginalLayout(response.layout)
    setPlacementReasons(response.placement_reasons)
    setExplanations(response.explanations)
    setDerivedParams(response.derived_params)
    setConfig(response.config)
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

  const handleDragEnd = useCallback((event) => {
    const { active, over } = event
    if (!over || !active) return

    const skuId = active.id
    const targetZoneId = over.id

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
    initFromResponse,
    buildBeforeLayout,
    handleDragEnd
  }
}
