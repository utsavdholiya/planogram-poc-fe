import { useState } from 'react'
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import DataUploadScreen from './components/DataManagement/DataUploadScreen'
import SetupModal from './components/Modals/SetupModal'
import ExportModal from './components/Modals/ExportModal'
import StoreCanvas from './components/Canvas/StoreCanvas'
import ScorePanel from './components/Panels/ScorePanel'
import SKUDetailPanel from './components/Panels/SKUDetailPanel'
import AdjacencyAlerts from './components/Panels/AdjacencyAlerts'
import DashboardPage from './pages/DashboardPage'
import { usePlanogram } from './hooks/usePlanogram'
import { useScoring } from './hooks/useScoring'
import { useAdjacencyAlerts } from './hooks/useAdjacencyAlerts'
import { generatePlanogram } from './services/api'
import stores from './data/stores.json'
import zones from './data/zones.json'
import skus from './data/skus.json'

function MainApp() {
  const navigate = useNavigate()
  const [storeId, setStoreId] = useState('store_001')
  const [screen, setScreen] = useState('upload') // upload | setup | canvas
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedSKU, setSelectedSKU] = useState(null)
  const [showExport, setShowExport] = useState(false)

  const planogram = usePlanogram()
  const { scores } = useScoring(
    planogram.layout, zones, skus, planogram.derivedParams, planogram.config
  )
  const { scores: beforeScores } = useScoring(
    planogram.buildBeforeLayout(zones, skus), zones, skus, planogram.derivedParams, planogram.config
  )
  const alerts = useAdjacencyAlerts(planogram.layout, skus, planogram.derivedParams)

  const handleContinue = () => setScreen('setup')

  const handleGenerate = async (params) => {
    setIsGenerating(true)
    try {
      const res = await generatePlanogram(params)
      planogram.initFromResponse(res.data)
      setScreen('canvas')
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      alert(`Generation failed: ${msg}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSKUClick = (sku) => setSelectedSKU(sku)

  if (screen === 'upload') {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Planogram AI</h1>
          <select
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            {stores.map(s => (
              <option key={s.store_id} value={s.store_id}>
                {s.store_name} ({s.city})
              </option>
            ))}
          </select>
        </header>
        <DataUploadScreen storeId={storeId} onContinue={handleContinue} />
      </div>
    )
  }

  if (screen === 'setup') {
    return (
      <div className="min-h-screen bg-gray-50">
        <SetupModal
          storeId={storeId}
          stores={stores}
          skus={skus}
          onGenerate={handleGenerate}
          onClose={() => setScreen('upload')}
          isLoading={isGenerating}
        />
      </div>
    )
  }

  // Canvas screen
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900">Planogram AI</h1>
          <span className="text-sm text-gray-500">
            {planogram.config?.store_name} | {planogram.config?.season} | {planogram.config?.business_objective?.replace('_', ' ')}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setScreen('setup')}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50"
          >
            Configure
          </button>
          <button
            onClick={() => navigate('/dashboard', {
              state: {
                scores,
                explanations: planogram.explanations,
                layout: planogram.layout,
                derivedParams: planogram.derivedParams,
                config: planogram.config
              }
            })}
            className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Dashboard
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Export PDF
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <StoreCanvas
            layout={planogram.showBefore ? planogram.buildBeforeLayout(zones, skus) : planogram.layout}
            zones={zones}
            skus={skus}
            scores={scores}
            derivedParams={planogram.derivedParams}
            config={planogram.config}
            onDragEnd={planogram.handleDragEnd}
            showBefore={planogram.showBefore}
            onToggleBefore={() => planogram.setShowBefore(!planogram.showBefore)}
            onSKUClick={handleSKUClick}
            beforeScores={beforeScores}
          />
        </div>

        <div className="w-[280px] border-l bg-white overflow-y-auto shrink-0">
          <ScorePanel scores={scores} derivedParams={planogram.derivedParams} config={planogram.config} />
          <div className="border-t">
            <AdjacencyAlerts alerts={alerts} />
          </div>
        </div>
      </div>

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
