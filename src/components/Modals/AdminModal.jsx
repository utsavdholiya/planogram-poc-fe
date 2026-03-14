import { useState, useEffect, useCallback } from 'react'
import {
  getStores, createStore, updateStore, deleteStore,
  getZones, createZone, updateZone, deleteZone,
  getSKUs, updateSKU,
} from '../../services/api'

const ZONE_TYPES = ['hero', 'aisle', 'back', 'checkout', 'endcap']

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

// ── Stores Tab ──────────────────────────────────────────────────────────────

function StoresTab() {
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(true)
  const [editRow, setEditRow] = useState(null) // store_id or '__new__'
  const [form, setForm] = useState({ store_id: '', store_name: '', city: '', sq_ft: '' })
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getStores()
      setStores(Array.isArray(res.data) ? res.data : [])
    } catch { setStores([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  function startAdd() {
    setEditRow('__new__')
    setForm({ store_id: '', store_name: '', city: '', sq_ft: '' })
  }

  function startEdit(s) {
    setEditRow(s.store_id)
    setForm({ store_id: s.store_id, store_name: s.store_name || '', city: s.city || '', sq_ft: s.sq_ft || '' })
  }

  function cancel() { setEditRow(null) }

  async function save() {
    if (!form.store_id || !form.store_name) return
    setSaving(true)
    try {
      const payload = { ...form, sq_ft: Number(form.sq_ft) || 0 }
      if (editRow === '__new__') await createStore(payload)
      else await updateStore(payload)
      setEditRow(null)
      await fetch()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally { setSaving(false) }
  }

  async function handleDelete(storeId) {
    if (!window.confirm(`Delete store ${storeId} and all its zones?`)) return
    try {
      await deleteStore(storeId)
      await fetch()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  if (loading) return <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-500"><Spinner /> Loading stores...</div>

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={startAdd} disabled={editRow !== null} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          + Add Store
        </button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">City</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Sq Ft</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-28">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {editRow === '__new__' && (
              <tr className="bg-blue-50">
                <td className="px-4 py-2"><input value={form.store_id} onChange={e => setForm(f => ({ ...f, store_id: e.target.value }))} placeholder="store_004" className="w-full border rounded px-2 py-1 text-sm" /></td>
                <td className="px-4 py-2"><input value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} placeholder="Store Name" className="w-full border rounded px-2 py-1 text-sm" /></td>
                <td className="px-4 py-2"><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className="w-full border rounded px-2 py-1 text-sm" /></td>
                <td className="px-4 py-2"><input type="number" value={form.sq_ft} onChange={e => setForm(f => ({ ...f, sq_ft: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm text-right" /></td>
                <td className="px-4 py-2 text-right space-x-1">
                  <button onClick={save} disabled={saving} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{saving ? '...' : 'Save'}</button>
                  <button onClick={cancel} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Cancel</button>
                </td>
              </tr>
            )}
            {stores.map(s => (
              editRow === s.store_id ? (
                <tr key={s.store_id} className="bg-blue-50">
                  <td className="px-4 py-2 text-gray-500">{s.store_id}</td>
                  <td className="px-4 py-2"><input value={form.store_name} onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" /></td>
                  <td className="px-4 py-2"><input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" /></td>
                  <td className="px-4 py-2"><input type="number" value={form.sq_ft} onChange={e => setForm(f => ({ ...f, sq_ft: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm text-right" /></td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <button onClick={save} disabled={saving} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{saving ? '...' : 'Save'}</button>
                    <button onClick={cancel} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Cancel</button>
                  </td>
                </tr>
              ) : (
                <tr key={s.store_id} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-gray-600 font-mono text-xs">{s.store_id}</td>
                  <td className="px-4 py-2 text-gray-900">{s.store_name}</td>
                  <td className="px-4 py-2 text-gray-600">{s.city}</td>
                  <td className="px-4 py-2 text-right text-gray-900 tabular-nums">{s.sq_ft}</td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <button onClick={() => startEdit(s)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Edit</button>
                    <button onClick={() => handleDelete(s.store_id)} className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50">Del</button>
                  </td>
                </tr>
              )
            ))}
            {stores.length === 0 && editRow !== '__new__' && (
              <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No stores found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Zones Tab ───────────────────────────────────────────────────────────────

function ZonesTab() {
  const [stores, setStores] = useState([])
  const [selectedStore, setSelectedStore] = useState('')
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [form, setForm] = useState({ zone_id: '', zone_name: '', zone_type: 'aisle', sq_ft: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getStores().then(r => {
      const list = Array.isArray(r.data) ? r.data : []
      setStores(list)
      if (list.length > 0) setSelectedStore(list[0].store_id)
    }).catch(() => {})
  }, [])

  const fetchZones = useCallback(async () => {
    if (!selectedStore) return
    setLoading(true)
    try {
      const res = await getZones(selectedStore)
      setZones(Array.isArray(res.data) ? res.data : [])
    } catch { setZones([]) }
    finally { setLoading(false) }
  }, [selectedStore])

  useEffect(() => { fetchZones() }, [fetchZones])

  function startAdd() {
    setEditRow('__new__')
    setForm({ zone_id: '', zone_name: '', zone_type: 'aisle', sq_ft: '' })
  }

  function startEdit(z) {
    setEditRow(z.zone_id)
    setForm({ zone_id: z.zone_id, zone_name: z.zone_name || '', zone_type: z.zone_type || 'aisle', sq_ft: z.sq_ft || '' })
  }

  function cancel() { setEditRow(null) }

  async function save() {
    if (!form.zone_id || !form.zone_name) return
    setSaving(true)
    try {
      const payload = { store_id: selectedStore, ...form, sq_ft: Number(form.sq_ft) || 0 }
      if (editRow === '__new__') await createZone(payload)
      else await updateZone(payload)
      setEditRow(null)
      await fetchZones()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally { setSaving(false) }
  }

  async function handleDelete(zoneId) {
    if (!window.confirm(`Delete zone ${zoneId}?`)) return
    try {
      await deleteZone(selectedStore, zoneId)
      await fetchZones()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Store:</label>
        <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm flex-1">
          {stores.map(s => <option key={s.store_id} value={s.store_id}>{s.store_name} ({s.store_id})</option>)}
        </select>
        <button onClick={startAdd} disabled={editRow !== null || !selectedStore} className="text-sm px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
          + Add Zone
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 justify-center text-sm text-gray-500"><Spinner /> Loading zones...</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Sq Ft</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {editRow === '__new__' && (
                <tr className="bg-blue-50">
                  <td className="px-4 py-2"><input value={form.zone_id} onChange={e => setForm(f => ({ ...f, zone_id: e.target.value }))} placeholder="zone_01" className="w-full border rounded px-2 py-1 text-sm" /></td>
                  <td className="px-4 py-2"><input value={form.zone_name} onChange={e => setForm(f => ({ ...f, zone_name: e.target.value }))} placeholder="Zone Name" className="w-full border rounded px-2 py-1 text-sm" /></td>
                  <td className="px-4 py-2">
                    <select value={form.zone_type} onChange={e => setForm(f => ({ ...f, zone_type: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm">
                      {ZONE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-2"><input type="number" value={form.sq_ft} onChange={e => setForm(f => ({ ...f, sq_ft: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm text-right" /></td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <button onClick={save} disabled={saving} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{saving ? '...' : 'Save'}</button>
                    <button onClick={cancel} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Cancel</button>
                  </td>
                </tr>
              )}
              {zones.map(z => (
                editRow === z.zone_id ? (
                  <tr key={z.zone_id} className="bg-blue-50">
                    <td className="px-4 py-2 text-gray-500">{z.zone_id}</td>
                    <td className="px-4 py-2"><input value={form.zone_name} onChange={e => setForm(f => ({ ...f, zone_name: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm" /></td>
                    <td className="px-4 py-2">
                      <select value={form.zone_type} onChange={e => setForm(f => ({ ...f, zone_type: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm">
                        {ZONE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2"><input type="number" value={form.sq_ft} onChange={e => setForm(f => ({ ...f, sq_ft: e.target.value }))} className="w-full border rounded px-2 py-1 text-sm text-right" /></td>
                    <td className="px-4 py-2 text-right space-x-1">
                      <button onClick={save} disabled={saving} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{saving ? '...' : 'Save'}</button>
                      <button onClick={cancel} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Cancel</button>
                    </td>
                  </tr>
                ) : (
                  <tr key={z.zone_id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600 font-mono text-xs">{z.zone_id}</td>
                    <td className="px-4 py-2 text-gray-900">{z.zone_name}</td>
                    <td className="px-4 py-2"><span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700">{z.zone_type}</span></td>
                    <td className="px-4 py-2 text-right text-gray-900 tabular-nums">{z.sq_ft}</td>
                    <td className="px-4 py-2 text-right space-x-1">
                      <button onClick={() => startEdit(z)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Edit</button>
                      <button onClick={() => handleDelete(z.zone_id)} className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded hover:bg-red-50">Del</button>
                    </td>
                  </tr>
                )
              ))}
              {zones.length === 0 && editRow !== '__new__' && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No zones for this store.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── SKUs Tab ────────────────────────────────────────────────────────────────

function SKUsTab() {
  const [skus, setSkus] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ floor_space: '', margin_pct: '' })
  const [saving, setSaving] = useState(false)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSKUs()
      setSkus(Array.isArray(res.data) ? res.data : [])
    } catch { setSkus([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  function startEdit(sku) {
    setEditId(sku.sku_id)
    setForm({ floor_space: sku.floor_space ?? '', margin_pct: sku.margin_pct ?? '' })
  }

  function cancel() { setEditId(null) }

  async function save(skuId) {
    setSaving(true)
    try {
      await updateSKU({
        sku_id: skuId,
        floor_space: Number(form.floor_space) || 0,
        margin_pct: Number(form.margin_pct) || 0,
      })
      setEditId(null)
      await fetch()
    } catch (err) {
      alert(err.response?.data?.error || err.message)
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center gap-2 py-8 justify-center text-sm text-gray-500"><Spinner /> Loading SKUs...</div>

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">SKU ID</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
            <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Floor Space</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase">Margin %</th>
            <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 uppercase w-24">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {skus.map(sku => (
            <tr key={sku.sku_id} className={editId === sku.sku_id ? 'bg-blue-50' : 'hover:bg-gray-50'}>
              <td className="px-4 py-2 text-gray-600 font-mono text-xs">{sku.sku_id}</td>
              <td className="px-4 py-2 text-gray-900">{sku.sku_name}</td>
              <td className="px-4 py-2 text-gray-600">{sku.cat_id}</td>
              <td className="px-4 py-2 text-right">
                {editId === sku.sku_id ? (
                  <input type="number" value={form.floor_space} onChange={e => setForm(f => ({ ...f, floor_space: e.target.value }))} className="w-20 border rounded px-2 py-1 text-sm text-right" />
                ) : (
                  <span className="tabular-nums">{sku.floor_space ?? '--'}</span>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                {editId === sku.sku_id ? (
                  <input type="number" step="0.1" value={form.margin_pct} onChange={e => setForm(f => ({ ...f, margin_pct: e.target.value }))} className="w-20 border rounded px-2 py-1 text-sm text-right" />
                ) : (
                  <span className="tabular-nums">{sku.margin_pct != null ? `${sku.margin_pct}%` : '--'}</span>
                )}
              </td>
              <td className="px-4 py-2 text-right">
                {editId === sku.sku_id ? (
                  <span className="space-x-1">
                    <button onClick={() => save(sku.sku_id)} disabled={saving} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50">{saving ? '...' : 'Save'}</button>
                    <button onClick={cancel} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Cancel</button>
                  </span>
                ) : (
                  <button onClick={() => startEdit(sku)} className="text-xs px-2 py-1 border rounded hover:bg-gray-50">Edit</button>
                )}
              </td>
            </tr>
          ))}
          {skus.length === 0 && (
            <tr><td colSpan={6} className="px-4 py-6 text-center text-gray-400">No SKUs found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Modal ──────────────────────────────────────────────────────────────

const TABS = [
  { key: 'stores', label: 'Stores' },
  { key: 'zones', label: 'Zones' },
  { key: 'skus', label: 'SKUs' },
]

export default function AdminModal({ onClose }) {
  const [tab, setTab] = useState('stores')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-xl shadow-2xl mx-4 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
        >
          <CloseIcon />
        </button>

        <div className="px-6 pt-6 pb-0 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Admin Settings</h2>
          <nav className="-mb-px flex space-x-6">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'stores' && <StoresTab />}
          {tab === 'zones' && <ZonesTab />}
          {tab === 'skus' && <SKUsTab />}
        </div>
      </div>
    </div>
  )
}
