import { useMemo } from 'react'
import { checkAdjacencyAlerts } from '../utils/adjacency'

export function useAdjacencyAlerts(layout, skus, derivedParams) {
  const alerts = useMemo(() => {
    if (!layout || !skus || !derivedParams) return []
    return checkAdjacencyAlerts(layout, skus, derivedParams)
  }, [layout, skus, derivedParams])

  return alerts
}
