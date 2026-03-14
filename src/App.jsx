import { useState, useEffect, useCallback } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import StoreCanvas from './components/Canvas/StoreCanvas'
import ScorePanel from './components/Panels/ScorePanel'
import SKUDetailPanel from './components/Panels/SKUDetailPanel'
import AdjacencyAlerts from './components/Panels/AdjacencyAlerts'
import ConfigSidebar from './components/Panels/ConfigSidebar'
import AdminModal from './components/Modals/AdminModal'
import DataUploadModal from './components/Modals/DataUploadModal'
import ExportModal from './components/Modals/ExportModal'
import DashboardPage from './pages/DashboardPage'
import { usePlanogram } from './hooks/usePlanogram'
import { useScoring } from './hooks/useScoring'
import { useAdjacencyAlerts } from './hooks/useAdjacencyAlerts'
import { generatePlanogram, getStores, getZones, getSKUs } from './services/api'

function MainApp() {
  const navigate = useNavigate()

  // Data from API
  const [stores, setStores] = useState([])
  const [zones, setZones] = useState([])
  const [skus, setSkus] = useState([])
  const [storeId, setStoreId] = useState('')

  // UI state
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedSKU, setSelectedSKU] = useState(null)
  const [showExport, setShowExport] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const planogram = usePlanogram()
  const { scores } = useScoring(
    planogram.layout, zones, skus, planogram.derivedParams, planogram.config
  )
  const { scores: beforeScores } = useScoring(
    hasGenerated ? planogram.buildBeforeLayout(zones, skus) : {},
    zones, skus, planogram.derivedParams, planogram.config
  )
  const alerts = useAdjacencyAlerts(planogram.layout, skus, planogram.derivedParams)

  // Fetch stores + SKUs on mount
  useEffect(() => {
    getStores()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : []
        setStores(list)
        if (list.length > 0) setStoreId(list[0].store_id)
      })
      .catch(() => {})
    getSKUs()
      .then(res => setSkus(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
  }, [])

  // Fetch zones when store changes
  useEffect(() => {
    if (!storeId) return
    getZones(storeId)
      .then(res => setZones(Array.isArray(res.data) ? res.data : []))
      .catch(() => setZones([]))
  }, [storeId])

  const handleStoreChange = useCallback((newStoreId) => {
    setStoreId(newStoreId)
  }, [])

  const handleGenerate = async (params) => {
    setIsGenerating(true)
    try {
      const res = await generatePlanogram(params)
      planogram.initFromResponse(res.data)
      setHasGenerated(true)
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      alert(`Generation failed: ${msg}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSKUClick = (sku) => setSelectedSKU(sku)

  const handleAdminClose = () => {
    setShowAdmin(false)
    // Refresh data after admin changes
    getStores()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : []
        setStores(list)
        if (list.length > 0 && !list.find(s => s.store_id === storeId)) {
          setStoreId(list[0].store_id)
        }
      })
      .catch(() => {})
    getSKUs()
      .then(res => setSkus(Array.isArray(res.data) ? res.data : []))
      .catch(() => {})
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">Planogram AI</h1>
          {hasGenerated && planogram.config && (
            <span className="text-sm text-gray-500">
              {planogram.config.store_name} | {planogram.config.season} | {planogram.config.business_objective?.replace('_', ' ')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUpload(true)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Upload Data
          </button>
          <button
            onClick={() => setShowAdmin(true)}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Admin
          </button>
          <button
            onClick={() => navigate('/dashboard', {
              state: {
                scores,
                explanations: planogram.explanations,
                layout: planogram.layout,
                derivedParams: planogram.derivedParams,
                config: planogram.config,
                skus,
              }
            })}
            disabled={!hasGenerated}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Dashboard
          </button>
          <button
            onClick={() => setShowExport(true)}
            disabled={!hasGenerated}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Export PDF
          </button>
        </div>
      </header>

      {/* Main layout: sidebar | canvas | score panel */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Config Sidebar */}
        <ConfigSidebar
          stores={stores}
          skus={skus}
          selectedStore={storeId}
          onStoreChange={handleStoreChange}
          onGenerate={handleGenerate}
          isLoading={isGenerating}
        />

        {/* Center: Canvas */}
        <div className="flex-1 overflow-auto">
          {hasGenerated ? (
            <StoreCanvas
              layout={planogram.showBefore ? planogram.buildBeforeLayout(zones, skus) : planogram.layout}
              zones={zones}
              skus={skus}
              scores={scores}
              derivedParams={planogram.derivedParams}
              config={planogram.config}
              onDragEnd={(event) => planogram.handleDragEnd(event, zones, skus)}
              showBefore={planogram.showBefore}
              onToggleBefore={() => planogram.setShowBefore(!planogram.showBefore)}
              onSKUClick={handleSKUClick}
              beforeScores={beforeScores}
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <svg className="mx-auto h-16 w-16 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-gray-700">No Planogram Yet</h3>
                <p className="mt-2 text-sm text-gray-500">
                  Configure your store, objective, and season in the left panel, then click
                  <span className="font-medium text-blue-600"> Generate Planogram</span> to see your layout.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Score Panel + Adjacency + Skipped */}
        <div className="w-[280px] border-l bg-white overflow-y-auto shrink-0">
          <ScorePanel scores={scores} derivedParams={planogram.derivedParams} config={planogram.config} />
          <div className="border-t">
            <AdjacencyAlerts alerts={alerts} />
          </div>
          {planogram.skippedSKUs.length > 0 && (
            <div className="border-t p-4">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <h4 className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {planogram.skippedSKUs.length} SKU{planogram.skippedSKUs.length !== 1 ? 's' : ''} not placed
                </h4>
                <p className="text-[11px] text-amber-700 mb-2">Not enough zone space for these items:</p>
                <div className="space-y-1">
                  {planogram.skippedSKUs.map(s => (
                    <div key={s.sku_id} className="text-[11px] text-amber-800 flex justify-between">
                      <span className="truncate font-medium">{s.sku_name}</span>
                      <span className="shrink-0 text-amber-600 ml-1">{s.floor_space} sqft</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedSKU && (
        <SKUDetailPanel
          sku={selectedSKU}
          placementReasons={planogram.placementReasons}
          explanations={planogram.explanations}
          onClose={() => setSelectedSKU(null)}
        />
      )}

      {showExport && (
        <ExportModal
          layout={planogram.layout}
          zones={zones}
          skus={skus}
          scores={scores}
          explanations={planogram.explanations}
          config={planogram.config}
          derivedParams={planogram.derivedParams}
          onClose={() => setShowExport(false)}
        />
      )}

      {showAdmin && <AdminModal onClose={handleAdminClose} />}
      {showUpload && <DataUploadModal storeId={storeId} onClose={() => setShowUpload(false)} />}
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}
