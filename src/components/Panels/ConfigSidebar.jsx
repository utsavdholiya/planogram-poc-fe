import { useState, useMemo } from 'react'

const SEASON_OPTIONS = [
  { value: 'summer', label: 'Summer' },
  { value: 'monsoon', label: 'Monsoon' },
  { value: 'winter', label: 'Winter' },
]

const OBJECTIVE_OPTIONS = [
  { value: 'maximise_conversion', label: 'Max Conversion' },
  { value: 'maximise_margin', label: 'Max Margin' },
  { value: 'balanced', label: 'Balanced' },
]

function detectSeason() {
  const month = new Date().getMonth() // 0-indexed
  if (month >= 2 && month <= 5) return 'summer'    // Mar-Jun
  if (month >= 6 && month <= 9) return 'monsoon'    // Jul-Oct
  return 'winter'                                    // Nov-Feb
}

export default function ConfigSidebar({
  stores,
  skus,
  selectedStore,
  onStoreChange,
  onGenerate,
  isLoading,
}) {
  const detectedSeason = useMemo(() => detectSeason(), [])

  const [objective, setObjective] = useState('balanced')
  const [season, setSeason] = useState(detectedSeason)
  const [prioritySKUs, setPrioritySKUs] = useState([])
  const [expandedCategories, setExpandedCategories] = useState({})
  const [loadingPhase, setLoadingPhase] = useState('calculating')

  const skusByCategory = useMemo(() => {
    if (!skus || skus.length === 0) return {}
    const grouped = {}
    skus.forEach(sku => {
      const cat = sku.cat_id || 'uncategorized'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(sku)
    })
    return grouped
  }, [skus])

  const categoryNames = useMemo(() => Object.keys(skusByCategory).sort(), [skusByCategory])

  function toggleCategory(catId) {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  function toggleSKU(skuId) {
    setPrioritySKUs(prev =>
      prev.includes(skuId) ? prev.filter(id => id !== skuId) : [...prev, skuId]
    )
  }

  function handleGenerate() {
    if (!onGenerate) return
    setLoadingPhase('calculating')
    const timer = setTimeout(() => setLoadingPhase('explaining'), 4000)
    onGenerate({
      store_id: selectedStore,
      business_objective: objective,
      season,
      priority_skus: prioritySKUs,
    })
    return () => clearTimeout(timer)
  }

  return (
    <div className="w-[260px] border-r bg-white shrink-0 flex flex-col overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-gray-100">
        <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Configuration</h2>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        {/* Store selector */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Store</label>
          <select
            value={selectedStore}
            onChange={e => onStoreChange(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            {(stores || []).map(s => (
              <option key={s.store_id} value={s.store_id}>
                {s.store_name} ({s.city})
              </option>
            ))}
          </select>
        </div>

        {/* Objective */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">Objective</label>
          <div className="space-y-1">
            {OBJECTIVE_OPTIONS.map(opt => (
              <label
                key={opt.value}
                className={[
                  'flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs cursor-pointer transition-all',
                  objective === opt.value
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50',
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
                    'w-3 h-3 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    objective === opt.value ? 'border-blue-500' : 'border-gray-300',
                  ].join(' ')}
                >
                  {objective === opt.value && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                </span>
                <span className="font-medium">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Season */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Season</label>
          <select
            value={season}
            onChange={e => setSeason(e.target.value)}
            disabled={isLoading}
            className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            {SEASON_OPTIONS.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {season === detectedSeason && (
            <p className="mt-0.5 text-[10px] text-green-600">Auto-detected</p>
          )}
        </div>

        {/* Priority SKUs */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Priority SKUs
            <span className="ml-1 text-gray-400 font-normal">{prioritySKUs.length} sel.</span>
          </label>
          <div className="rounded-md border border-gray-200 max-h-48 overflow-y-auto">
            {categoryNames.length === 0 ? (
              <p className="p-2 text-xs text-gray-400 italic">No SKUs</p>
            ) : (
              categoryNames.map(catId => {
                const catSKUs = skusByCategory[catId]
                const isExpanded = expandedCategories[catId]
                const selectedInCat = catSKUs.filter(s => prioritySKUs.includes(s.sku_id)).length

                return (
                  <div key={catId} className="border-b border-gray-100 last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggleCategory(catId)}
                      disabled={isLoading}
                      className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="flex items-center gap-1">
                        <svg
                          className={`h-3 w-3 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                        <span>{catId}</span>
                        <span className="text-gray-400">({catSKUs.length})</span>
                      </div>
                      {selectedInCat > 0 && (
                        <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                          {selectedInCat}
                        </span>
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-2 pb-1.5 space-y-0.5">
                        {catSKUs.map(sku => {
                          const isChecked = prioritySKUs.includes(sku.sku_id)
                          return (
                            <label
                              key={sku.sku_id}
                              className={`flex items-center gap-1.5 px-1.5 py-1 rounded text-xs cursor-pointer transition-colors ${
                                isChecked ? 'bg-blue-50' : 'hover:bg-gray-50'
                              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleSKU(sku.sku_id)}
                                disabled={isLoading}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                              />
                              <span className="text-gray-800 flex-1 truncate">{sku.sku_name}</span>
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
      </div>

      {/* Generate button */}
      <div className="px-4 py-3 border-t border-gray-100">
        <button
          onClick={handleGenerate}
          disabled={isLoading || !selectedStore}
          className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-xs">
                {loadingPhase === 'calculating' ? 'Calculating...' : 'Explaining...'}
              </span>
            </>
          ) : (
            'Generate Planogram'
          )}
        </button>
      </div>
    </div>
  )
}
