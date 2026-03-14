import { useState, useMemo } from 'react'

const SEASON_OPTIONS = [
  { value: 'summer', label: 'Summer' },
  { value: 'monsoon', label: 'Monsoon' },
  { value: 'festive', label: 'Festive' },
  { value: 'winter', label: 'Winter' },
  { value: 'neutral', label: 'Neutral' },
]

const OBJECTIVE_OPTIONS = [
  { value: 'maximise_conversion', label: 'Maximise Conversion' },
  { value: 'maximise_margin', label: 'Maximise Margin' },
  { value: 'balanced', label: 'Balanced' },
]

const TIER_STYLES = {
  premium: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Premium' },
  mid: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Mid' },
  budget: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Budget' },
}

function detectSeason() {
  const month = new Date().getMonth() // 0-indexed: Jan=0
  // Apr(3)-Jul(6) = summer, Aug(7)-Sep(8) = monsoon, Oct(9) = festive,
  // Nov(10)-Feb(1) = winter, Mar(2) = neutral
  if (month >= 3 && month <= 6) return 'summer'
  if (month >= 7 && month <= 8) return 'monsoon'
  if (month === 9) return 'festive'
  if (month >= 10 || month <= 1) return 'winter'
  return 'neutral'
}

export default function SetupModal({ storeId, stores, skus, onGenerate, onClose, isLoading }) {
  const detectedSeason = useMemo(() => detectSeason(), [])

  const [selectedStore, setSelectedStore] = useState(storeId || (stores?.[0]?.store_id ?? ''))
  const [objective, setObjective] = useState('balanced')
  const [season, setSeason] = useState(detectedSeason)
  const [prioritySKUs, setPrioritySKUs] = useState([])
  const [campaign, setCampaign] = useState('')
  const [loadingPhase, setLoadingPhase] = useState('calculating') // 'calculating' | 'explaining'
  const [expandedCategories, setExpandedCategories] = useState({})

  // Group SKUs by category
  const skusByCategory = useMemo(() => {
    if (!skus || skus.length === 0) return {}
    const grouped = {}
    skus.forEach((sku) => {
      const cat = sku.cat_id || 'uncategorized'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(sku)
    })
    return grouped
  }, [skus])

  const categoryNames = useMemo(() => Object.keys(skusByCategory).sort(), [skusByCategory])

  function toggleCategory(catId) {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }))
  }

  function toggleSKU(skuId) {
    setPrioritySKUs((prev) =>
      prev.includes(skuId) ? prev.filter((id) => id !== skuId) : [...prev, skuId]
    )
  }

  function handleGenerate() {
    if (!onGenerate) return
    setLoadingPhase('calculating')
    // Switch phase after a delay to simulate two-phase loading
    const timer = setTimeout(() => setLoadingPhase('explaining'), 4000)
    onGenerate({
      store_id: selectedStore,
      business_objective: objective,
      season,
      campaign: campaign.trim() || null,
      priority_skus: prioritySKUs,
    })
    // Cleanup is handled by parent unmounting the modal
    return () => clearTimeout(timer)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Setup Planogram</h2>
          <p className="mt-1 text-sm text-gray-500">
            Configure parameters for your planogram generation
          </p>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Store dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Store</label>
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
            >
              {(stores || []).map((store) => (
                <option key={store.store_id} value={store.store_id}>
                  {store.store_name} ({store.city})
                </option>
              ))}
            </select>
          </div>

          {/* Business Objective */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Business Objective
            </label>
            <div className="flex flex-wrap gap-3">
              {OBJECTIVE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={[
                    'flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm cursor-pointer transition-all',
                    objective === opt.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50',
                    isLoading ? 'opacity-50 cursor-not-allowed' : '',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="objective"
                    value={opt.value}
                    checked={objective === opt.value}
                    onChange={() => setObjective(opt.value)}
                    disabled={isLoading}
                    className="sr-only"
                  />
                  <span
                    className={[
                      'w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                      objective === opt.value ? 'border-blue-500' : 'border-gray-300',
                    ].join(' ')}
                  >
                    {objective === opt.value && (
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                    )}
                  </span>
                  <span className="font-medium">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Season */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Season</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
            >
              {SEASON_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            {season === detectedSeason && (
              <p className="mt-1 text-xs text-green-600">
                (Suggested based on current month)
              </p>
            )}
          </div>

          {/* Priority SKUs */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Priority SKUs
              <span className="ml-2 text-xs font-normal text-gray-400">
                {prioritySKUs.length} selected
              </span>
            </label>
            <div className="rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
              {categoryNames.length === 0 ? (
                <p className="p-3 text-sm text-gray-400 italic">No SKUs available</p>
              ) : (
                categoryNames.map((catId) => {
                  const catSKUs = skusByCategory[catId]
                  const isExpanded = expandedCategories[catId]
                  const selectedInCat = catSKUs.filter((s) => prioritySKUs.includes(s.sku_id)).length

                  return (
                    <div key={catId} className="border-b border-gray-100 last:border-b-0">
                      {/* Category header */}
                      <button
                        type="button"
                        onClick={() => toggleCategory(catId)}
                        disabled={isLoading}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <div className="flex items-center gap-2">
                          <svg
                            className={[
                              'h-4 w-4 text-gray-400 transition-transform',
                              isExpanded ? 'rotate-90' : '',
                            ].join(' ')}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                          </svg>
                          <span>{catId}</span>
                          <span className="text-xs text-gray-400">({catSKUs.length})</span>
                        </div>
                        {selectedInCat > 0 && (
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                            {selectedInCat} selected
                          </span>
                        )}
                      </button>

                      {/* SKU checkboxes */}
                      {isExpanded && (
                        <div className="px-3 pb-2 space-y-1">
                          {catSKUs.map((sku) => {
                            const tier = TIER_STYLES[sku.price_tier] || TIER_STYLES.budget
                            const isChecked = prioritySKUs.includes(sku.sku_id)

                            return (
                              <label
                                key={sku.sku_id}
                                className={[
                                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors',
                                  isChecked ? 'bg-blue-50' : 'hover:bg-gray-50',
                                  isLoading ? 'opacity-50 cursor-not-allowed' : '',
                                ].join(' ')}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => toggleSKU(sku.sku_id)}
                                  disabled={isLoading}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-gray-800 flex-1 truncate">{sku.sku_name}</span>
                                <span
                                  className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded ${tier.bg} ${tier.text}`}
                                >
                                  {tier.label}
                                </span>
                                <span className="text-xs text-gray-400 w-12 text-right">
                                  {sku.margin_pct}%
                                </span>
                              </label>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Active Campaign */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Active Campaign
              <span className="ml-1 text-xs font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="text"
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              disabled={isLoading}
              placeholder="e.g. Summer Sale, Diwali Promo"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !selectedStore}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                <span>
                  {loadingPhase === 'calculating'
                    ? 'Calculating from your orders data...'
                    : 'Generating explanations...'}
                </span>
              </>
            ) : (
              'Generate Planogram'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
