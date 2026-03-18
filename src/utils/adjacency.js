export function checkAdjacencyAlerts(layout, skus, derivedParams) {
  if (!derivedParams || !derivedParams.adjacency_rules) return [];

  const skuMap = Object.fromEntries(skus.map((s) => [s.sku_id, s]));
  const coP = derivedParams.co_purchase_frequency || {};
  const alerts = [];

  derivedParams.adjacency_rules.forEach((rule) => {
    if (!rule.enabled) return;
    const catIds = rule.categories;
    const pairKey = [...catIds].sort().join("|");
    const pairData = coP[pairKey] || {};
    const freq = pairData.frequency_pct || 0;
    const lift = Number(pairData.lift || rule.lift || 1.0);

    const zonesWithCats = new Set(
      Object.entries(layout)
        .filter(([, ids]) =>
          ids.some((id) => skuMap[id] && catIds.includes(skuMap[id].cat_id)),
        )
        .map(([zid]) => zid),
    );

    if (zonesWithCats.size === 1) {
      alerts.push({
        type: "satisfied",
        pair: rule.name,
        pairKey,
        frequency_pct: freq,
        lift: Math.round(lift * 10) / 10,
        message: `${rule.name} same zone (bought together ${lift.toFixed(1)}x more often, ${freq}%)`,
        zones: [...zonesWithCats],
      });
    } else if (zonesWithCats.size > 1) {
      alerts.push({
        type: "satisfied",
        pair: rule.name,
        pairKey,
        frequency_pct: freq,
        lift: Math.round(lift * 10) / 10,
        message: `${rule.name} separated (bought together ${lift.toFixed(1)}x more often, ${freq}%)`,
        zones: [...zonesWithCats],
      });
    }
  });

  return alerts;
}
