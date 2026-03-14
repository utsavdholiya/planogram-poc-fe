import { useState, useCallback, useEffect } from 'react'
import { scoreLayout } from '../utils/scoring'

export function useScoring(layout, zones, skus, derivedParams, config) {
  const [scores, setScores] = useState(null)

  const recalculate = useCallback(() => {
    if (!layout || !zones || !skus || !derivedParams || !config) return
    const result = scoreLayout(layout, zones, skus, derivedParams, config)
    setScores(result)
  }, [layout, zones, skus, derivedParams, config])

  useEffect(() => {
    recalculate()
  }, [recalculate])

  return { scores, recalculate }
}
