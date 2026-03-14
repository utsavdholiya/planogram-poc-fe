export function scoreLayout(layout, zones, skus, derivedParams, config) {
  const p = derivedParams.scoring_params
  const coP = derivedParams.co_purchase_frequency
  const seasonal = derivedParams.seasonal_boosts
  const convRates = derivedParams.conversion_rates
  const adjRules = derivedParams.adjacency_rules

  let conv = p.base_conv_score
  let margin = p.base_margin_score
  let exp = p.base_exp_score

  const skuMap = Object.fromEntries(skus.map(s => [s.sku_id, s]))
  const zoneMap = Object.fromEntries(zones.map(z => [z.zone_id, z]))
  const trace = []

  Object.entries(layout).forEach(([zoneId, skuIds]) => {
    const zone = zoneMap[zoneId]
    if (!zone) return
    const zoneSKUs = skuIds.map(id => skuMap[id]).filter(Boolean)
    const isHero = zone.zone_type === 'hero'
    const isAisle = zone.zone_type === 'aisle'
    const zoneSqft = Number(zone.sq_ft)

    zoneSKUs.forEach(sku => {
      const catConv = convRates[sku.cat_id] || p.avg_conversion_rate
      const seasonBoost = (seasonal[sku.cat_id] || {})[config.season] || 1.0
      const seasonBonus = ((p.seasonal_conv_bonuses || {})[sku.cat_id] || {})[config.season] || 0
      const skuMargin = Number(sku.margin_pct || 0)

      // ── CONVERSION rules ──
      if (isHero) {
        const cb = Math.round((catConv / Math.max(p.avg_conversion_rate, 0.0001) - 1) * 15)
        if (sku.display_type === 'hero' && cb > 0) {
          conv += cb
          trace.push({ rule: 'hero_sku_at_hero_zone', sku: sku.sku_id, delta: `+${cb}`, dim: 'conv', data: `conv ${(catConv * 100).toFixed(2)}% vs avg ${(p.avg_conversion_rate * 100).toFixed(2)}%` })
        }
        if (sku.campaign_tag && sku.campaign_tag === config.campaign) {
          const b = Math.max(3, Math.round(seasonBonus * 1.5))
          conv += b
          trace.push({ rule: 'campaign_at_hero', sku: sku.sku_id, delta: `+${b}`, dim: 'conv', data: `campaign=${sku.campaign_tag}, season_bonus=${seasonBonus}` })
        }
        if ((config.priority_skus || []).includes(sku.sku_id)) {
          const pb = Math.round(p.hero_conv_bonus * 0.8)
          conv += pb
          trace.push({ rule: 'priority_sku_at_hero', sku: sku.sku_id, delta: `+${pb}`, dim: 'conv', data: 'manually tagged as priority' })
        }
        if (sku.price_tier === 'budget') {
          const bp = -Math.round(p.hero_conv_bonus * 0.3)
          conv += bp
          trace.push({ rule: 'budget_tier_at_hero', sku: sku.sku_id, delta: `${bp}`, dim: 'conv', data: 'budget tier in hero zone hurts conversion' })
        }
      }

      // Seasonal (hero only)
      if (isHero && seasonBoost >= 1.3) {
        const sb = Math.round(seasonBoost * 6)
        conv += sb
        trace.push({ rule: 'high_season_at_hero', sku: sku.sku_id, delta: `+${sb}`, dim: 'conv', data: `boost ${seasonBoost}x in ${config.season}` })
      } else if (isHero && seasonBoost <= 0.7) {
        const sb = -Math.round((1 - seasonBoost) * 12)
        conv += sb
        trace.push({ rule: 'low_season_at_hero', sku: sku.sku_id, delta: `${sb}`, dim: 'conv', data: `boost ${seasonBoost}x in ${config.season} — off season` })
      }

      // ── MARGIN rules ──
      if (isHero && skuMargin > p.high_margin_threshold) {
        const mb = Math.round((skuMargin - p.avg_margin_pct) / Math.max(p.avg_margin_pct, 1) * 20)
        margin += mb
        trace.push({ rule: 'high_margin_at_hero', sku: sku.sku_id, delta: `+${mb}`, dim: 'margin', data: `margin ${skuMargin}% > threshold ${p.high_margin_threshold}%` })
      }
      if (isHero && skuMargin < p.low_margin_threshold) {
        const mp = -Math.round((p.avg_margin_pct - skuMargin) / Math.max(p.avg_margin_pct, 1) * 25)
        margin += mp
        trace.push({ rule: 'low_margin_at_hero', sku: sku.sku_id, delta: `${mp}`, dim: 'margin', data: `margin ${skuMargin}% < threshold ${p.low_margin_threshold}%` })
      }
      if (isAisle && skuMargin > p.high_margin_threshold) {
        const mb = Math.round((skuMargin - p.avg_margin_pct) / Math.max(p.avg_margin_pct, 1) * 8)
        margin += mb
        trace.push({ rule: 'high_margin_at_aisle', sku: sku.sku_id, delta: `+${mb}`, dim: 'margin', data: `margin ${skuMargin}% in aisle` })
      }
    })

    // ── CX FLOW rules ──
    const usedSqft = skuIds.reduce((sum, id) => sum + Number((skuMap[id] || {}).floor_space || 0), 0)
    if (usedSqft > zoneSqft) {
      const overflowPct = Math.round((usedSqft - zoneSqft) / zoneSqft * 100)
      const ep = -Math.round(overflowPct * 0.3)
      exp += ep
      trace.push({ rule: 'zone_overcrowded', zone: zoneId, delta: `${ep}`, dim: 'exp', data: `${usedSqft}/${zoneSqft} sq ft (${overflowPct}% over)` })
    }
    if (zoneSKUs.length === 0) {
      exp -= 3
      trace.push({ rule: 'zone_empty', zone: zoneId, delta: '-3', dim: 'exp', data: `${zone.zone_name} has no SKUs` })
    }
  })

  // Adjacency
  adjRules.filter(r => r.enabled).forEach(rule => {
    const catIds = rule.categories
    const zonesWithCats = new Set(
      Object.entries(layout)
        .filter(([, ids]) => ids.some(id => skuMap[id] && catIds.includes(skuMap[id].cat_id)))
        .map(([zid]) => zid)
    )
    const pairKey = [...catIds].sort().join('|')
    const realFreq = (coP[pairKey] || {}).frequency || 0
    const bonus = Math.max(2, Math.round(realFreq * 50))
    const penalty = -Math.max(1, Math.round(bonus * 0.5))
    if (zonesWithCats.size === 1) {
      exp += bonus
      trace.push({ rule: 'adjacency_satisfied', pair: pairKey, delta: `+${bonus}`, dim: 'exp', data: `co_purchase=${(realFreq * 100).toFixed(1)}% — same zone` })
    } else if (zonesWithCats.size > 1) {
      exp += penalty
      trace.push({ rule: 'adjacency_violated', pair: pairKey, delta: `${penalty}`, dim: 'exp', data: `co_purchase=${(realFreq * 100).toFixed(1)}% — split across zones` })
    }
  })

  const clamp = v => Math.min(100, Math.max(0, Math.round(v)))
  conv = clamp(conv)
  margin = clamp(margin)
  exp = clamp(exp)

  const WEIGHTS = {
    maximise_conversion: { conv: 0.65, margin: 0.20, exp: 0.15 },
    maximise_margin: { conv: 0.20, margin: 0.55, exp: 0.25 },
    balanced: { conv: 0.40, margin: 0.35, exp: 0.25 }
  }
  const w = WEIGHTS[config.business_objective] || WEIGHTS.balanced
  const overall = clamp(conv * w.conv + margin * w.margin + exp * w.exp)
  return { overall, conversion: conv, margin, experience: exp, score_trace: trace, weights_used: w }
}
