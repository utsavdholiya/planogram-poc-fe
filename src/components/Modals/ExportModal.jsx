import { useState, useRef, useCallback } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

const SCORE_LABELS = {
  conversion: 'Conversion',
  margin: 'Margin',
  experience: 'Experience',
  brand_visibility: 'Brand Visibility',
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export default function ExportModal({
  layout,
  zones,
  skus,
  scores,
  explanations,
  config,
  derivedParams,
  onClose,
}) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [copied, setCopied] = useState(false)
  const printRef = useRef(null)

  const skuMap = Object.fromEntries((skus || []).map((s) => [s.sku_id, s]))
  const zoneMap = Object.fromEntries((zones || []).map((z) => [z.zone_id, z]))

  const storeName = config?.store_name || config?.store_id || 'Store'
  const objective = config?.business_objective || 'balanced'
  const season = config?.season || 'neutral'
  const billsAnalysed = derivedParams?.total_bills || derivedParams?.bills_analysed || '-'
  const dataRange = derivedParams?.date_range
    ? `${derivedParams.date_range.start} to ${derivedParams.date_range.end}`
    : '-'

  const weights = scores?.weights_used || {}
  const trace = (scores?.score_trace || []).slice(0, 10)

  const top3 = explanations?.top_3_skus_to_promote || []
  const bottom3 = explanations?.bottom_3_skus_to_review || []
  const execSummary = explanations?.executive_summary || ''

  // Build layout summary: zone -> SKU names
  const layoutSummary = Object.entries(layout || {}).map(([zoneId, skuIds]) => {
    const zone = zoneMap[zoneId]
    const names = (skuIds || [])
      .map((id) => skuMap[id]?.sku_name || id)
    return {
      zoneName: zone?.zone_name || zoneId,
      zoneType: zone?.zone_type || '',
      skuNames: names,
    }
  })

  const handleExportPDF = useCallback(async () => {
    if (!printRef.current) return
    setIsGeneratingPDF(true)

    try {
      const canvas = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 297 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      const pdf = new jsPDF('p', 'mm', 'a4')
      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = -(pageHeight * Math.ceil((imgHeight - heightLeft) / pageHeight))
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `planogram_${storeName.replace(/\s+/g, '_').toLowerCase()}_${formatDate(new Date()).replace(/\s+/g, '_')}.pdf`
      pdf.save(fileName)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setIsGeneratingPDF(false)
    }
  }, [storeName])

  const handleCopyShareLink = useCallback(() => {
    try {
      const payload = JSON.stringify({
        layout,
        config,
        scores: { overall: scores?.overall },
      })
      const encoded = btoa(unescape(encodeURIComponent(payload)))
      const url = `${window.location.origin}${window.location.pathname}?layout=${encoded}`

      navigator.clipboard.writeText(url).then(() => {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      })
    } catch (err) {
      console.error('Failed to copy share link:', err)
    }
  }, [layout, config, scores])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Export Planogram</h2>
          <p className="mt-1 text-sm text-gray-500">
            Download as PDF or share a link to this layout
          </p>
        </div>

        {/* Action buttons */}
        <div className="px-6 py-5 flex flex-wrap gap-3">
          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPDF}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGeneratingPDF ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Generating PDF...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export PDF
              </>
            )}
          </button>

          <button
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span className="text-green-600">Copied!</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-3.572a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.343 8.28" />
                </svg>
                Copy Share Link
              </>
            )}
          </button>
        </div>

        {/* PDF Preview label */}
        <div className="px-6 pb-2">
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">PDF Preview</p>
        </div>

        {/* Hidden printable content */}
        <div className="px-6 pb-6">
          <div
            ref={printRef}
            className="border border-gray-200 rounded-lg bg-white p-8 text-sm"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {/* Title */}
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Planogram Report</h1>
              <div className="mt-3 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                <div>
                  <span className="text-gray-500">Store:</span>{' '}
                  <span className="font-medium text-gray-800">{storeName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Date:</span>{' '}
                  <span className="font-medium text-gray-800">{formatDate(new Date())}</span>
                </div>
                <div>
                  <span className="text-gray-500">Objective:</span>{' '}
                  <span className="font-medium text-gray-800">
                    {objective.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Season:</span>{' '}
                  <span className="font-medium text-gray-800 capitalize">{season}</span>
                </div>
                <div>
                  <span className="text-gray-500">Data Range:</span>{' '}
                  <span className="font-medium text-gray-800">{dataRange}</span>
                </div>
                <div>
                  <span className="text-gray-500">Bills Analysed:</span>{' '}
                  <span className="font-medium text-gray-800">{billsAnalysed}</span>
                </div>
              </div>
            </div>

            {/* Executive Summary */}
            {execSummary && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">Executive Summary</h2>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-lg p-4">
                  {execSummary}
                </p>
              </div>
            )}

            {/* Layout Summary */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">Layout Summary</h2>
              <div className="space-y-2">
                {layoutSummary.map((entry, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-36 shrink-0">
                      <span className="font-semibold text-gray-800">{entry.zoneName}</span>
                      {entry.zoneType && (
                        <span className="ml-1 text-[10px] text-gray-400 uppercase">
                          ({entry.zoneType})
                        </span>
                      )}
                    </div>
                    <div className="text-gray-600 flex-1">
                      {entry.skuNames.length > 0 ? entry.skuNames.join(', ') : (
                        <span className="italic text-gray-400">Empty</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Card */}
            <div className="mb-6">
              <h2 className="text-base font-bold text-gray-900 mb-3">Score Card</h2>
              <div className="grid grid-cols-5 gap-3">
                {/* Overall */}
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-blue-600 font-medium">Overall</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{scores?.overall ?? '-'}</p>
                </div>
                {/* Sub-scores */}
                {Object.entries(SCORE_LABELS).map(([key, label]) => {
                  const val = scores?.[key] ?? '-'
                  const w = weights[key === 'brand_visibility' ? 'brand' : key]
                  const weightPct = w != null ? `${Math.round(w * 100)}%` : ''
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-xs text-gray-500 font-medium">{label}</p>
                      <p className="text-xl font-bold text-gray-800 mt-1">{val}</p>
                      {weightPct && (
                        <p className="text-[10px] text-gray-400 mt-0.5">weight: {weightPct}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Score Trace */}
            {trace.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">
                  Score Trace
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    (first {trace.length} entries)
                  </span>
                </h2>
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200 text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Rule</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Dim</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Delta</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Data</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {trace.map((t, i) => (
                        <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                          <td className="px-3 py-1.5 text-gray-800 font-medium whitespace-nowrap">
                            {t.rule}
                          </td>
                          <td className="px-3 py-1.5 text-gray-600 whitespace-nowrap">{t.dim}</td>
                          <td
                            className={[
                              'px-3 py-1.5 font-semibold whitespace-nowrap',
                              String(t.delta).startsWith('-') ? 'text-red-600' : 'text-green-600',
                            ].join(' ')}
                          >
                            {t.delta}
                          </td>
                          <td className="px-3 py-1.5 text-gray-500 max-w-xs truncate">{t.data}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Top 3 SKUs to Promote */}
            {top3.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">
                  Top 3 SKUs to Promote
                </h2>
                <div className="space-y-2">
                  {top3.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-green-50 rounded-lg p-3"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.sku_name || item.sku_id || `SKU ${i + 1}`}
                        </p>
                        {item.reason && (
                          <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bottom 3 SKUs to Review */}
            {bottom3.length > 0 && (
              <div className="mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-3">
                  Bottom 3 SKUs to Review
                </h2>
                <div className="space-y-2">
                  {bottom3.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-3 bg-amber-50 rounded-lg p-3"
                    >
                      <span className="shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {item.sku_name || item.sku_id || `SKU ${i + 1}`}
                        </p>
                        {item.reason && (
                          <p className="text-xs text-gray-600 mt-0.5">{item.reason}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 mt-8 flex items-center justify-between text-xs text-gray-400">
              <span>Generated by Planogram AI | Based on {billsAnalysed} bills</span>
              <span>{formatDate(new Date())}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
