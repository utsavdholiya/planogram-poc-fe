export function scoreLayout(layout, zones, skus, derivedParams, config) {
  const p = derivedParams.scoring_params;
  const coP = derivedParams.co_purchase_frequency;
  const seasonal = derivedParams.seasonal_boosts;
  const convRates = derivedParams.conversion_rates;
  const adjRules = derivedParams.adjacency_rules;

  let conv = p.base_conv_score;
  let margin = p.base_margin_score;
  let exp = p.base_exp_score;

  const objective = config.business_objective;
  // Objective-dependent multipliers for bonus/penalty scaling
  let convMult = 1.0,
    marginMult = 1.0;
  if (objective === "maximise_conversion") {
    convMult = 1.6;
    marginMult = 0.5;
  } else if (objective === "maximise_margin") {
    convMult = 0.5;
    marginMult = 1.6;
  }

  const skuMap = Object.fromEntries(skus.map((s) => [s.sku_id, s]));
  const zoneMap = Object.fromEntries(zones.map((z) => [z.zone_id, z]));
  const trace = [];

  Object.entries(layout).forEach(([zoneId, skuIds]) => {
    const zone = zoneMap[zoneId];
    if (!zone) return;
    const zoneSKUs = skuIds.map((id) => skuMap[id]).filter(Boolean);
    const isHero = zone.zone_type === "hero";
    const isAisle = zone.zone_type === "aisle";
    const zoneSqft = Number(zone.sq_ft);

    zoneSKUs.forEach((sku) => {
      const catConv = convRates[sku.cat_id] || p.avg_conversion_rate;
      const seasonBoost = (seasonal[sku.cat_id] || {})[config.season] || 1.0;
      const seasonBonus =
        ((p.seasonal_conv_bonuses || {})[sku.cat_id] || {})[config.season] || 0;
      const skuMargin = Number(sku.margin_pct || 0);

      // ── CONVERSION rules ──
      if (isHero) {
        const cb = Math.round(
          (catConv / Math.max(p.avg_conversion_rate, 0.0001) - 1) *
            15 *
            convMult,
        );
        if (sku.display_type === "hero" && cb > 0) {
          conv += cb;
          trace.push({
            rule: "hero_sku_at_hero_zone",
            sku: sku.sku_id,
            delta: `+${cb}`,
            dim: "conv",
            data: `conv ${(catConv * 100).toFixed(2)}% vs avg ${(p.avg_conversion_rate * 100).toFixed(2)}%`,
          });
        }
        if ((config.priority_skus || []).includes(sku.sku_id)) {
          const pb = Math.round(p.hero_conv_bonus * 0.8 * convMult);
          conv += pb;
          trace.push({
            rule: "priority_sku_at_hero",
            sku: sku.sku_id,
            delta: `+${pb}`,
            dim: "conv",
            data: "manually tagged as priority",
          });
        }
      }

      // Seasonal: continuous ML-derived bonus
      if (seasonBonus !== 0) {
        let sb = 0;
        if (isHero) {
          sb = Math.round(seasonBonus * convMult);
        } else if (isAisle) {
          sb = Math.round(seasonBonus * convMult * 0.4);
        }
        if (sb !== 0) {
          conv += sb;
          trace.push({
            rule: sb > 0 ? "seasonal_boost" : "seasonal_drag",
            sku: sku.sku_id,
            delta: sb > 0 ? `+${sb}` : `${sb}`,
            dim: "conv",
            data: `ML seasonal bonus ${seasonBonus}pts (boost ${seasonBoost}x in ${config.season})`,
          });
        }
      }

      // ── MARGIN rules ──
      if (isHero && skuMargin > p.high_margin_threshold) {
        const mb = Math.round(
          ((skuMargin - p.avg_margin_pct) / Math.max(p.avg_margin_pct, 1)) *
            20 *
            marginMult,
        );
        margin += mb;
        trace.push({
          rule: "high_margin_at_hero",
          sku: sku.sku_id,
          delta: `+${mb}`,
          dim: "margin",
          data: `margin ${skuMargin}% > threshold ${p.high_margin_threshold}%`,
        });
      }
      if (isHero && skuMargin < p.low_margin_threshold) {
        const mp = -Math.round(
          ((p.avg_margin_pct - skuMargin) / Math.max(p.avg_margin_pct, 1)) *
            25 *
            marginMult,
        );
        margin += mp;
        trace.push({
          rule: "low_margin_at_hero",
          sku: sku.sku_id,
          delta: `${mp}`,
          dim: "margin",
          data: `margin ${skuMargin}% < threshold ${p.low_margin_threshold}%`,
        });
      }
      if (isAisle && skuMargin > p.high_margin_threshold) {
        const mb = Math.round(
          ((skuMargin - p.avg_margin_pct) / Math.max(p.avg_margin_pct, 1)) *
            8 *
            marginMult,
        );
        margin += mb;
        trace.push({
          rule: "high_margin_at_aisle",
          sku: sku.sku_id,
          delta: `+${mb}`,
          dim: "margin",
          data: `margin ${skuMargin}% in aisle`,
        });
      }
    });

    // ── CX FLOW rules ──
    const usedSqft = skuIds.reduce(
      (sum, id) => sum + Number((skuMap[id] || {}).floor_space || 0),
      0,
    );
    if (usedSqft > zoneSqft) {
      const overflowPct = Math.round(((usedSqft - zoneSqft) / zoneSqft) * 100);
      const ep = -Math.round(overflowPct * 0.3);
      exp += ep;
      trace.push({
        rule: "zone_overcrowded",
        zone: zoneId,
        delta: `${ep}`,
        dim: "exp",
        data: `${usedSqft}/${zoneSqft} sq ft (${overflowPct}% over)`,
      });
    }
    if (zoneSKUs.length === 0) {
      exp -= 3;
      trace.push({
        rule: "zone_empty",
        zone: zoneId,
        delta: "-3",
        dim: "exp",
        data: `${zone.zone_name} has no SKUs`,
      });
    }
  });

  // Adjacency (lift-based)
  adjRules
    .filter((r) => r.enabled)
    .forEach((rule) => {
      const catIds = rule.categories;
      const zonesWithCats = new Set(
        Object.entries(layout)
          .filter(([, ids]) =>
            ids.some((id) => skuMap[id] && catIds.includes(skuMap[id].cat_id)),
          )
          .map(([zid]) => zid),
      );
      const pairKey = [...catIds].sort().join("|");
      const pairData = coP[pairKey] || {};
      const lift = Number(pairData.lift || 1.0);
      const realFreq = Number(pairData.frequency || 0);
      const bonus = Math.max(2, Math.round(lift * 3));
      const penalty = -Math.max(1, Math.round(lift * 1.5));
      if (zonesWithCats.size === 1) {
        exp += bonus;
        trace.push({
          rule: "adjacency_satisfied",
          pair: pairKey,
          delta: `+${bonus}`,
          dim: "exp",
          data: `lift=${lift}x, co_purchase=${(realFreq * 100).toFixed(1)}% — same zone`,
        });
      } else if (zonesWithCats.size > 1) {
        exp += penalty;
        trace.push({
          rule: "adjacency_violated",
          pair: pairKey,
          delta: `${penalty}`,
          dim: "exp",
          data: `lift=${lift}x, co_purchase=${(realFreq * 100).toFixed(1)}% — split across zones`,
        });
      }
    });

  const clamp = (v) => Math.min(100, Math.max(0, Math.round(v)));
  conv = clamp(conv);
  margin = clamp(margin);
  exp = clamp(exp);

  const WEIGHTS = {
    maximise_conversion: { conv: 0.65, margin: 0.2, exp: 0.15 },
    maximise_margin: { conv: 0.2, margin: 0.55, exp: 0.25 },
    balanced: { conv: 0.4, margin: 0.35, exp: 0.25 },
  };
  const w = WEIGHTS[config.business_objective] || WEIGHTS.balanced;
  const overall = clamp(conv * w.conv + margin * w.margin + exp * w.exp);
  return {
    overall,
    conversion: conv,
    margin,
    experience: exp,
    score_trace: trace,
    weights_used: w,
  };
}
