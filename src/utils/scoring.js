const ZONE_TYPE_RANK = { hero: 1, aisle: 2, back: 3 }

export function scoreLayout(layout, zones, skus, derivedParams, config) {
  const p = derivedParams.scoring_params
  const coP = derivedParams.co_purchase_frequency
  const seasonal = derivedParams.seasonal_boosts
  const convRates = derivedParams.conversion_rates
  const adjRules = derivedParams.adjacency_rules

  let conv = p.base_conv_score
  let margin = p.base_margin_score
  let exp = p.base_exp_score
  let brand = p.base_brand_score

  const skuMap = Object.fromEntries(skus.map(s => [s.sku_id, s]))
  const zoneMap = Object.fromEntries(zones.map(z => [z.zone_id, z]))
  const trace = []

  Object.entries(layout).forEach(([zoneId, skuIds]) => {
    const zone = zoneMap[zoneId]
    if (!zone) return
    const zoneSKUs = skuIds.map(id => skuMap[id]).filter(Boolean)
    const isHero = zone.zone_type === 'hero'
    const maxSKUs = Math.max(1, Math.round(zone.sq_ft / p.avg_sku_footprint))

    zoneSKUs.forEach(sku => {
      const catConv = convRates[sku.cat_id] || p.avg_conversion_rate
      const seasonBoost = (seasonal[sku.cat_id] || {})[config.season] || 1.0
      const seasonBonus = ((p.seasonal_conv_bonuses || {})[sku.cat_id] || {})[config.season] || 0

      if (isHero) {
        const cb = Math.round((catConv / p.avg_conversion_rate - 1) * 15)
        if (sku.display_type === 'hero' && cb > 0) {
          conv += cb
          trace.push({ rule: 'hero_sku_at_hero_zone', sku: sku.sku_id, delta: `+${cb}`, dim: 'conv', data: `conv ${(catConv * 100).toFixed(2)}% vs avg ${(p.avg_conversion_rate * 100).toFixed(2)}%` })
        }
        if (sku.campaign_tag === config.campaign) {
          const b = Math.round(seasonBonus * 1.5)
          conv += b
          trace.push({ rule: 'campaign_at_hero', sku: sku.sku_id, delta: `+${b}`, dim: 'conv', data: `campaign=${sku.campaign_tag}, bonus=${seasonBonus}` })
        }
        if (sku.margin_pct > p.high_margin_threshold) {
          const mb = Math.round((sku.margin_pct - p.avg_margin_pct) / p.avg_margin_pct * 20)
          margin += mb
          trace.push({ rule: 'high_margin_at_hero', sku: sku.sku_id, delta: `+${mb}`, dim: 'margin', data: `margin ${sku.margin_pct}% > threshold ${p.high_margin_threshold}%` })
        }
        if ((config.priority_skus || []).includes(sku.sku_id)) {
          const pb = Math.round(p.hero_conv_bonus * 0.8)
          conv += pb
          trace.push({ rule: 'priority_sku_at_hero', sku: sku.sku_id, delta: `+${pb}`, dim: 'conv', data: 'manually tagged as priority' })
        }
        if (sku.margin_pct < p.low_margin_threshold) {
          const mp = -Math.round((p.avg_margin_pct - sku.margin_pct) / p.avg_margin_pct * 25)
          margin += mp
          trace.push({ rule: 'low_margin_at_hero', sku: sku.sku_id, delta: `${mp}`, dim: 'margin', data: `margin ${sku.margin_pct}% < threshold ${p.low_margin_threshold}%` })
        }
        if (sku.price_tier === 'budget') {
          const bp = -Math.round(p.hero_conv_bonus * 0.3)
          conv += bp
          trace.push({ rule: 'budget_tier_at_hero', sku: sku.sku_id, delta: `${bp}`, dim: 'conv', data: 'budget tier weakens brand signal at hero zone' })
        }
      }
      if (seasonBoost >= 1.5 && isHero) {
        const sb = Math.round(seasonBoost * 8)
        conv += sb
        trace.push({ rule: 'high_season_at_hero', sku: sku.sku_id, delta: `+${sb}`, dim: 'conv', data: `boost ${seasonBoost}x >= 1.5 in ${config.season}` })
      } else if (seasonBoost <= 0.7 && isHero) {
        const sb = -Math.round((1 - seasonBoost) * 15)
        conv += sb
        trace.push({ rule: 'low_season_at_hero', sku: sku.sku_id, delta: `${sb}`, dim: 'conv', data: `boost ${seasonBoost}x <= 0.7 in ${config.season}` })
      }
    })

    if (zoneSKUs.length > maxSKUs) {
      const overflow = zoneSKUs.length - maxSKUs
      const ep = -(overflow * Math.round(zone.sq_ft / 100))
      exp += ep
      trace.push({ rule: 'zone_overcrowded', zone: zoneId, delta: `${ep}`, dim: 'exp', data: `${zoneSKUs.length} SKUs, max=${maxSKUs} for ${zone.sq_ft}sqft` })
    }
  })

  adjRules.filter(r => r.enabled).forEach(rule => {
    const catIds = rule.categories
    const zonesWithCats = new Set(
      Object.entries(layout)
        .filter(([, ids]) => ids.some(id => skuMap[id] && catIds.includes(skuMap[id].cat_id)))
        .map(([zid]) => zid)
    )
    const pairKey = [...catIds].sort().join('|')
    const realFreq = (coP[pairKey] || {}).frequency || 0
    const bonus = Math.round(realFreq * 50)
    const penalty = -Math.round(bonus * 0.5)
    if (zonesWithCats.size === 1) {
      exp += bonus
      trace.push({ rule: 'adjacency_satisfied', pair: pairKey, delta: `+${bonus}`, dim: 'exp', data: `co_purchase=${(realFreq * 100).toFixed(1)}%` })
    } else if (zonesWithCats.size > 1) {
      exp += penalty
      trace.push({ rule: 'adjacency_violated', pair: pairKey, delta: `${penalty}`, dim: 'exp', data: `co_purchase=${(realFreq * 100).toFixed(1)}% — should be same zone` })
    }
  })

  const clamp = v => Math.min(100, Math.max(0, Math.round(v)))
  conv = clamp(conv)
  margin = clamp(margin)
  exp = clamp(exp)
  brand = clamp(brand)

  const WEIGHTS = {
    maximise_conversion: { conv: 0.6, margin: 0.2, exp: 0.15, brand: 0.05 },
    maximise_margin: { conv: 0.2, margin: 0.5, exp: 0.2, brand: 0.1 },
    balanced: { conv: 0.4, margin: 0.3, exp: 0.2, brand: 0.1 }
  }
  const w = WEIGHTS[config.business_objective] || WEIGHTS.balanced
  const overall = clamp(conv * w.conv + margin * w.margin + exp * w.exp + brand * w.brand)
  return { overall, conversion: conv, margin, experience: exp, brand_visibility: brand, score_trace: trace, weights_used: w }
}
