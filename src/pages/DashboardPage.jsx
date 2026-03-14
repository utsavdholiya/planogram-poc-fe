import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import KPICards from '../components/Dashboard/KPICards'
import SKUTable from '../components/Dashboard/SKUTable'
import RationaleTable from '../components/Dashboard/RationaleTable'
import ScenarioCompare from '../components/Dashboard/ScenarioCompare'
import { getSavedPlanograms, savePlanogram, getSKUs } from '../services/api'
import { useAdjacencyAlerts } from '../hooks/useAdjacencyAlerts'

export default function DashboardPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { scores, explanations, layout, derivedParams, config, skus: routeSkus } = location.state || {}
  const [savedLayouts, setSavedLayouts] = useState([])
  const [skusData, setSkusData] = useState(routeSkus || [])

  useEffect(() => {
    if (!routeSkus || routeSkus.length === 0) {
      getSKUs()
        .then(res => setSkusData(Array.isArray(res.data) ? res.data : []))
        .catch(() => {})
    }
  }, [routeSkus])

  const alerts = useAdjacencyAlerts(layout, skusData, derivedParams)

  useEffect(() => {
    if (!config?.store_id) return
    getSavedPlanograms(config.store_id)
      .then(res => setSavedLayouts(res.data.layouts || []))
      .catch(() => {})
  }, [config?.store_id])

  const handleSave = async () => {
    const name = window.prompt('Enter layout name:')
    if (!name) return
    try {
      await savePlanogram({
        store_id: config.store_id,
        layout_name: name,
        season: config.season,
        business_objective: config.business_objective,
        campaign: config.campaign,
        priority_skus: config.priority_skus,
        layout_data: layout,
        scores,
        ai_rationale: explanations
      })
      const res = await getSavedPlanograms(config.store_id)
      setSavedLayouts(res.data.layouts || [])
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  if (!scores || !layout) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-lg">No planogram data available.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Data Upload
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">BI Dashboard</h1>
          <p className="text-sm text-gray-500">
            {config?.store_name} | {config?.season} | {config?.business_objective?.replace('_', ' ')}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50"
          >
            Back to Canvas
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <KPICards scores={scores} derivedParams={derivedParams} layout={layout} alerts={alerts} />
        <SKUTable explanations={explanations} />
        <RationaleTable explanations={explanations} layout={layout} skus={skusData} />
        <ScenarioCompare
          savedLayouts={savedLayouts}
          currentScores={scores}
          onSave={handleSave}
        />
      </main>
    </div>
  )
}
