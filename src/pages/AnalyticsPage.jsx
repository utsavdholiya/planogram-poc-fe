import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts'
import { getStores, getOrdersAnalytics } from '../services/api'

const CATEGORY_COLORS = {
  cat_ac: '#f87171', cat_flw: '#2dd4bf', cat_tlw: '#5eead4',
  cat_dry: '#99f6e4', cat_wdr: '#14b8a6', cat_ddf: '#60a5fa',
  cat_sdf: '#93c5fd', cat_dish: '#fbbf24', cat_mwo: '#fcd34d',
  cat_wp: '#22d3ee', cat_tv: '#a78bfa', cat_chim: '#fb923c',
}

const SKU_PALETTE = [
  '#f87171','#60a5fa','#2dd4bf','#fbbf24','#a78bfa',
  '#fb923c','#22d3ee','#5eead4','#93c5fd','#fcd34d',
]

function formatMonth(m) {
  const [y, mo] = m.split('-')
  const names = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${names[parseInt(mo, 10) - 1]} ${y.slice(2)}`
}

export default function AnalyticsPage() {
  const navigate = useNavigate()
  const [stores, setStores] = useState([])
  const [storeId, setStoreId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  useEffect(() => {
    getStores()
      .then(res => {
        const list = Array.isArray(res.data) ? res.data : []
        setStores(list)
        if (list.length > 0) setStoreId(list[0].store_id)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!storeId) return
    setLoading(true)
    setData(null)
    setCatFilter('all')
    getOrdersAnalytics(storeId)
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [storeId])

  // Pivot by_category → [{month, "Air Conditioner": 45, ...}]
  const { catChartData, categories } = useMemo(() => {
    if (!data?.by_category?.length) return { catChartData: [], categories: [] }
    const months = {}
    const catSet = new Map()
    for (const r of data.by_category) {
      if (!months[r.month]) months[r.month] = { month: r.month }
      months[r.month][r.cat_name] = (months[r.month][r.cat_name] || 0) + r.units
      if (!catSet.has(r.cat_id)) catSet.set(r.cat_id, r.cat_name)
    }
    const sorted = Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
    return {
      catChartData: sorted,
      categories: [...catSet.entries()].map(([id, name]) => ({ id, name })),
    }
  }, [data])

  // Pivot by_sku → filtered by catFilter, top 10 when "all"
  const { skuChartData, skuKeys } = useMemo(() => {
    if (!data?.by_sku?.length) return { skuChartData: [], skuKeys: [] }
    let filtered = data.by_sku
    if (catFilter !== 'all') {
      filtered = filtered.filter(r => r.cat_id === catFilter)
    }

    // Determine which SKUs to show
    const skuTotals = {}
    for (const r of filtered) {
      skuTotals[r.sku_id] = (skuTotals[r.sku_id] || 0) + r.units
    }
    let skuIds = Object.keys(skuTotals)
    if (catFilter === 'all') {
      skuIds = skuIds.sort((a, b) => skuTotals[b] - skuTotals[a]).slice(0, 10)
    }
    const skuIdSet = new Set(skuIds)

    // Build name map
    const nameMap = {}
    for (const r of filtered) {
      if (skuIdSet.has(r.sku_id)) nameMap[r.sku_id] = r.sku_name
    }

    // Pivot
    const months = {}
    for (const r of filtered) {
      if (!skuIdSet.has(r.sku_id)) continue
      if (!months[r.month]) months[r.month] = { month: r.month }
      months[r.month][r.sku_name] = (months[r.month][r.sku_name] || 0) + r.units
    }

    const sorted = Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
    const keys = skuIds.map(id => nameMap[id]).filter(Boolean)
    return { skuChartData: sorted, skuKeys: keys }
  }, [data, catFilter])

  const isEmpty = !loading && data && !data.by_category?.length && !data.by_sku?.length

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold text-gray-900">Orders Analytics</h1>
        <div className="flex items-center gap-3">
          <select
            value={storeId}
            onChange={e => setStoreId(e.target.value)}
            className="border rounded-lg px-3 py-1.5 text-sm bg-white"
          >
            {stores.map(s => (
              <option key={s.store_id} value={s.store_id}>{s.store_name || s.store_id}</option>
            ))}
          </select>
          <button
            onClick={() => navigate('/')}
            className="px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {loading && (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}

        {isEmpty && (
          <div className="text-center py-20 text-gray-500">
            No order data for this store.
          </div>
        )}

        {/* Chart 1: Monthly Units by Category */}
        {catChartData.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Monthly Units by Category</h2>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={catChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={formatMonth}
                  formatter={(value, name) => [value, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {categories.map(c => (
                  <Bar
                    key={c.id}
                    dataKey={c.name}
                    stackId="cat"
                    fill={CATEGORY_COLORS[c.id] || '#94a3b8'}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Chart 2: Monthly Units by SKU */}
        {data?.by_sku?.length > 0 && (
          <div className="bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">Monthly Units by SKU</h2>
              <select
                value={catFilter}
                onChange={e => setCatFilter(e.target.value)}
                className="border rounded-lg px-3 py-1.5 text-sm bg-white"
              >
                <option value="all">All Categories (Top 10)</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={skuChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tickFormatter={formatMonth} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  labelFormatter={formatMonth}
                  formatter={(value, name) => [value, name]}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {skuKeys.map((name, i) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    fill={SKU_PALETTE[i % SKU_PALETTE.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
